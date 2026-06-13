import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { landmarksAPI, reviewsAPI, favoritesAPI, itinerariesAPI, bookingsAPI } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { MapPin, Clock, Tag, Star, ArrowLeft, Heart, MessageSquare, AlertCircle, Calendar, ExternalLink, Compass, ShieldAlert, Check, X, ChevronLeft, ChevronRight, Phone, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingSuccessModal from '../components/BookingSuccessModal';

export default function LandmarkDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuthStore();

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [favMsg, setFavMsg] = useState('');

  // Editing review states
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lightbox gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(null);


  // Book Entrance Ticket states
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketQty, setTicketQty] = useState(1);
  const [ticketDate, setTicketDate] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketStep, setTicketStep] = useState(1);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activePaymentTab, setActivePaymentTab] = useState('saved');
  const [selectedSavedMethod, setSelectedSavedMethod] = useState('');

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planSuccessMsg, setPlanSuccessMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);



  const { data: landmarkData, isLoading, error } = useQuery({
    queryKey: ['landmark', slug],
    queryFn: () => landmarksAPI.getBySlug(slug),
  });

  const landmark = landmarkData?.data?.data?.landmark || landmarkData?.data?.landmark || landmarkData?.data || null;
  const landmarkId = landmark?._id;

  useEffect(() => {
    let mapInstance;
    if (landmark?.location?.coordinates && landmark.location.coordinates.length === 2 && mapContainerRef.current) {
      const [lng, lat] = landmark.location.coordinates;
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

        // Init map centered on the landmark
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
              <div style="transform: rotate(45deg); font-size: 14px;">📍</div>
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
  }, [landmark]);

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
    queryKey: ['reviews', 'landmark', landmarkId],
    queryFn: () => reviewsAPI.getByItem('landmark', landmarkId),
    enabled: !!landmarkId,
  });

  const { data: favsData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoritesAPI.getAll(),
    enabled: isAuthenticated,
  });

  // Fetch User Custom Itineraries
  const { data: userItinerariesData } = useQuery({
    queryKey: ['userItineraries'],
    queryFn: () => itinerariesAPI.getUserItineraries(),
    enabled: isAuthenticated,
  });

  // Fetch User Bookings to check for ticket
  const { data: bookingsData } = useQuery({
    queryKey: ['userBookings'],
    queryFn: () => bookingsAPI.getAll(),
    enabled: isAuthenticated,
  });

  const reviews = reviewsData?.data?.data?.reviews || reviewsData?.data || [];
  const favorites = favsData?.data?.data?.favorites || favsData?.data?.favorites || [];
  const isFavorite = favorites.some((f) => f.item_id?._id === landmarkId || f.item_id === landmarkId);
  const itineraries = userItinerariesData?.data?.data?.itineraries || userItinerariesData?.data?.itineraries || [];

  const bookingsFromAPI = bookingsData?.data?.data?.bookings || bookingsData?.data?.bookings || [];
  const localBookings = (() => {
    try {
      const storageKey = (user?._id || user?.id) ? `kemet_simulated_bookings_${user._id || user.id}` : 'kemet_simulated_bookings';
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  })();
  const allBookingsMap = new Map();
  bookingsFromAPI.forEach(b => allBookingsMap.set(b._id, b));
  localBookings.forEach(b => {
    if (!allBookingsMap.has(b._id)) {
      allBookingsMap.set(b._id, b);
    }
  });
  const allBookings = Array.from(allBookingsMap.values());

  const canReview = (() => {
    if (!isAuthenticated) return false;
    if (user?.role === 'admin') return true;
    if (!Number(landmark?.ticketPrice)) return true;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const today = new Date(todayStr);

    // 1. Check if they bought a ticket for this landmark and the ticket date is today or in the past
    const ticketBooking = allBookings.find(b => {
      const bType = b.booking_type || b.bookingType || b.type;
      const refId = b.reference_id?._id || b.reference_id;
      if (bType !== 'landmark' && bType !== 'ticket') return false;
      if (refId !== landmarkId) return false;
      if (b.status === 'cancelled') return false;

      const visitDateStr = b.dates?.start ? new Date(b.dates.start).toISOString().split('T')[0] : '';
      if (!visitDateStr) return false;
      const visitDate = new Date(visitDateStr);
      return visitDate <= today;
    });

    if (ticketBooking) return true;

    // 2. Check if they added the landmark to one of their itinerary plans and the visit date is today or in the past
    for (const plan of itineraries) {
      const dayIndex = plan.schedule?.findIndex(dayPlan =>
        dayPlan.landmarks?.some(l => {
          const lId = l.landmark_id?._id || l.landmark_id;
          return lId === landmarkId;
        })
      );

      if (dayIndex !== -1 && dayIndex !== undefined) {
        if (plan.dates?.start) {
          const planStart = new Date(plan.dates.start);
          const landmarkVisitDate = new Date(planStart);
          landmarkVisitDate.setDate(landmarkVisitDate.getDate() + dayIndex);
          const landmarkVisitDateStr = landmarkVisitDate.toISOString().split('T')[0];
          if (new Date(landmarkVisitDateStr) <= today) {
            return true;
          }
        } else {
          return false; // Prevent review if the custom plan has no start date scheduled
        }
      }
    }

    return false;
  })();

  // Toggle Favorite Mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: () => favoritesAPI.toggle('landmark', landmarkId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      setFavMsg(res.data.message || 'Updated favorites!');
      setTimeout(() => setFavMsg(''), 3000);
    },
  });

  // Create Review Mutation
  const createReviewMutation = useMutation({
    mutationFn: (data) => reviewsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'landmark', landmarkId] });
      setComment('');
      setRating(5);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Failed to submit review');
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: ({ id, data }) => reviewsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'landmark', landmarkId] });
      setIsEditing(false);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Failed to update review');
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (id) => reviewsAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', 'landmark', landmarkId] });
      setShowDeleteConfirm(false);
      setIsEditing(false);
      setComment('');
      setRating(5);
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Failed to delete review');
    },
  });


  const bookLandmarkMutation = useMutation({
    mutationFn: (data) => bookingsAPI.bookLandmark(data),
    onSuccess: (res) => {
      const booking = res.data.data?.booking || res.data.booking || res.data;
      if (booking?._id || booking?.id) {
        setShowSuccessModal(true);
      }
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to create booking.');
    }
  });

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    setReviewError('');
    createReviewMutation.mutate({
      rating,
      comment,
      landmark_id: landmarkId,
    });
  };

  const handleReviewUpdateSubmit = (e, reviewId) => {
    e.preventDefault();
    setReviewError('');
    updateReviewMutation.mutate({
      id: reviewId,
      data: { rating: editRating, comment: editComment },
    });
  };


  // Review Distribution Statistics
  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (ratingCounts[r.rating] !== undefined) ratingCounts[r.rating]++;
  });
  const totalReviewCount = reviews.length;
  const avgReviewRating = totalReviewCount > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviewCount).toFixed(1)
    : '0.0';

  const userReview = reviews.find(
    (rev) => rev.user_id?._id === user?._id || rev.user_id === user?._id
  );

  const imagesList = landmark?.images || [];
  const coords = landmark?.location?.coordinates || []; // [lng, lat]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-8 animate-pulse">
        <div className="h-[50vh] bg-gray-200 rounded-3xl"></div>
        <div className="h-8 bg-gray-200 w-1/3 rounded-xl"></div>
        <div className="h-32 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (error || !landmark) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-red-500 font-serif">Landmark Not Found</h2>
        <Link to="/landmarks" className="text-gold-600 hover:underline flex items-center space-x-1">
          <ArrowLeft className="h-4 w-4" /> <span>Back to Landmarks</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF2] pb-24 font-sans text-navy-900">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">

          {/* Main Image with Share/Favorite */}
          <div className="relative rounded-3xl overflow-hidden h-[55vh] bg-gray-200 shadow-sm border border-gray-100">
            <img
              src={imagesList[activeImageIndex || 0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1920&q=80'}
              alt={landmark.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex space-x-3">

              <button
                onClick={() => {
                  if (!isAuthenticated) navigate('/auth');
                  else toggleFavoriteMutation.mutate();
                }}
                className="bg-white rounded-full p-2.5 shadow-md hover:bg-gray-50 transition"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-[#C1A249] text-[#C1A249]' : 'text-gray-700'}`} />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {imagesList.length > 0 && (
            <div className="flex space-x-3 overflow-x-auto pb-2 hide-scrollbar">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 h-24 w-36 rounded-2xl overflow-hidden border-2 transition-all ${(activeImageIndex || 0) === idx ? 'border-[#C1A249] shadow-sm' : 'border-transparent hover:opacity-90'
                    }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Info Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-serif font-bold text-navy-900 mb-2">{landmark.name}</h1>
                <div className="flex items-center text-gray-500 text-sm font-medium">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{landmark.governorate_id?.name || 'Egypt'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <Star className="h-5 w-5 fill-[#C1A249] text-[#C1A249]" />
                  <span className="text-xl font-bold text-[#C1A249]">{avgReviewRating}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{totalReviewCount} reviews</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">

              <div className="flex items-center space-x-3 flex-1 min-w-[140px]">
                <div className="bg-[#FDFBF2] p-3 rounded-xl">
                  <Tag className="h-5 w-5 text-[#C1A249]" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Entry Fee</div>
                  <div className="font-bold text-navy-900 text-sm">{landmark.ticketPrice} EGP</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 flex-1 min-w-[140px]">
                <div className="bg-[#FDFBF2] p-3 rounded-xl">
                  <Calendar className="h-5 w-5 text-[#C1A249]" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Hours</div>
                  <div className="font-bold text-navy-900 text-sm">{landmark.workingHours || '6 AM - 9 PM'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Description & Best Time */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
            <p className="text-gray-700 leading-relaxed font-medium">
              {landmark.description}
            </p>
            <div className="bg-[#FDFBF2] p-4 rounded-xl">
              <span className="font-bold text-navy-900 mr-2">Best Time to Visit:</span>
              <span className="text-gray-600 font-medium">{landmark.bestTimeToVisit || 'Early morning or late afternoon for best lighting'}</span>
            </div>
          </div>

          {/* Location Map */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-xl font-serif font-bold text-navy-900 pb-2 border-b border-gray-100">Location Map</h3>
            <div
              ref={mapContainerRef}
              className="w-full h-80 rounded-2xl overflow-hidden border border-gray-100 shadow-inner z-10 relative"
            />
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-xl font-serif font-bold text-navy-900 pb-2">
              Reviews ({totalReviewCount})
            </h3>

            {/* Write a review */}
            {isAuthenticated ? (
              userReview ? (
                userReview.deletedByAdmin ? (
                  <div className="bg-red-50/20 p-5 rounded-2xl border border-red-200/50 shadow-sm text-center text-xs text-red-700 space-y-2.5 mb-6">
                    <ShieldAlert className="h-7 w-7 text-red-500 mx-auto" />
                    <h4 className="font-serif font-bold text-navy-900">Review Removed</h4>
                    <p className="max-w-md mx-auto leading-relaxed">
                      Your review has been removed by the administrator.
                    </p>
                  </div>
                ) : isEditing ? (
                  <form onSubmit={(e) => handleReviewUpdateSubmit(e, userReview._id)} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-serif font-bold text-navy-900 text-sm">Edit Your Review</h4>
                      <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
                    </div>

                    {reviewError && (
                      <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Edit Rating</label>
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setEditRating(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-6 w-6 ${star <= editRating
                                ? 'fill-[#C1A249] text-[#C1A249]'
                                : 'text-gray-300'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Comment</label>
                      <textarea
                        required
                        rows={3}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        placeholder="Write something..."
                        className="w-full p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-[#C1A249] text-xs font-semibold focus:outline-none"
                      ></textarea>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateReviewMutation.isPending}
                        className="flex-1 bg-[#C1A249] hover:bg-[#b59546] text-white font-bold py-2 rounded-xl text-xs uppercase"
                      >
                        {updateReviewMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-gray-150 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs uppercase"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="bg-[#FDFBF2] p-5 rounded-2xl border border-[#C1A249]/20 shadow-sm space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C1A249] uppercase tracking-wider block">Your Review</span>
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${s <= userReview.rating
                                ? 'fill-[#C1A249] text-[#C1A249]'
                                : 'text-gray-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-xs leading-relaxed font-medium">{userReview.comment}</p>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            setEditRating(userReview.rating);
                            setEditComment(userReview.comment);
                            setIsEditing(true);
                          }}
                          className="flex-1 bg-navy-900 hover:bg-navy-800 text-white font-bold py-2 rounded-xl text-xs uppercase transition text-center"
                        >
                          Edit Review
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2 rounded-xl text-xs uppercase transition"
                        >
                          Delete Review
                        </button>
                      </div>
                    </div>

                    {showDeleteConfirm && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                        <p className="text-xs text-red-700 font-semibold">Delete review permanently? This cannot be undone.</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteReviewMutation.mutate(userReview._id)}
                            disabled={deleteReviewMutation.isPending}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 rounded-lg text-xs transition"
                          >
                            {deleteReviewMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-1.5 rounded-lg text-xs transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : !canReview ? (
                <div className="bg-[#FDFBF2] p-6 rounded-2xl border border-[#C1A249]/20 shadow-sm text-center text-xs text-gray-500 space-y-2.5 mb-6">
                  <ShieldAlert className="h-7 w-7 text-[#C1A249] mx-auto" />
                  <h4 className="font-serif font-bold text-navy-900">Review Access Restricted</h4>
                  <p className="max-w-md mx-auto leading-relaxed">
                    You can only submit a review for <strong>{landmark.name}</strong> after you have visited it.
                    Please buy an entrance ticket or schedule it in your custom itineraries for a visit today or in the past.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-inner space-y-4 mb-6">
                  <h4 className="font-serif font-bold text-navy-900 text-sm">Write a Review</h4>
                  {reviewError && (
                    <div className="flex items-center space-x-1.5 text-xs text-red-600 bg-red-50 p-2 rounded">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{reviewError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Score</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${star <= rating
                              ? 'fill-[#C1A249] text-[#C1A249]'
                              : 'text-gray-300'
                              }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Review Description</label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your tips, historical views, or access directions..."
                      className="w-full p-3 border border-gray-200 bg-white rounded-xl focus:ring-2 focus:ring-[#C1A249] text-xs font-semibold focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={createReviewMutation.isPending}
                    className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 rounded-xl shadow-md transition text-xs uppercase tracking-wider"
                  >
                    {createReviewMutation.isPending ? 'Posting...' : 'Post Review'}
                  </button>
                </form>
              )
            ) : (
              <div className="bg-gray-50 p-6 rounded-2xl text-center border border-dashed border-gray-300 space-y-4 mb-6">
                <p className="text-gray-600 text-xs">Please log in to participate in the community review feed.</p>
                <Link to="/auth" className="inline-block bg-[#C1A249] hover:bg-[#b59546] text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow">
                  Login / Signup
                </Link>
              </div>
            )}

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
                <p className="text-gray-500 italic">No reviews yet. Be the first!</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">

          {/* Booking Widget */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6 sticky top-24">
            <h3 className="text-xl font-serif font-bold text-navy-900">Book Your Visit</h3>

            {Number(landmark.ticketPrice) > 0 ? (
            <form 
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!isAuthenticated) {
                  navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`);
                  return;
                }
                bookLandmarkMutation.mutate({
                  landmark_id: landmarkId,
                  dates: { start: ticketDate },
                  guests: ticketQty,
                });
              }}
            >
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-2">Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={ticketDate}
                  onChange={(e) => setTicketDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#C1A249] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-2">Number of Visitors</label>
                <select
                  value={ticketQty}
                  onChange={(e) => setTicketQty(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#C1A249] focus:outline-none appearance-none bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                    <option key={n} value={n}>{n} person{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Entry Fee</span>
                  <span className="font-bold text-navy-900">{landmark.ticketPrice} EGP</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="font-bold text-navy-900">Total</span>
                  <span className="font-bold text-[#C1A249]">{landmark.ticketPrice * ticketQty} EGP</span>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={bookLandmarkMutation.isPending}
                  className="w-full bg-[#C1A249] hover:bg-[#b59546] text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{bookLandmarkMutation.isPending ? 'Processing...' : 'Book Tickets'}</span>
                </button>
              </div>
            </form>
            ) : (
              <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100 text-center space-y-2">
                <div className="bg-white inline-block p-3 rounded-full shadow-sm mb-2">
                  <Tag className="h-6 w-6 text-green-500" />
                </div>
                <h4 className="font-serif font-bold text-navy-900 text-lg">Free Entry</h4>
                <p className="text-sm text-gray-600 font-medium">This landmark is free to visit. No booking is required!</p>
              </div>
            )}
          </div>

        </div>
      </div>



      {/* Add To Custom Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-gold-500/20 shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">

            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-lg font-serif font-bold text-navy-900">Add {landmark.name} to Plan</h3>
                <p className="text-xs text-gray-500">Incorporate this historical landmark into your Egypt timeline.</p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {planSuccessMsg && (
              <div className="text-xs text-green-700 bg-green-50 p-3.5 rounded-xl border border-green-200 flex items-center space-x-2">
                <Check className="h-4.5 w-4.5 text-green-600 shrink-0" />
                <span>{planSuccessMsg}</span>
              </div>
            )}

          </div>
        </div>
      )}

      <BookingSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/dashboard/bookings');
        }} 
      />
    </div>
  );
}
