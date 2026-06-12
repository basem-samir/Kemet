import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { governoratesAPI } from '../api/endpoints';
import { MapPin, Calendar, Star, Building2, Eye, Compass, ArrowLeft, Search, Clock, Users, Landmark, CloudSun } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GovernorateDetails() {
  const { slug } = useParams();
  const [landmarkSearchQuery, setLandmarkSearchQuery] = useState('');
  const [hotelSearchQuery, setHotelSearchQuery] = useState('');

  const { data: govDetails, isLoading, error } = useQuery({
    queryKey: ['governorate', slug],
    queryFn: () => governoratesAPI.getBySlug(slug),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-12">
        <div className="h-96 rounded-2xl animate-shimmer"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 rounded-2xl animate-shimmer"></div>
          <div className="h-64 rounded-2xl animate-shimmer"></div>
        </div>
      </div>
    );
  }

  if (error || !govDetails) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500 font-serif">Governorate Not Found</h2>
        <Link to="/governorates" className="text-[#C1A249] hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Back to Governorates</span>
        </Link>
      </div>
    );
  }

  const { governorate, landmarks = [], hotels = [], weather } = govDetails.data.data || govDetails.data || {};

  const filteredLandmarks = landmarks.filter(l => 
    l.name.toLowerCase().includes(landmarkSearchQuery.toLowerCase())
  );

  const filteredHotels = hotels.filter(h => 
    h.name.toLowerCase().includes(hotelSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#FDFBF2] flex flex-col pb-20">
      
      {/* TOP CONTENT */}
      <div className="w-full flex flex-col flex-shrink-0 bg-[#FDFBF2] relative">
        {/* Hero Section */}
        <div className="relative h-[45vh] lg:h-[55vh] flex-shrink-0 bg-gray-900">
          <img 
            src={governorate.coverImage || 'https://images.unsplash.com/photo-1572252009286-268acec5a0af?auto=format&fit=crop&w=1920&q=80'} 
            alt={governorate.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-transparent to-transparent opacity-80"></div>
          
          <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12 pb-16">
            <Link 
              to="/governorates" 
              className="inline-flex items-center space-x-2 bg-[#C1A249] hover:bg-[#b59546] text-navy-900 font-bold px-4 py-2 rounded-lg text-sm w-fit transition shadow-lg mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>All Governorate</span>
            </Link>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-6xl lg:text-[4rem] font-serif font-black tracking-tight !text-white uppercase drop-shadow-xl"
              style={{ color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
            >
              {governorate.name}
            </motion.h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full">
          {/* Floating Stats Card */}
          <div className="relative z-10 -mt-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-6 border border-[#C1A249]/10">
            <div className="flex items-center space-x-4">
              <div className="bg-[#C1A249] p-3 rounded-full text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Capital:</span>
                <span className="font-bold text-navy-900 uppercase text-sm">{governorate.capital || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 p-3 rounded-full text-white">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Best Time To Visit:</span>
                <span className="font-bold text-navy-900 uppercase text-sm">{governorate.bestTimeToVisit || 'OCTOBER TO APRIL'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-500 p-3 rounded-full text-white">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Population:</span>
                <span className="font-bold text-navy-900 uppercase text-sm">{governorate.population || '3.5 MILLION'}</span>
              </div>
            </div>
            {weather && weather.weather && weather.main && (
              <div className="flex items-center space-x-4">
                <div className="bg-orange-400 p-3 rounded-full text-white">
                  <CloudSun className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Weather:</span>
                  <span className="font-bold text-navy-900 uppercase text-sm">
                    {Math.round(weather.main.temp)}°C, {weather.weather[0].main}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* Text Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-12 space-y-10">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-navy-900 uppercase tracking-widest border-b border-[#C1A249]/30 pb-2 inline-block">
              About the Governorate
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm lg:text-[15px] font-medium text-justify">
              {governorate.description}
            </p>
          </div>
          
          {governorate.famousFor && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-navy-900 uppercase tracking-widest border-b border-[#C1A249]/30 pb-2 inline-block">
                Famous For
              </h2>
              <p className="text-gray-700 leading-relaxed text-sm lg:text-[15px] font-medium text-justify">
                {governorate.famousFor}
              </p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* BOTTOM CONTENT */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12 space-y-16">
        
        {/* Landmarks Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-navy-900 uppercase tracking-widest">
              Landmarks to Explore
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative w-64 hidden sm:block">
                <input
                  type="text"
                  placeholder="Search..."
                  value={landmarkSearchQuery}
                  onChange={(e) => setLandmarkSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C1A249] shadow-sm bg-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
              <button className="bg-[#b59546] hover:bg-[#C1A249] text-white text-[10px] font-bold px-4 py-2 rounded-md uppercase tracking-widest transition shadow-sm whitespace-nowrap">
                View All Landmarks
              </button>
            </div>
          </div>

          <div className="sm:hidden relative w-full">
            <input
              type="text"
              placeholder="Search..."
              value={landmarkSearchQuery}
              onChange={(e) => setLandmarkSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#C1A249] shadow-sm bg-white"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>

          {filteredLandmarks.length === 0 ? (
            <p className="text-gray-500 italic py-10 bg-white rounded-xl border border-gray-100 shadow-sm text-center text-sm">
              No landmarks found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredLandmarks.map((l) => (
                <Link 
                  key={l._id} 
                  to={`/landmarks/${l.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col h-full"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img 
                      src={l.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80'} 
                      alt={l.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className="bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                        {l.category || 'HISTORY'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3.5 w-3.5 fill-[#C1A249] text-[#C1A249]" />
                        <span className="text-sm font-bold text-navy-900">4.8</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-navy-900 uppercase tracking-wide mb-2 line-clamp-1 group-hover:text-[#C1A249] transition-colors">
                      {l.name}
                    </h3>
                    <p className="text-gray-600 text-xs line-clamp-3 mb-4 flex-1 font-medium">
                      {l.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Accommodations Section */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-navy-900 uppercase tracking-widest">
              Accommodations
            </h2>
            <div className="flex items-center space-x-4">
              <button className="bg-[#b59546] hover:bg-[#C1A249] text-white text-[10px] font-bold px-4 py-2 rounded-md uppercase tracking-widest transition shadow-sm whitespace-nowrap">
                View All Accommodations
              </button>
            </div>
          </div>

          {filteredHotels.length === 0 ? (
            <p className="text-gray-500 italic py-10 bg-white rounded-xl border border-gray-100 shadow-sm text-center text-sm">
              No hotels found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filteredHotels.map((h) => (
                <Link 
                  key={h._id} 
                  to={`/hotels/${h.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col h-full"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img 
                      src={h.images?.[0] || 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80'} 
                      alt={h.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex space-x-2">
                        <span className="bg-[#C1A249] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                          LUXURY
                        </span>
                        <span className="bg-sky-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                          {h.stars} STARS
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3.5 w-3.5 fill-[#C1A249] text-[#C1A249]" />
                        <span className="text-sm font-bold text-navy-900">5.0</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-base text-navy-900 uppercase tracking-wide mb-2 line-clamp-1 group-hover:text-[#C1A249] transition-colors">
                      {h.name}
                    </h3>
                    <p className="text-gray-600 text-xs line-clamp-2 mb-4 flex-1 font-medium">
                      Enjoy a luxurious stay at {h.name} with premium amenities and stunning views.
                    </p>
                    <div className="flex justify-end text-sm font-bold text-gray-400">
                      $$$
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
