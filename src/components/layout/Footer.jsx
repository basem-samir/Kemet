import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Compass, Mail, Phone, MapPin } from 'lucide-react';
import { tourismTypesAPI } from '../../api/endpoints';

export default function Footer() {
  const { data: typesData } = useQuery({
    queryKey: ['tourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const types = typesData?.data?.data?.types || typesData?.data?.types || [];

  return (
    <footer className="bg-navy-900 text-gray-300 border-t border-gold-500/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Compass className="h-8 w-8 text-gold-500" />
            <span className="font-serif text-2xl font-bold tracking-widest text-gold-500">
              KEMET
            </span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Experience the magic of Egypt. Discover timeless landmarks, book luxury cruises, and build your custom historical itinerary with ease.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold-500 transition-colors">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold-500 transition-colors">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-gold-500 transition-colors">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div className="font-serif text-lg font-bold mb-4 tracking-wider uppercase" style={{ color: '#c1a249' }}>Explore</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/governorates" className="hover:text-gold-500 transition-colors">Governorates</Link></li>
            <li><Link to="/landmarks" className="hover:text-gold-500 transition-colors">Landmarks</Link></li>
            <li><Link to="/hotels" className="hover:text-gold-500 transition-colors">Hotels</Link></li>
            <li><Link to="/itineraries" className="hover:text-gold-500 transition-colors">Guided Itineraries</Link></li>
            <li><Link to="/trip-builder" className="hover:text-gold-500 transition-colors">Custom Trip Builder</Link></li>
          </ul>
        </div>

        {/* Info */}
        <div>
          <div className="font-serif text-lg font-bold mb-4 tracking-wider uppercase" style={{ color: '#c1a249' }}>Tourism Types</div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {types.map((type) => (
              <li key={type._id}>
                <Link to={`/landmarks?type=${type.slug}`} className="hover:text-gold-500 transition-colors">
                  {type.name}
                </Link>
              </li>
            ))}
            {types.length === 0 && (
              <>
                <li><Link to="/landmarks?type=pharaonic" className="hover:text-gold-500 transition-colors">Cultural & Historical</Link></li>
                <li><Link to="/landmarks?type=islamic" className="hover:text-gold-500 transition-colors">Religious & Spiritual</Link></li>
                <li><Link to="/landmarks?type=beach" className="hover:text-gold-500 transition-colors">Leisure & Coastal</Link></li>
                <li><Link to="/landmarks" className="hover:text-gold-500 transition-colors">Medical & Wellness</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <div className="font-serif text-lg font-bold mb-4 tracking-wider uppercase" style={{ color: '#c1a249' }}>Contact Us</div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gold-500 shrink-0" />
              <span>12 El Nile St, Zamalek, Cairo, Egypt</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gold-500 shrink-0" />
              <a href="tel:+20227361234" className="hover:text-gold-500 transition-colors">+20 2 2736 1234</a>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gold-500 shrink-0" />
              <a href="mailto:support@kemet.travel" className="hover:text-gold-500 transition-colors">support@kemet.travel</a>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} KEMET Tourism Technologies. All rights reserved.</p>
      </div>
    </footer>
  );
}
