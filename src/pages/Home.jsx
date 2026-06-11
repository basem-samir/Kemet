import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, MapPin, Calendar, Heart, Shield, Award, Users, Star, Tag, Search } from 'lucide-react';
import { tourismTypesAPI, governoratesAPI, landmarksAPI } from '../api/endpoints';
import MapExplorer from './MapExplorer';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import heroBg from '../assets/hero.webp';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/landmarks?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/landmarks');
    }
  };
  const { data: typesData, isLoading: typesLoading } = useQuery({
    queryKey: ['tourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const { data: govData, isLoading: govLoading } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const { data: topLandmarksData, isLoading: topLandmarksLoading } = useQuery({
    queryKey: ['topLandmarks'],
    queryFn: () => landmarksAPI.getAll({ sort: '-averageRating,-totalReviews', limit: 4 }),
  });

  const { data: allLandmarksData } = useQuery({
    queryKey: ['allLandmarksCount'],
    queryFn: () => landmarksAPI.getAll({ limit: 1000 }),
  });

  const types = typesData?.data?.data?.types || typesData?.data?.types || [];
  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];
  const topLandmarks = topLandmarksData?.data?.data?.landmarks || topLandmarksData?.data?.landmarks || [];
  const allLandmarks = allLandmarksData?.data?.data?.landmarks || allLandmarksData?.data?.landmarks || [];

  return (
    <div className="bg-[#FDFBF2] font-sans text-navy-900 pb-0">
      {/* Majestic Hero Section */}
      <div
        className="relative h-[calc(100vh-5rem)] flex flex-col items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.6) 100%), url(${heroBg})`
        }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 z-10 -mt-20">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-6xl md:text-7xl font-serif font-black text-white tracking-wide leading-tight drop-shadow-lg uppercase"
          >
            Discover The<br/>Hidden Wonders Of Egypt
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-white/90 max-w-2xl mx-auto font-sans font-medium leading-relaxed drop-shadow-md"
          >
            Experience Egypt beyond the pyramids. Explore ancient treasures, stunning landscapes, and local stories.
          </motion.p>

          {/* Integrated Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="max-w-3xl mx-auto pt-4"
          >
            <form
              onSubmit={handleSearchSubmit}
              className="rounded-full p-2 shadow-xl flex items-center max-w-2xl mx-auto bg-white/95 backdrop-blur-sm border border-gray-100"
            >
              <input
                type="text"
                placeholder="Search destinations, tours..."
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  // Regex to allow only alphabetical characters and spaces
                  if (/^[a-zA-Z\s]*$/.test(val)) {
                    setSearchQuery(val);
                  }
                }}
                className="w-full !bg-transparent !border-none focus:outline-none focus:ring-0 flex-grow py-3 pl-6 pr-4 text-gray-700 font-sans text-sm"
                style={{ backgroundColor: 'transparent' }}
              />
              <button
                type="submit"
                className="bg-[#C1A249] hover:bg-[#b59546] text-white font-bold px-8 py-3 rounded-full flex items-center gap-2 transition duration-200 shrink-0 shadow-md text-sm"
              >
                <Search className="h-4 w-4" />
                <span>Search</span>
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-row justify-center gap-4 pt-4"
          >
            <Link
              to="/landmarks"
              className="bg-[#C1A249] hover:bg-[#b59546] text-white font-bold px-8 py-3 rounded-full shadow-lg transition duration-200 text-sm"
            >
              Explore Destinations
            </Link>
            <Link
              to="/trip-builder"
              className="bg-transparent border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-white hover:text-[#0f172a] transition duration-200 text-sm"
            >
              Plan Your Trip
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Core Features / Trust Section - Below Hero */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl flex flex-col items-center text-center border border-gray-100/50">
            <div className="h-12 w-12 rounded-full border border-[#C1A249]/30 flex items-center justify-center mb-4 bg-orange-50/50">
              <Award className="h-5 w-5 text-[#C1A249]" />
            </div>
            <h3 className="text-base font-bold font-serif text-navy-900 mb-2">Premium Curated Guides</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Handpicked expert guides to make your journey exceptional.</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl flex flex-col items-center text-center border border-gray-100/50">
            <div className="h-12 w-12 rounded-full border border-[#C1A249]/30 flex items-center justify-center mb-4 bg-orange-50/50">
              <Shield className="h-5 w-5 text-[#C1A249]" />
            </div>
            <h3 className="text-base font-bold font-serif text-navy-900 mb-2">Flexible Custom Trips</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Tailor-made itineraries that fit your style and schedule.</p>
          </div>
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl flex flex-col items-center text-center border border-gray-100/50">
            <div className="h-12 w-12 rounded-full border border-[#C1A249]/30 flex items-center justify-center mb-4 bg-orange-50/50">
              <Shield className="h-5 w-5 text-[#C1A249]" />
            </div>
            <h3 className="text-base font-bold font-serif text-navy-900 mb-2">Secure Payments</h3>
            <p className="text-gray-500 text-xs leading-relaxed">Your payments and personal information are always protected.</p>
          </div>
        </div>
      </div>

      {/* Interactive Map Explorer Section */}
      <div className="py-10 bg-[#FDFBF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-10">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-[#C1A249]"></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 tracking-wider uppercase">
                Interactive Map Explorer
              </h2>
              <div className="h-px w-8 bg-[#C1A249]"></div>
            </div>
            <p className="text-gray-600 text-sm">Explore Egypt's rich history. Click on any location to learn more about landmarks, culture and local experiences.</p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-white relative" style={{ height: '500px' }}>
            <MapExplorer />
          </div>
        </div>
      </div>

      {/* Tourism Categories Section */}
      <div className="py-20 bg-[#FDFBF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2 mb-12">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-[#C1A249]"></div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy-900 tracking-wider uppercase">
                Tourism Categories
              </h2>
              <div className="h-px w-8 bg-[#C1A249]"></div>
            </div>
            <p className="text-gray-600 text-sm">Explore Egypt according to your passion and interests.</p>
          </div>

          {typesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-64 rounded-2xl bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {types.slice(0, 3).map((type) => (
                <Link
                  key={type._id}
                  to={`/landmarks?type=${type.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 flex flex-col border border-gray-100"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={type.image || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80'}
                      alt={type.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-left">
                    <h3 className="font-serif font-bold text-base text-navy-900 uppercase tracking-widest mb-2">
                      {type.name}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/categories"
              className="inline-flex items-center justify-center space-x-2 bg-[#C1A249] hover:bg-[#b59546] text-white font-bold px-8 py-3 rounded-full shadow-md transition duration-200 text-xs uppercase tracking-wide"
            >
              <span>View All Categories &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Trending Destinations */}
      <div className="py-20 bg-[#F4F6F8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-navy-900 uppercase tracking-wider">
                Trending Destinations
              </h2>
              <p className="text-gray-500 text-sm mt-1">Most visited places by travelers</p>
            </div>
            <Link
              to="/landmarks"
              className="text-gray-500 hover:text-navy-900 font-semibold text-xs transition flex items-center space-x-1"
            >
              <span>View All ↗</span>
            </Link>
          </div>

          {topLandmarksLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-64 rounded-2xl bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {topLandmarks.slice(0, 4).map((l) => (
                <Link
                  key={l._id}
                  to={`/landmarks/${l.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 block"
                >
                  <div className="h-52 overflow-hidden relative">
                    <img
                      src={l.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80'}
                      alt={l.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-serif font-bold text-base text-navy-900 line-clamp-1">
                      {l.name}
                    </h3>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span className="truncate">{l.governorate_id?.name || 'Egypt'}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-[#C1A249] fill-current" />
                        <span className="font-bold">{l.averageRating?.toFixed(1) || '4.9'}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Governorates Section */}
      <div className="py-20 bg-[#FDFBF2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#C1A249]" />
                <h2 className="text-xl md:text-2xl font-serif font-bold text-navy-900 uppercase tracking-wider">
                  Explore by Governorate
                </h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">Discover Egypt's beauty from North to South</p>
            </div>
            <Link
              to="/governorates"
              className="text-gray-500 hover:text-navy-900 font-semibold text-xs transition flex items-center space-x-1"
            >
              <span>View All ↗</span>
            </Link>
          </div>

          {govLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-64 rounded-2xl bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {governorates.slice(0, 6).map((gov) => {
                return (
                  <Link
                    key={gov._id}
                    to={`/governorates/${gov.slug}`}
                    className="group relative h-64 rounded-2xl overflow-hidden shadow-sm block"
                  >
                    <img
                      src={gov.coverImage || 'https://images.unsplash.com/photo-1572252009286-268acec5a0af?auto=format&fit=crop&w=600&q=80'}
                      alt={gov.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 space-y-1">
                      <div className="font-serif font-bold text-2xl text-white uppercase tracking-wider">
                        {gov.name}
                      </div>
                      <p className="text-[#C1A249] text-sm font-medium">
                        History & Temples
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Promotional Custom Trip Builder Section */}
      <div className="py-10 bg-[#FDFBF2] pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0f172a] rounded-3xl p-10 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between shadow-2xl">
            <div className="max-w-xl space-y-4 relative z-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold uppercase tracking-wider leading-tight text-white !text-white">
                Design Your Own<br />Ancient Journey
              </h2>
              <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                We'll craft a personalized itinerary just for you. Share your dreams and we'll make them real.
              </p>
              <Link
                to="/trip-builder"
                className="inline-block bg-[#C1A249] hover:bg-[#b59546] text-[#0f172a] font-bold px-8 py-3.5 rounded-full shadow-md transition duration-200 mt-4 text-sm"
              >
                Start Planning Now
              </Link>
            </div>
            {/* Outline Graphics (Pseudo icon to simulate the mockup) */}
            <div className="hidden md:flex absolute -right-10 -bottom-10 pointer-events-none" style={{ opacity: 0.3 }}>
                <Users className="h-72 w-72 text-white" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
