import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bookingsAPI, favoritesAPI } from '../../api/endpoints';
import { User, Mail, Globe, Phone, ShieldCheck, AlertCircle, Calendar, Heart, Compass, Loader2, CheckCircle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardOverview() {
  const { user } = useAuthStore();

  // Fetch stats details
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['userBookings'],
    queryFn: () => bookingsAPI.getAll(),
  });

  const { data: favsData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesAPI.getAll(),
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
  const favorites = favsData?.data?.data?.favorites || favsData?.data?.favorites || [];

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'completed');
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const totalSpent = confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0);

  // Type breakdowns
  const hotelBookings = bookings.filter((b) => b.booking_type === 'hotel' || b.bookingType === 'hotel' || b.type === 'hotel').length;
  const flightBookings = bookings.filter((b) => b.booking_type === 'flight' || b.bookingType === 'flight' || b.type === 'flight').length;
  const itineraryBookings = bookings.filter((b) => b.booking_type === 'itinerary' || b.bookingType === 'itinerary' || b.type === 'itinerary').length;
  const ticketBookings = bookings.filter((b) => b.booking_type === 'landmark' || b.bookingType === 'landmark' || b.type === 'landmark').length;

  const maxVal = Math.max(hotelBookings, flightBookings, itineraryBookings, ticketBookings, 1);
  const hotelHeight = (hotelBookings / maxVal) * 80;
  const flightHeight = (flightBookings / maxVal) * 80;
  const itineraryHeight = (itineraryBookings / maxVal) * 80;
  const ticketHeight = (ticketBookings / maxVal) * 80;

  // Donut chart calculations
  const totalStatus = confirmedBookings.length + pendingBookings.length + cancelledBookings.length || 1;
  const confPct = (confirmedBookings.length / totalStatus) * 100;
  const pendPct = (pendingBookings.length / totalStatus) * 100;
  const cancPct = (cancelledBookings.length / totalStatus) * 100;

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-bold text-navy-900">Welcome back, {user?.name || user?.full_name || 'Traveler'}</h2>
        <p className="text-xs text-gray-500">Here is your Kemet travel itinerary overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-sand-50 p-5 rounded-xl border border-gold-500/10 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-gold-500/15 text-gold-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total Bookings</span>
            <span className="text-xl font-bold font-serif text-navy-900">{totalBookings}</span>
          </div>
        </div>

        <div className="bg-sand-50 p-5 rounded-xl border border-gold-500/10 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-green-500/15 text-green-600">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Confirmed</span>
            <span className="text-xl font-bold font-serif text-navy-900">{confirmedBookings.length}</span>
          </div>
        </div>

        <div className="bg-sand-50 p-5 rounded-xl border border-gold-500/10 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-navy-500/15 text-navy-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Money Spent</span>
            <span className="text-xl font-bold font-serif text-gold-600">${totalSpent}</span>
          </div>
        </div>

        <div className="bg-sand-50 p-5 rounded-xl border border-gold-500/10 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-red-500/15 text-red-500">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Bookmarks</span>
            <span className="text-xl font-bold font-serif text-navy-900">{favorites.length} saved</span>
          </div>
        </div>
      </div>

      {/* Diagrams / Charts Section */}
      {totalBookings > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Booking Category Distribution Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-gold-500/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider">Booking Categories</h3>
            <div className="flex justify-center items-center">
              <svg className="w-full max-w-xs h-40" viewBox="0 0 300 150">
                {/* Gridlines */}
                <line x1="20" y1="20" x2="280" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="20" y1="60" x2="280" y2="60" stroke="#f3f4f6" strokeWidth="1" />
                <line x1="20" y1="100" x2="280" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                
                {/* Bars */}
                <rect x="35" y={110 - hotelHeight} width="30" height={hotelHeight} fill="#0d1b2a" rx="4" className="transition-all duration-500" />
                <rect x="100" y={110 - flightHeight} width="30" height={flightHeight} fill="#6072a3" rx="4" className="transition-all duration-500" />
                <rect x="165" y={110 - itineraryHeight} width="30" height={itineraryHeight} fill="#10b981" rx="4" className="transition-all duration-500" />
                <rect x="230" y={110 - ticketHeight} width="30" height={ticketHeight} fill="#C9A84C" rx="4" className="transition-all duration-500" />

                {/* X-axis */}
                <line x1="20" y1="110" x2="280" y2="110" stroke="#e5e7eb" strokeWidth="1.5" />

                {/* Labels */}
                <text x="50" y="125" textAnchor="middle" className="text-[9px] fill-gray-500 font-bold uppercase">Stays ({hotelBookings})</text>
                <text x="115" y="125" textAnchor="middle" className="text-[9px] fill-gray-500 font-bold uppercase">Flights ({flightBookings})</text>
                <text x="180" y="125" textAnchor="middle" className="text-[9px] fill-gray-500 font-bold uppercase">Tours ({itineraryBookings})</text>
                <text x="245" y="125" textAnchor="middle" className="text-[9px] fill-gray-500 font-bold uppercase">Tickets ({ticketBookings})</text>
              </svg>
            </div>
          </div>

          {/* Booking Status Distribution Donut Chart */}
          <div className="bg-white p-6 rounded-xl border border-gold-500/10 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-500 uppercase tracking-wider">Booking Statuses</h3>
            <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
              {/* Radial Donut Progress Ring */}
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                  
                  {/* Confirmed Segment */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" stroke="#10b981" strokeWidth="3.2" 
                    strokeDasharray={`${confPct} ${100 - confPct}`}
                    strokeDashoffset="0"
                  />
                  {/* Pending Segment */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" stroke="#f59e0b" strokeWidth="3.2" 
                    strokeDasharray={`${pendPct} ${100 - pendPct}`}
                    strokeDashoffset={`-${confPct}`}
                  />
                  {/* Cancelled Segment */}
                  <circle 
                    cx="18" cy="18" r="15.915" 
                    fill="none" stroke="#ef4444" strokeWidth="3.2" 
                    strokeDasharray={`${cancPct} ${100 - cancPct}`}
                    strokeDashoffset={`-${confPct + pendPct}`}
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="block text-lg font-black text-navy-500 font-serif">{totalBookings}</span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Orders</span>
                </div>
              </div>

              {/* Status Legends */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-[#10b981] rounded-full shrink-0"></div>
                  <span className="text-gray-600 font-medium">Confirmed: <strong className="text-navy-500">{confirmedBookings.length}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-[#f59e0b] rounded-full shrink-0"></div>
                  <span className="text-gray-600 font-medium">Pending: <strong className="text-navy-500">{pendingBookings.length}</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-[#ef4444] rounded-full shrink-0"></div>
                  <span className="text-gray-600 font-medium">Cancelled: <strong className="text-navy-500">{cancelledBookings.length}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div className="space-y-4 w-full">
        <div className="flex justify-between items-end border-b border-gray-150 pb-2">
          <h3 className="text-lg font-serif font-bold text-navy-500">Recent Activity</h3>
          <span className="text-xs text-gray-500">
            Total Money Spent: <strong className="text-gold-600 font-serif text-sm font-bold">${totalSpent}</strong>
          </span>
        </div>
        
        {bookingsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 text-gold-500 animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-xl border border-dashed text-center text-xs text-gray-400 space-y-2">
            <p>You have no travel bookings recorded.</p>
            <Link to="/itineraries" className="inline-block text-gold-600 font-bold hover:underline">Explore itineraries &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.slice(0, 5).map((b) => (
              <div key={b._id} className="p-4 bg-gray-50 border border-gray-150 rounded-lg flex justify-between items-center text-xs hover:border-gold-500/30 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-navy-500 capitalize">{b.booking_type || b.type} booking</span>
                    <span className="text-gray-400 text-[10px]">— {b.snapshot?.itemName || 'Kemet Reservation'}</span>
                  </div>
                  <span className="text-gray-400 block text-[10px]">Ref: #{b._id.slice(-8)}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-gold-600 font-serif text-sm">
                    ${b.totalPrice || b.price || 0}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    b.status === 'confirmed' || b.status === 'completed' ? 'bg-green-50 text-green-700' : b.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                  }`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
            {bookings.length > 5 && (
              <Link to="/dashboard/bookings" className="text-xs text-gold-600 font-bold hover:underline block text-right">
                View all bookings &rarr;
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
