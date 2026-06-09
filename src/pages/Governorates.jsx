import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { governoratesAPI } from '../api/endpoints';
import { MapPin, Calendar, Compass, Search } from 'lucide-react';

export default function Governorates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 6;

  const { data: govData, isLoading } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];

  const filteredGovernorates = governorates.filter(gov => 
    gov.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredGovernorates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGovernorates = filteredGovernorates.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPage]);

  return (
    <div style={{ backgroundColor: '#FAF5E8', minHeight: '95vh' }} className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200/60 pb-8">
          <div className="space-y-2 text-left">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-950 tracking-wider uppercase">Egyptian Governorates</h1>
            <p className="text-gray-600 text-sm max-w-xl font-medium">Explore regional details, weather patterns, and the distinct wonders of each governorate.</p>
          </div>
          
          <div className="w-full md:max-w-md shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by governorate name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-300/60 focus:outline-none focus:ring-2 focus:ring-gold-500/50 shadow-sm text-sm font-medium transition"
                style={{ backgroundColor: '#ffffff', color: '#1a1612' }}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4.5 w-4.5" />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-80 rounded-3xl animate-shimmer"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {currentGovernorates.map((gov) => (
                <Link 
                  key={gov._id} 
                  to={`/governorates/${gov.slug}`}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col border border-gray-150/50"
                >
                  <div className="h-56 relative overflow-hidden rounded-t-3xl bg-gray-100">
                    <img 
                      src={gov.coverImage || 'https://images.unsplash.com/photo-1572252009286-268acec5a0af?auto=format&fit=crop&w=600&q=80'} 
                      alt={gov.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"></div>
                    <div className="absolute bottom-4 left-5 flex items-center space-x-2 text-white">
                      <MapPin className="h-4.5 w-4.5 text-gold-500 shrink-0" />
                      <span className="font-serif font-bold text-lg text-white" style={{ color: '#ffffff' }}>{gov.name}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed font-normal">{gov.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs text-gray-600 font-semibold">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-4.5 w-4.5 text-gold-600 shrink-0" />
                        <span>Best: {gov.bestTimeToVisit || 'October to April'}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Compass className="h-4.5 w-4.5 text-gold-600 shrink-0" />
                        <span>Capital: {gov.capital || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center space-x-3 pt-6 text-xs font-semibold">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-xl border bg-white disabled:opacity-50 text-navy-500 transition hover:bg-gold-500 hover:text-white"
                >
                  Previous
                </button>
                <span className="text-gray-500 bg-white/70 px-4 py-2.5 rounded-xl border">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 rounded-xl border bg-white disabled:opacity-50 text-navy-500 transition hover:bg-gold-500 hover:text-white"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
