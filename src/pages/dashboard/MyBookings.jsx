import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { bookingsAPI } from '../../api/endpoints';
import { useAuthStore } from '../../store/authStore';
import { Calendar, CreditCard, XCircle, Loader2, Plane, Building2, Landmark, ShieldAlert, CheckCircle } from 'lucide-react';

export default function MyBookings() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [activeQRBooking, setActiveQRBooking] = useState(null);
  const [activeItineraryBooking, setActiveItineraryBooking] = useState(null);
  const [selectedDayTab, setSelectedDayTab] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };
  const itemsPerPage = 5;
  const [completedLandmarks, setCompletedLandmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('kemet_completed_landmarks') || '{}');
    } catch {
      return {};
    }
  });

  const toggleLandmarkCompleted = (bookingId, day, landmarkId) => {
    const key = `${bookingId}-${day}-${landmarkId}`;
    const updated = {
      ...completedLandmarks,
      [key]: !completedLandmarks[key]
    };
    setCompletedLandmarks(updated);
    localStorage.setItem('kemet_completed_landmarks', JSON.stringify(updated));
  };

  const { data: bookingsData, isLoading, error } = useQuery({
    queryKey: ['userBookings'],
    queryFn: () => bookingsAPI.getAll(),
  });

  const bookingsFromAPI = bookingsData?.data?.data?.bookings || bookingsData?.data?.bookings || [];
  
  // Combine with local simulated bookings (user-specific)
  const localBookings = (() => {
    try {
      const storageKey = (user?._id || user?.id) ? `kemet_simulated_bookings_${user._id || user.id}` : 'kemet_simulated_bookings';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  })();
  
  const allBookingsMap = new Map();
  bookingsFromAPI.forEach(b => allBookingsMap.set(b._id, b));
  localBookings.forEach(b => {
    if (!allBookingsMap.has(b._id)) {
      allBookingsMap.set(b._id, b);
    }
  });
  const bookings = Array.from(allBookingsMap.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Cancel Booking Mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (id) => bookingsAPI.cancel(id),
    onMutate: () => {
      setToast({ message: 'Cancelling booking...', type: 'info' });
    },
    onSuccess: () => {
      setToast({ message: 'Booking cancelled successfully!', type: 'success' });
      setConfirmCancelId(null);
      queryClient.invalidateQueries({ queryKey: ['userBookings'] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({ message: err?.response?.data?.message || 'Failed to cancel booking.', type: 'error' });
      setConfirmCancelId(null);
      setTimeout(() => setToast(null), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        <p className="text-gray-500 text-xs">Loading your reservations...</p>
      </div>
    );
  }

  // Helper to filter bookings
  const getFilteredBookings = (category, status) => {
    return bookings.filter((b) => {
      const bType = b.booking_type || b.bookingType || b.type;
      const matchesCategory = category === 'all' || bType === category;
      const matchesStatus = status === 'all' || b.status === status;
      return matchesCategory && matchesStatus;
    });
  };

  const filteredBookings = getFilteredBookings(activeTab, activeStatus);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-bold text-navy-500">My Bookings</h2>
        <p className="text-xs text-gray-500">View your active tours, hotel reservations, and custom trip packages.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-4">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-serif font-semibold text-navy-500 text-sm">No Bookings Found</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">You haven't reserved any flights, hotels, or itineraries yet.</p>
          </div>
          <Link to="/itineraries" className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-6 py-2.5 rounded-lg text-xs shadow-md">
            Explore Tours
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Category Tabs */}
          <div className="flex border-b border-gray-200 space-x-6 text-xs overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'hotel', label: 'Hotel Stays' },
              { id: 'flight', label: 'Flights' },
              { id: 'itinerary', label: 'Tours & Packages' },
              { id: 'landmark', label: 'Landmark Tickets' },
            ].map((tab) => {
              const count = bookings.filter(b => tab.id === 'all' || (b.booking_type || b.bookingType || b.type) === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveStatus('all'); // Reset status sub-filter on category change for better UX
                    setCurrentPage(1);
                  }}
                  className={`pb-3 font-bold relative transition whitespace-nowrap shrink-0 ${
                    activeTab === tab.id
                      ? 'text-gold-600 border-b-2 border-gold-500'
                      : 'text-gray-500 hover:text-navy-500'
                  }`}
                >
                  {tab.label} <span className="text-[10px] text-gray-400 font-normal">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Status Sub-filters (Pills) */}
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { id: 'all', label: 'All Status' },
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((statusTab) => {
              const count = getFilteredBookings(activeTab, statusTab.id).length;
              return (
                <button
                  key={statusTab.id}
                  onClick={() => {
                    setActiveStatus(statusTab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition whitespace-nowrap ${
                    activeStatus === statusTab.id
                      ? 'bg-gold-500 text-navy-900 border-gold-500 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:text-navy-500 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  {statusTab.label} <span className="text-[9px] font-normal opacity-85">({count})</span>
                </button>
              );
            })}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
              No bookings found matching the selected filters.
            </div>
          ) : (
            <>
              <div className="space-y-4">
              {(() => {
                const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
                const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
                const indexOfLastItem = safeCurrentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
                
                return currentBookings.map((booking) => {
                const isPending = booking.status === 'pending';
                const isAccepted = booking.status === 'accepted';
                const isConfirmed = booking.status === 'confirmed';
                const isCompleted = booking.status === 'completed';
                const isCancelled = booking.status === 'cancelled';
                const isRejected = booking.status === 'rejected';
                
                const bType = booking.booking_type || booking.bookingType || booking.type;
                let typeIcon = Calendar;
                if (bType === 'flight') typeIcon = Plane;
                if (bType === 'hotel') typeIcon = Building2;
                if (bType === 'itinerary' || bType === 'landmark') typeIcon = Landmark;

                const IconComponent = typeIcon;
                const bookingPrice = booking.totalPrice ?? booking.price ?? 250;

                return (
                  <div 
                    key={booking._id} 
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-gold-500/30 transition"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="h-10 w-10 bg-gold-50 text-gold-600 rounded-lg flex items-center justify-center shrink-0 border border-gold-500/10">
                        {/* Render Icon */}
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-semibold text-navy-500 text-sm capitalize">
                            {bType} Booking
                          </span>
                          <span className="text-gray-400 text-[10px]">— {booking.snapshot?.itemName || 'Kemet Reservation'}</span>
                        </div>
                        <span className="text-gray-400 block">
                          Ref: #{booking._id?.slice(-8)} • Guests: {booking.guests || 1}
                        </span>
                        {booking.dates && (
                          <span className="text-gray-500 block">
                            Dates: {new Date(booking.dates.start).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Total cost</span>
                        <span className="font-bold text-navy-500 font-serif text-sm">{bookingPrice === 0 ? 'FREE' : `$${bookingPrice}`}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 text-[10px] rounded-full font-bold uppercase border ${
                          isConfirmed || isCompleted
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : isCancelled || isRejected
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : isAccepted
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {isPending ? 'Pending Approval' : booking.status}
                        </span>

                        {/* Actions */}
                        {(isPending || isAccepted) && (
                          <div className="flex items-center space-x-2">
                            {isAccepted && (
                              <Link 
                                to={`/payment?bookingId=${booking._id}`}
                                className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center space-x-1 shadow transition"
                              >
                                <CreditCard className="h-3 w-3" />
                                <span>Pay Now</span>
                              </Link>
                            )}

                            <button
                              onClick={() => setConfirmCancelId(booking._id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg text-xs transition"
                              title="Cancel Booking"
                            >
                              <XCircle className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        )}

                        {(isConfirmed || isCompleted) && (
                          <div className="flex items-center space-x-2">
                            {bType === 'itinerary' && (
                              <button
                                onClick={() => {
                                  setActiveItineraryBooking(booking);
                                  setSelectedDayTab(1);
                                }}
                                className="bg-navy-900 hover:bg-navy-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-[10px] shadow transition"
                              >
                                Track Program
                              </button>
                            )}
                            <button
                              onClick={() => setActiveQRBooking(booking)}
                              className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-3.5 py-1.5 rounded-lg text-[10px] shadow transition"
                            >
                              View QR Pass
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })})()}
            </div>
            
            {/* Pagination Controls */}
            {Math.ceil(filteredBookings.length / itemsPerPage) > 1 && (() => {
              const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
              return (
                <div className="flex justify-center items-center space-x-2 pt-4">
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-950 shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-semibold px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                    }}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 rounded-xl border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-950 shadow-sm"
                  >
                    Next
                  </button>
                </div>
              );
            })()}
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-red-600">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">Cancel Booking</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to cancel this booking? This will restore any reserved inventory, and this action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmCancelId(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Go Back
              </button>
              <button
                onClick={() => cancelBookingMutation.mutate(confirmCancelId)}
                disabled={cancelBookingMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow transition flex items-center space-x-1"
              >
                {cancelBookingMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Yes, Cancel</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Egypt-themed QR ticket pass modal */}
      {activeQRBooking && (() => {
        const qrType = activeQRBooking.booking_type || activeQRBooking.bookingType || activeQRBooking.type || 'landmark';
        let qrTitle = 'Entrance Ticket Pass';
        let qrItemLabel = 'Landmark:';
        let qrDateLabel = 'Visit Date:';
        let qrQtyLabel = 'Tickets Qty:';
        let qrQtyVal = `${activeQRBooking.guests || 1} Ticket(s)`;

        if (qrType === 'flight') {
          qrTitle = 'Flight Boarding Pass';
          qrItemLabel = 'Flight Line:';
          qrDateLabel = 'Departure:';
          qrQtyLabel = 'Passengers:';
          qrQtyVal = `${activeQRBooking.guests || 1} Traveler(s) (${activeQRBooking.snapshot?.itemDetails?.flightClass || 'Economy'})`;
        } else if (qrType === 'hotel') {
          qrTitle = 'Hotel Booking Voucher';
          qrItemLabel = 'Hotel Stay:';
          qrDateLabel = 'Check-in:';
          qrQtyLabel = 'Rooms/Guests:';
          qrQtyVal = `${activeQRBooking.rooms || 1} Room(s) / ${activeQRBooking.guests || 1} Guest(s)`;
        } else if (qrType === 'itinerary') {
          qrTitle = 'Tour Booking Pass';
          qrItemLabel = 'Tour Name:';
          qrDateLabel = 'Tour Date:';
          qrQtyLabel = 'Travelers:';
          qrQtyVal = `${activeQRBooking.guests || 1} Traveler(s)`;
        }

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-gold-500/20 shadow-2xl p-6 text-center space-y-6 animate-in fade-in zoom-in duration-250">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <h3 className="text-base font-serif font-black text-navy-900">{qrTitle}</h3>
                <button onClick={() => setActiveQRBooking(null)} className="text-gray-400 hover:text-gray-600 font-bold">&times;</button>
              </div>
              
              {/* Mock QR code vector SVG styled with Ancient Egyptian vibes */}
              <div className="bg-gradient-to-br from-navy-900 to-black p-4 rounded-3xl border-2 border-gold-500 shadow-xl w-fit mx-auto relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent pointer-events-none"></div>
                <svg className="w-40 h-40 mx-auto" viewBox="0 0 29 29" shapeRendering="crispEdges">
                  <defs>
                    <linearGradient id="egyptianGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#faf4df" />
                      <stop offset="50%" stopColor="#C9A84C" />
                      <stop offset="100%" stopColor="#8e7030" />
                    </linearGradient>
                    <linearGradient id="lapisBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6072a3" />
                      <stop offset="100%" stopColor="#0D1B2A" />
                    </linearGradient>
                  </defs>
                  {/* Background board */}
                  <rect width="29" height="29" fill="url(#lapisBlue)" rx="2" />
                  {/* QR code matrix colored in Egyptian Gold */}
                  <path fill="url(#egyptianGold)" d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0zm9 0h1v1h-1zm1 1h1v1h-1zm-1 1h1v1h-1zm2 1h1v1h-1zm1-2h1v1h-1zm1 3h1v1h-1zm2-3h1v1h-1zm-1-1h1v1h-1zm3 0h1v1h-1zm1 1h1v1h-1zm1-1h1v1h-1zm1 2h1v1h-1zm-4 2h1v1h-1zm3 0h1v1h-1zm1 1h1v1h-1zm-9-5h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm-10 1h1v1h-1zm4 0h1v1h-1zm3 0h1v1h-1zm-8 1h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm-7 1h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm-5 1h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm-10 1h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm-15-7h1v1h-1zm0 2h1v1H8zm1 1h1v1H9zm1-2h1v1h-1zm2 0h1v1h-1zm-2 2h1v1h-1zm4-1h1v1h-1zm2-1h1v1h-1zm0 2h1v1h-1zm-7-5h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm-12 1h1v1h-1zm4 0h1v1h-1zm3 0h1v1h-1zm-5 1h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm-4 1h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm-5 1h1v1h-1zm1 0h1v1h-1zm3 0h1v1h-1zm2 0h1v1h-1zm1 0h1v1h-1zm1 0h1v1h-1zM2 2h3v3H2zm20 0h3v3h-3zM2 24h3v3H2z"/>
                  {/* Nested details - Gold inner positioning marks */}
                  <rect x="2.5" y="2.5" width="2" height="2" fill="#faf4df" />
                  <rect x="24.5" y="2.5" width="2" height="2" fill="#faf4df" />
                  <rect x="2.5" y="24.5" width="2" height="2" fill="#faf4df" />
                  {/* Egyptian Ankh Symbol vector right at the center */}
                  <g transform="translate(11, 11)" fill="url(#egyptianGold)">
                    <path d="M 3.5 1 A 1.5 1.5 0 1 0 3.5 4 A 1.5 1.5 0 1 0 3.5 1 Z M 3.5 0.25 A 2.25 2.25 0 1 1 3.5 4.75 A 2.25 2.25 0 1 1 3.5 0.25 Z" />
                    <rect x="1.5" y="4.5" width="4" height="0.75" rx="0.2" />
                    <rect x="3.1" y="5.25" width="0.8" height="2" rx="0.1" />
                  </g>
                </svg>
              </div>

              <div className="bg-sand-50/50 border border-gold-500/10 rounded-2xl p-4 text-left text-xs space-y-1.5 font-semibold text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">{qrItemLabel}</span>
                  <span className="font-bold text-navy-900">{activeQRBooking.snapshot?.itemName || 'Kemet Reservation'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{qrDateLabel}</span>
                  <span className="font-bold text-navy-900">
                    {activeQRBooking.dates?.start ? new Date(activeQRBooking.dates.start).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">{qrQtyLabel}</span>
                  <span className="font-bold text-navy-900">{qrQtyVal}</span>
                </div>
                <div className="flex justify-between border-t border-gray-150 pt-1.5 mt-1.5">
                  <span className="text-gray-400 font-bold">Total Paid:</span>
                  <span className="font-bold text-gold-600">{(activeQRBooking.totalPrice ?? activeQRBooking.price ?? 0) === 0 ? 'FREE' : `$${activeQRBooking.totalPrice ?? activeQRBooking.price ?? 0}`}</span>
                </div>
              </div>
              
              <button
                onClick={() => setActiveQRBooking(null)}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase"
              >
                Close Pass
              </button>
            </div>
          </div>
        );
      })()}

      {/* Day-by-day Itinerary Tracker Modal */}
      {activeItineraryBooking && (() => {
        const reference = activeItineraryBooking.reference_id || {};
        const title = reference.title || activeItineraryBooking.snapshot?.itemName || 'Itinerary Program';
        const schedule = reference.schedule || [];
        const totalDays = reference.duration || schedule.length || 1;
        
        // Find current day plan
        const currentDayPlan = schedule.find(d => d.day === selectedDayTab) || { landmarks: [], meals: [], description: '' };
        
        // Calculate progress percentage
        let totalLandmarks = 0;
        let visitedLandmarks = 0;
        schedule.forEach(dayPlan => {
          (dayPlan.landmarks || []).forEach(l => {
            totalLandmarks++;
            const landmarkId = l.landmark_id?._id || l.landmark_id;
            const key = `${activeItineraryBooking._id}-${dayPlan.day}-${landmarkId}`;
            if (completedLandmarks[key]) {
              visitedLandmarks++;
            }
          });
        });
        
        const progressPct = totalLandmarks > 0 ? Math.round((visitedLandmarks / totalLandmarks) * 100) : 0;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gold-500/20 shadow-2xl p-6 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-250">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-base font-serif font-black text-navy-900 capitalize">{title}</h3>
                  <p className="text-[10px] text-gray-500">Track and check off your tour schedule step-by-step.</p>
                </div>
                <button 
                  onClick={() => {
                    setActiveItineraryBooking(null);
                  }} 
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Progress Bar */}
              <div className="py-3 px-1 border-b border-gray-100 shrink-0 space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-400 uppercase tracking-wider">Overall Progress</span>
                  <span className="text-gold-600">{progressPct}% ({visitedLandmarks}/{totalLandmarks} Landmarks visited)</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gold-500 h-full transition-all duration-500" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>

              {/* Day Tabs Stepper */}
              <div className="flex space-x-2 overflow-x-auto py-3 scrollbar-none shrink-0 border-b border-gray-100">
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                  const isSelected = selectedDayTab === day;
                  const dayLandmarks = (schedule.find(d => d.day === day)?.landmarks || []);
                  const completedOnDay = dayLandmarks.filter(l => {
                    const lId = l.landmark_id?._id || l.landmark_id;
                    return completedLandmarks[`${activeItineraryBooking._id}-${day}-${lId}`];
                  }).length;
                  const isDayFullyComplete = dayLandmarks.length > 0 && completedOnDay === dayLandmarks.length;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDayTab(day)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap shrink-0 border flex items-center space-x-1 ${
                        isSelected 
                          ? 'bg-gold-500 text-navy-900 border-gold-500 shadow-sm' 
                          : isDayFullyComplete
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>Day {day}</span>
                      {completedOnDay > 0 && (
                        <span className={`text-[9px] px-1 rounded-full ${isSelected ? 'bg-navy-900 text-white' : 'bg-gold-500 text-navy-900'}`}>
                          {completedOnDay}/{dayLandmarks.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day Details Content Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 min-h-0 text-xs">
                {currentDayPlan.description && (
                  <div className="bg-sand-50/50 p-3.5 rounded-xl border border-gold-500/10 italic text-gray-600 leading-relaxed text-[11px]">
                    "{currentDayPlan.description}"
                  </div>
                )}

                {/* Landmarks Schedule List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-navy-900 uppercase tracking-wider text-[10px] text-gray-400">Scheduled Landmarks</h4>
                  {(!currentDayPlan.landmarks || currentDayPlan.landmarks.length === 0) ? (
                    <div className="text-center py-8 text-gray-400 italic">No landmarks scheduled for Day {selectedDayTab}. Enjoy your free day!</div>
                  ) : (
                    currentDayPlan.landmarks.map((l, index) => {
                      const landmarkObj = l.landmark_id || {};
                      const lId = landmarkObj._id || l.landmark_id;
                      const isVisited = !!completedLandmarks[`${activeItineraryBooking._id}-${selectedDayTab}-${lId}`];
                      const img = landmarkObj.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=150&q=80';
                      const coords = landmarkObj.location?.coordinates || [];

                      return (
                        <div 
                          key={lId || index}
                          className={`p-3.5 rounded-xl border transition flex gap-3.5 items-start ${
                            isVisited 
                              ? 'bg-green-50/30 border-green-200/50' 
                              : 'bg-white border-gray-150 hover:border-gold-500/20'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt={landmarkObj.name || 'Landmark'} 
                            className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-150"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-navy-500 block truncate text-sm">{landmarkObj.name || 'Egypt Landmark'}</span>
                              <span className="text-[9px] font-bold text-gold-600 bg-gold-50 px-1.5 py-0.5 rounded">{l.visitTime || '10:00 AM'}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-normal">{l.notes || 'No custom notes provided.'}</p>
                            <div className="flex items-center justify-between pt-1 border-t border-gray-100 mt-2 text-[10px]">
                              {coords.length === 2 ? (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-gold-600 font-bold hover:underline"
                                >
                                  🗺️ Get Directions
                                </a>
                              ) : (
                                <span className="text-gray-400">Egypt Site</span>
                              )}
                              
                              <button
                                onClick={() => toggleLandmarkCompleted(activeItineraryBooking._id, selectedDayTab, lId)}
                                className={`px-2.5 py-1 rounded-md font-bold text-[9px] transition ${
                                  isVisited 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-gold-500 hover:bg-gold-600 text-navy-900'
                                }`}
                              >
                                {isVisited ? '✓ Visited' : 'Mark Visited'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Meals and Hotel options */}
                {((currentDayPlan.meals && currentDayPlan.meals.length > 0) || currentDayPlan.hotel) && (
                  <div className="border-t border-gray-150 pt-3 grid grid-cols-2 gap-4">
                    {currentDayPlan.meals && currentDayPlan.meals.length > 0 && (
                      <div className="space-y-1">
                        <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-wider">Meals Plan</span>
                        <div className="flex flex-wrap gap-1 text-[9px] font-bold text-navy-500">
                          {currentDayPlan.meals.map((meal, mIdx) => (
                            <span key={mIdx} className="bg-sand-50 border border-gold-500/10 px-1.5 py-0.5 rounded capitalize">🍴 {meal}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {currentDayPlan.hotel && (
                      <div className="space-y-1 text-[10px]">
                        <span className="block font-bold text-[9px] text-gray-400 uppercase tracking-wider">Hotel Stay</span>
                        <span className="font-semibold text-navy-500 block truncate">🏨 Assigned Accommodation</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Close Footer Button */}
              <div className="border-t border-gray-100 pt-3 shrink-0 flex justify-end">
                <button
                  onClick={() => setActiveItineraryBooking(null)}
                  className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 px-6 rounded-xl text-xs uppercase"
                >
                  Close Tracker
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 text-xs px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 border transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : toast.type === 'error'
            ? 'bg-red-50 text-red-700 border-red-200'
            : 'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : toast.type === 'error' ? (
            <ShieldAlert className="h-4 w-4 text-red-600" />
          ) : (
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
