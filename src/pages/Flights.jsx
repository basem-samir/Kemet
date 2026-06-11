import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { flightsAPI, bookingsAPI } from '../api/endpoints';
import { Plane, Calendar, Users, Search, DollarSign, Loader2, AlertCircle, CheckCircle, ShieldAlert, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useEffect } from 'react';

const AIRPORTS = [
  { code: 'CAI', name: 'Cairo International (CAI)' },
  { code: 'LXR', name: 'Luxor International (LXR)' },
  { code: 'ASW', name: 'Aswan International (ASW)' },
  { code: 'HRG', name: 'Hurghada International (HRG)' },
  { code: 'SSH', name: 'Sharm El Sheikh (SSH)' },
];

const parseAirport = (str) => {
  if (!str) return { city: '', code: '' };
  const match = str.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) return { city: match[1], code: match[2] };
  return { city: str, code: '' };
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.length <= 5 && timeStr.includes(':')) return timeStr;
  
  const dt = new Date(timeStr);
  if (!isNaN(dt)) {
    return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return timeStr;
};

export default function Flights() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // Search & Filter states
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [flightClass, setFlightClass] = useState('all');
  const [budget, setBudget] = useState(1500);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };
  const itemsPerPage = isFiltersOpen ? 6 : 9;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // Booking Modal states
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [travelDate, setTravelDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [bookingError, setBookingError] = useState('');

  // Fetch flights
  const { data: flightsData, isLoading } = useQuery({
    queryKey: ['publicFlights', origin, destination],
    queryFn: () => flightsAPI.search({ origin, destination }),
  });

  const flights = flightsData?.data?.data?.flights || flightsData?.data?.flights || [];

  const { data: bookingsData } = useQuery({
    queryKey: ['allBookings'],
    queryFn: () => bookingsAPI.getAll(),
    enabled: isAuthenticated,
  });

  const bookingsFromAPI = bookingsData?.data?.data?.bookings || bookingsData?.data?.bookings || [];
  const localBookings = (() => {
    try {
      return JSON.parse(localStorage.getItem('kemet_simulated_bookings') || '[]');
    } catch {
      return [];
    }
  })();
  const allBookingsMap = new Map();
  bookingsFromAPI.forEach(b => allBookingsMap.set(b._id, b));
  localBookings.forEach(b => {
    if (!allBookingsMap.has(b._id)) allBookingsMap.set(b._id, b);
  });
  const allBookings = Array.from(allBookingsMap.values());

  const bookedSeatsForDay = travelDate && selectedFlight ? allBookings.filter(b => {
    const isFlightBooking = (b.booking_type || b.bookingType || b.type) === 'flight';
    const isThisFlight = (b.reference_id?._id || b.reference_id) === selectedFlight._id;
    const isThisDay = b.dates?.start && b.dates.start.startsWith(travelDate);
    return isFlightBooking && isThisFlight && isThisDay && b.status !== 'cancelled';
  }).reduce((acc, curr) => acc + (curr.guests || curr.passengers || 1), 0) : 0;

  const currentAvailableSeats = 300 - bookedSeatsForDay;

  // Client side filtering for class & budget
  const filteredFlights = flights.filter((f) => {
    const matchesClass = flightClass === 'all' || (f.class || '').toLowerCase() === flightClass.toLowerCase();
    const matchesBudget = f.price <= budget;
    const matchesAirline = airlineSearch === '' || f.airline.toLowerCase().includes(airlineSearch.toLowerCase());
    return matchesClass && matchesBudget && matchesAirline;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredFlights.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFlights = filteredFlights.slice(indexOfFirstItem, indexOfLastItem);

  // Book Flight Mutation
  const bookMutation = useMutation({
    mutationFn: (payload) => bookingsAPI.bookFlight(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['publicFlights'] });
      const bookingId = res?.data?.data?.booking?._id || res?.data?.booking?._id;
      if (bookingId) {
        navigate(`/payment?bookingId=${bookingId}`);
      } else {
        navigate('/dashboard/bookings');
      }
    },
    onError: (err) => {
      setBookingError(err.response?.data?.message || 'Failed to initialize booking.');
    },
  });

  const handleBookClick = (flight) => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setSelectedFlight(flight);
    setTravelDate('');
    setPassengers(1);
    setBookingError('');
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingError('');
    if (!travelDate) {
      setBookingError('Please select your departure date.');
      return;
    }

    const departureDate = new Date(travelDate);
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 1);

    bookMutation.mutate({
      flight_id: selectedFlight._id,
      dates: {
        start: travelDate,
        end: new Date(returnDate.getTime() - returnDate.getTimezoneOffset() * 60000).toISOString().split('T')[0],
      },
      guests: parseInt(passengers),
      flightClass: selectedFlight.class,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

      {/* Title */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-serif font-black text-navy-500 tracking-wider">Egyptian Air Carriers</h1>
        <div className="h-1 w-24 bg-gold-500 mx-auto rounded-full"></div>
        <p className="text-gray-600 max-w-xl mx-auto">Compare carrier timetables and book swift routes connecting Cairo, Luxor, Aswan, and the Red Sea.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar: Filters Panel */}
        <div className={`transition-all duration-500 ease-in-out shrink-0 ${isFiltersOpen ? 'w-full lg:w-1/4' : 'w-full lg:w-[80px]'}`}>
          <div className="backdrop-blur-md bg-white/80 p-5 lg:p-6 rounded-2xl border border-gold-500/15 shadow-xl flex flex-col overflow-hidden">
            <div className={`flex items-center ${isFiltersOpen ? 'justify-between border-b border-gray-100 pb-3' : 'justify-center'} cursor-pointer`} onClick={() => setIsFiltersOpen(!isFiltersOpen)}>
              {isFiltersOpen ? (
                <>
                  <h3 className="text-base font-serif font-black text-navy-950 flex items-center space-x-2 whitespace-nowrap">
                    <Plane className="h-4.5 w-4.5 text-gold-500 rotate-45" />
                    <span>Filter Flights</span>
                  </h3>
                  <div className="flex items-center space-x-3">
                    {(origin || destination || flightClass !== 'all' || budget !== 1500 || airlineSearch !== '') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrigin('');
                          setDestination('');
                          setFlightClass('all');
                          setBudget(1500);
                          setAirlineSearch('');
                          setCurrentPage(1);
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-gold-600 hover:text-gold-700 transition duration-200 whitespace-nowrap"
                      >
                        Reset
                      </button>
                    )}
                    <span className="text-gray-400">
                      <ChevronLeft className="h-4 w-4" />
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 text-gold-500 hover:text-navy-900 transition-colors">
                  <SlidersHorizontal className="h-5 w-5" />
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </div>

            <div className={`transition-opacity duration-500 ease-in-out ${isFiltersOpen ? 'opacity-100' : 'opacity-0 hidden'} space-y-6 pt-4 flex-1 overflow-y-auto overflow-x-hidden`}>
              {/* Airline Search Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Airline Name</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. EgyptAir"
                    value={airlineSearch}
                    onChange={(e) => { setAirlineSearch(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Origin Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Origin</label>
                <div className="relative">
                  <select
                    value={origin}
                    onChange={(e) => { setOrigin(e.target.value); setCurrentPage(1); }}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none text-xs font-bold text-navy-900 transition duration-200 appearance-none"
                  >
                    <option value="">🛫 Any Origin</option>
                    {AIRPORTS.map((ap) => (
                      <option key={ap.code} value={ap.code}>{ap.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              {/* Destination Dropdown */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Destination</label>
                <div className="relative">
                  <select
                    value={destination}
                    onChange={(e) => { setDestination(e.target.value); setCurrentPage(1); }}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none text-xs font-bold text-navy-900 transition duration-200 appearance-none"
                  >
                    <option value="">🛬 Any Destination</option>
                    {AIRPORTS.map((ap) => (
                      <option key={ap.code} value={ap.code}>{ap.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                  </div>
                </div>
              </div>

              {/* Class Tier Filter List */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Cabin Class</label>
                <div className="flex flex-col gap-1.5">
                  {[
                    { value: 'all', label: '💎 All Classes' },
                    { value: 'economy', label: 'Economy Class' },
                    { value: 'business', label: 'Business Class' },
                    { value: 'first', label: 'First Class' },
                  ].map((tier) => {
                    const isActive = flightClass === tier.value;
                    return (
                      <button
                        key={tier.value}
                        onClick={() => { setFlightClass(tier.value); setCurrentPage(1); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-between ${isActive
                          ? 'bg-gold-500 text-navy-950 shadow-sm border border-gold-500'
                          : 'bg-gray-50 hover:bg-gray-100 text-navy-900 border border-gray-100'
                          }`}
                      >
                        <span>{tier.label}</span>
                        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-navy-950"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Budget Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Max Ticket Fare</span>
                  <span className="text-gold-600 font-serif font-black">${budget}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={budget}
                  onChange={(e) => { setBudget(Number(e.target.value)); setCurrentPage(1); }}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content: Flights Listing Grid */}
        <div className="flex-1 w-full transition-all duration-500">

          {/* Flights Listing Grid */}
          {isLoading ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 ${!isFiltersOpen ? 'lg:grid-cols-3' : ''} gap-8 transition-all duration-500`}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].slice(0, itemsPerPage).map(n => (
                <div key={n} className="h-64 rounded-xl animate-shimmer"></div>
              ))}
            </div>
          ) : filteredFlights.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4 transition-all duration-500">
              <Plane className="h-12 w-12 text-gray-300 mx-auto rotate-45" />
              <p className="text-gray-500 italic">No flights matching your flight parameters were found.</p>
            </div>
          ) : (
            <div className="space-y-8 transition-all duration-500">
              <div className={`grid grid-cols-1 md:grid-cols-2 ${!isFiltersOpen ? 'lg:grid-cols-3' : ''} gap-8`}>
                {currentFlights.map((f) => {
                  const originData = parseAirport(f.origin);
                  const destData = parseAirport(f.destination);

                  return (
                    <div
                      key={f._id}
                      className="relative bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden transition-all duration-500 transform hover:-translate-y-2 group"
                    >
                      {/* Decorative Top Accent */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-gold-400 via-gold-500 to-navy-500"></div>

                      <div className="p-5 flex flex-col h-full bg-gradient-to-b from-white to-gray-50/30">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-navy-50 to-gray-50 flex items-center justify-center border border-gray-100 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ease-out">
                              <Plane className="h-5 w-5 text-navy-500 -rotate-45" />
                            </div>
                            <div>
                              <h3 className="font-serif font-black text-navy-900 text-base leading-tight capitalize">{f.airline}</h3>
                              <p className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-0.5">Flight {f.flightNumber}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 bg-navy-50/80 text-navy-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-navy-100 shadow-sm">
                            {f.class || 'Economy'}
                          </span>
                        </div>

                        {/* Route details */}
                        <div className="flex items-center justify-between mb-6 relative">
                          <div className="text-left z-10 w-2/5 pr-2">
                            <span className="block text-sm sm:text-base font-black text-navy-900 truncate mb-0.5">{originData.city}</span>
                            {originData.code && <span className="block text-[10px] font-bold text-gray-400 tracking-widest uppercase">{originData.code}</span>}
                            <span className="text-[9px] font-semibold text-gold-600 uppercase tracking-widest block mt-1.5">Depart at {formatTime(f.departureTime)}</span>
                          </div>

                          <div className="flex-1 flex flex-col items-center justify-center relative w-1/5 shrink-0 px-2">
                            <div className="w-full border-t-2 border-dashed border-gray-200 absolute top-1/2 -translate-y-1/2 z-0"></div>
                            <div className="bg-white p-2 z-10 rounded-full border border-gray-100 shadow-sm group-hover:bg-gold-50 transition-colors duration-500 group-hover:shadow-md">
                              <Plane className="h-4 w-4 text-gold-500 rotate-90 transform group-hover:translate-x-1.5 transition-transform duration-500 ease-in-out" />
                            </div>
                          </div>

                          <div className="text-right z-10 w-2/5 pl-2">
                            <span className="block text-sm sm:text-base font-black text-navy-900 truncate mb-0.5">{destData.city}</span>
                            {destData.code && <span className="block text-[10px] font-bold text-gray-400 tracking-widest uppercase">{destData.code}</span>}
                            <span className="text-[9px] font-semibold text-gold-600 uppercase tracking-widest block mt-1.5">Arrive at {formatTime(f.arrivalTime)}</span>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full border-t border-gray-100 border-dashed mb-5 relative">
                          <div className="absolute -left-7 -top-3 h-6 w-6 rounded-full bg-gray-50 border border-gray-100 shadow-inner"></div>
                          <div className="absolute -right-7 -top-3 h-6 w-6 rounded-full bg-gray-50 border border-gray-100 shadow-inner"></div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Total Fare</span>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-sm font-bold text-gold-500">$</span>
                              <span className="text-3xl font-serif font-black text-navy-900 leading-none">{f.price}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleBookClick(f)}
                            className="bg-navy-900 text-white font-bold px-5 py-2.5 rounded-lg text-[10px] uppercase tracking-widest transition-all duration-300 shadow hover:shadow-lg hover:bg-gold-500 hover:text-navy-900 flex items-center space-x-1.5 group/btn overflow-hidden relative"
                          >
                            <span className="relative z-10">Select Flight</span>
                            <Plane className="h-3 w-3 rotate-45 transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-300 relative z-10" />
                            <div className="absolute inset-0 bg-gold-400 transform scale-x-0 group-hover/btn:scale-x-100 transition-transform origin-left duration-300 ease-out z-0"></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 pt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3.5 py-2 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-900"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-semibold">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-2 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-900"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Selection Modal Dialog */}
      {selectedFlight && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden border border-gold-500/10 shadow-2xl p-8 space-y-6 relative">
            
            {/* Close Button absolute */}
            <button
              onClick={() => setSelectedFlight(null)}
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 text-2xl font-bold transition focus:outline-none"
            >
              &times;
            </button>

            {/* Header Title */}
            <div className="text-center">
              <h3 className="text-3xl font-serif font-black tracking-widest text-[#c1a249] uppercase">
                Confirm Flight Route
              </h3>
              <p className="text-xs text-gray-500 mt-1">Specify dates and passengers for your flight.</p>
            </div>

            {bookingError && (
              <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Ticket details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-xs p-6 rounded-2xl border border-gold-500/10" style={{ backgroundColor: '#FAF7F0' }}>
              
              {/* Carrier */}
              <div className="flex items-center space-x-4">
                <svg className="h-8 w-8 text-[#c1a249] shrink-0 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12.5l-6-6v-3l-2-2-1 2v3l-6 6v2l6-2v5l-2 2v2l3-1 3 1v-2l-2-2v-5l6 2v-2z" />
                </svg>
                <div className="text-left">
                  <span className="text-gray-500 block text-xs">Carrier:</span>
                  <span className="font-bold text-gray-900 text-sm block mt-0.5">{selectedFlight.airline}</span>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center space-x-4">
                <svg className="h-8 w-8 text-[#c1a249] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 12c3 0 4-4 6-4s3 8 6 8h2" />
                  <circle cx="4" cy="12" r="2" />
                  <circle cx="18" cy="16" r="2" />
                  <path d="M12 6a2 2 0 100-4 2 2 0 000 4z" />
                  <path d="M12 6c-1 0-2 1-2 2 0 1.5 2 4 2 4s2-2.5 2-4c0-1-1-2-2-2z" />
                </svg>
                <div className="text-left">
                  <span className="text-gray-500 block text-xs">Route:</span>
                  <span className="font-bold text-gray-900 text-sm block mt-0.5">
                    {parseAirport(selectedFlight.origin).city} ({parseAirport(selectedFlight.origin).code}) &rarr; {parseAirport(selectedFlight.destination).city} ({parseAirport(selectedFlight.destination).code})
                  </span>
                </div>
              </div>

              {/* Cabin Class */}
              <div className="flex items-center space-x-4">
                <svg className="h-8 w-8 text-[#c1a249] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 13a9 9 0 0118 0v7H3v-7z" />
                  <rect x="6" y="11" width="5" height="7" rx="1" />
                  <path d="M6 15h5" />
                  <rect x="13" y="11" width="5" height="7" rx="1" />
                  <path d="M13 15h5" />
                </svg>
                <div className="text-left">
                  <span className="text-gray-500 block text-xs">Cabin Class:</span>
                  <span className="font-bold text-gray-900 text-sm block mt-0.5 capitalize">{selectedFlight.class}</span>
                </div>
              </div>

              {/* Available Seats */}
              {travelDate ? (
                <div className="flex items-center space-x-4">
                  <svg className="h-8 w-8 text-[#c1a249] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 4h2l3 9h6a1 1 0 011 1v1H9.5a1 1 0 01-1-.7L7 4.5A0.5 0.5 0 017 4z" />
                    <path d="M11 9h5a1 1 0 011 1v0.5a1 1 0 01-1 1H11" />
                    <path d="M10 15v3M15 15v3" />
                  </svg>
                  <div className="text-left">
                    <span className="text-gray-500 block text-xs">Available Seats:</span>
                    <span className="font-bold text-emerald-600 text-sm block mt-0.5">{Math.max(0, currentAvailableSeats - passengers)} free</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4 opacity-50">
                  <svg className="h-8 w-8 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path d="M7 4h2l3 9h6a1 1 0 011 1v1H9.5a1 1 0 01-1-.7L7 4.5A0.5 0.5 0 017 4z" />
                    <path d="M11 9h5a1 1 0 011 1v0.5a1 1 0 01-1 1H11" />
                    <path d="M10 15v3M15 15v3" />
                  </svg>
                  <div className="text-left">
                    <span className="text-gray-500 block text-xs">Available Seats:</span>
                    <span className="font-bold text-gray-400 text-sm block mt-0.5">Select a date</span>
                  </div>
                </div>
              )}

            </div>

            {/* Inputs & Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-6 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Departure Date */}
                <div className="space-y-2">
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] pl-1">Departure Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="date"
                      required
                      min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="pl-12 w-full p-3.5 border border-gold-500/35 focus:border-[#c1a249] focus:ring-1 focus:ring-[#c1a249] rounded-xl focus:outline-none font-semibold text-gray-800 bg-white"
                    />
                  </div>
                </div>

                {/* Passengers Count */}
                <div className="space-y-2">
                  <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] pl-1">Passengers Count</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min={1}
                      max={currentAvailableSeats}
                      value={passengers}
                      onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value) || 1))}
                      className="pl-12 w-full p-3.5 border border-gray-300 focus:border-[#c1a249] focus:ring-1 focus:ring-[#c1a249] rounded-xl focus:outline-none font-semibold text-gray-800 bg-white"
                    />
                  </div>
                </div>

              </div>

              {/* Total Cost & Buttons */}
              <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
                <div className="text-left">
                  <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest block pl-0.5">TOTAL COST</span>
                  <span className="font-serif text-3xl font-black text-[#c1a249]">${selectedFlight.price * passengers}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFlight(null)}
                    className="py-3.5 px-6 border border-[#c1a249] hover:bg-[#c1a249]/5 rounded-2xl text-xs font-bold text-[#c1a249] transition uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookMutation.isPending}
                    className="bg-[#c1a249] hover:bg-[#a68a3b] text-white font-bold py-3.5 px-8 rounded-2xl text-xs shadow-md flex items-center space-x-1.5 transition uppercase tracking-wider"
                  >
                    {bookMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                    <span>Checkout Booking</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
