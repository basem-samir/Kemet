import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { itinerariesAPI } from '../api/endpoints';
import { Compass, MapPin, Check, X, ArrowLeft, ArrowRight, BedDouble, Camera, Mountain, Palmtree } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-12 animate-pulse bg-[#f3eedd] min-h-screen">
        <div className="h-[75vh] bg-[#EBE2CD] rounded-2xl"></div>
        <div className="h-8 bg-[#EBE2CD] w-1/4 rounded"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 bg-[#f3eedd]">
        <h2 className="text-2xl font-bold text-red-500 font-serif">Itinerary Not Found</h2>
        <Link to="/itineraries" className="text-[#8A792E] hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Back to Itineraries</span>
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        backgroundColor: '#f3eedd',
        backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')"
      }}
    >
      
      {/* Hero Section */}
      <div className="relative w-full h-[75vh] flex items-end justify-center">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${template.imageCover || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1920&q=80'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Central Ankh */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 opacity-80 drop-shadow-2xl">
          <span className="text-[#c1a249] text-8xl md:text-[140px] leading-none select-none drop-shadow-lg">☥</span>
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 flex justify-between items-end">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A792E]">
              <span className="bg-[#8A792E] text-white px-3 py-1 rounded-sm shadow-sm">Travel Itinerary</span>
              <span>{template.duration} Days</span>
            </div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-6xl md:text-[5rem] font-serif font-black tracking-widest text-[#1a1612] uppercase leading-[1.1]"
            >
              {template.title}
            </motion.h1>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="pt-6">
              <Link to="/itineraries" className="inline-flex items-center space-x-2 bg-[#1a1612] text-white hover:bg-[#8A792E] px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors rounded-sm shadow-md">
                <ArrowLeft className="h-4 w-4" />
                <span>Go Back</span>
              </Link>
            </motion.div>
          </div>

          {/* Floating Booking Box */}
          <div className="hidden lg:block absolute right-8 -bottom-16 bg-white p-8 shadow-2xl rounded-sm w-[350px] z-40 border border-gray-100">
            <h3 className="font-serif font-bold text-2xl text-center text-[#1a1612]">BOOK NOW</h3>
            <p className="text-center text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-2 mb-6">BOOK ONLINE NOW | ${template.totalBudget}</p>
            <Link 
              to={`/itineraries/book/${template._id}`} 
              className="group flex items-center justify-center w-full bg-[#8A792E] hover:bg-[#726426] text-white text-center py-4 text-xs font-bold uppercase tracking-widest transition-colors rounded-sm"
            >
              BOOK ONLINE NOW | ${template.totalBudget}
              <ArrowRight className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>


      {/* Mobile Booking Button (Visible only on small screens since box is hidden) */}
      <div className="lg:hidden p-4">
        <Link 
          to={`/itineraries/book/${template._id}`} 
          className="flex items-center justify-center w-full bg-[#8A792E] text-white py-4 text-xs font-bold uppercase tracking-widest rounded-sm"
        >
          BOOK ONLINE NOW | ${template.totalBudget}
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trip Overview */}
        <section id="overview" className="py-20 lg:py-28">
          <div className="max-w-4xl space-y-10">
            <h2 className="text-3xl md:text-4xl font-serif font-black text-[#1a1612] uppercase tracking-widest">
              Trip Overview
            </h2>
            <p className="text-gray-700 text-sm md:text-base leading-relaxed">
              {template.description}
            </p>
            
            {template.highlights?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8 pt-4">
                {template.highlights.map((h, i) => {
                  const icons = [MapPin, Compass, Camera, Mountain, Palmtree];
                  const Icon = icons[i % icons.length];
                  return (
                    <div key={i} className="flex items-start space-x-4">
                      <Icon className="h-4 w-4 text-[#8A792E] shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="text-xs text-gray-800 font-medium leading-relaxed">{h}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Daily Schedule (New V2 Layout) */}
        <section id="schedule" className="pb-24">
          <h2 className="text-3xl md:text-4xl font-serif font-black text-[#1a1612] uppercase tracking-widest text-center mb-16">
            Daily Schedule
          </h2>

          <div className="space-y-8">
            {template.schedule?.map((dayPlan, i) => {
              // Determine a background image for the card
              const bgImage = dayPlan.image
                || dayPlan.landmarks?.[0]?.landmark_id?.images?.[0] 
                || template.images?.[i] 
                || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80';

              return (
                <div 
                  key={i} 
                  className="relative w-full min-h-[350px] md:min-h-[400px] bg-cover bg-center rounded-sm overflow-hidden flex flex-col justify-between shadow-lg"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, rgba(26,22,18,0.95) 0%, rgba(26,22,18,0.6) 50%, rgba(26,22,18,0.2) 100%), url(${bgImage})` 
                  }}
                >
                  <div className="p-8 md:p-12 flex space-x-6 items-start relative z-10">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-[#8A792E] flex items-center justify-center text-white font-bold border-2 border-white/20 shadow-md">
                      {dayPlan.day}
                    </div>
                    <div className="space-y-3 text-white max-w-3xl">
                      <p className="text-[10px] font-bold !text-white uppercase tracking-[0.2em]">Day {dayPlan.day} | Activity</p>
                      <h3 className="text-2xl md:text-4xl font-serif font-bold !text-white leading-tight tracking-wide uppercase drop-shadow-md">
                        {dayPlan.description?.split('.')[0] || `Exploration & Discovery`}
                      </h3>
                      <p className="text-xs md:text-sm !text-white pt-2 leading-relaxed opacity-90">
                        {dayPlan.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 flex flex-wrap gap-4 items-end justify-start relative z-10">
                    {/* Landmarks Horizontal Cards inside the image */}
                    {dayPlan.landmarks?.map((l, lIdx) => (
                      <Link 
                        key={lIdx}
                        to={`/landmarks/${l.landmark_id?.slug}`} 
                        className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-sm flex items-center space-x-4 max-w-sm hover:bg-black/60 transition-colors"
                      >
                        <img 
                          src={l.landmark_id?.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=150&q=80'} 
                          className="h-12 w-12 object-cover rounded-sm shadow-sm"
                          alt={l.landmark_id?.name}
                        />
                        <div>
                          <p className="text-[9px] font-bold text-[#c1a249] uppercase tracking-widest">{l.visitTime || 'Flexible Time'}</p>
                          <p className="text-[11px] font-bold text-white uppercase tracking-wider mt-0.5 line-clamp-1">{l.landmark_id?.name}</p>
                        </div>
                      </Link>
                    ))}

                    {/* Hotel Card inside the image */}
                    {dayPlan.hotel && (
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-sm flex items-center space-x-4 sm:ml-auto">
                        <BedDouble className="h-5 w-5 text-[#c1a249]" />
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Overnight Stay</p>
                          <Link to={`/hotels/${dayPlan.hotel.slug}`} className="text-[11px] font-bold text-white uppercase tracking-wider hover:text-[#c1a249] transition-colors line-clamp-1">
                            {dayPlan.hotel.name}
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Policies Section */}
        <section id="inclusions" className="pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Inclusions */}
            <div className="bg-[#f3eedd]/40 border border-[#c1a249]/30 p-10 flex flex-col justify-between h-full min-h-[350px] rounded-sm shadow-sm backdrop-blur-sm">
              <div className="space-y-8">
                <h3 className="text-[#1a1612] font-serif font-bold tracking-widest text-sm uppercase">Inclusions</h3>
                <ul className="space-y-4">
                  {(template.includes?.length > 0 ? template.includes : ['Tour Guide', 'Transportation', 'Accommodation']).map((inc, i) => (
                    <li key={i} className="flex items-start space-x-3 text-xs tracking-wider text-[#1a1612]">
                      <Check className="h-4 w-4 text-[#8A792E] shrink-0" strokeWidth={2} />
                      <span className="uppercase leading-relaxed">{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-10 border-t border-[#1a1612]/10 mt-8">
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] block">All Inclusive Curated Service</span>
              </div>
            </div>

            {/* Exclusions */}
            <div className="bg-[#f3eedd]/40 border border-[#c1a249]/30 p-10 flex flex-col justify-between h-full min-h-[350px] rounded-sm shadow-sm backdrop-blur-sm">
              <div className="space-y-8">
                <h3 className="text-[#1a1612] font-serif font-bold tracking-widest text-sm uppercase">Exclusions</h3>
                <ul className="space-y-4">
                  {(template.notIncludes?.length > 0 ? template.notIncludes : ['International Flights', 'Visa Fees', 'Personal Expenses']).map((exc, i) => (
                    <li key={i} className="flex items-start space-x-3 text-xs tracking-wider text-[#1a1612]">
                      <X className="h-4 w-4 text-[#d9534f] shrink-0" strokeWidth={2} />
                      <span className="uppercase leading-relaxed">{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-10 border-t border-[#1a1612]/10 mt-8 text-right">
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] block">Flexible Booking</span>
              </div>
            </div>

            {/* Travel Tips */}
            <div className="bg-[#f3eedd]/40 border border-[#c1a249]/30 p-10 flex flex-col justify-between h-full min-h-[350px] rounded-sm shadow-sm backdrop-blur-sm">
              <div className="space-y-8">
                <h3 className="text-[#1a1612] font-serif font-bold tracking-widest text-sm uppercase">Travel Tips</h3>
                <ul className="space-y-4">
                  {(template.tips?.length > 0 ? template.tips : ['Bring comfortable shoes', 'Carry extra water', 'Respect local customs']).map((tip, i) => (
                    <li key={i} className="flex items-start space-x-3 text-xs tracking-wider text-[#1a1612]">
                      <div className="h-1.5 w-1.5 mt-1.5 rounded-sm bg-[#8A792E] shrink-0"></div>
                      <span className="uppercase leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-10 border-t border-[#1a1612]/10 mt-8 text-right">
                <span className="text-[10px] text-[#8A792E] uppercase tracking-[0.2em] block">Expert Advice</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
