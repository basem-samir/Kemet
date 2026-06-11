import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api/endpoints';
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, Building2, Plane, Landmark, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminCommissionDashboard() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('paypal');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [earningsPage, setEarningsPage] = useState(1);
  const itemsPerPage = 5;

  const { data, isLoading } = useQuery({
    queryKey: ['commissionDashboard'],
    queryFn: () => adminAPI.getCommissionDashboard(),
  });

  const dashboardData = data?.data?.data || null;

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const withdrawMutation = useMutation({
    mutationFn: (payload) => adminAPI.requestWithdrawal(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['commissionDashboard']);
      queryClient.invalidateQueries(['adminStats']);
      setWithdrawAmount('');
      setWithdrawDetails('');
      setSuccessMessage(`Success! Funds transferred. Transaction ID: ${res.data?.data?.withdrawal?.transactionId || 'Confirmed'}`);
      setTimeout(() => {
        setSuccessMessage('');
        setIsModalOpen(false);
      }, 4000);
    },
    onError: (error) => {
      setErrorMessage(error.response?.data?.message || 'Failed to process official payout API');
      setTimeout(() => setErrorMessage(''), 5000);
    },
  });

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (amount > dashboardData.availableBalance) {
      alert('Insufficient funds.');
      return;
    }
    if (!withdrawDetails) {
      alert('Please provide withdrawal details.');
      return;
    }

    withdrawMutation.mutate({
      amount,
      method: withdrawMethod,
      details: withdrawDetails,
    });
  };

  const getBookingIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-4 w-4 text-sky-600" />;
      case 'hotel':
        return <Building2 className="h-4 w-4 text-gold-600" />;
      case 'itinerary':
      case 'landmark':
      case 'ticket':
        return <Landmark className="h-4 w-4 text-emerald-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-400">Loading commission dashboard...</div>;
  }

  if (!dashboardData) {
    return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold font-serif text-navy-500">Commission & Payouts</h2>
        <p className="text-sm text-gray-500 mt-1">Track platform earnings and manage withdrawals to your accounts.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Available Balance</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <span className="text-3xl font-bold font-serif text-navy-500">
            ${dashboardData.availableBalance.toFixed(2)}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={dashboardData.availableBalance <= 0}
            className="mt-6 w-full py-2 bg-navy-500 hover:bg-navy-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Withdraw Funds
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Earned</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <span className="text-3xl font-bold font-serif text-gray-800">
            ${dashboardData.totalEarned.toFixed(2)}
          </span>
          <p className="text-xs text-gray-400 mt-auto pt-6">Lifetime commission from bookings</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Withdrawn</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <span className="text-3xl font-bold font-serif text-gray-800">
            ${dashboardData.totalWithdrawn.toFixed(2)}
          </span>
          <p className="text-xs text-gray-400 mt-auto pt-6">Successfully transferred to accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Withdrawals Ledger */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
          <h3 className="text-lg font-bold text-navy-500 font-serif mb-4 flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-amber-500" />
            Recent Withdrawals
          </h3>
          {dashboardData.recentWithdrawals.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No withdrawals requested yet.</p>
          ) : (
            <div className="space-y-4">
              {(() => {
                const totalPages = Math.ceil(dashboardData.recentWithdrawals.length / itemsPerPage);
                const indexOfLastItem = withdrawalsPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentItems = dashboardData.recentWithdrawals.slice(indexOfFirstItem, indexOfLastItem);

                return (
                  <>
                    {currentItems.map((w) => (
                      <div key={w._id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-gray-800 capitalize">{w.method} Transfer</p>
                          <p className="text-xs text-gray-500">{new Date(w.createdAt).toLocaleDateString()} · {w.transactionId}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{w.details}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold font-serif text-navy-500">-${w.amount.toFixed(2)}</p>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${w.status === 'completed' ? 'text-emerald-600' : w.status === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                            {w.status === 'completed' ? <CheckCircle2 className="h-3 w-3" /> : w.status === 'failed' ? <XCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {w.status}
                          </span>
                        </div>
                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center border-t border-gray-150 pt-4 mt-2">
                        <div className="text-[10px] text-gray-500 font-medium">
                          Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                          <span className="font-semibold text-navy-500">
                            {Math.min(indexOfLastItem, dashboardData.recentWithdrawals.length)}
                          </span>{' '}
                          of <span className="font-semibold text-navy-500">{dashboardData.recentWithdrawals.length}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => setWithdrawalsPage(p => Math.max(1, p - 1))} disabled={withdrawalsPage === 1} className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-[10px] font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955">Prev</button>
                          <button onClick={() => setWithdrawalsPage(p => Math.min(totalPages, p + 1))} disabled={withdrawalsPage === totalPages} className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-[10px] font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955">Next</button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Recent Commission Earnings */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
          <h3 className="text-lg font-bold text-navy-500 font-serif mb-4 flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-emerald-500" />
            Recent Commission Earnings
          </h3>
          {dashboardData.recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No commission earned yet.</p>
          ) : (
            <div className="space-y-4">
              {(() => {
                const totalPages = Math.ceil(dashboardData.recentBookings.length / itemsPerPage);
                const indexOfLastItem = earningsPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentItems = dashboardData.recentBookings.slice(indexOfFirstItem, indexOfLastItem);

                return (
                  <>
                    {currentItems.map((b) => (
                      <div key={b._id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors">
                        <div className="h-10 w-10 bg-navy-50 border border-navy-100 rounded-lg flex items-center justify-center shrink-0">
                          {getBookingIcon(b.booking_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{b.snapshot?.itemName || 'Booking'}</p>
                          <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString()} · {b.booking_type}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold font-serif text-emerald-600">
                            +${b.commission.amount.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            from ${b.totalPrice.toFixed(0)} total
                          </p>
                        </div>
                      </div>
                    ))}

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center border-t border-gray-150 pt-4 mt-2">
                        <div className="text-[10px] text-gray-500 font-medium">
                          Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                          <span className="font-semibold text-navy-500">
                            {Math.min(indexOfLastItem, dashboardData.recentBookings.length)}
                          </span>{' '}
                          of <span className="font-semibold text-navy-500">{dashboardData.recentBookings.length}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => setEarningsPage(p => Math.max(1, p - 1))} disabled={earningsPage === 1} className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-[10px] font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955">Prev</button>
                          <button onClick={() => setEarningsPage(p => Math.min(totalPages, p + 1))} disabled={earningsPage === totalPages} className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-[10px] font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955">Next</button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-navy-900 text-white">
              <h3 className="text-lg font-bold font-serif !text-white">Withdraw Funds</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
              {successMessage && (
                <div className="p-3 mb-4 text-sm text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-lg">
                  {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 border border-red-200 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center text-sm">
                <span className="text-emerald-800 font-medium">Available Balance</span>
                <span className="text-emerald-700 font-bold font-serif">${dashboardData.availableBalance.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Withdrawal Method
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => {
                    setWithdrawMethod(e.target.value);
                    setWithdrawDetails('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:outline-none mb-4"
                >
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Bank Transfer (Stripe)</option>
                  <option value="card">Bank Card</option>
                </select>

                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {withdrawMethod === 'paypal' ? 'PayPal Email Address' : withdrawMethod === 'stripe' ? 'IBAN Number' : 'Full Bank Card Number'}
                </label>
                <input
                  type="text"
                  value={withdrawDetails}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (withdrawMethod === 'card') {
                      val = val.replace(/\D/g, '');
                      val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                    } else if (withdrawMethod === 'stripe') {
                      let raw = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
                      let clean = '';
                      for (let i = 0; i < raw.length; i++) {
                        let char = raw[i];
                        let pos = clean.length;
                        if (pos === 0) { if (char === 'E') clean += char; }
                        else if (pos === 1) { if (char === 'G') clean += char; }
                        else if (pos === 2 || pos === 3) { if (/\d/.test(char)) clean += char; }
                        else if (pos >= 4 && pos <= 7) { if (/[A-Z0-9]/.test(char)) clean += char; }
                        else if (pos >= 8 && pos <= 28) { if (/\d/.test(char)) clean += char; }
                        if (clean.length === 29) break;
                      }
                      val = clean.replace(/(.{4})(?=.)/g, '$1 ');
                    }
                    setWithdrawDetails(val);
                  }}
                  placeholder={withdrawMethod === 'paypal' ? 'e.g., admin@paypal.com' : withdrawMethod === 'stripe' ? 'e.g., EG12 CIBG 0000 1234...' : 'e.g., 4111 1111 1111 1111'}
                  minLength={withdrawMethod === 'card' ? 19 : withdrawMethod === 'stripe' ? 36 : undefined}
                  maxLength={withdrawMethod === 'card' ? 19 : withdrawMethod === 'stripe' ? 36 : undefined}
                  pattern={withdrawMethod === 'card' ? '[0-9 ]+' : withdrawMethod === 'stripe' ? '^EG[0-9]{2} [A-Z0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4} [0-9]{4} [0-9]$' : undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Amount to Withdraw (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={dashboardData.availableBalance}
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:outline-none"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setWithdrawAmount(dashboardData.availableBalance.toString())} className="text-xs font-bold text-gold-600 hover:text-gold-700 uppercase tracking-wide">
                      Max
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  className="w-full py-3 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
