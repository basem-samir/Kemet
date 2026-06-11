import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { landmarksAPI, governoratesAPI, tourismTypesAPI, favoritesAPI } from '../api/endpoints';
import { Compass, Search, MapPin, Star, Heart, Check, ChevronDown, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Landmarks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedGovs, setSelectedGovs] = useState([]);
  const [priceFilters, setPriceFilters] = useState([]); // 'free', 'under-100', '100-200', '200+'
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity', 'price-low', 'price-high'
  const [favorites, setFavorites] = useState(new Set());
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const itemsPerPage = 9;

  // Fetch initial data
  const { data: landmarksData, isLoading } = useQuery({
    queryKey: ['landmarks'],
    queryFn: () => landmarksAPI.getAll({ limit: 1000 }),
  });

  const { data: govData } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const { data: typesData } = useQuery({
    queryKey: ['tourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const { data: favsData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesAPI.getAll(),
    enabled: !!localStorage.getItem('kemet_access_token'),
  });

  useEffect(() => {
    if (favsData?.data?.data?.favorites) {
      const favSet = new Set(favsData.data.data.favorites.map(f => f.item_id?._id || f.item_id));
      setFavorites(favSet);
    }
  }, [favsData]);

  const landmarks = landmarksData?.data?.data?.landmarks || landmarksData?.data?.landmarks || landmarksData?.data || [];
  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];
  const tourismTypes = typesData?.data?.data?.types || typesData?.data?.types || [];

  // Initialize filters from URL search param if present
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      const matchedType = tourismTypes.find(t => t.slug === typeParam || t._id === typeParam);
      if (matchedType) {
        setSelectedTypes([matchedType._id]);
      }
    }
  }, [searchParams, tourismTypes]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  // Handle Favorite Toggle
  const toggleFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!localStorage.getItem('kemet_access_token')) {
        // Fallback local toggle for guests
        const updated = new Set(favorites);
        if (updated.has(id)) updated.delete(id);
        else updated.add(id);
        setFavorites(updated);
        return;
      }
      await favoritesAPI.toggle('landmark', id);
      const updated = new Set(favorites);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      setFavorites(updated);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Toggle Filters helpers
  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
    setCurrentPage(1);
  };

  const handleGovToggle = (govId) => {
    setSelectedGovs(prev =>
      prev.includes(govId) ? prev.filter(id => id !== govId) : [...prev, govId]
    );
    setCurrentPage(1);
  };

  const handlePriceToggle = (filterValue) => {
    setPriceFilters(prev =>
      prev.includes(filterValue) ? prev.filter(v => v !== filterValue) : [...prev, filterValue]
    );
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredLandmarks = landmarks.filter((l) => {
    // Search filter
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase());

    // Category / Tourism Type filter
    const matchesType = selectedTypes.length === 0 ||
      selectedTypes.includes(l.tourismType?._id || l.tourismType);

    // Governorate filter
    const govId = l.governorate_id?._id || l.governorate_id;
    const matchesGov = selectedGovs.length === 0 || selectedGovs.includes(govId);

    // Price filters
    let matchesPrice = priceFilters.length === 0;
    if (priceFilters.length > 0) {
      const price = l.ticketPrice || 0;
      if (priceFilters.includes('free') && price === 0) matchesPrice = true;
      if (priceFilters.includes('under-100') && price > 0 && price < 100) matchesPrice = true;
      if (priceFilters.includes('100-200') && price >= 100 && price <= 200) matchesPrice = true;
      if (priceFilters.includes('200+') && price > 200) matchesPrice = true;
    }

    return matchesSearch && matchesType && matchesGov && matchesPrice;
  });

  // Sort
  const sortedLandmarks = [...filteredLandmarks].sort((a, b) => {
    if (sortBy === 'price-low') return (a.ticketPrice || 0) - (b.ticketPrice || 0);
    if (sortBy === 'price-high') return (b.ticketPrice || 0) - (a.ticketPrice || 0);
    // popularity fallback (sort by rating & reviews)
    const scoreA = (a.averageRating || 4.5) * 10 + (a.totalReviews || 0);
    const scoreB = (b.averageRating || 4.5) * 10 + (b.totalReviews || 0);
    return scoreB - scoreA;
  });

  const totalPages = Math.ceil(sortedLandmarks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLandmarks = sortedLandmarks.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '95vh' }} className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Filters Sidebar (Left Column) */}
          {isFiltersOpen ? (
            <div className="w-full lg:w-1/4 shrink-0 transition-all duration-300">
              <div className="bg-white p-6 rounded-3xl border border-gray-200/50 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-serif font-black text-navy-950 tracking-wider">Filters</h2>
                    <div className="h-0.5 w-12 bg-[#c1a249] mt-2 rounded-full"></div>
                  </div>
                  <button
                    onClick={() => setIsFiltersOpen(false)}
                    className="p-1.5 hover:bg-gray-150 rounded-xl transition text-gray-500 hover:text-navy-950 flex items-center justify-center border border-gray-200/60"
                    title="Collapse filters"
                  >
                    <ChevronLeft className="h-4.5 w-4.5 text-[#c1a249]" />
                  </button>
                </div>

                {/* Keyword Search */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Keyword Search</span>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search landmarks..."
                      value={search}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[a-zA-Z\s]*$/.test(val)) {
                          setSearch(val);
                          setCurrentPage(1);
                        }
                      }}
                      className="pl-11 w-full p-3.5 border border-gold-500/10 rounded-full focus:outline-none focus:ring-2 focus:ring-gold-500/50 text-xs font-semibold transition"
                      style={{ backgroundColor: '#FAF5E8', color: '#1a1612' }}
                    />
                  </div>
                </div>

                {/* Categories Bullet List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Categories</span>
                  <div className="space-y-3 pr-2">
                    {tourismTypes.map((type) => {
                      const isChecked = selectedTypes.includes(type._id);
                      return (
                        <button
                          key={type._id}
                          onClick={() => handleTypeToggle(type._id)}
                          className="flex items-center space-x-3.5 w-full text-left group focus:outline-none py-0.5"
                        >
                          <div className={`h-1.5 w-1.5 rounded-full transition-all shrink-0 ${isChecked ? 'bg-[#c1a249] scale-125' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
                          <span className={`text-xs font-semibold transition ${isChecked ? 'text-[#c1a249] font-bold' : 'text-gray-600 group-hover:text-navy-950'}`}>
                            {type.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>



                {/* Price Range Checkboxes */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Price Range</span>
                  <div className="space-y-2.5">
                    {[
                      { val: 'free', label: 'Free' },
                      { val: 'under-100', label: 'Under 100 EGP' },
                      { val: '100-200', label: '100 - 200 EGP' },
                      { val: '200+', label: '200+ EGP' },
                    ].map((p) => {
                      const isChecked = priceFilters.includes(p.val);
                      return (
                        <button
                          key={p.val}
                          onClick={() => handlePriceToggle(p.val)}
                          className="flex items-center space-x-3.5 w-full text-left group focus:outline-none py-0.5"
                        >
                          <div className={`h-1.5 w-1.5 rounded-full transition-all shrink-0 ${isChecked ? 'bg-[#c1a249] scale-125' : 'bg-gray-300 group-hover:bg-gray-400'}`}></div>
                          <span className={`text-xs font-semibold transition ${isChecked ? 'text-[#c1a249] font-bold' : 'text-gray-600 group-hover:text-navy-950'}`}>
                            {p.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reset Filters */}
                {(search || selectedTypes.length > 0 || selectedGovs.length > 0 || priceFilters.length > 0) && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setSelectedTypes([]);
                      setSelectedGovs([]);
                      setPriceFilters([]);
                      setCurrentPage(1);
                    }}
                    className="w-full text-center text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100/80 py-3 rounded-2xl transition"
                  >
                    Clear All Filters
                  </button>
                )}

              </div>
            </div>
          ) : (
            <div className="w-full lg:w-[80px] shrink-0 transition-all duration-300">
              <button
                onClick={() => setIsFiltersOpen(true)}
                className="w-full bg-white p-5 rounded-3xl border border-gray-200/50 shadow-sm flex lg:flex-col items-center justify-between lg:justify-center lg:space-y-4 hover:border-[#c1a249]/50 transition group"
                title="Expand filters"
              >
                <div className="flex items-center space-x-3 lg:space-x-0">
                  <SlidersHorizontal className="h-5 w-5 text-navy-950 group-hover:text-[#c1a249] transition" />
                  <span className="text-xs font-bold text-navy-950 lg:hidden">Show Filters</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#c1a249] transition hidden lg:block" />
                <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-[#c1a249] transition lg:hidden" />
              </button>
            </div>
          )}

          {/* Main Grid View */}
          <div className="flex-1 w-full space-y-6">

            {/* Top Bar (Results count & Sort option) */}
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-3xl border border-gray-200/50 shadow-sm">
              <div className="text-sm font-medium text-gray-600">
                Showing <span className="font-bold text-navy-950">{sortedLandmarks.length}</span> attractions
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-50 border border-gray-200/80 rounded-2xl px-4 py-2 text-xs font-bold text-navy-950 focus:outline-none focus:ring-2 focus:ring-gold-500/50 cursor-pointer appearance-none pr-8 relative"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="popularity">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Landmarks Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="h-80 rounded-3xl animate-shimmer"></div>
                ))}
              </div>
            ) : sortedLandmarks.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/50 shadow-sm space-y-4">
                <Compass className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="text-gray-500 italic">No landmarks match your filters.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentLandmarks.map((l) => {
                    const isFav = favorites.has(l._id);
                    const isFree = (l.ticketPrice || 0) === 0;
                    return (
                      <Link
                        key={l._id}
                        to={`/landmarks/${l.slug}`}
                        className="group bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-gray-150"
                      >
                        {/* Image Container with Badges */}
                        <div className="h-52 overflow-hidden relative bg-gray-100">
                          <img
                            src={l.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80'}
                            alt={l.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Free Entry Badge */}
                          {isFree && (
                            <span className="absolute top-4 left-4 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                              Free Entry
                            </span>
                          )}

                          {/* Favorite Button */}
                          <button
                            onClick={(e) => toggleFavorite(e, l._id)}
                            className="absolute top-4 right-4 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-md transition duration-200 flex items-center justify-center"
                          >
                            <Heart className={`h-4.5 w-4.5 transition-colors duration-300 ${isFav ? 'text-red-500 fill-current' : 'text-gray-500 hover:text-red-500'}`} />
                          </button>
                        </div>

                        {/* Card Details */}
                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h3 className="font-serif font-bold text-lg text-navy-950 group-hover:text-gold-600 transition-colors line-clamp-1">
                              {l.name}
                            </h3>
                            {l.governorate_id?.name && (
                              <div className="flex items-center space-x-1 text-gray-500">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="text-xs font-semibold">{l.governorate_id.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Footer Details: Rating and Price */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-1.5">
                              <Star className="h-4 w-4 text-gold-500 fill-current" />
                              <span className="text-xs font-bold text-gray-700">{l.averageRating?.toFixed(1) || '4.8'}</span>
                            </div>

                            <div className="text-xs font-bold text-navy-950">
                              {isFree ? 'Free' : `${l.ticketPrice} EGP`}
                            </div>
                          </div>
                        </div>

                      </Link>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 pt-6">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2.5 rounded-xl border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-950 shadow-sm"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500 font-semibold px-3">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2.5 rounded-xl border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-950 shadow-sm"
                    >
                      Next
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
