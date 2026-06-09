import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { bookingsAPI, paymentAPI } from '../../api/endpoints';
import { CreditCard, Shield, Lock, Wallet, AlertCircle, Compass, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      fontFamily: 'inherit',
      color: '#1a1a2e',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function CardPaymentForm({ booking, bookingPrice, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const createIntentMutation = useMutation({
    mutationFn: (data) => paymentAPI.createPaymentIntent(data),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!stripe || !elements) {
      setError('Stripe is still loading. Please try again.');
      return;
    }

    setProcessing(true);

    try {
      const intentRes = await createIntentMutation.mutateAsync({
        amount: bookingPrice,
        booking_id: booking._id,
      });

      const { clientSecret } = intentRes.data.data;

      const cardElement = elements.getElement(CardElement);

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (confirmError) {
        setError(confirmError.message);
        setProcessing(false);
        if (onError) onError(confirmError.message);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        await paymentAPI.captureOrder({
          booking_id: booking._id,
          payment_intent_id: paymentIntent.id,
        });
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Payment failed';
      setError(msg);
      if (onError) onError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          Card Details
        </label>
        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50/50 focus-within:ring-2 focus-within:ring-gold-500 focus-within:outline-none">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full mt-6 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3.5 px-4 rounded-lg shadow-lg hover:shadow-gold-500/20 transition duration-200 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-navy-900" />
            <span>Processing Secure Charge...</span>
          </>
        ) : (
          <span>Authorize Secure Charge (${bookingPrice})</span>
        )}
      </button>
    </form>
  );
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState('');

  const { data: bookingData, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsAPI.getById(bookingId),
    enabled: !!bookingId,
  });

  const booking = bookingData?.data?.data?.booking || bookingData?.data?.booking || null;

  const bookingPrice = booking?.totalPrice ?? 0;

  const handlePaySuccess = () => {
    setProcessing(false);
    navigate('/payment/success');
  };

  const handlePayError = (msg) => {
    setProcessing(false);
    setPayError(msg || 'Payment failed. Try again.');
  };

  const handleSavedMethodPay = async (e) => {
    e.preventDefault();
    setPayError('');
    setProcessing(true);

    try {
      await paymentAPI.captureOrder({ booking_id: bookingId });
      handlePaySuccess();
    } catch (err) {
      handlePayError(err.response?.data?.message || 'Payment capture failed');
    }
  };

  const handlePaypalPay = async (e) => {
    e.preventDefault();
    setPayError('');
    setProcessing(true);

    try {
      await paymentAPI.createPaypalOrder({ amount: bookingPrice, booking_id: bookingId });
      await paymentAPI.captureOrder({ booking_id: bookingId });
      handlePaySuccess();
    } catch (err) {
      handlePayError(err.response?.data?.message || 'PayPal payment failed');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 text-gold-500 animate-spin" />
        <p className="text-gray-500 text-sm">Retrieving checkout parameters...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-navy-500 font-serif">Checkout Error</h2>
        <p className="text-gray-600 text-sm">No active booking was found matching this transaction reference.</p>
        <Link to="/dashboard" className="text-gold-600 hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-serif font-black text-navy-500 tracking-wider">Secure Payment Gateway</h1>
        <p className="text-xs text-gray-500">Review your Egyptian booking invoice and complete checkout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-gold-500/15 shadow-md space-y-6">
          {bookingPrice === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
              <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <Compass className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-900">This booking is Free!</h3>
                <p className="text-xs text-gray-500 mt-1">No payment method is required to complete this reservation.</p>
              </div>
              <button
                onClick={async () => {
                  setProcessing(true);
                  try {
                    await paymentAPI.captureOrder({ booking_id: bookingId });
                    handlePaySuccess();
                  } catch (err) {
                    handlePayError(err.response?.data?.message);
                  }
                }}
                disabled={processing}
                className="mt-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3.5 px-8 rounded-lg shadow-lg hover:shadow-gold-500/20 transition duration-200 text-xs flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-navy-900" />
                    <span>Processing Booking...</span>
                  </>
                ) : (
                  <span>Complete Free Booking</span>
                )}
              </button>
            </div>
          ) : (
            <>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
                {[
                  { id: 'card', label: 'Pay with Card', icon: CreditCard },
                  ...(user?.paymentMethods?.length > 0
                    ? [{ id: 'saved', label: 'Saved Methods', icon: Wallet }]
                    : []),
                  { id: 'paypal', label: 'PayPal', icon: Wallet },
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentMethod(tab.id)}
                      className={`flex-1 py-3 flex items-center justify-center space-x-1.5 font-bold transition ${paymentMethod === tab.id
                        ? 'bg-navy-500 text-white'
                        : 'bg-gray-50 text-gray-600 hover:text-navy-900'
                      }`}
                    >
                      <TabIcon className="h-4 w-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {payError && (
                <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                  {payError}
                </div>
              )}

              {paymentMethod === 'card' && (
                <Elements stripe={stripePromise} key={booking?._id}>
                  <CardPaymentForm
                    booking={booking}
                    bookingPrice={bookingPrice}
                    onSuccess={handlePaySuccess}
                    onError={handlePayError}
                  />
                </Elements>
              )}

              {paymentMethod === 'saved' && (
                <form onSubmit={handleSavedMethodPay} className="space-y-4">
                  <div className="space-y-2">
                    {user.paymentMethods.map((method, idx) => {
                      const methodId = method._id || String(idx);
                      const isCard = method.methodType === 'card';
                      const title = isCard
                        ? `${method.cardType || 'Card'} ending in ${String(method.cardNumber || '').slice(-4)}`
                        : 'PayPal Account';
                      const subtitle = isCard
                        ? `Holder: ${method.cardholderName}  •  Exp: ${method.expiryDate}`
                        : method.paypalEmail;

                      return (
                        <div
                          key={methodId}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center space-x-3 text-xs">
                            <CreditCard className={`h-5 w-5 ${isCard ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div>
                              <span className="font-bold text-navy-900 block">{title}</span>
                              <span className="text-[10px] text-gray-400">{subtitle}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full mt-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3.5 px-4 rounded-lg shadow-lg hover:shadow-gold-500/20 transition duration-200 text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-navy-900" />
                        <span>Processing Secure Charge...</span>
                      </>
                    ) : (
                      <span>Authorize Secure Charge (${bookingPrice})</span>
                    )}
                  </button>
                </form>
              )}

              {paymentMethod === 'paypal' && (
                <div className="text-center py-6 space-y-4">
                  <p className="text-xs text-gray-600">Click the button below to authorize payment through your PayPal Account.</p>
                  <button
                    onClick={handlePaypalPay}
                    disabled={processing}
                    className="inline-flex items-center space-x-2 bg-yellow-400 hover:bg-yellow-500 text-navy-900 font-bold py-3 px-8 rounded-lg shadow-md transition duration-200 text-xs"
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Connecting to PayPal...</span>
                      </>
                    ) : (
                      <span>Pay with PayPal</span>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center space-x-2 text-[10px] text-gray-400 pt-4 border-t border-gray-100">
                <Lock className="h-3.5 w-3.5 text-gold-500 shrink-0" />
                <span>256-Bit SSL Encrypted Connection</span>
              </div>
            </>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-navy-900 text-white p-6 rounded-xl border border-gold-500/30 shadow-md space-y-4">
            <h3 className="font-serif text-lg font-bold text-gold-500 border-b border-gray-800 pb-2">Invoice Summary</h3>

            <div className="space-y-1">
              <span className="font-semibold block text-sm">Booking Type:</span>
              <span className="text-xs text-gold-400 capitalize">{booking.booking_type || 'Stay/Tour'}</span>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-800 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Guests count:</span>
                <span>{booking.guests || 1}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Status:</span>
                <span className="text-yellow-500 capitalize">{booking.status}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-800 font-serif text-lg">
              <span className="text-gold-500 font-bold">Total Bill:</span>
              <span className="font-bold">{bookingPrice === 0 ? 'FREE' : `$${bookingPrice}`}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-[10px] text-gray-400 flex items-start space-x-2">
            <Shield className="h-5 w-5 text-gold-600 shrink-0" />
            <span>If you cancellation occurs up to 48 hours before check-in/start date, you will receive a full refund directly to your original payment card.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
