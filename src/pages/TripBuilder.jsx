import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { tourismTypesAPI, governoratesAPI, itinerariesAPI, bookingsAPI, hotelsAPI, landmarksAPI } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import {
  Compass, Calendar, DollarSign, MapPin, Sparkles, Building2, ShieldCheck, Check, Plane,
  ArrowLeft, ArrowRight, RefreshCw, Star, HelpCircle, Plus, Trash2, Save, Search, AlertCircle, Info, ShieldAlert, X,
  Landmark, Moon, Cross, Umbrella, Fish, Tent, Sailboat, Leaf, Mountain, HeartPulse, Palette, Book, Gem, Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingSuccessModal from '../components/BookingSuccessModal';

const getVibeIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('pharaonic') || n.includes('ancient') || n.includes('roman')) return <Landmark strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('islamic')) return <Moon strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('coptic') || n.includes('christian')) return <Cross strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('beach') || n.includes('sea')) return <Umbrella strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('diving')) return <Fish strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('desert') || n.includes('safari')) return <Tent strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('nile') || n.includes('cruise')) return <Sailboat strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('eco') || n.includes('nature')) return <Leaf strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('adventure') || n.includes('sports')) return <Mountain strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('medical') || n.includes('wellness')) return <HeartPulse strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('art') || n.includes('cultur')) return <Palette strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('religio') || n.includes('pilgrim')) return <Book strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('luxury') || n.includes('resort')) return <Gem strokeWidth={1.25} className="w-10 h-10" />;
  if (n.includes('nubian')) return <Home strokeWidth={1.25} className="w-10 h-10" />;
  return <Landmark strokeWidth={1.25} className="w-10 h-10" />;
};

