import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { tourismTypesAPI } from '../api/endpoints';

export default function TourismCategories() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: typesData, isLoading } = useQuery({
    queryKey: ['tourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const types = typesData?.data?.data?.types || typesData?.data?.types || [];

  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    type.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#FDFBF2] min-h-screen py-20 font-sans text-navy-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center space-y-2 mb-12">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-[#C1A249]"></div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-navy-900 tracking-wider uppercase">
              Tourism Categories
            </h1>
            <div className="h-px w-8 bg-[#C1A249]"></div>
          </div>
          <p className="text-gray-600 text-base max-w-2xl mx-auto pt-2">
            Explore Egypt according to your passion and interests.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-white border border-gray-200 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:border-[#C1A249] focus:ring-1 focus:ring-[#C1A249] shadow-sm transition-shadow hover:shadow-md"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-80 rounded-2xl bg-gray-200 animate-pulse"></div>
            ))}
          </div>
        ) : filteredTypes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No categories found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTypes.map((type, index) => (
              <motion.div
                key={type._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/landmarks?type=${type.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300 flex flex-col border border-gray-100 h-full"
                >
                  <div className="h-56 overflow-hidden relative">
                    <img
                      src={type.image || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=600&q=80'}
                      alt={type.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 text-left flex-grow flex flex-col">
                    <h3 className="font-serif font-bold text-lg text-navy-900 uppercase tracking-widest mb-3">
                      {type.name}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-3 leading-relaxed flex-grow">
                      {type.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
