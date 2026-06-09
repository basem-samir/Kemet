import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api/endpoints';
import { 
  BarChart3, Users, DollarSign, Calendar, Bookmark, 
  MessageSquare, Compass, Loader2, ArrowUpRight, 
  Activity, Plane, Building2, Landmark, Clock 
} from 'lucide-react';

export default function AdminStats() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminAPI.getStats(),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => adminAPI.getBookings(),
  });

  const stats = statsData?.data?.data?.stats || statsData?.data?.stats || null;
  const bookings = bookingsData?.data?.data?.bookings || bookingsData?.data?.bookings || [];

  if (statsLoading || bookingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 text-gold-500 animate-spin" />
        <p className="text-gray-500 text-sm">Aggregating platform metrics and activities...</p>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="text-center py-10 text-red-500 font-bold">
        Failed to load platform statistics.
      </div>
    );
  }

  // Define metric cards
  const statCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-green-600 bg-green-500/10' },
    { 
      label: 'Platform Commission Earned', 
      value: `$${(stats.commission?.totalEarned || 0).toFixed(0)}`, 
      icon: DollarSign, 
      color: 'text-emerald-600 bg-emerald-500/10' 
    },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: Calendar, color: 'text-purple-600 bg-purple-500/10' },
    { label: 'Total Hotels', value: stats.totalHotels, icon: Bookmark, color: 'text-gold-600 bg-gold-500/10' },
    { label: 'Total Landmarks', value: stats.totalLandmarks, icon: Compass, color: 'text-orange-600 bg-orange-500/10' },
    { label: 'Total Reviews', value: stats.totalReviews, icon: MessageSquare, color: 'text-red-600 bg-red-500/10' },
  ];

  // Booking distribution calculations
  const hotelCount = stats.bookingsByType?.hotel || 0;
  const flightCount = stats.bookingsByType?.flight || 0;
  const itineraryCount = stats.bookingsByType?.itinerary || 0;
  const ticketCount = stats.bookingsByType?.landmark || stats.bookingsByType?.ticket || 0;
  const totalTyped = hotelCount + flightCount + itineraryCount + ticketCount || 1;

  const hotelPct = (hotelCount / totalTyped) * 100;
  const flightPct = (flightCount / totalTyped) * 100;
  const itineraryPct = (itineraryCount / totalTyped) * 100;
  const ticketPct = (ticketCount / totalTyped) * 100;

  const barChartData = [
    { label: 'Hotel Stays', count: hotelCount, color: '#F26419' },
    { label: 'Flights', count: flightCount, color: '#E01A4F' },
    { label: 'Tours & Packages', count: itineraryCount, color: '#F6AA1C' },
    { label: 'Tickets', count: ticketCount, color: '#800E13' },
  ];
  const maxCount = Math.max(...barChartData.map(d => d.count), 1);

  // Helper component for Booking Icon
  const getBookingIcon = (type) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-4 w-4 text-sky-600" />;
      case 'hotel':
        return <Building2 className="h-4 w-4 text-gold-600" />;
      case 'itinerary':
        return <Landmark className="h-4 w-4 text-emerald-600" />;
      case 'landmark':
      case 'ticket':
        return <Landmark className="h-4 w-4 text-amber-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-bold text-navy-500">Platform Analytics Overview</h2>
        <p className="text-xs text-gray-500">Real-time statistics compiled across all Egypt tourism operations.</p>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, i) => {
          const IconComponent = card.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex items-center space-x-4">
              <div className={`p-2.5 rounded-lg ${card.color} shrink-0`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider truncate">{card.label}</span>
                <span className="text-lg font-bold font-serif text-navy-500 block truncate">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Commission Breakdown Section */}
      {stats.commission && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Commission Breakdown by Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['flight', 'hotel', 'itinerary', 'landmark'].map((type) => {
              const typeData = stats.commission.byType?.[type] || {};
              const currentRate = stats.commission.currentRates?.[type] ?? stats.commission.currentRates?.default ?? 10;
              return (
                <div key={type} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{type}</p>
                  <p className="text-xl font-bold text-gray-800">
                    ${(typeData.totalCommission || 0).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {typeData.bookingCount || 0} bookings · {currentRate}% rate
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    from ${(typeData.totalRevenue || 0).toFixed(0)} total revenue
                  </p>
                </div>
              );
            })}
          </div>

          {/* Current commission rates summary */}
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm font-medium text-amber-800 mb-2">Current Commission Rates</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.commission.currentRates || {}).map(([key, rate]) => (
                <span key={key} className="text-xs bg-white border border-amber-200 text-amber-700 px-3 py-1 rounded-full">
                  {key.replace('commission_rate_', '')}: <strong>{rate}%</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bar Chart: Bookings by Type */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-navy-500 text-sm">Booking Volumes</h3>
              <p className="text-[9px] text-gray-400">Total orders categorized by item category.</p>
            </div>
            <BarChart3 className="h-4.5 w-4.5 text-gold-500" />
          </div>
          
          <div className="flex items-end justify-around h-56 pt-6 px-4">
            {barChartData.map((bar, idx) => {
              const heightPercent = (bar.count / maxCount) * 80;
              return (
                <div key={idx} className="flex flex-col items-center group w-1/4">
                  <div className="relative w-full flex justify-center items-end h-40">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 bg-navy-950 text-white text-[9px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold pointer-events-none whitespace-nowrap shadow-md">
                      {bar.count} orders
                    </div>
                    {/* Visual Bar */}
                    <div 
                      style={{ height: `${Math.max(heightPercent, 6)}%`, backgroundColor: bar.color }}
                      className="w-12 rounded-t-md transition-all duration-500 ease-out shadow-sm group-hover:scale-x-105 group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 mt-3 text-center truncate w-full">{bar.label}</span>
                  <span className="text-xs font-bold text-navy-500 mt-0.5">{bar.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution Analysis */}
        <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-navy-500 text-sm">Product Market Share</h3>
              <p className="text-[9px] text-gray-400">Percentage distribution of current bookings.</p>
            </div>
            <Activity className="h-4.5 w-4.5 text-gold-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center h-56">
            {/* SVG Pie Chart representation */}
            <div className="flex justify-center relative">
              <svg width="150" height="150" viewBox="0 0 42 42" className="transform -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#E2E8F0" strokeWidth="4.5" />
                
                {/* Hotel slice */}
                <circle 
                  cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#F26419" strokeWidth="4.5" 
                  strokeDasharray={`${hotelPct} ${100 - hotelPct}`} 
                  strokeDashoffset="0" 
                />

                {/* Flight slice */}
                <circle 
                  cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#E01A4F" strokeWidth="4.5" 
                  strokeDasharray={`${flightPct} ${100 - flightPct}`} 
                  strokeDashoffset={`-${hotelPct}`} 
                />

                {/* Itinerary slice */}
                <circle 
                  cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#F6AA1C" strokeWidth="4.5" 
                  strokeDasharray={`${itineraryPct} ${100 - itineraryPct}`} 
                  strokeDashoffset={`-${hotelPct + flightPct}`} 
                />

                {/* Ticket slice */}
                <circle 
                  cx="21" cy="21" r="15.915" fill="transparent" 
                  stroke="#800E13" strokeWidth="4.5" 
                  strokeDasharray={`${ticketPct} ${100 - ticketPct}`} 
                  strokeDashoffset={`-${hotelPct + flightPct + itineraryPct}`} 
                />
              </svg>
              {/* Inner Label */}
              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                <span className="text-xs font-bold text-navy-500">{stats.totalBookings}</span>
                <span className="text-[7px] text-gray-400 uppercase tracking-widest font-bold">Total</span>
              </div>
            </div>

            {/* Legend block */}
            <div className="space-y-3 text-xs text-navy-950 font-medium w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-[#F26419] shrink-0" />
                  <span>Stays</span>
                </div>
                <span className="font-bold">{hotelPct.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-[#E01A4F] shrink-0" />
                  <span>Flights</span>
                </div>
                <span className="font-bold">{flightPct.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-[#F6AA1C] shrink-0" />
                  <span>Tours</span>
                </div>
                <span className="font-bold">{itineraryPct.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded bg-[#800E13] shrink-0" />
                  <span>Tickets</span>
                </div>
                <span className="font-bold">{ticketPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log List */}
      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-4.5 w-4.5 text-gold-500" />
            <div>
              <h3 className="font-serif font-bold text-navy-500 text-sm">Recent System Activity</h3>
              <p className="text-[9px] text-gray-400">Live feed of all global user booking reservations.</p>
            </div>
          </div>
          <span className="bg-navy-50 text-navy-500 text-[9px] font-bold px-2 py-0.5 rounded border border-navy-100">
            Total operations: {bookings.length}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-400 italic">
            No booking activities recorded on the platform yet.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-gray-100">
              {(() => {
                const itemsPerPage = 5;
                const totalPages = Math.ceil(bookings.length / itemsPerPage);
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentBookings = bookings.slice(indexOfFirstItem, indexOfLastItem);
                
                return (
                  <>
                    {currentBookings.map((b) => {
                      const isPaid = b.payment?.status === 'paid';
                      return (
                        <div key={b._id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                          {/* User & Icon Group */}
                          <div className="flex items-center space-x-3">
                            <div className="h-8.5 w-8.5 bg-navy-50 border border-navy-100 rounded-lg flex items-center justify-center shrink-0">
                              {getBookingIcon(b.booking_type)}
                            </div>
                            <div>
                              <span className="font-bold text-navy-500 text-xs block">
                                {b.user_id?.full_name || 'Anonymous Explorer'}
                              </span>
                              <span className="text-[10px] text-gray-400 block">
                                {b.user_id?.email || 'no-email@kemet.com'}
                              </span>
                            </div>
                          </div>

                          {/* Booking item details */}
                          <div className="flex-1 min-w-0 sm:px-4">
                            <span className="font-medium text-gray-600 block truncate">
                              {b.snapshot?.itemName || `${b.booking_type} Reservation`}
                            </span>
                            <span className="text-[9px] text-gray-400 block font-mono">
                              ID: #{b._id}
                            </span>
                          </div>

                          {/* Status, Price, Date */}
                          <div className="flex items-center space-x-6 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="text-left sm:text-right">
                              <span className="font-bold text-navy-500 font-serif block">${b.totalPrice?.toFixed(0)}</span>
                              <span className="text-[9px] text-gray-400 block">
                                {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'recent'}
                              </span>
                            </div>

                            <div className="flex flex-col items-end space-y-1">
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${
                                b.status === 'confirmed' || b.status === 'completed'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : b.status === 'cancelled'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              }`}>
                                {b.status}
                              </span>
                              
                              <span className={`text-[8px] font-bold uppercase tracking-wider block ${
                                isPaid ? 'text-green-600' : 'text-amber-500'
                              }`}>
                                {isPaid ? '● Paid' : '○ Unpaid'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {totalPages > 1 && (
                      <div className="flex justify-between items-center border-t border-gray-150 pt-4 mt-2">
                        <div className="text-[10px] text-gray-500 font-medium">
                          Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                          <span className="font-semibold text-navy-500">
                            {Math.min(indexOfLastItem, bookings.length)}
                          </span>{' '}
                          of <span className="font-semibold text-navy-500">{bookings.length}</span> entries
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-[10px] font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-2.5 py-1 rounded border bg-white disabled:opacity-50 text-[10px] font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