export default function TripBuilder() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  // Overall Mode: 'ai' or 'manual'
  const [builderMode, setBuilderMode] = useState('ai');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ==========================================
  // SHARED STATE & QUERIES
  // ==========================================
  const { data: typesData } = useQuery({
    queryKey: ['tourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const { data: govsData } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const { data: hotelsData } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => hotelsAPI.getAll({ limit: 1000 }),
  });

  const { data: landmarksData } = useQuery({
    queryKey: ['landmarks'],
    queryFn: () => landmarksAPI.getAll({ limit: 1000 }),
  });

  const types = typesData?.data?.data?.types || typesData?.data?.types || [];
  const governorates = govsData?.data?.data?.governorates || govsData?.data?.governorates || [];
  const hotels = hotelsData?.data?.data?.hotels || hotelsData?.data?.hotels || hotelsData?.data || [];
  const landmarks = landmarksData?.data?.data?.landmarks || landmarksData?.data?.landmarks || landmarksData?.data || [];
  const uniqueCategories = [...new Set(landmarks.map(l => l.category))].filter(Boolean).sort();

  // ==========================================
  // AI MODE WIZARD STATES
  // ==========================================
  const [aiStep, setAiStep] = useState(1);
  const [aiBudget, setAiBudget] = useState(1500);
  const [aiDuration, setAiDuration] = useState(5);
  const [aiSelectedTypes, setAiSelectedTypes] = useState([]);
  const [aiSelectedGovs, setAiSelectedGovs] = useState([]);
  const [aiMinStars, setAiMinStars] = useState(3);
  const [aiBuilderError, setAiBuilderError] = useState('');
  const [aiTripResult, setAiTripResult] = useState(null);

  // AI Booking states
  const [aiStartDate, setAiStartDate] = useState('');
  const [aiEndDate, setAiEndDate] = useState('');
  const [aiGuestsCount, setAiGuestsCount] = useState(1);
  const [aiBookingError, setAiBookingError] = useState('');

  // ==========================================
  // MANUAL MODE STATES
  // ==========================================
  const [manualTitle, setManualTitle] = useState('My Custom Egypt Adventure');
  const [manualDescription, setManualDescription] = useState('A custom itinerary planned step-by-step.');
  const [manualBudget, setManualBudget] = useState(1000);
  const [manualDuration, setManualDuration] = useState(3);
  const [manualIsPublic, setManualIsPublic] = useState(false);

  // Manual Search & Filter states
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSelectedGov, setManualSelectedGov] = useState('all');
  const [manualSelectedCat, setManualSelectedCat] = useState('all');

  // Manual builder schedule
  const [manualSchedule, setManualSchedule] = useState(
    Array.from({ length: 3 }, (_, i) => ({
      day: i + 1,
      landmarks: [],
      hotel: null,
      description: `Day ${i + 1} exploration`,
    }))
  );

  const [manualActiveDay, setManualActiveDay] = useState(1);
  const [manualStartDate, setManualStartDate] = useState('');
  const [manualEndDate, setManualEndDate] = useState('');
  const [manualGuestsCount, setManualGuestsCount] = useState(1);

  // Common notification states
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ==========================================
  // AI MODE LOGIC & MUTATIONS
  // ==========================================
  const handleAiGovChange = (slug) => {
    if (aiSelectedGovs.includes(slug)) {
      setAiSelectedGovs(aiSelectedGovs.filter((s) => s !== slug));
    } else {
      setAiSelectedGovs([...aiSelectedGovs, slug]);
    }
  };

  const handleAiTypeSelect = (id) => {
    if (aiSelectedTypes.includes(id)) {
      setAiSelectedTypes(aiSelectedTypes.filter(t => t !== id));
    } else {
      setAiSelectedTypes([...aiSelectedTypes, id]);
    }
  };

  const buildAiTripMutation = useMutation({
    mutationFn: (data) => itinerariesAPI.buildCustom(data),
    onSuccess: (res) => {
      setAiTripResult(res.data.data || res.data);
      setAiStep(4);
    },
    onError: (err) => {
      setAiBuilderError(err.response?.data?.message || 'Failed to auto-generate trip. Modify filters and try again.');
    },
  });

  const handleAiGenerate = (e) => {
    if (e) e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setAiBuilderError('');
    setAiTripResult(null);

    const body = {
      budget: parseFloat(aiBudget),
      duration: parseInt(aiDuration),
      preferences: {
        hotelStars: parseInt(aiMinStars),
      },
    };

    if (aiSelectedTypes.length > 0) {
      body.tourismType = aiSelectedTypes;
    }
    if (aiSelectedGovs.length > 0) {
      body.governorates = aiSelectedGovs;
    }

    buildAiTripMutation.mutate(body);
  };

  const bookAiTripMutation = useMutation({
    mutationFn: (data) => bookingsAPI.bookCustomTrip(data),
    onSuccess: (res) => {
      setShowSuccessModal(true);
    },
    onError: (err) => {
      setAiBookingError(err.response?.data?.message || 'Failed to book custom trip.');
    },
  });

  const handleAiBookTrip = (e) => {
    e.preventDefault();
    setAiBookingError('');
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!aiStartDate || !aiEndDate) {
      setAiBookingError('Please select start and end dates.');
      return;
    }

    bookAiTripMutation.mutate({
      itinerary_id: aiTripResult.itinerary_id,
      dates: { start: aiStartDate, end: aiEndDate },
      guests: parseInt(aiGuestsCount),
      totalPrice: aiTripResult.totalEstimatedCost * parseInt(aiGuestsCount),
    });
  };

  const resetAiBuilder = () => {
    setAiTripResult(null);
    setAiStep(1);
    setAiBuilderError('');
  };

  // ==========================================
  // MANUAL MODE LOGIC & MUTATIONS
  // ==========================================
  const handleManualStartDateChange = (newStart) => {
    setManualStartDate(newStart);
    if (newStart && manualDuration) {
      const start = new Date(newStart);
      start.setDate(start.getDate() + (manualDuration - 1));
      setManualEndDate(start.toISOString().split('T')[0]);
    } else {
      setManualEndDate('');
    }
  };

  const handleManualDurationChange = (newDuration) => {
    setManualDuration(newDuration);
    if (manualStartDate) {
      const start = new Date(manualStartDate);
      start.setDate(start.getDate() + (newDuration - 1));
      setManualEndDate(start.toISOString().split('T')[0]);
    }
    setManualSchedule((prev) => {
      const updated = [...prev];
      if (newDuration > prev.length) {
        for (let i = prev.length; i < newDuration; i++) {
          updated.push({
            day: i + 1,
            landmarks: [],
            hotel: null,
            description: `Day ${i + 1} exploration`,
          });
        }
      } else if (newDuration < prev.length) {
        updated.splice(newDuration);
      }
      return updated;
    });
    if (manualActiveDay > newDuration) {
      setManualActiveDay(newDuration);
    }
  };

  const addLandmarkToManualDay = (landmark) => {
    const isAlreadyAdded = manualSchedule.some((dayPlan) =>
      dayPlan.landmarks.some((l) => l._id === landmark._id)
    );

    if (isAlreadyAdded) {
      setErrorMsg(`"${landmark.name}" is already included in your program!`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setManualSchedule((prev) =>
      prev.map((dayPlan) => {
        if (dayPlan.day === manualActiveDay) {
          return {
            ...dayPlan,
            landmarks: [...dayPlan.landmarks, landmark],
          };
        }
        return dayPlan;
      })
    );
  };

  const removeManualLandmark = (dayNum, landmarkId) => {
    setManualSchedule((prev) =>
      prev.map((dayPlan) => {
        if (dayPlan.day === dayNum) {
          return {
            ...dayPlan,
            landmarks: dayPlan.landmarks.filter((l) => l._id !== landmarkId),
          };
        }
        return dayPlan;
      })
    );
  };

  const setManualHotelForDay = (dayNum, hotel) => {
    setManualSchedule((prev) =>
      prev.map((dayPlan) => {
        if (dayPlan.day === dayNum) {
          return {
            ...dayPlan,
            hotel: hotel,
          };
        }
        return dayPlan;
      })
    );
  };

  const manualTotalCost = manualSchedule.reduce((sum, dayPlan) => {
    const dayLandmarksCost = dayPlan.landmarks.reduce((daySum, l) => daySum + (l.ticketPrice || 0), 0);
    const dayHotelCost = dayPlan.hotel ? (dayPlan.hotel.roomTypes?.[0]?.pricePerNight || 120) : 0;
    return sum + dayLandmarksCost + dayHotelCost;
  }, 0);

  const manualTotalBookingCost = manualTotalCost * manualGuestsCount;
  const manualBudgetRemaining = manualBudget - manualTotalBookingCost;

  const filteredManualLandmarks = landmarks.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(manualSearchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(manualSearchQuery.toLowerCase());

    const landmarkGovId = l.governorate_id?._id || l.governorate_id;
    const matchesGov = manualSelectedGov === 'all' || landmarkGovId === manualSelectedGov;

    const matchesCategory = manualSelectedCat === 'all' || l.category === manualSelectedCat;

    return matchesSearch && matchesGov && matchesCategory;
  });

  const bookManualTripMutation = useMutation({
    mutationFn: (data) => bookingsAPI.bookCustomTrip(data),
    onSuccess: (res) => {
      setShowSuccessModal(true);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to book custom program.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  const saveManualItineraryMutation = useMutation({
    mutationFn: (data) => itinerariesAPI.createUserItinerary(data),
    onSuccess: (res) => {
      const newItinerary = res.data?.data?.itinerary || res.data?.itinerary || res.data;
      bookManualTripMutation.mutate({
        itinerary_id: newItinerary._id || newItinerary.id,
        dates: { start: manualStartDate, end: manualEndDate },
        guests: parseInt(manualGuestsCount),
        totalPrice: manualTotalBookingCost,
      });
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to save custom program. Please try again.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  const handleSaveManualProgram = () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!manualTitle.trim()) {
      setErrorMsg('Please provide a title for your custom program.');
      return;
    }

    if (!manualStartDate) {
      setErrorMsg('Please select a start date for your custom program.');
      return;
    }

    const totalLandmarksAdded = manualSchedule.reduce((sum, day) => sum + day.landmarks.length, 0);
    if (totalLandmarksAdded === 0) {
      setErrorMsg('Please add at least one discovery to your program before saving.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const formattedSchedule = manualSchedule.map((dayPlan) => ({
      day: dayPlan.day,
      landmarks: dayPlan.landmarks.map((l, index) => ({
        landmark_id: l._id,
        visitTime: index === 0 ? 'Morning' : index === 1 ? 'Afternoon' : 'Evening',
        order: index + 1,
      })),
      hotel_id: dayPlan.hotel ? dayPlan.hotel._id : undefined,
      description: dayPlan.description || `Day ${dayPlan.day} exploration`,
    }));

    const payload = {
      title: manualTitle,
      description: manualDescription,
      budget: manualBudget,
      duration: manualDuration,
      isCustom: true,
      schedule: formattedSchedule,
      isPublic: manualIsPublic,
    };

    saveManualItineraryMutation.mutate(payload);
  };

  // Step transitions variant
  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF2] flex flex-col lg:flex-row">
      {/* Left Panel - Fixed Hero Image */}
      <div className="lg:w-[45%] xl:w-[40%] relative bg-gray-900 overflow-hidden lg:h-screen lg:sticky top-0 shadow-2xl z-10 flex-shrink-0 min-h-[40vh]">
        <img
          src="https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1200&q=80"
          alt="Pyramids"
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0c0a] via-[#1c1a17]/50 to-transparent"></div>
        <div className="absolute inset-y-0 left-8 right-8 lg:left-12 lg:pr-12 flex flex-col justify-center">
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-serif font-black text-[#C1A249] tracking-tight leading-none mb-6 drop-shadow-xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            DESIGN YOUR<br />EGYPTIAN LEGEND
          </h1>
          <p className="text-white/90 text-sm lg:text-base max-w-md leading-relaxed drop-shadow-md">
            Choose to auto-generate a program with our smart AI builder or manually select landmarks and accommodations to curate your budget travel timeline.
          </p>
        </div>
      </div>

      {/* Right Panel - Builder Content */}
      <div className="flex-1 flex w-full relative bg-[#FDFBF2]">

        {/* Step Tracker (Only visible in AI mode) */}
        {builderMode === 'ai' && aiStep <= 3 && (
          <div className="hidden lg:flex flex-col items-center justify-center w-28 border-r border-[#C1A249]/20 py-16 bg-[#FDFBF2] flex-shrink-0 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
            <div className="relative flex flex-col items-center justify-between h-[450px] w-full">
              <div className="absolute top-8 bottom-8 w-px bg-[#C1A249]/40"></div>

              {[
                { number: 1, title: 'SCOPE' },
                { number: 2, title: 'VIBE' },
                { number: 3, title: 'DESTINATIONS' }
              ].map((s) => {
                const isActive = aiStep >= s.number;
                const isCurrent = aiStep === s.number;
                return (
                  <div key={s.number} className="relative z-10 flex flex-col items-center bg-[#FDFBF2] py-2">
                    <span className="text-[9px] font-bold uppercase mb-2 tracking-widest text-navy-900">{s.title}</span>
                    <button
                      onClick={() => { if (s.number < aiStep) setAiStep(s.number); }}
                      disabled={s.number > aiStep}
                      className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition duration-300 ${isCurrent
                          ? 'bg-gradient-to-b from-[#C1A249] to-[#9c7d2b] text-white border-[#C1A249]/50 shadow-[0_0_15px_rgba(201,150,59,0.4)]'
                          : isActive
                            ? 'bg-[#FDFBF2] text-[#C1A249] border-[#C1A249]'
                            : 'bg-[#FDFBF2] text-gray-400 border-gray-300'
                        }`}
                    >
                      {isActive && s.number < aiStep ? <Check className="h-5 w-5" /> : s.number}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable Form Content */}
        <div className="flex-1 py-10 px-4 sm:px-8 lg:px-16 w-full max-w-4xl mx-auto flex flex-col">

          {/* Mode Selector */}
          <div className="flex justify-end mb-12">
            <div className="bg-[#EBE2CD]/50 p-1 rounded-full border border-[#C1A249]/30 flex space-x-1 shadow-inner">
              <button
                onClick={() => setBuilderMode('ai')}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center space-x-2 ${builderMode === 'ai'
                    ? 'bg-gradient-to-b from-[#C1A249] to-[#9c7d2b] text-white shadow-md border border-[#C1A249]/50'
                    : 'text-gray-500 hover:text-navy-900'
                  }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI Auto-Builder</span>
              </button>
              <button
                onClick={() => setBuilderMode('manual')}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center space-x-2 ${builderMode === 'manual'
                    ? 'bg-gradient-to-b from-[#C1A249] to-[#9c7d2b] text-white shadow-md border border-[#C1A249]/50'
                    : 'text-gray-500 hover:text-navy-900'
                  }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Manual Builder</span>
              </button>
            </div>
          </div>

          {/* Global Notifications */}
          <AnimatePresence>
            {(successMsg || errorMsg) && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 50, x: "-50%" }}
                className={`fixed bottom-10 left-1/2 z-[100] text-sm p-4 rounded-xl border flex items-center space-x-3 w-[90%] max-w-xl shadow-2xl ${successMsg ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'
                  }`}
              >
                {successMsg ? (
                  <>
                    <Check className="h-5 w-5 text-green-600 shrink-0" />
                    <span>{successMsg}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================
              MODE A: AI AUTO-BUILDER
              ============================================================ */}
          {builderMode === 'ai' && (
            <div className="w-full">
              {aiBuilderError && (
                <div className="mb-6 text-xs text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>{aiBuilderError}</span>
                </div>
              )}

              <AnimatePresence mode="wait">
                {/* STEP 1: Adventure Scope */}
                {aiStep === 1 && (
                  <motion.div
                    key="aiStep1"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    className="space-y-10 py-4"
                  >
                    <div className="border-b border-[#C1A249]/20 pb-4">
                      <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#A68B53] uppercase tracking-widest">Adventure Scope & Lodging</h2>
                      <p className="text-[13px] text-navy-900 mt-2 font-medium">Specify your target budget, trip timeline, and lodging preferences.</p>
                    </div>

                    <div className="space-y-8">
                      {/* Budget */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-[11px] font-bold text-navy-900 uppercase tracking-widest block">Estimated Budget ($)</label>
                          <span className="text-sm font-bold text-navy-900">${aiBudget}</span>
                        </div>
                        <input
                          type="range"
                          min={200}
                          max={8000}
                          step={50}
                          value={aiBudget}
                          onChange={(e) => setAiBudget(Number(e.target.value))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#C1A249]"
                          style={{
                            background: `linear-gradient(to right, #C1A249 ${((aiBudget - 200) / (8000 - 200)) * 100}%, #EBE2CD ${((aiBudget - 200) / (8000 - 200)) * 100}%)`
                          }}
                        />
                        <div className="relative w-[150px]">
                          <span className="absolute left-3 top-[10px] text-[#A68B53] font-bold text-sm">$</span>
                          <input
                            type="number"
                            min={100}
                            value={aiBudget}
                            onChange={(e) => setAiBudget(Math.max(100, Number(e.target.value) || 0))}
                            className="pl-8 w-full p-2 bg-transparent border border-[#C1A249]/30 rounded text-sm font-bold text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-sm"
                            style={{ backgroundColor: '#FDFBF2' }}
                          />
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-navy-900 uppercase tracking-widest block">Trip Duration (Days)</label>
                        <div className="flex items-center space-x-3 relative">
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={aiDuration}
                            onChange={(e) => setAiDuration(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                            className="w-full p-2 bg-transparent border border-[#C1A249]/30 rounded text-sm font-bold text-navy-900 focus:outline-none focus:ring-1 focus:ring-gold-500 shadow-sm"
                            style={{ backgroundColor: '#FDFBF2' }}
                          />
                          <span className="absolute right-4 text-sm text-gray-400">Days</span>
                        </div>
                      </div>

                      {/* Accommodations */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-navy-900 uppercase tracking-widest block">Accommodations</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[
                            { stars: 3, label: '3★+', img: '/hotel_3_star_ai.png' },
                            { stars: 4, label: '4★+', img: '/hotel_4_star_ai.png' },
                            { stars: 5, label: '5★ Luxury', img: '/hotel_5_star_ai.png' }
                          ].map((tier) => (
                            <button
                              key={tier.stars}
                              type="button"
                              onClick={() => setAiMinStars(tier.stars)}
                              className={`relative rounded-xl overflow-hidden border transition text-left group ${aiMinStars === tier.stars
                                  ? 'border-[#C1A249] shadow-[0_0_15px_rgba(201,150,59,0.3)]'
                                  : 'border-transparent shadow-sm hover:border-[#C1A249]/50'
                                }`}
                            >
                              <img src={tier.img} alt={tier.label} className="w-full h-24 object-cover" />
                              <div className="bg-[#FDFBF2] p-2 flex justify-between items-center border-t border-[#C1A249]/10">
                                <span className="text-[11px] font-bold text-navy-900">{tier.label}</span>
                                {aiMinStars === tier.stars ? (
                                  <Building2 className="h-3 w-3 text-[#C1A249]" />
                                ) : (
                                  <Building2 className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setAiStep(2)}
                        className="w-full mt-6 bg-gradient-to-r from-[#b59546] to-[#9c7d2b] text-white font-bold py-3.5 rounded-full text-xs uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2"
                      >
                        <span>Choose Category</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Category Vibe */}
                {aiStep === 2 && (
                  <motion.div
                    key="aiStep2"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    className="space-y-10 py-4"
                  >
                    <div className="text-center pb-4">
                      <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#A68B53] uppercase tracking-widest">Choose Your Travel Vibe</h2>
                      <p className="text-[13px] text-navy-900 mt-2 font-medium">Select the core experience style you want our compiler to focus on.</p>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
                      {types.map((type) => {
                        const isSelected = aiSelectedTypes.includes(type._id);
                        return (
                          <button
                            key={type._id}
                            type="button"
                            onClick={() => handleAiTypeSelect(type._id)}
                            className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center space-y-3 group ${isSelected
                                ? 'border-[#C1A249] shadow-[0_0_15px_rgba(201,150,59,0.3)] bg-gradient-to-b from-[#FDFBF2] to-[#f4ead5]'
                                : 'border-[#C1A249]/20 hover:border-[#C1A249]/50 shadow-sm bg-[#FDFBF2]'
                              }`}
                          >
                            <span className={`transition-transform duration-300 flex justify-center items-center ${isSelected ? 'scale-110 text-[#A68B53]' : 'text-[#A68B53] group-hover:scale-110'}`}>
                              {getVibeIcon(type.name)}
                            </span>
                            <span className={`font-bold text-[9px] uppercase tracking-wider text-center ${isSelected ? 'text-[#A68B53]' : 'text-navy-900'}`}>
                              {type.name.replace(' Tourism', '')}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        onClick={() => setAiStep(1)}
                        className="text-[#A68B53] hover:text-[#8C7335] font-bold py-3 px-2 text-[11px] uppercase tracking-widest flex items-center space-x-2 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                      <button
                        onClick={() => setAiStep(3)}
                        className="bg-black hover:bg-gray-900 text-[#C1A249] font-bold py-3.5 px-8 rounded-full text-[11px] uppercase tracking-widest flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                      >
                        <span>Select Regions</span>
                        <ArrowRight className="h-4 w-4 text-[#C1A249]" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Regions / Destinations */}
                {aiStep === 3 && (
                  <motion.div
                    key="aiStep3"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    className="space-y-10 py-4"
                  >
                    <div className="text-center pb-4">
                      <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#A68B53] uppercase tracking-widest">Select Preferred Governorates</h2>
                      <p className="text-[13px] text-navy-900 mt-2 font-medium">Select the provinces you would love to visit (or leave empty to let us customize options).</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 border border-[#C1A249]/20 p-5 rounded-2xl bg-[#EBE2CD]/20">
                      {governorates.map((gov) => {
                        const isSelected = aiSelectedGovs.includes(gov.slug);
                        return (
                          <button
                            key={gov._id}
                            type="button"
                            onClick={() => handleAiGovChange(gov.slug)}
                            className={`p-3.5 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center justify-center space-y-2 relative overflow-hidden group ${isSelected
                                ? 'border-[#C1A249] shadow-[0_0_15px_rgba(201,150,59,0.3)] bg-gradient-to-b from-[#FDFBF2] to-[#f4ead5]'
                                : 'border-[#C1A249]/20 hover:border-[#C1A249]/50 shadow-sm bg-[#FDFBF2]'
                              }`}
                          >
                            <MapPin className={`h-4.5 w-4.5 shrink-0 transition-transform duration-300 ${isSelected ? 'text-[#A68B53] scale-110' : 'text-[#A68B53] group-hover:scale-110'}`} />
                            <span className={`truncate w-full font-bold text-[10px] uppercase tracking-wider mt-1 ${isSelected ? 'text-[#A68B53]' : 'text-navy-900'}`}>{gov.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <button
                        onClick={() => setAiStep(2)}
                        className="text-[#A68B53] hover:text-[#8C7335] font-bold py-3 px-2 text-[11px] uppercase tracking-widest flex items-center space-x-2 transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Back</span>
                      </button>
                      <button
                        onClick={handleAiGenerate}
                        disabled={buildAiTripMutation.isPending}
                        className="bg-black hover:bg-gray-900 text-[#C1A249] font-bold py-3.5 px-8 rounded-full text-[11px] uppercase tracking-widest flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {buildAiTripMutation.isPending ? (
                          <>
                            <Compass className="h-4 w-4 animate-spin" />
                            <span>Compiling itinerary...</span>
                          </>
                        ) : (
                          <>
                            <Compass className="h-4 w-4" />
                            <span>Generate Custom Itinerary</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: AI Itinerary Results Dashboard */}
                {aiStep === 4 && aiTripResult && (
                  <motion.div
                    key="aiStep4"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    className="space-y-8"
                  >
                    <div className="bg-gradient-to-br from-navy-900 via-navy-900 to-navy-850 text-white p-6 sm:p-8 rounded-3xl border border-gold-500/30 shadow-xl space-y-6 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                        <div className="space-y-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-gold-500/20 text-gold-400 border border-gold-500/30">
                            ✨ AI Custom Compilation Complete
                          </span>
                          <h2 className="text-3xl font-serif font-black text-gold-500 tracking-wide">{aiTripResult.title}</h2>
                        </div>
                        <button
                          onClick={resetAiBuilder}
                          className="border border-gold-500/30 hover:border-gold-500 bg-white/5 hover:bg-white/10 text-gold-500 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-gold-500" />
                          <span>Re-Config</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center border-t border-b border-white/10 py-5 text-sm relative">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Duration</span>
                          <span className="font-bold text-base block">{aiTripResult.duration} Days</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Target Budget</span>
                          <span className="font-bold text-base text-gold-400 block">${aiTripResult.budget}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Est. Cost</span>
                          <span className="font-bold text-base block">${aiTripResult.totalEstimatedCost.toFixed(0)}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Remaining</span>
                          <span className={`font-bold text-base block ${aiTripResult.budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${aiTripResult.budgetRemaining.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 relative">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Cost Allocation Breakdown:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                            <div className="flex justify-between text-[10px] font-semibold text-gray-300">
                              <span>Hotels & Stays</span>
                              <span className="text-gold-400 font-bold">${aiTripResult.breakdown.accommodation.toFixed(0)}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-gold-500" style={{ width: `${(aiTripResult.breakdown.accommodation / aiTripResult.totalEstimatedCost) * 100}%` }}></div>
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                            <div className="flex justify-between text-[10px] font-semibold text-gray-300">
                              <span>Attractions / Tickets</span>
                              <span className="text-sky-400 font-bold">${aiTripResult.breakdown.attractions.toFixed(0)}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-sky-400" style={{ width: `${(aiTripResult.breakdown.attractions / aiTripResult.totalEstimatedCost) * 100}%` }}></div>
                            </div>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-3.5 rounded-xl">
                            <div className="flex justify-between text-[10px] font-semibold text-gray-300">
                              <span>Transport & Meals</span>
                              <span className="text-emerald-400 font-bold">${aiTripResult.breakdown.transportAndFood.toFixed(0)}</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-emerald-400" style={{ width: `${(aiTripResult.breakdown.transportAndFood / aiTripResult.totalEstimatedCost) * 100}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Day-by-Day Timeline */}
                      <div className="lg:col-span-7 space-y-6">
                        <h3 className="font-serif text-xl font-bold text-navy-900 flex items-center space-x-2 border-b border-gray-100 pb-3">
                          <Calendar className="h-5 w-5 text-gold-500" />
                          <span>Timeline itinerary</span>
                        </h3>

                        <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4.5 before:w-0.5 before:bg-gold-500/20">
                          {aiTripResult.schedule.map((dayPlan, index) => (
                            <div key={index} className="relative pl-11">
                              <div className="absolute left-0.5 top-1.5 h-8 w-8 rounded-full bg-navy-900 text-gold-500 font-bold flex items-center justify-center border-[3px] border-sand-50/50 shadow-md text-xs">
                                {dayPlan.day}
                              </div>
                              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                                <h4 className="font-serif font-black text-navy-900 text-sm">Day {dayPlan.day}</h4>
                                {dayPlan.hotel && (
                                  <div className="flex items-center space-x-2.5 bg-sand-50/40 p-3 rounded-xl border border-gold-500/10 text-xs">
                                    <Building2 className="h-4 w-4 text-gold-500" />
                                    <div>
                                      <span className="text-gray-400 block text-[9px] uppercase font-bold">Stay</span>
                                      <span className="font-semibold text-navy-900">{dayPlan.hotel.name}</span>
                                    </div>
                                  </div>
                                )}
                                {dayPlan.landmarks && dayPlan.landmarks.length > 0 && (
                                  <div className="space-y-2">
                                    {dayPlan.landmarks.map((l, lIdx) => (
                                      <div key={lIdx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-150 text-xs">
                                        <span className="font-semibold text-navy-900">{l.name}</span>
                                        <span className="text-gold-600 font-bold">{l.ticketPrice === 0 ? 'Free' : `$${l.ticketPrice}`}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Booking Form */}
                      <div className="lg:col-span-5">
                        <div className="bg-white p-6 rounded-2xl border border-gold-500/20 shadow-xl space-y-6 sticky top-24">
                          <h3 className="font-serif text-lg font-bold text-navy-900 border-b border-gray-100 pb-3">Book Curated Itinerary</h3>

                          {aiBookingError && <div className="text-xs text-red-650 bg-red-50 p-3 rounded-xl border border-red-200">{aiBookingError}</div>}

                          <form onSubmit={handleAiBookTrip} className="space-y-4">
                            <div className="space-y-3 text-xs">
                              <div className="space-y-1">
                                <label className="font-bold text-gray-500 uppercase tracking-wider block">Start Date</label>
                                <input
                                  type="date"
                                  required
                                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                                  value={aiStartDate}
                                  onChange={(e) => {
                                    setAiStartDate(e.target.value);
                                    if (e.target.value && aiTripResult.duration) {
                                      const s = new Date(e.target.value);
                                      s.setDate(s.getDate() + (aiTripResult.duration - 1));
                                      setAiEndDate(s.toISOString().split('T')[0]);
                                    }
                                  }}
                                  className="w-full p-2.5 border border-gray-250 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-gold-500 font-semibold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-gray-500 uppercase tracking-wider block">Guests</label>
                                <select
                                  value={aiGuestsCount}
                                  onChange={(e) => setAiGuestsCount(Number(e.target.value))}
                                  className="w-full p-2.5 border border-gray-250 bg-gray-50/50 rounded-xl focus:ring-2 focus:ring-gold-500 font-bold"
                                >
                                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>)}
                                </select>
                              </div>
                              <div className="flex justify-between items-center border-t border-gray-150 pt-4 mt-2">
                                <span className="font-bold text-navy-900">Total Price:</span>
                                <span className="text-xl font-black text-gold-600">${(aiTripResult.totalEstimatedCost * aiGuestsCount).toFixed(0)}</span>
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={bookAiTripMutation.isPending}
                              className="w-full bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3 px-4 rounded-xl shadow-lg transition duration-200 text-xs uppercase tracking-widest"
                            >
                              Request Booking
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Loader */}
                {buildAiTripMutation.isPending && (
                  <motion.div
                    key="aiLoading"
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={slideVariants}
                    className="h-[50vh] bg-white rounded-3xl border border-gold-500/10 shadow-xl flex items-center justify-center p-8 text-center"
                  >
                    <div className="space-y-4">
                      <Compass className="h-12 w-12 text-gold-500 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-navy-900 uppercase tracking-widest animate-pulse">Analyzing variables...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ============================================================
            MODE B: MANUAL PROGRAM BUILDER
            ============================================================ */}
          {builderMode === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
              {/* LEFT COLUMN: ITINERARY DETAILS & TIMELINE */}
              <div className="lg:col-span-5 space-y-6">

                {/* Manual Configuration Card */}
                <div className="p-6 rounded-xl border border-gold-500/30 shadow-md space-y-4" style={{ backgroundColor: '#F9F6EE', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                  <h3 className="font-serif text-lg font-bold text-center tracking-widest uppercase mb-6" style={{ color: '#a68b53' }}>
                    Program Configuration
                  </h3>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Program Title</label>
                    <input
                      type="text"
                      value={manualTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[a-zA-Z\s]*$/.test(val)) {
                          setManualTitle(val);
                        }
                      }}
                      placeholder="e.g. My Cairo & Luxor Tour"
                      className="w-full p-2.5 rounded-md text-xs font-semibold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner"
                      style={{ backgroundColor: '#EBE2CD' }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Trip Duration</label>
                    <select
                      value={manualDuration}
                      onChange={(e) => handleManualDurationChange(Number(e.target.value))}
                      className="w-full p-2.5 rounded-md text-xs font-bold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner appearance-none"
                      style={{ backgroundColor: '#EBE2CD' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map((d) => (
                        <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Start Date of Visit</label>
                    <input
                      type="date"
                      required
                      min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                      value={manualStartDate}
                      onChange={(e) => handleManualStartDateChange(e.target.value)}
                      className="w-full p-2.5 rounded-md text-xs font-semibold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner"
                      style={{ backgroundColor: '#EBE2CD' }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Number of Guests</label>
                    <select
                      value={manualGuestsCount}
                      onChange={(e) => setManualGuestsCount(Number(e.target.value))}
                      className="w-full p-2.5 rounded-md text-xs font-bold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner appearance-none"
                      style={{ backgroundColor: '#EBE2CD' }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                        <option key={g} value={g}>{g} Guest{g > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Dynamic Financial Tracker */}
                <div className="p-6 rounded-2xl border border-gold-500/20 shadow-2xl space-y-5" style={{ background: 'linear-gradient(180deg, #1c1a17 0%, #0d0c0a 100%)' }}>
                  <h3 className="font-serif text-lg font-bold text-center tracking-widest uppercase mb-2" style={{ color: '#C1A249' }}>
                    Financial Tracker
                  </h3>

                  <div className="space-y-4 border border-[#C1A249]/30 rounded-xl p-4 bg-white/5">
                    <div className="flex justify-between items-center px-4">
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Set Budget:</span>
                      <div className="flex items-center text-lg font-bold text-white">
                        <span>$</span>
                        <input
                          type="number"
                          value={manualBudget}
                          onChange={(e) => setManualBudget(Number(e.target.value))}
                          className="!bg-transparent !text-white text-right w-20 focus:outline-none border-b border-gold-500/50"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4 pt-3 border-t border-white/10">
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Total Cost:</span>
                      <span className="text-lg font-bold text-gold-400">${manualTotalBookingCost}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 pt-3 border-t border-white/10">
                      <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">Remaining Balance:</span>
                      <span className={`text-lg font-bold ${manualBudgetRemaining >= 0 ? 'text-[#4ade80]' : 'text-red-400'}`}>
                        ${manualBudgetRemaining}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Day Selector and Timeline */}
                <div className="p-6 rounded-xl border border-gold-500/30 shadow-md space-y-4" style={{ backgroundColor: '#F9F6EE', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                  <h3 className="font-serif text-lg font-bold text-center tracking-widest uppercase mb-4" style={{ color: '#a68b53' }}>
                    Program Timeline
                  </h3>

                  <div className="flex space-x-1 overflow-x-auto p-1 bg-[#EBE2CD] rounded-full justify-around mb-2">
                    {manualSchedule.map((dayPlan) => (
                      <button
                        key={dayPlan.day}
                        onClick={() => setManualActiveDay(dayPlan.day)}
                        className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap px-4 ${manualActiveDay === dayPlan.day
                            ? 'bg-white text-navy-900 shadow-sm border border-gold-500/30'
                            : 'text-gray-500 hover:text-navy-900'
                          }`}
                      >
                        Day {dayPlan.day}
                      </button>
                    ))}
                  </div>

                  {/* Day details */}
                  <div className="rounded-xl border border-gold-500/30 shadow-sm bg-white overflow-hidden">
                    <div className="py-2 px-4 text-center" style={{ background: 'linear-gradient(180deg, #c4a758 0%, #9c7d2b 100%)' }}>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider shadow-sm">Day {manualActiveDay} Details</h4>
                    </div>

                    <div className="p-4 space-y-4 bg-[#F9F6EE]">
                      {/* Hotel select */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Accommodation Stay (Optional)</label>
                        <select
                          value={manualSchedule[manualActiveDay - 1]?.hotel?._id || ''}
                          onChange={(e) => {
                            const hObj = hotels.find((h) => h._id === e.target.value) || null;
                            setManualHotelForDay(manualActiveDay, hObj);
                          }}
                          className="w-full p-2.5 rounded-md text-xs font-bold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner appearance-none"
                          style={{ backgroundColor: '#EBE2CD' }}
                        >
                          <option value="">Optional</option>
                          {hotels.map((h) => (
                            <option key={h._id} value={h._id}>
                              {h.name} — ${h.roomTypes?.[0]?.pricePerNight || 120}/n
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Note */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Day Activity Note</label>
                        <input
                          type="text"
                          value={manualSchedule[manualActiveDay - 1]?.description || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^[a-zA-Z\s]*$/.test(val)) {
                              setManualSchedule((prev) =>
                                prev.map((dayPlan) => {
                                  if (dayPlan.day === manualActiveDay) {
                                    return { ...dayPlan, description: val };
                                  }
                                  return dayPlan;
                                })
                              );
                            }
                          }}
                          className="w-full p-2.5 rounded-md text-xs font-semibold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner"
                          style={{ backgroundColor: '#EBE2CD' }}
                        />
                      </div>

                      {/* Landmarks list for day */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider block">Selected Landmarks ({manualSchedule[manualActiveDay - 1]?.landmarks.length || 0})</span>
                        {manualSchedule[manualActiveDay - 1]?.landmarks.length === 0 ? (
                          <div className="text-center py-6 border border-dashed border-gold-500/30 rounded-xl text-[10px] text-gray-500 bg-[#EBE2CD]/50">
                            <Calendar className="h-4 w-4 mx-auto mb-1 text-gold-500/60" />
                            You aren't currently assigned any landmarks.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {manualSchedule[manualActiveDay - 1].landmarks.map((l) => (
                              <div key={l._id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gold-500/20 text-xs shadow-sm">
                                <span className="font-bold text-navy-900 truncate flex-grow pr-2 text-[10px]">{l.name}</span>
                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className="font-bold text-gold-600">{l.ticketPrice === 0 ? 'Free' : `$${l.ticketPrice}`}</span>
                                  <button
                                    onClick={() => removeManualLandmark(manualActiveDay, l._id)}
                                    className="text-red-400 hover:text-red-600 transition p-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="pt-2">
                    <button
                      onClick={handleSaveManualProgram}
                      disabled={saveManualItineraryMutation.isPending || bookManualTripMutation.isPending}
                      className="w-full text-white font-bold py-3.5 rounded-xl shadow-lg text-[11px] uppercase tracking-wider flex items-center justify-center space-x-2 transition-transform active:scale-95"
                      style={{ background: 'linear-gradient(180deg, #9c7d2b 0%, #614a11 100%)' }}
                    >
                      {saveManualItineraryMutation.isPending || bookManualTripMutation.isPending ? (
                        <>
                          <Compass className="h-4 w-4 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4" />
                          <span>Book & Pay Program (${manualTotalBookingCost})</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* RIGHT COLUMN: LANDMARKS EXPLORER */}
              <div className="lg:col-span-7">
                <div className="bg-[#F9F6EE] p-5 rounded-xl border border-gold-500/30 shadow-md space-y-4" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                  <h3 className="font-serif text-lg font-bold text-center tracking-widest uppercase mb-4" style={{ color: '#a68b53' }}>
                    Landmark Explorer
                  </h3>

                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={manualSearchQuery}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^[a-zA-Z\s]*$/.test(val)) {
                            setManualSearchQuery(val);
                          }
                        }}
                        className="pl-9 w-full p-2 rounded-md text-xs font-semibold focus:outline-none border border-gold-500/20 shadow-inner"
                        style={{ backgroundColor: '#EBE2CD' }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase block tracking-wider">Governorate</label>
                        <select
                          value={manualSelectedGov}
                          onChange={(e) => setManualSelectedGov(e.target.value)}
                          className="w-full p-2 rounded-md text-xs font-bold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner appearance-none"
                          style={{ backgroundColor: '#EBE2CD' }}
                        >
                          <option value="all">All</option>
                          {governorates.map((g) => (
                            <option key={g._id} value={g._id}>{g.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-600 uppercase block tracking-wider">Category</label>
                        <select
                          value={manualSelectedCat}
                          onChange={(e) => setManualSelectedCat(e.target.value)}
                          className="w-full p-2 rounded-md text-xs font-bold text-navy-900 focus:outline-none border border-gold-500/20 shadow-inner appearance-none"
                          style={{ backgroundColor: '#EBE2CD' }}
                        >
                          <option value="all">All</option>
                          {types.map(t => {
                            const value = t.name.toLowerCase().replace(' tourism', '').replace(/ /g, '_');
                            const label = t.name.replace(' Tourism', '');
                            return <option key={t._id} value={value}>{label}</option>;
                          })}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-navy-900 uppercase tracking-widest mb-3">
                      Available Discoveries ({filteredManualLandmarks.length})
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[850px] overflow-y-auto pb-4 pr-1">
                      {filteredManualLandmarks.map((l) => {
                        const isSelected = manualSchedule.some(day => day.landmarks.some(mark => mark._id === l._id));
                        return (
                          <div key={l._id} className="bg-[#F9F6EE] rounded-lg border border-gold-500/20 shadow-sm overflow-hidden flex flex-col transition hover:shadow-md">
                            <div className="h-28 bg-gray-200 relative shrink-0">
                              <img
                                src={l.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=300&q=80'}
                                alt={l.name}
                                className={`h-full w-full object-cover ${isSelected ? 'grayscale opacity-80' : ''}`}
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center backdrop-blur-[1px]">
                                  <Check className="h-8 w-8 text-white drop-shadow-md" />
                                </div>
                              )}
                            </div>
                            <div className="p-2.5 flex-grow flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-[10px] text-navy-900 uppercase truncate">{l.name}</h4>
                                <p className="text-[9px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                                  {l.description || `Description of ${l.name}. Discover its ancient secrets...`}
                                </p>
                                <div className="font-bold text-[11px] text-navy-900 mt-1">
                                  {l.ticketPrice === 0 ? 'Free' : `$${l.ticketPrice?.toFixed(2) || '0.00'}`}
                                </div>
                              </div>
                              <button
                                onClick={() => !isSelected && addLandmarkToManualDay(l)}
                                disabled={isSelected}
                                className={`w-full mt-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition shadow-sm ${isSelected
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
                                    : 'text-white hover:opacity-90 active:scale-95'
                                  }`}
                                style={isSelected ? {} : { background: 'linear-gradient(180deg, #c4a758 0%, #9c7d2b 100%)' }}
                              >
                                {isSelected ? 'Added' : `Add To Day ${manualActiveDay}`}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

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
