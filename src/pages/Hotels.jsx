import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { hotelsAPI, governoratesAPI, favoritesAPI } from '../api/endpoints';
import { Compass, Search, MapPin, Star, Heart, Building2, SlidersHorizontal, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

export default function Hotels() {
  const [search, setSearch] = useState('');
  const [stars, setStars] = useState('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [favorites, setFavorites] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const itemsPerPage = isFiltersOpen ? 5 : 6;

  // React Queries
  const { data: hotelsData, isLoading } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => hotelsAPI.getAll({ limit: 1000 }),
  });

  const { data: govData } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const { data: favsData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesAPI.getAll(),
    enabled: !!localStorage.getItem('kemet_access_token'),
  });

  // Sync favorites
  useEffect(() => {
    if (favsData?.data?.data?.favorites) {
      const favSet = new Set(favsData.data.data.favorites.map(f => f.item_id?._id || f.item_id));
      setFavorites(favSet);
    }
  }, [favsData]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  const hotels = hotelsData?.data?.data?.hotels || hotelsData?.data?.hotels || hotelsData?.data || [];
  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];

  // Handle Favorite Toggle
  const toggleFavorite = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!localStorage.getItem('kemet_access_token')) {
        const updated = new Set(favorites);
        if (updated.has(id)) updated.delete(id);
        else updated.add(id);
        setFavorites(updated);
        return;
      }
      await favoritesAPI.toggle('hotel', id);
      const updated = new Set(favorites);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      setFavorites(updated);
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Filter Logic
  const filteredHotels = hotels.filter((h) => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city.toLowerCase().includes(search.toLowerCase());
    
    const matchesStars = stars === 'all' || h.stars === parseInt(stars);

    const hotelGovId = h.governorate_id?._id || h.governorate_id;
    const matchesGov = selectedGovernorate === 'all' || hotelGovId === selectedGovernorate;

    return matchesSearch && matchesStars && matchesGov;
  });

  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '95vh' }} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-serif font-black text-navy-950 tracking-wider">Hotels & Accommodations</h1>
          <div className="h-1 w-24 bg-gold-500 mx-auto rounded-full"></div>
          <p className="text-gray-600 max-w-xl mx-auto">Book from luxury Nile-view retreats to boutique desert lodges and sea-facing resorts.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar: Filters Panel */}
          {isFiltersOpen ? (
            <div className="w-full lg:w-1/4 shrink-0 transition-all duration-300">
              <div className="bg-white p-6 rounded-[20px] border border-[#c1a249] shadow-[4px_4px_0px_#c1a249] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#c1a249] pb-4">
                  <h3 className="text-xl font-serif font-black tracking-wide uppercase text-left" style={{ color: '#1a1612' }}>
                    Filter Stays
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-[#c1a249] shrink-0" />
                    <button 
                      onClick={() => setIsFiltersOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-navy-950 flex items-center justify-center border border-gray-200"
                      title="Collapse filters"
                    >
                      <ChevronLeft className="h-4 w-4 text-[#c1a249]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 pt-5 flex-1 overflow-y-auto overflow-x-hidden">
                  
                  {/* Search */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block text-left">Search</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#c1a249]" />
                      <input
                        type="text"
                        placeholder="Hotel or city name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        className="pl-12 w-full p-3.5 border border-[#c1a249] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c1a249] text-xs font-semibold transition bg-transparent placeholder-gray-400"
                        style={{ color: '#1a1612' }}
                      />
                    </div>
                  </div>

                  {/* Governorate Dropdown */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block text-left">Governorate</label>
                    <div className="relative">
                      <select
                        value={selectedGovernorate}
                        onChange={(e) => { setSelectedGovernorate(e.target.value); setCurrentPage(1); }}
                        className="w-full p-3.5 border border-[#c1a249] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c1a249] text-xs font-bold text-navy-950 transition appearance-none cursor-pointer"
                        style={{ backgroundColor: '#ffffff', color: '#1a1612' }}
                      >
                        <option value="all">🌍 All Governorates</option>
                        {governorates.map((gov) => (
                          <option key={gov._id} value={gov._id}>📍 {gov.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#c1a249]">
                        <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>
                  </div>


                  {/* Star Class Filter */}
                  <div className="space-y-3 pt-5 border-t border-gray-150">
                    <label className="text-[11px] font-bold text-gray-900 uppercase tracking-wider block text-left">Star Class</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {['all', '3', '4', '5'].map((starOpt) => {
                        const isActive = stars === starOpt;
                        return (
                          <button
                            key={starOpt}
                            onClick={() => { setStars(starOpt); setCurrentPage(1); }}
                            className={`px-4 py-3 text-xs font-bold transition duration-200 flex items-center justify-center space-x-1.5 border rounded-[14px] ${isActive
                              ? 'text-white shadow-sm'
                              : 'bg-[#f8f9fa] hover:bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            style={isActive ? { backgroundColor: '#c1a249', borderColor: '#c1a249', color: '#ffffff' } : {}}
                          >
                            {starOpt !== 'all' && <Star className={`h-3.5 w-3.5 fill-current shrink-0 ${isActive ? 'text-white' : 'text-[#c1a249]'}`} />}
                            <span>{starOpt === 'all' ? 'All' : `${starOpt} Stars`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="w-full lg:w-[80px] shrink-0 transition-all duration-300">
              <button
                onClick={() => setIsFiltersOpen(true)}
                className="w-full bg-white p-5 rounded-[20px] border border-[#c1a249] shadow-[4px_4px_0px_#c1a249] flex lg:flex-col items-center justify-between lg:justify-center lg:space-y-4 hover:bg-gray-50 transition group"
                title="Expand filters"
              >
                <div className="flex items-center space-x-3 lg:space-x-0">
                  <SlidersHorizontal className="h-5 w-5 text-[#c1a249] transition" />
                  <span className="text-xs font-bold text-navy-950 lg:hidden">Show Filters</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#c1a249] transition hidden lg:block" />
                <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-[#c1a249] transition lg:hidden" />
              </button>
            </div>
          )}

          {/* Main Content: Hotels List */}
          <div className="flex-1 w-full space-y-6">
            
            <div className="text-sm font-medium text-gray-500 text-left">
              Showing <span className="font-bold text-navy-950">{filteredHotels.length}</span> hotels
            </div>

            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-60 rounded-3xl animate-shimmer"></div>
                ))}
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/50 shadow-sm space-y-4">
                <Building2 className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="text-gray-500 italic">No hotels match your filters.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentHotels.map((h) => {
                  const isFav = favorites.has(h._id);
                  const minPrice = h.roomTypes?.length > 0
                    ? Math.min(...h.roomTypes.map(rt => rt.pricePerNight))
                    : 1500;
                  const amenities = h.amenities || ['Free WiFi', 'Pool', 'Restaurant', 'Spa'];
                  
                  return (
                    <div
                      key={h._id}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row border border-gray-200/60"
                    >
                      {/* Left Column: Image Container */}
                      <div className="w-full md:w-1/3 h-56 md:h-auto min-h-[220px] relative overflow-hidden bg-gray-100">
                        <img
                          src={h.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80'}
                          alt={h.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />

                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(e, h._id)}
                          className="absolute top-4 right-4 bg-white/95 hover:bg-white p-2.5 rounded-full shadow-md transition duration-200 flex items-center justify-center"
                        >
                          <Heart className={`h-4.5 w-4.5 transition-colors duration-300 ${isFav ? 'text-red-500 fill-current' : 'text-gray-500 hover:text-red-500'}`} />
                        </button>
                      </div>

                      {/* Right Column: Hotel Details */}
                      <div className="p-6 flex-grow flex flex-col justify-between space-y-4 text-left">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-1.5">
                            <h3 className="font-serif font-bold text-xl md:text-2xl text-navy-950">
                              {h.name}
                            </h3>
                            
                            <div className="flex items-center text-xs text-gray-500 space-x-1 font-semibold">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span>{h.city}, {h.governorate_id?.name || 'Egypt'}</span>
                            </div>

                            {/* Rating block */}
                            <div className="flex items-center space-x-1.5 text-xs text-gray-600 font-semibold pt-1">
                              <Star className="h-4 w-4 text-gold-500 fill-current" />
                              <span className="text-gray-700">{h.stars?.toFixed(1) || '4.8'}</span>
                              <span className="text-gray-400">({h.totalReviews || 120} reviews)</span>
                            </div>
                          </div>

                          {/* Pricing block */}
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-bold text-navy-950 font-serif" style={{ color: '#C9963B' }}>
                              {minPrice} EGP
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                              per night
                            </div>
                          </div>
                        </div>

                        {/* Amenities Badges */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          {amenities.slice(0, 5).map((amenity, i) => (
                            <span
                              key={i}
                              className="bg-gray-100/80 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 border-t border-gray-150">
                          <Link
                            to={`/hotels/${h.slug}`}
                            className="block w-full bg-gold-500 hover:bg-gold-600 text-white font-bold py-3 rounded-xl transition text-center text-xs"
                            style={{ backgroundColor: '#C9963B', color: '#ffffff' }}
                          >
                            View Details
                          </Link>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

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

        </div>
      </div>
    </div>
  );
}
