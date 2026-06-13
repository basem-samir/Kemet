import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { landmarksAPI, governoratesAPI, itinerariesAPI, hotelsAPI, bookingsAPI, tourismTypesAPI } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import { Compass, Calendar, DollarSign, MapPin, Sparkles, Building2, Plus, Trash2, ArrowRight, Save, Search, AlertCircle, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingSuccessModal from '../components/BookingSuccessModal';

export default function ProgramBuilder() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Basic Details
  const [title, setTitle] = useState('My Custom Egypt Adventure');
  const [description, setDescription] = useState('A custom itinerary planned step-by-step.');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [budget, setBudget] = useState(1000);
  const [duration, setDuration] = useState(3);
  const [isPublic, setIsPublic] = useState(false);

  // Booking details
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  // Search & Filter state for Landmarks Explorer
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // The Builder state: schedule is an array of days
  // e.g. [ { day: 1, landmarks: [landmarkObj, ...], hotel: hotelObj }, ... ]
  const [schedule, setSchedule] = useState(
    Array.from({ length: 3 }, (_, i) => ({
      day: i + 1,
      landmarks: [],
      hotel: null,
      description: `Day ${i + 1} exploration`,
    }))
  );

  const [activeDay, setActiveDay] = useState(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch Landmarks, Governorates, and Hotels
  const { data: landmarksData, isLoading: isLoadingLandmarks } = useQuery({
    queryKey: ['landmarks'],
    queryFn: () => landmarksAPI.getAll({ limit: 1000 }),
  });

  const { data: typesData } = useQuery({
    queryKey: ['tourismTypes'],
    queryFn: () => tourismTypesAPI.getAll({ limit: 1000 }),
  });

  const { data: govsData } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const { data: hotelsData, isLoading: isLoadingHotels } = useQuery({
    queryKey: ['hotels'],
    queryFn: () => hotelsAPI.getAll({ limit: 1000 }),
  });

  const landmarks = landmarksData?.data?.data?.landmarks || landmarksData?.data?.landmarks || landmarksData?.data || [];
  const types = typesData?.data?.data?.types || typesData?.data?.types || [];
  const governorates = govsData?.data?.data?.governorates || govsData?.data?.governorates || [];
  const hotels = hotelsData?.data?.data?.hotels || hotelsData?.data?.hotels || hotelsData?.data || [];

  const handleStartDateChange = (newStart) => {
    setStartDate(newStart);
    if (newStart && duration) {
      const start = new Date(newStart);
      start.setDate(start.getDate() + (duration - 1));
      setEndDate(start.toISOString().split('T')[0]);
    } else {
      setEndDate('');
    }
  };

  // Handle duration change: resize the schedule array without losing existing data
  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    if (startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + (newDuration - 1));
      setEndDate(start.toISOString().split('T')[0]);
    }
    setSchedule((prev) => {
      const updated = [...prev];
      if (newDuration > prev.length) {
        // Add new days
        for (let i = prev.length; i < newDuration; i++) {
          updated.push({
            day: i + 1,
            landmarks: [],
            hotel: null,
            description: `Day ${i + 1} exploration`,
          });
        }
      } else if (newDuration < prev.length) {
        // Truncate days
        updated.splice(newDuration);
      }
      return updated;
    });
    if (activeDay > newDuration) {
      setActiveDay(newDuration);
    }
  };

  // Add a landmark to the active day
  const addLandmarkToActiveDay = (landmark) => {
    // Check if landmark already added in ANY day to prevent duplicates in the program
    const isAlreadyAdded = schedule.some((dayPlan) =>
      dayPlan.landmarks.some((l) => l._id === landmark._id)
    );

    if (isAlreadyAdded) {
      setErrorMsg(`"${landmark.name}" is already included in your program!`);
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setSchedule((prev) =>
      prev.map((dayPlan) => {
        if (dayPlan.day === activeDay) {
          return {
            ...dayPlan,
            landmarks: [...dayPlan.landmarks, landmark],
          };
        }
        return dayPlan;
      })
    );
  };

  // Remove a landmark from a specific day
  const removeLandmark = (dayNum, landmarkId) => {
    setSchedule((prev) =>
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

  // Set hotel for a specific day
  const setHotelForDay = (dayNum, hotel) => {
    setSchedule((prev) =>
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

  // Calculations
  const totalLandmarkCost = schedule.reduce((sum, dayPlan) => {
    const dayLandmarksCost = dayPlan.landmarks.reduce((daySum, l) => daySum + (l.ticketPrice || 0), 0);
    const dayHotelCost = dayPlan.hotel ? (dayPlan.hotel.roomTypes?.[0]?.pricePerNight || 120) : 0;
    return sum + dayLandmarksCost + dayHotelCost;
  }, 0);

  const totalBookingCost = totalLandmarkCost * guestsCount;
  const budgetRemaining = budget - totalBookingCost;

  // Filtered Landmarks for Explorer panel
  const filteredLandmarks = landmarks.filter((l) => {
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());

    const landmarkGovId = l.governorate_id?._id || l.governorate_id;
    const matchesGov = selectedGovernorate === 'all' || landmarkGovId === selectedGovernorate;

    const matchesCategory = selectedCategory === 'all' || l.category === selectedCategory;

    return matchesSearch && matchesGov && matchesCategory;
  });

  // Book Custom Trip Mutation
  const bookCustomTripMutation = useMutation({
    mutationFn: (data) => bookingsAPI.bookCustomTrip(data),
    onSuccess: (res) => {
      setShowSuccessModal(true);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to book custom program.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  // Save Itinerary Mutation
  const saveItineraryMutation = useMutation({
    mutationFn: (data) => itinerariesAPI.createUserItinerary(data),
    onSuccess: (res) => {
      const newItinerary = res.data?.data?.itinerary || res.data?.itinerary || res.data;
      
      // Trigger booking creation
      bookCustomTripMutation.mutate({
        itinerary_id: newItinerary._id || newItinerary.id,
        dates: { start: startDate, end: endDate },
        guests: parseInt(guestsCount),
        totalPrice: totalLandmarkCost * parseInt(guestsCount),
      });
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to save custom program. Please try again.');
      setTimeout(() => setErrorMsg(''), 4000);
    },
  });

  const handleSaveProgram = () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please provide a title for your custom program.');
      return;
    }

    if (!startDate) {
      setErrorMsg('Please select a start date for your custom program.');
      return;
    }

    // Format the schedule according to what the backend expects
    const formattedSchedule = schedule.map((dayPlan) => ({
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
      title,
      description,
      budget,
      duration,
      isCustom: true,
      schedule: formattedSchedule,
      isPublic,
    };

    saveItineraryMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-sand-50/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 bg-gold-500/10 border border-gold-500/35 px-4 py-1.5 rounded-full text-gold-600 font-bold text-xs uppercase tracking-widest shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold-500" />
            <span>Interactive Program Builder</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-black text-navy-900 tracking-tight leading-none">
            Design Your Custom Egypt Tour
          </h1>
          <p className="text-gray-550 text-sm max-w-xl mx-auto">
            Choose your budget, select landmarks and hotels, organize them into days, and save your custom itinerary for booking.
          </p>
        </div>

        {/* Status Messages */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-sm text-green-700 bg-green-50 p-4 rounded-xl border border-green-200 flex items-center space-x-3 max-w-xl mx-auto shadow-md"
            >
              <Check className="h-5 w-5 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 flex items-center space-x-3 max-w-xl mx-auto shadow-md"
            >
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: Left Column is Creator, Right Column is Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: ITINERARY DETAILS & TIMELINE (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Itinerary Configuration Card */}
            <div className="bg-white p-6 rounded-3xl border border-gold-500/15 shadow-xl space-y-6">
              <h3 className="font-serif text-lg font-bold text-navy-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
                <Compass className="h-5 w-5 text-gold-500" />
                <span>Program Configuration</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Program Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[a-zA-Z\s]*$/.test(val)) {
                        setTitle(val);
                      }
                    }}
                    placeholder="e.g. My Cairo & Luxor Tour"
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-250 rounded-xl text-xs font-semibold text-navy-900 focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Trip Duration (Days)</label>
                  <select
                    value={duration}
                    onChange={(e) => handleDurationChange(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-250 rounded-xl text-xs font-bold text-navy-900 focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map((d) => (
                      <option key={d} value={d}>{d} Day{d > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Description / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your program, target theme, or notes..."
                  rows={2}
                  className="w-full p-2.5 bg-gray-50/50 border border-gray-250 rounded-xl text-xs font-semibold text-navy-900 focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Start Date of Visit</label>
                  <input
                    type="date"
                    required
                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-250 rounded-xl text-xs font-semibold text-navy-900 focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Number of Guests</label>
                  <select
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50/50 border border-gray-250 rounded-xl text-xs font-bold text-navy-900 focus:ring-2 focus:ring-gold-500 focus:bg-white focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                      <option key={g} value={g}>{g} Guest{g > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Budget Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>Program Budget</span>
                    <span className="text-sm font-serif font-black text-gold-600">${budget}</span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={5000}
                    step={50}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-gold-500"
                  />
                </div>

                {/* Public Access Toggle */}
                <div className="flex items-center justify-between border border-gray-150 p-3 rounded-xl bg-gray-50/30">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-navy-900 block uppercase tracking-wider">Share Publicly</span>
                    <span className="text-[9px] text-gray-400 block">Allow other travelers to see this custom plan</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-gray-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Cost Meter */}
            <div className="bg-gradient-to-r from-navy-900 to-navy-850 text-white p-5 rounded-2xl border border-gold-500/20 shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Financial Tracker</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-white/10 text-[9px] font-bold uppercase tracking-wider text-gold-400">
                  Live Calculator
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-gray-450 uppercase tracking-wider block">Set Budget</span>
                  <span className="text-base font-serif font-bold text-gold-400">${budget}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-gray-450 uppercase tracking-wider block">Total Cost (x{guestsCount})</span>
                  <span className="text-base font-serif font-bold">${totalBookingCost}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-semibold text-gray-450 uppercase tracking-wider block">Remaining Balance</span>
                  <span className={`text-base font-serif font-bold ${budgetRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${budgetRemaining}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${budgetRemaining >= 0 ? 'bg-gold-500' : 'bg-red-500'}`} 
                  style={{ width: `${Math.min(100, (totalBookingCost / budget) * 100)}%` }}
                />
              </div>
            </div>

            {/* Day Selector and Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="font-serif text-lg font-bold text-navy-900 flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gold-500" />
                  <span>Program Timeline</span>
                </h3>
                
                {/* Active Day Selector buttons */}
                <div className="flex space-x-1.5 overflow-x-auto py-1 max-w-xs sm:max-w-sm">
                  {schedule.map((dayPlan) => (
                    <button
                      key={dayPlan.day}
                      onClick={() => setActiveDay(dayPlan.day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                        activeDay === dayPlan.day
                          ? 'bg-navy-900 text-gold-500 border border-navy-900'
                          : 'bg-white text-navy-900 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Day {dayPlan.day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Day detail editor */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-150 pb-2">
                  <h4 className="font-serif font-black text-navy-900 text-sm">Day {activeDay} Details</h4>
                  <span className="text-[10px] font-bold text-navy-500 bg-navy-50 px-2 py-0.5 rounded-full border border-navy-100">
                    Active Target Day
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Select Accommodation Hotel for this Day */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Accommodation Stay (Optional)</label>
                    <div className="relative">
                      <select
                        value={schedule[activeDay - 1]?.hotel?._id || ''}
                        onChange={(e) => {
                          const hObj = hotels.find((h) => h._id === e.target.value) || null;
                          setHotelForDay(activeDay, hObj);
                        }}
                        className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white"
                      >
                        <option value="">🏨 No Hotel selected for this day</option>
                        {hotels.map((h) => (
                          <option key={h._id} value={h._id}>
                            🏨 {h.name} ({h.stars}★) — ${h.roomTypes?.[0]?.pricePerNight || 120}/night
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Day Description */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Day Activity Note</label>
                    <input
                      type="text"
                      value={schedule[activeDay - 1]?.description || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[a-zA-Z\s]*$/.test(val)) {
                          setSchedule((prev) =>
                            prev.map((dayPlan) => {
                              if (dayPlan.day === activeDay) {
                                return { ...dayPlan, description: val };
                              }
                              return dayPlan;
                            })
                          );
                        }
                      }}
                      placeholder="e.g. Visit pyramids and local bazaar"
                      className="w-full p-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white"
                    />
                  </div>

                  {/* List of Day's landmarks */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Selected Landmarks ({schedule[activeDay - 1]?.landmarks.length || 0})</span>
                    
                    {schedule[activeDay - 1]?.landmarks.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400 italic">
                        No landmarks assigned to Day {activeDay} yet. Click "Add" on any landmark from the explorer panel on the right.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {schedule[activeDay - 1].landmarks.map((l) => (
                          <div key={l._id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <MapPin className="h-4 w-4 text-gold-500 shrink-0" />
                              <div>
                                <span className="font-bold text-navy-900 block truncate">{l.name}</span>
                                <span className="text-[10px] text-gray-400 capitalize">{l.category}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <span className="font-bold text-gold-600 bg-gold-500/5 px-2 py-0.5 rounded border border-gold-500/10 text-[10px]">
                                Ticket: {l.ticketPrice === 0 ? 'Free' : `$${l.ticketPrice}`}
                              </span>
                              <button
                                onClick={() => removeLandmark(activeDay, l._id)}
                                className="text-red-500 hover:text-red-700 transition"
                                title="Remove landmark"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Save Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleSaveProgram}
                disabled={saveItineraryMutation.isPending || bookCustomTripMutation.isPending}
                className="flex-1 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3.5 rounded-xl shadow-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-2"
              >
                {saveItineraryMutation.isPending || bookCustomTripMutation.isPending ? (
                  <>
                    <Compass className="h-4 w-4 animate-spin text-navy-900" />
                    <span>Processing Program & Booking...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5 text-navy-900" />
                    <span>Book & Pay Program (${totalBookingCost})</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* RIGHT PANEL: LANDMARKS EXPLORER (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Filter Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-md space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="font-serif text-sm font-bold text-navy-900 flex items-center space-x-1.5">
                  <Search className="h-4 w-4 text-gold-500" />
                  <span>Landmark Explorer</span>
                </h3>
                
                {/* Reset Filters */}
                {(searchQuery || selectedGovernorate !== 'all' || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGovernorate('all');
                      setSelectedCategory('all');
                    }}
                    className="text-[9px] font-bold uppercase tracking-wider text-gold-600 hover:text-gold-700 transition"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[a-zA-Z\s]*$/.test(val)) {
                        setSearchQuery(val);
                      }
                    }}
                    className="pl-8.5 w-full p-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gold-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Governorate Select */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Governorate</label>
                  <select
                    value={selectedGovernorate}
                    onChange={(e) => setSelectedGovernorate(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold text-navy-900 focus:outline-none"
                  >
                    <option value="all">🌍 All</option>
                    {governorates.map((g) => (
                      <option key={g._id} value={g._id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category Select */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-gray-400 uppercase block tracking-wider">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs font-bold text-navy-900 focus:outline-none"
                  >
                    <option value="all">🏺 All</option>
                    {types.map(t => {
                      const value = t.name.toLowerCase().replace(' tourism', '').replace(/ /g, '_');
                      const label = t.name.replace(' Tourism', '');
                      return <option key={t._id} value={value}>{label}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Landmarks List panel */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-md space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Available Discoveries ({filteredLandmarks.length})</span>
                <span className="flex items-center space-x-1 text-gold-600">
                  <Info className="h-3 w-3" />
                  <span>Adding to Day {activeDay}</span>
                </span>
              </div>

              {isLoadingLandmarks ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="h-20 bg-gray-150 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : filteredLandmarks.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 italic">
                  No landmarks match your search.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLandmarks.map((l) => (
                    <div 
                      key={l._id} 
                      className="flex gap-3 bg-gray-50 hover:bg-gray-100/50 p-2.5 rounded-xl border border-gray-150 transition"
                    >
                      <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                        <img
                          src={l.images?.[0] || 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=200&q=80'}
                          alt={l.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-navy-950 truncate">{l.name}</h4>
                          <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 mt-0.5">
                            <span className="capitalize">{l.category}</span>
                            <span>•</span>
                            <span className="truncate">{l.governorate_id?.name || 'Egypt'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <span className="font-serif font-black text-gold-600 text-xs">{l.ticketPrice === 0 ? 'Free' : `$${l.ticketPrice}`}</span>
                          <button
                            onClick={() => addLandmarkToActiveDay(l)}
                            className="bg-navy-900 hover:bg-navy-950 text-white font-bold px-3 py-1 rounded-lg text-[9px] uppercase tracking-wider transition flex items-center space-x-1"
                          >
                            <Plus className="h-3 w-3 text-gold-500" />
                            <span>Add to Day {activeDay}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

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
