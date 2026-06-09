import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { itinerariesAPI } from '../api/endpoints';
import { Compass, Calendar, DollarSign, MapPin, BookOpen, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ItineraryDetails() {
  const { slug } = useParams();

  const { data: templateDetails, isLoading, error } = useQuery({
    queryKey: ['itineraryTemplate', slug],
    queryFn: () => itinerariesAPI.getTemplateBySlug(slug),
  });

  const template = templateDetails?.data?.data?.template || templateDetails?.data?.template || null;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-12 animate-pulse">
        <div className="h-[45vh] bg-gray-200 rounded-2xl"></div>
        <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500 font-serif">Itinerary Not Found</h2>
        <Link to="/itineraries" className="text-gold-600 hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Back to Itineraries</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">
      
      {/* Banner */}
      <div 
        className="relative h-[48vh] flex items-end bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(rgba(13, 27, 42, 0.4), rgba(13, 27, 42, 0.85)), url(${template.imageCover || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1920&q=80'})` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4 text-white">
            <Link to="/itineraries" className="inline-flex items-center space-x-1.5 text-gold-400 hover:text-gold-300 font-medium text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Itineraries</span>
            </Link>
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl font-serif font-black tracking-wider text-gold-500 uppercase"
            >
              {template.title}
            </motion.h1>
            <div className="flex items-center text-sm space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-gold-500" />
                <span>{template.duration} Days</span>
              </div>
              <div className="bg-gold-500/20 text-gold-400 border border-gold-500/30 text-xs px-2.5 py-0.5 rounded capitalize">
                {template.budgetTier} Class
              </div>
            </div>
          </div>

          <Link
            to={`/itineraries/book/${template._id}`}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-8 py-4 rounded-lg shadow-lg hover:shadow-gold-500/20 transform hover:-translate-y-1 transition duration-200 shrink-0"
          >
            Book Guided Tour (${template.totalBudget})
          </Link>
        </div>
      </div>

      {/* Breakdown */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          
          <div className="space-y-4">
            <h2 className="text-2xl font-serif font-bold text-navy-500">Trip Overview</h2>
            <p className="text-gray-700 leading-relaxed text-lg">{template.description}</p>
          </div>

          {/* Highlights */}
          {template.highlights && template.highlights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-navy-500">Highlights</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                {template.highlights.map((h, i) => (
                  <li key={i} className="flex items-start space-x-2.5">
                    <Compass className="h-4.5 w-4.5 text-gold-500 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Daily Schedule */}
          <div className="space-y-8">
            <h3 className="text-2xl font-serif font-bold text-navy-500 border-b border-gray-100 pb-3">Daily Schedule</h3>
            
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gold-500/30">
              {template.schedule?.map((dayPlan, i) => (
                <div key={i} className="relative pl-10 space-y-4">
                  <div className="absolute left-0 top-0.5 h-8 w-8 rounded-full bg-gold-500 text-navy-900 font-bold flex items-center justify-center border-4 border-sand-50 shadow-sm text-sm">
                    {dayPlan.day}
                  </div>
                  
                  <div className="bg-white p-6 rounded-xl border border-gold-500/10 shadow-sm space-y-4">
                    <h4 className="font-serif font-bold text-lg text-navy-500">Day {dayPlan.day} Activity</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{dayPlan.description || 'Sightseeing and regional exploration'}</p>

                    {/* Landmarks for the day */}
                    {dayPlan.landmarks && dayPlan.landmarks.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled Landmark Visits:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {dayPlan.landmarks.map((l, lIdx) => (
                            <Link 
                              key={lIdx} 
                              to={`/landmarks/${l.landmark_id?.slug}`}
                              className="flex items-center space-x-3 p-3 bg-sand-50 rounded-lg border border-gold-500/5 hover:border-gold-500/20 transition"
                            >
                              <div className="h-10 w-10 rounded overflow-hidden shrink-0 bg-gray-200">
                                <img 
                                  src={l.landmark_id?.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=80&q=80'} 
                                  alt={l.landmark_id?.name} 
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="text-xs">
                                <p className="font-semibold text-navy-500 hover:text-gold-600 transition">{l.landmark_id?.name || 'Landmark'}</p>
                                <p className="text-gray-400">{l.visitTime || 'Flexible Time'}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hotel for the day */}
                    {dayPlan.hotel && (
                      <div className="flex items-center space-x-3 border-t border-gray-100 pt-4 mt-2">
                        <MapPin className="h-4.5 w-4.5 text-gold-500" />
                        <div className="text-xs text-gray-600">
                          <span>Overnight stay: </span>
                          <Link to={`/hotels/${dayPlan.hotel.slug}`} className="font-bold text-navy-500 hover:text-gold-600">
                            {dayPlan.hotel.name}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details Checklist sidebar */}
        <div className="space-y-6 h-fit">
          <div className="bg-white p-6 rounded-xl border border-gold-500/10 shadow-md space-y-6">
            <h3 className="font-serif text-lg font-bold text-navy-500 border-b border-gray-100 pb-3">Package Policy</h3>
            
            {template.includes && template.includes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">What's Included:</span>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  {template.includes.map((inc, i) => (
                    <li key={i}>✓ {inc}</li>
                  ))}
                </ul>
              </div>
            )}

            {template.notIncludes && template.notIncludes.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Exclusions:</span>
                <ul className="text-xs text-gray-600 space-y-1.5">
                  {template.notIncludes.map((exc, i) => (
                    <li key={i}>✗ {exc}</li>
                  ))}
                </ul>
              </div>
            )}

            {template.tips && template.tips.length > 0 && (
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">Travel Tips:</span>
                <ul className="text-xs text-gray-500 space-y-1">
                  {template.tips.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
