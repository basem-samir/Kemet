import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itinerariesAPI, adminAPI, landmarksAPI, hotelsAPI } from '../../api/endpoints';
import { Plus, Trash2, Edit2, Loader2, Search, MapPin, Building, ChevronDown, ChevronUp, Check, ClipboardList, Calendar } from 'lucide-react';

export default function AdminItineraries() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [budgetTier, setBudgetTier] = useState('standard');
  const [totalBudget, setTotalBudget] = useState(0);
  const [duration, setDuration] = useState(1);
  const [description, setDescription] = useState('');
  const [imageCover, setImageCover] = useState('');
  const [highlightsStr, setHighlightsStr] = useState('');
  const [includesStr, setIncludesStr] = useState('');
  const [notIncludesStr, setNotIncludesStr] = useState('');
  const [tipsStr, setTipsStr] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [dayUploading, setDayUploading] = useState({});
  const [schedule, setSchedule] = useState([]);

  // For toggling day accordions in the UI
  const [expandedDays, setExpandedDays] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const toggleDay = (idx) => {
    setExpandedDays(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    if (/^[a-zA-Z\s-]*$/.test(newTitle)) {
      setTitle(newTitle);
      setSlug(newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await adminAPI.uploadImage(formData);
      const url = res.data?.data?.imageUrl || res.data?.imageUrl;
      if (url) {
        setImageCover(url);
      } else {
        throw new Error('Image URL was not returned.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload image.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDayImageUpload = async (e, dayIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDayUploading(prev => ({ ...prev, [dayIdx]: true }));
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await adminAPI.uploadImage(formData);
      const url = res.data?.data?.imageUrl || res.data?.imageUrl;
      if (url) {
        updateDay(dayIdx, 'image', url);
      } else {
        throw new Error('Image URL was not returned.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload image.');
    } finally {
      setDayUploading(prev => ({ ...prev, [dayIdx]: false }));
    }
  };

  const { data: itinerariesData, isLoading } = useQuery({
    queryKey: ['adminItineraries'],
    queryFn: () => itinerariesAPI.getTemplates(),
  });

  const { data: landmarksData } = useQuery({
    queryKey: ['allLandmarks'],
    queryFn: () => landmarksAPI.getAll({ limit: 200 }),
  });

  const { data: hotelsData } = useQuery({
    queryKey: ['allHotels'],
    queryFn: () => hotelsAPI.getAll({ limit: 200 }),
  });

  const availableLandmarks = landmarksData?.data?.data?.landmarks || landmarksData?.data?.landmarks || [];
  const availableHotels = hotelsData?.data?.data?.hotels || hotelsData?.data?.hotels || [];

  const addDay = () => {
    const newIdx = schedule.length;
    setSchedule([...schedule, { day: newIdx + 1, description: '', image: '', hotel: '', meals: '', landmarks: [] }]);
    setExpandedDays(prev => ({ ...prev, [newIdx]: true }));
  };

  const removeDay = (idx) => {
    setSchedule(schedule.filter((_, i) => i !== idx).map((d, i) => ({ ...d, day: i + 1 })));
  };

  const updateDay = (idx, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[idx][field] = value;
    setSchedule(newSchedule);
  };

  const addDayLandmark = (dayIdx) => {
    const newSchedule = [...schedule];
    newSchedule[dayIdx].landmarks.push({ landmark_id: '', visitTime: '', notes: '', order: newSchedule[dayIdx].landmarks.length + 1 });
    setSchedule(newSchedule);
  };

  const removeDayLandmark = (dayIdx, lmIdx) => {
    const newSchedule = [...schedule];
    newSchedule[dayIdx].landmarks = newSchedule[dayIdx].landmarks.filter((_, i) => i !== lmIdx);
    setSchedule(newSchedule);
  };

  const updateDayLandmark = (dayIdx, lmIdx, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[dayIdx].landmarks[lmIdx][field] = value;
    setSchedule(newSchedule);
  };

  useEffect(() => {
    let total = 0;
    schedule.forEach(day => {
      // Add landmarks prices
      day.landmarks.forEach(lm => {
        if (lm.landmark_id) {
          const landmarkData = availableLandmarks.find(l => l._id === lm.landmark_id);
          if (landmarkData && landmarkData.ticketPrice) {
            total += landmarkData.ticketPrice;
          }
        }
      });

      // Add overnight hotel cheapest room price
      if (day.hotel) {
        const hotelData = availableHotels.find(h => h._id === day.hotel);
        if (hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0) {
          const minPrice = Math.min(...hotelData.roomTypes.map(r => r.pricePerNight || 0));
          total += minPrice;
        }
      }
    });
    setTotalBudget(prev => prev !== total ? total : prev);
    setDuration(schedule.length === 0 ? 1 : schedule.length);
  }, [schedule, availableLandmarks, availableHotels]);

  const itineraries = itinerariesData?.data?.data?.templates || itinerariesData?.data?.templates || [];

  const filteredItineraries = itineraries.filter((i) => {
    const term = search.toLowerCase();
    return i.title.toLowerCase().includes(term) ||
      i.description?.toLowerCase().includes(term) ||
      i.budgetTier.toLowerCase().includes(term);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredItineraries.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItineraries = filteredItineraries.slice(indexOfFirstItem, indexOfLastItem);

  const createMutation = useMutation({
    mutationFn: (data) => itinerariesAPI.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminItineraries'] });
      setSuccessMsg('Itinerary template created successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create itinerary.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => itinerariesAPI.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminItineraries'] });
      setSuccessMsg('Itinerary template updated successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update itinerary.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => itinerariesAPI.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminItineraries'] });
      setSuccessMsg('Itinerary template deleted successfully.');
      setConfirmDelete(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const resetForm = () => {
    setTitle('');
    setSlug('');
    setBudgetTier('standard');
    setTotalBudget(0);
    setDuration(1);
    setDescription('');
    setImageCover('');
    setHighlightsStr('');
    setIncludesStr('');
    setNotIncludesStr('');
    setTipsStr('');
    setSchedule([]);
    setExpandedDays({});
    setCurrentStep(0);
    setShowAddForm(false);
    setEditingId(null);
    setErrorMsg('');
  };

  const handleEditClick = (i) => {
    setEditingId(i._id);
    setTitle(i.title);
    setSlug(i.slug || '');
    setBudgetTier(i.budgetTier);
    setTotalBudget(i.totalBudget);
    setDuration(i.duration);
    setDescription(i.description || '');
    setImageCover(i.imageCover || '');
    setHighlightsStr(i.highlights?.join(', ') || '');
    setIncludesStr(i.includes?.join(', ') || '');
    setNotIncludesStr(i.notIncludes?.join(', ') || '');
    setTipsStr(i.tips?.join(', ') || '');
    setSchedule(i.schedule?.map(d => ({
      ...d,
      meals: d.meals?.join(', ') || '',
      hotel: d.hotel?._id || d.hotel || '',
      image: d.image || '',
      landmarks: d.landmarks?.map(lm => ({
        ...lm,
        landmark_id: lm.landmark_id?._id || lm.landmark_id || ''
      })) || []
    })) || []);

    // Auto-expand first day if any
    if (i.schedule && i.schedule.length > 0) {
      setExpandedDays({ 0: true });
    } else {
      setExpandedDays({});
    }

    setShowAddForm(true);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title || !slug || !budgetTier || !totalBudget || !duration) {
      setErrorMsg('Please fill all required fields.');
      return;
    }

    const payload = {
      title,
      slug,
      budgetTier,
      totalBudget: parseFloat(totalBudget),
      duration: parseInt(duration),
      description,
      imageCover,
      highlights: highlightsStr.split(',').map(s => s.trim()).filter(Boolean),
      includes: includesStr.split(',').map(s => s.trim()).filter(Boolean),
      notIncludes: notIncludesStr.split(',').map(s => s.trim()).filter(Boolean),
      tips: tipsStr.split(',').map(s => s.trim()).filter(Boolean),
      schedule: schedule.map(d => ({
        day: d.day,
        description: d.description,
        image: d.image,
        hotel: d.hotel || undefined,
        meals: typeof d.meals === 'string' ? d.meals.split(',').map(m => m.trim()).filter(Boolean) : d.meals,
        landmarks: d.landmarks.filter(lm => lm.landmark_id).map((lm, idx) => ({
          landmark_id: lm.landmark_id,
          visitTime: lm.visitTime,
          notes: lm.notes,
          order: idx + 1
        }))
      })),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Itineraries</h2>
          <p className="text-xs text-gray-500">Add, edit, search, and delete curated itineraries.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search itineraries..."
              value={search}
              onChange={(e) => {
                if (/^[a-zA-Z\s]*$/.test(e.target.value)) {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }
              }}
              className="pl-9 w-full p-2.5 border border-gray-300 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <button
            onClick={() => {
              if (showAddForm) resetForm();
              else setShowAddForm(true);
            }}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1 shadow shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Cancel' : 'Add Itinerary'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {successMsg}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-[#fdfbf7] rounded overflow-hidden shadow-2xl w-full max-w-4xl border-[3px] border-[#b89047] text-left flex flex-col max-h-[95vh]"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#b89047]/30 px-6 py-4 bg-[#fdfbf7]">
              <h3 className="font-serif text-lg text-gray-800">
                Stepped Itinerary Editor V2 {title ? `- ${title}` : ''}
              </h3>
              <button type="button" onClick={resetForm} className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none">&times;</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs text-center border-b border-red-100">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-1 overflow-hidden bg-[#fdfbf7]">
              {/* LEFT SIDEBAR: STEPPER */}
              <div className="w-40 shrink-0 border-r border-[#b89047]/30 flex flex-col items-center py-8 space-y-0">
                {/* Step 0: General Info */}
                <button type="button" onClick={() => setCurrentStep(0)} className="flex flex-col items-center group focus:outline-none">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${currentStep === 0 ? 'bg-[#b89047] text-white border-[#b89047]' : currentStep > 0 ? 'bg-[#b89047] text-white border-[#b89047]' : 'border-[#b89047] text-[#b89047] bg-transparent'}`}>
                    {currentStep > 0 ? <Check className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-serif transition-colors ${currentStep === 0 ? 'text-[#b89047] font-bold' : 'text-[#b89047]'}`}>General Info</span>
                </button>
                <div className={`w-px h-16 my-2 ${currentStep > 0 ? 'bg-[#b89047]' : 'bg-[#b89047]/30'}`}></div>

                {/* Step 1: Schedule */}
                <button type="button" onClick={() => setCurrentStep(1)} className="flex flex-col items-center group focus:outline-none">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${currentStep === 1 ? 'bg-[#b89047] text-white border-[#b89047]' : currentStep > 1 ? 'bg-[#b89047] text-white border-[#b89047]' : 'border-[#b89047] text-[#b89047] bg-transparent'}`}>
                    {currentStep > 1 ? <Check className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-serif transition-colors ${currentStep === 1 ? 'text-[#b89047] font-bold' : 'text-[#b89047]'}`}>Schedule</span>
                </button>
                <div className={`w-px h-16 my-2 ${currentStep > 1 ? 'bg-[#b89047]' : 'bg-[#b89047]/30'}`}></div>

                {/* Step 2: Logistics */}
                <button type="button" onClick={() => setCurrentStep(2)} className="flex flex-col items-center group focus:outline-none">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${currentStep === 2 ? 'bg-[#b89047] text-white border-[#b89047]' : 'border-[#b89047] text-[#b89047] bg-transparent'}`}>
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <span className={`text-xs mt-2 font-serif transition-colors ${currentStep === 2 ? 'text-[#b89047] font-bold' : 'text-[#b89047]'}`}>Logistics</span>
                </button>
              </div>

              {/* RIGHT CONTENT */}
              <div className="flex-1 p-6 overflow-y-auto bg-[#fdfbf7] border-[1px] border-[#d9cbb2] m-2">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-gray-800">General Info</h4>

                    <div>
                      <label className="block text-[11px] text-gray-800">Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={handleTitleChange}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                        placeholder="Islamic Cairo Deep Dive"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-800">Slug Identifier</label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => {
                          if (/^[a-z0-9-]*$/.test(e.target.value)) {
                            setSlug(e.target.value);
                          }
                        }}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                        placeholder="islamic-cairo-deep-dive"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-800">Budget Tier</label>
                      <select
                        required
                        value={budgetTier}
                        onChange={(e) => setBudgetTier(e.target.value)}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      >
                        <option value="budget">Budget</option>
                        <option value="standard">Standard</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-[11px] text-gray-800">Total Budget (EGP)</label>
                        <input
                          type="number"
                          disabled
                          value={totalBudget}
                          onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                          className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[11px] text-gray-800">Duration (Days)</label>
                        <input
                          type="number"
                          disabled
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                          className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] text-gray-500 cursor-not-allowed focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-800">File Uploader</label>
                      <div className="mt-1 flex flex-col gap-2 border border-[#d9cbb2] rounded p-3 bg-white">
                        <div className="flex items-center gap-4">
                          <label className="bg-[#b89047] text-white px-4 py-2 rounded text-xs cursor-pointer hover:bg-[#a07c3c] transition-colors shadow">
                            Choose File
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-xs text-gray-800">{imageUploading ? 'Uploading...' : imageCover ? 'File chosen' : 'No file chosen'}</span>
                          {imageUploading && <Loader2 className="animate-spin text-[#b89047] h-4 w-4" />}
                        </div>
                        {imageCover && (
                          <div className="mt-2 bg-[#fdfbf7] p-3 rounded flex items-start gap-3 w-full border border-[#d9cbb2]/50">
                            <div className="relative">
                              <img
                                src={imageCover}
                                alt="Preview"
                                className="h-16 w-16 object-cover rounded shadow-sm border border-[#d9cbb2]"
                              />
                              <button
                                type="button"
                                onClick={() => setImageCover('')}
                                className="absolute -top-2 -right-2 bg-[#b89047] text-white rounded-full p-1 hover:bg-[#a07c3c] shadow"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-800">Description</label>
                      <textarea
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="mt-1 w-full p-3 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                        placeholder="Two days lost in the labyrinthine medieval streets..."
                      ></textarea>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2">
                      <h4 className="font-serif text-lg text-gray-800">Schedule</h4>
                      <button
                        type="button"
                        onClick={addDay}
                        className="text-[10px] bg-[#b89047] text-white px-3 py-1.5 rounded font-bold hover:bg-[#a07c3c] flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Plus className="h-3 w-3" /> Add Day
                      </button>
                    </div>

                    <div className="space-y-3">
                      {schedule.map((day, dIdx) => (
                        <div key={dIdx} className="bg-white border border-[#d9cbb2] rounded-lg overflow-hidden shadow-sm">
                          <div
                            className="bg-[#fdfbf7] px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-[#f4ebd9]/50 transition-colors border-b border-[#d9cbb2]/50"
                            onClick={() => toggleDay(dIdx)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="bg-[#b89047] text-white text-xs font-bold px-2 py-0.5 rounded">Day {day.day}</span>
                              <span className="text-xs text-gray-800 truncate max-w-[200px]">{day.description || 'No description...'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeDay(dIdx); }}
                                className="text-[#b89047] hover:text-red-500 p-1 rounded-full transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                              {expandedDays[dIdx] ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                            </div>
                          </div>

                          {expandedDays[dIdx] && (
                            <div className="p-4 space-y-4 bg-white">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] text-gray-500">Day Description</label>
                                  <textarea
                                    rows={2}
                                    value={day.description}
                                    onChange={(e) => updateDay(dIdx, 'description', e.target.value)}
                                    className="w-full p-2 border border-[#d9cbb2] rounded text-xs focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                                  ></textarea>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] text-gray-500">Day Background Image</label>
                                  <div className="mt-1 flex flex-col gap-2 border border-[#d9cbb2] rounded p-2 bg-[#fdfbf7]">
                                    <div className="flex items-center gap-4">
                                      <label className="bg-[#b89047] text-white px-3 py-1.5 rounded text-[10px] cursor-pointer hover:bg-[#a07c3c] transition-colors shadow-sm">
                                        Upload Image
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleDayImageUpload(e, dIdx)}
                                          className="hidden"
                                        />
                                      </label>
                                      <span className="text-[10px] text-gray-500">
                                        {dayUploading[dIdx] ? 'Uploading...' : day.image ? 'Image uploaded' : 'Optional day background'}
                                      </span>
                                      {dayUploading[dIdx] && <Loader2 className="animate-spin text-[#b89047] h-3 w-3" />}
                                    </div>
                                    {day.image && (
                                      <div className="mt-2 relative inline-block">
                                        <img
                                          src={day.image}
                                          alt={`Day ${day.day}`}
                                          className="h-12 w-20 object-cover rounded shadow border border-[#d9cbb2]"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => updateDay(dIdx, 'image', '')}
                                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                                        >
                                          <Trash2 className="h-2.5 w-2.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500">Overnight Hotel</label>
                                  <div className="relative">
                                    <Building className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                                    <select
                                      value={day.hotel}
                                      onChange={(e) => updateDay(dIdx, 'hotel', e.target.value)}
                                      className="w-full p-2 pl-8 border border-[#d9cbb2] rounded text-xs focus:ring-1 focus:ring-[#b89047] focus:outline-none bg-white"
                                    >
                                      <option value="">No Hotel Scheduled</option>
                                      {availableHotels.map(h => (
                                        <option key={h._id} value={h._id}>{h.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-gray-500">Meals Included</label>
                                  <input
                                    type="text"
                                    value={day.meals}
                                    onChange={(e) => updateDay(dIdx, 'meals', e.target.value)}
                                    className="w-full p-2 border border-[#d9cbb2] rounded text-xs focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                                  />
                                </div>
                              </div>

                              <div className="bg-[#fdfbf7] p-3 rounded-lg border border-[#d9cbb2] space-y-3">
                                <div className="flex justify-between items-center">
                                  <label className="block text-[10px] font-bold text-[#b89047]">Scheduled Landmarks</label>
                                  <button
                                    type="button"
                                    onClick={() => addDayLandmark(dIdx)}
                                    className="text-[10px] text-[#b89047] hover:underline flex items-center"
                                  >
                                    <Plus className="h-3 w-3 mr-0.5" /> Add Landmark
                                  </button>
                                </div>

                                <div className="space-y-2">
                                  {day.landmarks.map((lm, lmIdx) => (
                                    <div key={lmIdx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2 rounded border border-[#d9cbb2]">
                                      <div className="flex-1 w-full relative">
                                        <MapPin className="absolute left-2 top-2 h-3.5 w-3.5 text-gray-400" />
                                        <select
                                          value={lm.landmark_id}
                                          onChange={(e) => updateDayLandmark(dIdx, lmIdx, 'landmark_id', e.target.value)}
                                          className="w-full p-1.5 pl-7 border border-[#d9cbb2] rounded text-[10px] focus:ring-1 focus:ring-[#b89047] focus:outline-none bg-white"
                                        >
                                          <option value="">Select a Landmark...</option>
                                          {availableLandmarks.map(l => (
                                            <option key={l._id} value={l._id}>{l.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <input
                                        type="text"
                                        value={lm.visitTime}
                                        onChange={(e) => updateDayLandmark(dIdx, lmIdx, 'visitTime', e.target.value)}
                                        className="w-full sm:w-24 p-1.5 border border-[#d9cbb2] rounded text-[10px] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                                        placeholder="Time"
                                      />
                                      <input
                                        type="text"
                                        value={lm.notes}
                                        onChange={(e) => updateDayLandmark(dIdx, lmIdx, 'notes', e.target.value)}
                                        className="w-full sm:w-40 p-1.5 border border-[#d9cbb2] rounded text-[10px] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                                        placeholder="Notes..."
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeDayLandmark(dIdx, lmIdx)}
                                        className="text-gray-400 hover:text-red-500 p-1"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                  {day.landmarks.length === 0 && (
                                    <div className="text-[10px] text-gray-400 italic">No landmarks scheduled.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {schedule.length === 0 && (
                        <div className="text-xs text-gray-400 italic text-center py-4 border border-dashed rounded-xl border-[#d9cbb2]">
                          No days added yet. Start building the itinerary schedule!
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="font-serif text-lg text-gray-800 pb-2">Logistics</h4>

                    <div>
                      <label className="block text-[11px] text-gray-800">Highlights (Comma Separated)</label>
                      <input
                        type="text"
                        value={highlightsStr}
                        onChange={(e) => {
                          if (/^[a-zA-Z0-9\s,-]*$/.test(e.target.value)) {
                            setHighlightsStr(e.target.value);
                          }
                        }}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-800">Includes (Comma Separated)</label>
                      <input
                        type="text"
                        value={includesStr}
                        onChange={(e) => {
                          if (/^[a-zA-Z0-9\s,-]*$/.test(e.target.value)) {
                            setIncludesStr(e.target.value);
                          }
                        }}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-800">Not Includes (Comma Separated)</label>
                      <input
                        type="text"
                        value={notIncludesStr}
                        onChange={(e) => {
                          if (/^[a-zA-Z0-9\s,-]*$/.test(e.target.value)) {
                            setNotIncludesStr(e.target.value);
                          }
                        }}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-800">Travel Tips (Comma Separated)</label>
                      <input
                        type="text"
                        value={tipsStr}
                        onChange={(e) => {
                          if (/^[a-zA-Z0-9\s,-]*$/.test(e.target.value)) {
                            setTipsStr(e.target.value);
                          }
                        }}
                        className="mt-1 w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end border-t border-[#b89047]/30 px-6 py-4 bg-[#fdfbf7]">
              <button
                type="button"
                onClick={resetForm}
                className="border-2 border-gray-800 text-gray-800 font-bold py-2 px-6 rounded-lg text-xs hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-[#b89047] hover:bg-[#a07c3c] text-white font-bold py-2 px-6 rounded-lg text-xs shadow transition-colors"
              >
                {editingId ? 'Update Itinerary' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredItineraries.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No itineraries matched your criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Duration/Budget</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentItineraries.map((i) => (
                <tr key={i._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {i.imageCover ? (
                      <img
                        src={i.imageCover}
                        alt={i.title}
                        className="h-10 w-16 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="h-10 w-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-[10px]">No Img</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-navy-900">{i.title}</div>
                    <div className="text-[10px] text-gray-400">{i.slug}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded font-bold text-[10px] ${i.budgetTier === 'luxury' ? 'bg-purple-100 text-purple-700' :
                        i.budgetTier === 'standard' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                      }`}>
                      {i.budgetTier.charAt(0).toUpperCase() + i.budgetTier.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-navy-900 font-bold">{i.totalBudget} EGP</div>
                    <div className="text-gray-500 text-[10px]">{i.duration} Days</div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleEditClick(i)}
                      className="text-navy-500 hover:bg-navy-50 p-1.5 rounded"
                      title="Edit Itinerary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: i._id, title: i.title })}
                      className="text-red-500 hover:bg-red-50 p-1.5 rounded"
                      title="Delete Itinerary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    Showing <span className="font-bold text-navy-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-navy-900">{Math.min(indexOfLastItem, filteredItineraries.length)}</span> of <span className="font-bold text-navy-900">{filteredItineraries.length}</span> entries
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex space-x-2" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold text-navy-900 border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white shadow-sm transition-colors"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <h3 className="text-lg font-serif font-bold text-navy-500">Confirm Deletion</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to delete <span className="font-bold text-navy-900">"{confirmDelete.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="bg-gray-100 hover:bg-gray-200 text-navy-500 font-bold py-2 px-6 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg text-xs shadow"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
