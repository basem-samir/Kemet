import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { itinerariesAPI, bookingsAPI } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { Calendar, Users, MapPin, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import BookingSuccessModal from '../../components/BookingSuccessModal';

export default function BookItinerary() {
  const { id } = useParams(); // Template ID
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // We need to fetch the template to get the title, price and details.
  // Wait, templates are loaded by slug, but here we have the template ID.
  // Let's see: itineraries templates route supports fetching templates.
  // We can query all templates and find the one with `_id === id`, or fetch it directly.
  // Let's fetch all templates and find the matching one.
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['itineraryTemplates'],
    queryFn: () => itinerariesAPI.getTemplates(),
  });

  const templates = templatesData?.data?.data?.templates || templatesData?.data?.templates || [];
  const template = templates.find((t) => t._id === id);

  const bookItineraryMutation = useMutation({
    mutationFn: (data) => bookingsAPI.bookItinerary(data),
    onSuccess: (res) => {
      const booking = res.data.data?.booking || res.data.booking || res.data;
      setShowSuccessModal(true);
    },
    onError: (err) => {
      setBookingError(err.response?.data?.message || 'Failed to create booking.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setBookingError('');

    if (!isAuthenticated) {
      navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!startDate || !endDate) {
      setBookingError('Please enter start and end dates.');
      return;
    }

    bookItineraryMutation.mutate({
      template_id: id,
      dates: {
        start: startDate,
        end: endDate,
      },
      guests: parseInt(guestsCount),
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 w-1/3 rounded"></div>
        <div className="h-64 bg-gray-200 rounded-xl"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500 font-serif">Itinerary Template Not Found</h2>
        <Link to="/itineraries" className="text-gold-600 hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Browse Itineraries</span>
        </Link>
      </div>
    );
  }

  const estimatedTotal = (template.totalBudget || template.pricePerPerson || 250) * guestsCount;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <Link to="/itineraries" className="inline-flex items-center space-x-1 text-gold-600 hover:underline font-medium text-sm">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Itineraries</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Booking Form */}
        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-gold-500/15 shadow-md space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-serif font-bold text-navy-500">Book Tour</h1>
            <p className="text-xs text-gray-500">Specify dates and guest details to reserve your guided Egyptian journey.</p>
          </div>

          {bookingError && (
            <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>{bookingError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Start Date</label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setStartDate(newStart);
                      if (newStart && template?.duration) {
                        const start = new Date(newStart);
                        // A tour of N days means (N-1) nights/days added to the start date
                        const durationToAdd = Math.max(0, template.duration - 1);
                        start.setDate(start.getDate() + durationToAdd);
                        setEndDate(new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().split('T')[0]);
                      } else {
                        setEndDate('');
                      }
                    }}
                    className="pl-9 w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">End Date</label>
                <div className="mt-1 relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    readOnly
                    value={endDate}
                    className="pl-9 w-full text-xs p-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase">Number of Guests</label>
              <div className="mt-1 relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                  className="pl-9 w-full text-xs p-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} Traveler{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={bookItineraryMutation.isPending}
              className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3.5 px-4 rounded-lg shadow-lg hover:shadow-gold-500/20 transition duration-200 text-sm"
            >
              {bookItineraryMutation.isPending ? 'Processing...' : 'Request Booking'}
            </button>
          </form>
        </div>

        {/* Sidebar Summary */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-navy-900 text-white p-6 rounded-xl border border-gold-500/30 shadow-md space-y-4">
            <h3 className="font-serif text-lg font-bold text-gold-500 border-b border-gray-800 pb-2">Itinerary Summary</h3>
            <div className="space-y-1">
              <span className="font-semibold block text-sm">{template.title}</span>
              <span className="text-xs text-gray-400">{template.duration} Days guided tour</span>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-gray-800 text-xs">
              <div className="flex justify-between">
                <span>Base Price (per person):</span>
                <span>${template.totalBudget || template.pricePerPerson || 250}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests count:</span>
                <span>{guestsCount}</span>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-800 font-serif text-lg">
              <span className="text-gold-500 font-bold">Estimated Total:</span>
              <span className="font-bold">${estimatedTotal}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-[10px] text-gray-400 space-y-2 flex items-start space-x-2">
            <Shield className="h-5 w-5 text-gold-600 shrink-0" />
            <span>Secure 256-bit SSL transaction. Fully integrated with international processing cards and Stripe.</span>
          </div>
        </div>

      </div>

      <BookingSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/dashboard/bookings');
        }} 
      />
    </div>
  );
}
