import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { favoritesAPI } from '../../api/endpoints';
import { Heart, Loader2, MapPin, Eye, Compass, ShieldAlert, CheckCircle } from 'lucide-react';

export default function Favorites() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }
  const [confirmRemoveFav, setConfirmRemoveFav] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };
  const itemsPerPage = 6;
  const [filterType, setFilterType] = useState('all');

  const { data: favsData, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesAPI.getAll(),
  });

  const favorites = favsData?.data?.data?.favorites || favsData?.data?.favorites || [];
  const filteredFavorites = favorites.filter(fav => filterType === 'all' || fav.item_type === filterType);

  // Toggle/Delete favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (fav) => favoritesAPI.toggle(fav.item_type, fav.item_id?._id || fav.item_id),
    onMutate: () => {
      setToast({ message: 'Removing from favorites...', type: 'info' });
    },
    onSuccess: () => {
      setToast({ message: 'Removed from favorites successfully!', type: 'success' });
      setConfirmRemoveFav(null);
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (err) => {
      setToast({ message: err?.response?.data?.message || 'Failed to remove from favorites.', type: 'error' });
      setConfirmRemoveFav(null);
      setTimeout(() => setToast(null), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        <p className="text-gray-500 text-xs">Loading your saved wonders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-serif font-bold text-navy-500">My Favorites</h2>
        <p className="text-xs text-gray-500">Your bookmarked landmarks and accommodations across Egypt.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-4">
          <Heart className="h-12 w-12 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="font-serif font-semibold text-navy-500 text-sm">No Favorites Yet</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">Click the heart button on landmark or hotel detail pages to save them.</p>
          </div>
          <Link to="/landmarks" className="inline-block bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-6 py-2.5 rounded-lg text-xs shadow-md">
            Explore Landmarks
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex space-x-2 pb-2">
            {[
              { id: 'all', label: 'All Favorites' },
              { id: 'landmark', label: 'Landmarks' },
              { id: 'hotel', label: 'Hotels' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterType(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition ${
                  filterType === tab.id
                    ? 'bg-gold-500 text-navy-900 shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:text-navy-500 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filteredFavorites.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs italic">
              No favorites found matching the selected filter.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {(() => {
                  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
                  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
                  const indexOfLastItem = safeCurrentPage * itemsPerPage;
                  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                  const currentFavorites = filteredFavorites.slice(indexOfFirstItem, indexOfLastItem);
                  
                  return currentFavorites.map((fav) => {
                    const item = fav.item_id;
                    if (!item) return null;

                    const detailLink = fav.item_type === 'hotel' 
                      ? `/hotels/${item.slug}` 
                      : `/landmarks/${item.slug}`;

                    return (
                      <div 
                        key={fav._id} 
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-gold-500/30 transition relative group"
                      >
                        {/* Remove from favorites button */}
                        <button
                          onClick={() => setConfirmRemoveFav(fav)}
                          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow hover:bg-red-50 hover:text-red-500 text-gray-600 transition"
                          title="Remove from Favorites"
                        >
                          <Heart className="h-4.5 w-4.5 fill-red-500 text-red-500" />
                        </button>

                        <div className="h-40 overflow-hidden bg-gray-100 relative">
                          <img 
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=400&q=80'} 
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider block">{fav.item_type}</span>
                            <h4 className="font-serif font-bold text-navy-500 text-base line-clamp-1">{item.name}</h4>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                            <Link 
                              to={detailLink} 
                              className="text-navy-500 hover:text-gold-600 font-bold flex items-center space-x-1.5"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View details</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })})()}
              </div>
            
            {/* Pagination Controls */}
            {Math.ceil(filteredFavorites.length / itemsPerPage) > 1 && (() => {
              const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
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

      {/* Confirmation Modal for Favorite Removal */}
      {confirmRemoveFav && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-red-500">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">Remove Favorite</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to remove <strong className="text-navy-500">{confirmRemoveFav.item_id?.name || 'this item'}</strong> from your favorites?
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmRemoveFav(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleFavoriteMutation.mutate(confirmRemoveFav)}
                disabled={toggleFavoriteMutation.isPending}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow transition flex items-center space-x-1"
              >
                {toggleFavoriteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span>Remove</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
