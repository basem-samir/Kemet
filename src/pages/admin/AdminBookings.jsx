import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api/endpoints';
import { Loader2, Plane, Building2, Landmark, Calendar } from 'lucide-react';

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'completed', 'cancelled'
  const [currentPage, setCurrentPage] = useState(1);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: () => adminAPI.getBookings(),
  });

  const bookings = bookingsData?.data?.data?.bookings || bookingsData?.data?.bookings || [];

  // Calculate status counts
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'all') return true;
    return b.status === statusFilter;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Bookings</h2>
        <p className="text-xs text-gray-500">Overview of all active flights, stays, and tour itineraries processed.</p>
      </div>

      {/* Filters tabs with counts */}
      <div className="flex border-b border-gray-200 space-x-6 text-xs pb-0.5 overflow-x-auto scrollbar-none">
        {[
          { id: 'all', label: 'All Bookings', count: totalCount },
          { id: 'pending', label: 'Pending', count: pendingCount },
          { id: 'confirmed', label: 'Confirmed', count: confirmedCount },
          { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleStatusFilterChange(tab.id)}
            className={`pb-3 font-bold relative transition whitespace-nowrap ${
              statusFilter === tab.id
                ? 'text-gold-600 border-b-2 border-gold-500'
                : 'text-gray-500 hover:text-navy-500'
            }`}
          >
            {tab.label} <span className="text-[10px] text-gray-400 font-normal">({tab.count})</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No bookings match the selected status filter.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Total Bill</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentBookings.map((b) => {
                let typeIcon = Calendar;
                // Support both schema-defined booking_type and fallback type
                const bookingType = b.booking_type || b.type;
                if (bookingType === 'flight') typeIcon = Plane;
                if (bookingType === 'hotel') typeIcon = Building2;
                if (bookingType === 'itinerary') typeIcon = Landmark;

                const IconComponent = typeIcon;

                return (
                  <tr key={b._id} className="hover:bg-sand-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-navy-500">#{b._id.slice(-8)}</td>
                    <td className="px-6 py-4 text-xs leading-relaxed">
                      <span className="font-bold block text-navy-900">{b.user_id?.full_name || 'Anonymous User'}</span>
                      <span className="text-gray-400 block">{b.user_id?.email || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5 capitalize">
                        <IconComponent className="h-4 w-4 text-gold-500" />
                        <span>{bookingType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-navy-500">${b.totalPrice || 250}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                        b.status === 'confirmed' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : b.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize font-semibold">
                      {b.payment?.status === 'paid' ? (
                        <span className="text-green-600">Paid ({b.payment.method})</span>
                      ) : (
                        <span className="text-red-500">Unpaid</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border-t border-gray-200 px-6 py-4">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-semibold text-navy-500">
                  {Math.min(indexOfLastItem, filteredBookings.length)}
                </span>{' '}
                of <span className="font-semibold text-navy-500">{filteredBookings.length}</span> entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Previous
                </button>
                <button
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
