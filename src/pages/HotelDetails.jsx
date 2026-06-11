import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { hotelsAPI, bookingsAPI, reviewsAPI } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { Star, MapPin, Calendar, Users, Coffee, ShieldAlert, ArrowLeft, MessageSquare, AlertCircle, ExternalLink, Compass, Globe, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HotelDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [roomsCount, setRoomsCount] = useState(1);
  const [guestsCount, setGuestsCount] = useState(1);
  const [selectedRoomName, setSelectedRoomName] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const { data: hotelData, isLoading, error } = useQuery({
    queryKey: ['hotel', slug],
    queryFn: () => hotelsAPI.getBySlug(slug),
  });

  const hotel = hotelData?.data?.data?.hotel || hotelData?.data?.hotel || hotelData?.data || null;
  const hotelId = hotel?._id;

  const getHotelCoords = () => {
    if (hotel?.location?.coordinates && hotel.location.coordinates.length === 2) {
      return hotel.location.coordinates;
    }
    if (hotel?.coordinates && hotel.coordinates.length === 2) {
      return hotel.coordinates;
    }
    // Fallback to governorate coordinates or standard city coordinates
    const cityCoords = {
      'cairo': [31.2357, 30.0444],
      'giza': [31.2089, 30.0131],
      'alexandria': [29.9187, 31.2001],
      'luxor': [32.6396, 25.6872],
      'aswan': [32.8998, 24.0889],
      'sharm el sheikh': [34.3299, 27.9158],
      'hurghada': [33.8076, 27.2579]
    };
    const cityKey = (hotel?.city || '').toLowerCase().trim();
    if (cityCoords[cityKey]) return cityCoords[cityKey];

    if (hotel?.governorate_id?.lat && hotel?.governorate_id?.lng) {
      return [hotel.governorate_id.lng, hotel.governorate_id.lat];
    }
    return [31.2357, 30.0444]; // default Cairo
  };

  const coords = getHotelCoords();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);

  useEffect(() => {
    let mapInstance;
    if (coords && coords.length === 2 && mapContainerRef.current) {
      const [lng, lat] = coords;
      const initMap = async () => {
        const L = await import('leaflet');

        // Inject Leaflet CSS if not loaded
        if (!document.getElementById('leaflet-css-cdn')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css-cdn';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Fix default icons path issues
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Init map centered on the hotel
        mapInstance = L.map(mapContainerRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true
        });
        mapRef.current = mapInstance;

        const currentTheme = localStorage.getItem('kemet-theme') || 'light';
        const tileUrl = currentTheme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        const tileLayer = L.tileLayer(tileUrl, {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(mapInstance);
        tileLayerRef.current = tileLayer;

        // Marker Pin icon
        const pinIcon = L.divIcon({
          className: 'marker-pin-wrapper',
          html: `
            <div class="map-marker-pin" style="--mc: #C9963B; width: 30px; height: 30px; background: #C9963B; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.4);">
              <div style="transform: rotate(45deg); font-size: 14px;">🏨</div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        L.marker([lat, lng], { icon: pinIcon }).addTo(mapInstance);
      };

      initMap();
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [hotel]);

  useEffect(() => {
    const handleThemeChange = (e) => {
      const newTheme = e.detail;
      if (tileLayerRef.current) {
        const newUrl = newTheme === 'dark'
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        tileLayerRef.current.setUrl(newUrl);
      }
    };

    window.addEventListener('kemet-theme-change', handleThemeChange);
    return () => {
      window.removeEventListener('kemet-theme-change', handleThemeChange);
    };
  }, []);

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', 'hotel', hotelId],
    queryFn: () => reviewsAPI.getByItem('hotel', hotelId),
    enabled: !!hotelId,
  });

  const reviews = reviewsData?.data?.data?.reviews || reviewsData?.data || [];

  // Book Hotel Mutation
  const bookHotelMutation = useMutation({
    mutationFn: (bookingData) => bookingsAPI.bookHotel(bookingData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['hotel', slug] });
      const booking = res.data.data?.booking || res.data.booking || res.data;
      navigate(`/payment?bookingId=${booking._id || booking.id}`);
    },
    onError: (err) => {
      setBookingError(err.response?.data?.message || 'Booking failed. Try again.');
    },
  });

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    setBookingError('');
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!startDate || !endDate) {
      setBookingError('Please select both check-in and check-out dates.');
      return;
    }
    if (!selectedRoomName) {
      setBookingError('Please choose a room type from the table below.');
      return;
    }

    bookHotelMutation.mutate({
      hotel_id: hotelId,
      dates: {
        start: startDate,
        end: endDate,
      },
      rooms: parseInt(roomsCount),
      guests: parseInt(guestsCount),
      roomType: selectedRoomName,
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-12 animate-pulse">
        <div className="h-96 bg-gray-200 rounded-2xl"></div>
        <div className="h-8 bg-gray-200 w-1/4 rounded"></div>
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500 font-serif">Hotel Not Found</h2>
        <Link to="/hotels" className="text-gold-600 hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Back to Hotels</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 font-sans text-navy-900">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Hero Gallery Section */}
        <div className="space-y-4 mb-8">
          <div className="w-full h-[60vh] rounded-3xl overflow-hidden shadow-sm">
            <img
              src={hotel.images?.[activeImageIndex] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80'}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          </div>
          {hotel.images && hotel.images.length > 0 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 hide-scrollbar">
              {hotel.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 h-24 w-40 rounded-2xl overflow-hidden border-4 transition-all ${activeImageIndex === idx ? 'border-[#C1A249] shadow-md' : 'border-transparent hover:opacity-90'
                    }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">

            {/* Title & Description Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h1 className="text-4xl font-serif font-bold text-navy-900 mb-4">{hotel.name}</h1>
              <div className="flex items-center text-sm space-x-4 mb-6">
                <div className="flex items-center space-x-1 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{hotel.city}, {hotel.governorate_id?.name || 'Egypt'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-[#C1A249] text-[#C1A249]" />
                  <span className="font-bold text-navy-900">{hotel.stars}.0</span>
                  <span className="text-gray-500">({reviews.length} reviews)</span>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-[15px]">
                {hotel.description}
              </p>
            </div>

            {/* Amenities Card */}
            {hotel.amenities && hotel.amenities.length > 0 && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-2xl font-serif font-bold text-navy-900">Amenities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  {hotel.amenities.map((item, i) => (
                    <div key={i} className="flex items-center space-x-3 text-sm">
                      <div className="bg-[#FDFBF2] p-1 rounded border border-[#C1A249]/20">
                        <Check className="h-4 w-4 text-[#C1A249]" />
                      </div>
                      <span className="text-navy-900 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Rooms Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-2xl font-serif font-bold text-navy-900 mb-2">Available Rooms</h3>
              <div className="space-y-6">
                {hotel.roomTypes?.map((room) => (
                  <div key={room._id} className="flex flex-col sm:flex-row gap-6 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition">
                    <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0">
                      <img src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=400&q=80'} alt={room.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-lg font-serif font-bold text-navy-900">{room.name}</h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mt-2">
                          <span className="flex items-center"><Users className="h-4 w-4 mr-1" /> {room.maxGuests} guests</span>
                        </div>
                      </div>
                      <div className="flex items-end justify-between mt-4">
                        <div>
                          <span className="text-2xl font-bold text-[#C1A249]">{room.pricePerNight} EGP</span>
                          <span className="text-sm text-gray-500">/night</span>
                        </div>
                        <button
                          onClick={() => setSelectedRoomName(room.name)}
                          disabled={room.availableCount === 0}
                          className={`px-6 py-2 rounded-xl font-bold text-sm transition ${room.availableCount === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : selectedRoomName === room.name ? 'bg-navy-900 text-white' : 'bg-[#C1A249] hover:bg-[#b59546] text-white'}`}
                        >
                          {room.availableCount === 0 ? 'Sold Out' : selectedRoomName === room.name ? 'Selected' : 'Select Room'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Guest Reviews Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <h3 className="text-2xl font-serif font-bold text-navy-900 pb-2">
                Guest Reviews
              </h3>

              <div className="space-y-6">
                {reviews.length > 0 ? reviews.map(r => (
                  <div key={r._id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                          <img
                            src={r.user_id?.avatar || `https://ui-avatars.com/api/?name=${r.user_id?.full_name || 'User'}&background=random`}
                            alt={`${r.user_id?.full_name || 'User'}'s avatar`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-serif font-bold text-navy-900 text-base">{r.user_id?.full_name || 'User'}</div>
                          <div className="flex space-x-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < r.rating ? 'fill-[#C1A249] text-[#C1A249]' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <p className="text-gray-700 text-[15px] mt-3 ml-16 leading-relaxed">
                      {r.comment}
                    </p>
                  </div>
                )) : (
                  <p className="text-gray-500 italic">No reviews yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-24">
              <h3 className="text-xl font-serif font-bold text-navy-900 mb-6">Book Your Stay</h3>

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {bookingError && (
                  <div className="flex items-center space-x-1.5 text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-navy-900 mb-2">Check-in</label>
                  <input
                    type="date"
                    required
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (endDate && e.target.value > endDate) setEndDate('');
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C1A249] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy-900 mb-2">Check-out</label>
                  <input
                    type="date"
                    required
                    min={startDate || new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C1A249] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-navy-900 mb-2">Guests</label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C1A249] text-sm"
                  >
                    {[1, 2, 3].map((n) => (
                      <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Calculation breakdown */}
                {selectedRoomName && startDate && endDate && (
                  <div className="pt-4 border-t border-gray-100 space-y-3 text-sm">
                    {(() => {
                      const room = hotel.roomTypes.find(r => r.name === selectedRoomName);
                      if (!room) return null;
                      const nights = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
                      const roomTotal = room.pricePerNight * nights;
                      const serviceFee = Math.round(roomTotal * 0.05); // 5% fee
                      const total = roomTotal + serviceFee;

                      return (
                        <>
                          <div className="flex justify-between text-gray-600">
                            <span>{room.pricePerNight} EGP × {nights} nights</span>
                            <span className="font-bold text-navy-900">{roomTotal} EGP</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Service fee</span>
                            <span className="font-bold text-navy-900">{serviceFee} EGP</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100">
                            <span className="text-navy-900">Total</span>
                            <span className="text-[#C1A249]">{total} EGP</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={bookHotelMutation.isPending}
                  className="w-full bg-[#C1A249] hover:bg-[#b59546] text-white font-bold py-3.5 rounded-xl shadow-md transition duration-200 mt-4"
                >
                  {bookHotelMutation.isPending ? 'Booking...' : 'Book Now'}
                </button>
              </form>

            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
