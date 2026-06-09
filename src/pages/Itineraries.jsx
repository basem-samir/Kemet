import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { itinerariesAPI, governoratesAPI } from '../api/endpoints';
import { Compass, Search, ChevronLeft, ChevronRight, SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function Itineraries() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const setCurrentPage = (val) => {
    const newPage = typeof val === 'function' ? val(currentPage) : val;
    setSearchParams((prev) => {
      prev.set('page', newPage);
      return prev;
    });
  };
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    const filtersElement = document.getElementById('filters-section');
    if (filtersElement) {
      const topOffset = filtersElement.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: 'instant' });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentPage]);

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['itineraryTemplates'],
    queryFn: () => itinerariesAPI.getTemplates(),
  });

  const templates = templatesData?.data?.data?.templates || templatesData?.data?.templates || templatesData?.data || [];

  const [search, setSearch] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [duration, setDuration] = useState('all');
  const [budget, setBudget] = useState(10000);

  // Filter states

  const { data: govData } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch = !search || tpl.title?.toLowerCase().includes(search.toLowerCase()) ||
      tpl.description?.toLowerCase().includes(search.toLowerCase());
    
    const tplGovId = tpl.governorate_id?._id || tpl.governorate_id;
    const matchesGov = selectedGovernorate === 'all' || tplGovId === selectedGovernorate;
    
    const matchesBudget = (tpl.totalBudget || 0) <= budget;

    let matchesDuration = true;
    if (duration !== 'all') {
      if (duration === '5') {
        matchesDuration = (tpl.duration || 0) >= 5;
      } else {
        matchesDuration = (tpl.duration || 0) === parseInt(duration);
      }
    }

    return matchesSearch && matchesGov && matchesBudget && matchesDuration;
  });

  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTemplates = filteredTemplates.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '95vh' }} className="pb-16">
      
      {/* Hero Section */}
      <div 
        className="relative bg-cover bg-center py-40 md:py-48 px-4 text-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1920&q=80')` }}
      >
        {/* Dark warm overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-serif font-black tracking-wide leading-tight text-white drop-shadow-lg uppercase">
            Guided Itineraries
          </h1>
          <p className="text-gray-100 text-sm md:text-[15px] leading-relaxed max-w-xl mx-auto font-medium drop-shadow">
            Explore ancient Egyptian pathways curated by expert guides and historical scholars.
          </p>
        </div>
      </div>

      <div id="filters-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-10">

        {/* Mobile Toggle Filters Button */}
        <div className="lg:hidden w-full">
          <button 
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
            className="w-full bg-[#0f172a] text-[#FAF5E8] py-3.5 px-5 rounded-2xl flex items-center justify-between font-bold text-xs border border-gray-800 transition shadow-md"
          >
            <span className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4.5 w-4.5 text-[#c1a249]" />
              <span className="uppercase tracking-wider">
                {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
              </span>
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isMobileFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Horizontal Filter Bar */}
        <div className={`relative z-20 -mt-12 bg-[#FAF8F5] p-6 lg:px-8 lg:py-5 rounded-[30px] shadow-2xl flex-col lg:flex-row items-end lg:items-center gap-5 w-full border border-white/60 ${isMobileFiltersOpen ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Keyword Search */}
          <div className="w-full lg:w-[280px] shrink-0 space-y-1.5 text-left">
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider block pl-3">Search</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Tours..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="pl-11 w-full py-2.5 px-4 bg-[#F4EFE6] border border-[#E5D5B5] rounded-full focus:outline-none focus:ring-1 focus:ring-[#c1a249] text-xs font-semibold text-gray-900 placeholder-gray-400 transition"
              />
            </div>
          </div>

          {/* Region Dropdown */}
          <div className="w-full lg:w-[180px] shrink-0 text-left space-y-1.5 font-bold">
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider block pl-3">Region</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#e11d48] text-[10px] pointer-events-none z-10">📍</span>
              <select
                value={selectedGovernorate}
                onChange={(e) => { setSelectedGovernorate(e.target.value); setCurrentPage(1); }}
                className="w-full py-2.5 pl-10 pr-10 bg-[#F4EFE6] border border-[#E5D5B5] rounded-full text-xs font-bold text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#c1a249] transition"
              >
                <option value="all">All Regions</option>
                {governorates.map((gov) => (
                  <option key={gov._id} value={gov._id}>{gov.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-gray-500 z-10">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Duration Dropdown */}
          <div className="w-full lg:w-[150px] shrink-0 text-left space-y-1.5 font-bold">
            <span className="text-[10px] font-bold text-gray-900 uppercase tracking-wider block pl-3">Duration</span>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => { setDuration(e.target.value); setCurrentPage(1); }}
                className="w-full py-2.5 pl-4 pr-10 bg-[#F4EFE6] border border-[#E5D5B5] rounded-full text-xs font-bold text-gray-900 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#c1a249] transition"
              >
                <option value="all">Duration</option>
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5+ Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>
          </div>

          {/* Budget Slider */}
          <div className="flex-grow w-full text-left space-y-1.5 flex flex-col justify-end">
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-900 uppercase tracking-wider px-2">
              <span>Max Budget</span>
              <span className="text-[#c1a249] font-serif font-black">${budget}</span>
            </div>
            <div className="pb-3.5 px-2">
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={budget}
                onChange={(e) => { setBudget(Number(e.target.value)); setCurrentPage(1); }}
                className="w-full h-1.5 bg-[#d4af37]/30 rounded-lg appearance-none cursor-pointer accent-[#c1a249]"
              />
            </div>
          </div>

          {/* Buttons Group */}
          <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 pb-1">
            <button
              onClick={() => {
                setSearch('');
                setSelectedGovernorate('all');
                setDuration('all');
                setBudget(10000);
                setCurrentPage(1);
              }}
              className="flex-1 lg:flex-none py-2.5 px-5 border border-[#c1a249]/50 hover:bg-[#c1a249]/10 text-[#c1a249] font-bold rounded-full text-[10px] transition whitespace-nowrap uppercase tracking-wider"
            >
              Reset
            </button>
          </div>

        </div>

        {/* Main Content Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-10">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-48 rounded-[24px] animate-shimmer bg-white"></div>
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[24px] border border-gray-200/50 shadow-sm space-y-4 pt-10">
            <Compass className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="text-gray-500 italic">No guided itineraries match your filters.</p>
          </div>
        ) : (
          <div className="space-y-10 pt-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentTemplates.map((tpl) => (
                <Link
                  key={tpl._id}
                  to={`/itineraries/${tpl.slug}`}
                  className="group bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 flex flex-row border border-gray-150 h-48 isolate [transform:translateZ(0)]"
                >
                  {/* Left Column: Image Container */}
                  <div className="w-[40%] h-full relative overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={tpl.imageCover || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80'}
                      alt={tpl.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm shadow-md text-navy-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-white/50 flex items-center gap-1.5">
                      <span className="text-[#c1a249] text-xs">⏱</span> {tpl.duration} Days
                    </div>
                  </div>

                  {/* Right Column: Content Details */}
                  <div className="w-[60%] p-5 flex flex-col justify-between text-left">
                    
                    <div className="space-y-1.5">
                      <h3 className="font-serif font-black text-[#1a1612] text-sm group-hover:text-[#c1a249] transition-colors line-clamp-1 uppercase">
                        {tpl.title}
                      </h3>
                      <p className="text-gray-500 text-[10px] font-medium leading-relaxed line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-start space-x-2 text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                        <div className="h-4 w-4 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-[#c1a249]">ⓘ</span>
                        </div>
                        <span>BUDGET TIER <span className="text-[#1a1612] font-black">${tpl.totalBudget}</span> TOTAL</span>
                      </div>

                      <div className="w-fit border border-[#c1a249]/50 hover:bg-[#c1a249]/5 text-[#c1a249] font-bold py-1.5 px-6 rounded-full transition text-[10px] uppercase tracking-wider">
                        Explore Journey
                      </div>
                    </div>

                  </div>

                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2.5 rounded-xl border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-[#c1a249] hover:text-[#0f172a] shadow-sm"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 font-semibold px-3">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2.5 rounded-xl border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-[#c1a249] hover:text-[#0f172a] shadow-sm"
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
