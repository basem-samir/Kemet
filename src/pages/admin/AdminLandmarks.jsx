import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { landmarksAPI, governoratesAPI, adminAPI } from '../../api/endpoints';
import { Plus, Trash2, Edit2, Loader2, Search, AlertCircle, Info, MapPin, List, UploadCloud, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  'historical', 'pharaonic', 'islamic', 'coptic', 'museum',
  'beach', 'resort', 'temple', 'nature', 'eco_nature',
  'religious', 'desert_safari', 'medical', 'adventure'
];

export default function AdminLandmarks() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [confirmDeleteLandmark, setConfirmDeleteLandmark] = useState(null); // { id: string, name: string }

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Form states
  const [name, setName] = useState('');
  const [govId, setGovId] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPrice, setTicketPrice] = useState(10);
  const [category, setCategory] = useState('historical');
  const [workingHours, setWorkingHours] = useState('09:00 AM - 05:00 PM');
  const [bestTimeToVisit, setBestTimeToVisit] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageUpload = async (e, type, index = null) => {
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
        if (type === 'cover') {
          setCoverImage(url);
        } else if (type === 'gallery') {
          if (index !== null) {
            const newGallery = [...galleryImages];
            newGallery[index] = url;
            setGalleryImages(newGallery);
          } else {
            setGalleryImages([...galleryImages, url]);
          }
        }
      } else {
        throw new Error('Image URL was not returned.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload image.');
    } finally {
      setImageUploading(false);
    }
  };

  const addGalleryImageInput = () => {
    setGalleryImages([...galleryImages, '']);
  };

  const removeGalleryImage = (idx) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== idx));
  };
  const [coordinatesStr, setCoordinatesStr] = useState('31.233, 30.044'); // default Cairo lng, lat

  useEffect(() => {
    if (!showAddForm || activeStep !== 2 || !mapContainerRef.current) return;

    let isMounted = true;
    
    const initMap = async () => {
      const L = await import('leaflet');
      
      if (!isMounted) return;

      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      let lat = 30.044;
      let lng = 31.233;
      if (coordinatesStr) {
        const parts = coordinatesStr.split(',').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          lng = parts[0];
          lat = parts[1];
        }
      }

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current).setView([lat, lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
        }).addTo(mapInstanceRef.current);

        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
        
        markerRef.current.on('dragend', (e) => {
          const position = e.target.getLatLng();
          setCoordinatesStr(`${position.lng.toFixed(6)}, ${position.lat.toFixed(6)}`);
        });

        mapInstanceRef.current.on('click', (e) => {
          const { lat, lng } = e.latlng;
          markerRef.current.setLatLng([lat, lng]);
          setCoordinatesStr(`${lng.toFixed(6)}, ${lat.toFixed(6)}`);
        });
      } else {
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      }
    };

    // Small delay to ensure container is fully rendered in modal before init
    setTimeout(initMap, 100);

    return () => {
      isMounted = false;
    };
  }, [showAddForm, coordinatesStr, activeStep]);

  // Clean up map when form closes
  useEffect(() => {
    if ((!showAddForm || activeStep !== 2) && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }
  }, [showAddForm, activeStep]);

  // Queries
  const { data: govData } = useQuery({
    queryKey: ['adminGovernorates'],
    queryFn: () => governoratesAPI.getAll({ limit: 1000 }),
  });

  const governorates = govData?.data?.data?.governorates || govData?.data?.governorates || [];

  const { data: landmarksData, isLoading } = useQuery({
    queryKey: ['adminLandmarks'],
    queryFn: () => landmarksAPI.getAll({ limit: 1000 }),
  });

  const landmarks = landmarksData?.data?.data?.landmarks || landmarksData?.data?.landmarks || [];

  // Filter list
  const filteredLandmarks = landmarks.filter((l) => {
    const term = search.toLowerCase();
    return l.name.toLowerCase().includes(term) ||
      l.category.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term);
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredLandmarks.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLandmarks = filteredLandmarks.slice(indexOfFirstItem, indexOfLastItem);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data) => landmarksAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLandmarks'] });
      setSuccessMsg('Landmark created successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create landmark.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => landmarksAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLandmarks'] });
      setSuccessMsg('Landmark updated successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3000);
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || 'Failed to update landmark.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => landmarksAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLandmarks'] });
      setSuccessMsg('Landmark deleted successfully.');
      setConfirmDeleteLandmark(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    },
  });

  const resetForm = () => {
    setName('');
    setGovId('');
    setDescription('');
    setTicketPrice(10);
    setCategory('historical');
    setWorkingHours('09:00 AM - 05:00 PM');
    setBestTimeToVisit('');
    setCoverImage('');
    setGalleryImages([]);
    setCoordinatesStr('31.233, 30.044');
    setShowAddForm(false);
    setEditingId(null);
    setActiveStep(1);
  };

  const handleEditClick = (l) => {
    setEditingId(l._id);
    setName(l.name);
    setGovId(l.governorate_id?._id || l.governorate_id || '');
    setDescription(l.description);
    setTicketPrice(l.ticketPrice);
    setCategory(l.category);
    setWorkingHours(l.workingHours);
    setBestTimeToVisit(l.bestTimeToVisit);
    setCoverImage(l.images?.[0] || '');
    setGalleryImages(l.images?.slice(1) || []);
    if (l.location?.coordinates?.length === 2) {
      setCoordinatesStr(`${l.location.coordinates[0]}, ${l.location.coordinates[1]}`);
    }
    setActiveStep(1);
    setShowAddForm(true);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !govId || !description || !coverImage) {
      setErrorMsg('Please populate name, governorate, description, and cover image link.');
      return;
    }

    const parts = coordinatesStr.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) {
      setErrorMsg('Please enter valid coordinates as "Longitude, Latitude" (e.g. 31.23, 30.04).');
      return;
    }

    const payload = {
      name,
      governorate_id: govId,
      description,
      images: [coverImage, ...galleryImages.filter(img => img && img.trim() !== '')],
      ticketPrice: parseFloat(ticketPrice),
      workingHours,
      bestTimeToVisit,
      category,
      location: {
        type: 'Point',
        coordinates: parts, // [lng, lat]
      }
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
          <h2 className="text-2xl font-serif font-bold text-navy-500">Manage Landmarks</h2>
          <p className="text-xs text-gray-500">Add, edit, search, and delete landmarks.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search landmarks..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 w-full p-2.5 border border-gray-300 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <button
            onClick={() => {
              if (showAddForm) {
                resetForm();
              } else {
                setShowAddForm(true);
              }
            }}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-4 py-2 rounded-lg text-xs flex items-center space-x-1 shadow shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddForm ? 'Cancel' : 'Add Landmark'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
          {successMsg}
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form 
            onSubmit={handleSubmit} 
            className="bg-[#fdfbf7] rounded-xl w-full max-w-2xl overflow-hidden border-[3px] border-[#b89047] shadow-2xl flex flex-col max-h-[90vh] text-left"
          >
            {/* Header & Stepper */}
            <div className="p-6 pb-0 border-b border-[#d9cbb2]/40">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif text-2xl text-gray-800">
                  {editingId ? 'Edit Landmark' : 'Register New Landmark'}
                </h3>
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Stepper Tabs */}
              <div className="flex bg-[#f3ecd8] rounded-full p-1 mb-6 border border-[#d9cbb2]">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all ${activeStep === 1 ? 'bg-gradient-to-r from-[#b89047] to-[#8a682b] text-white shadow' : 'text-gray-600 hover:text-[#b89047]'}`}
                >
                  <Info className="h-4 w-4" /> Basic Info
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all ${activeStep === 2 ? 'bg-gradient-to-r from-[#b89047] to-[#8a682b] text-white shadow' : 'text-gray-600 hover:text-[#b89047]'}`}
                >
                  <MapPin className="h-4 w-4" /> Location & Media
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full flex items-center justify-center gap-2 transition-all ${activeStep === 3 ? 'bg-gradient-to-r from-[#b89047] to-[#8a682b] text-white shadow' : 'text-gray-600 hover:text-[#b89047]'}`}
                >
                  <List className="h-4 w-4" /> Details
                </button>
              </div>
              
              {errorMsg && (
                <div className="mb-4 text-xs text-red-700 bg-red-50 p-2.5 rounded border border-red-200">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* STEP 1: Basic Info */}
              {activeStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Landmark Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      placeholder="e.g. Karnak Temple"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Governorate</label>
                    <select
                      required
                      value={govId}
                      onChange={(e) => setGovId(e.target.value)}
                      className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                    >
                      <option value="">-- Select Governorate --</option>
                      {governorates.map((g) => (
                        <option key={g._id} value={g._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Ticket Price (EGP)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Working Hours</label>
                    <input
                      type="text"
                      required
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      placeholder="e.g. 09:00 AM - 05:00 PM"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Best Time to Visit</label>
                    <input
                      type="text"
                      value={bestTimeToVisit}
                      onChange={(e) => setBestTimeToVisit(e.target.value)}
                      className="w-full p-2 border border-[#d9cbb2] rounded text-xs bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none"
                      placeholder="e.g. Oct - Apr"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Location & Media */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  {/* Map */}
                  <div className="w-full">
                    <div 
                      ref={mapContainerRef} 
                      className="w-full h-56 rounded-lg border border-[#b89047] shadow-md z-10 relative"
                    ></div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">Click on the map or drag the marker to set coordinates automatically.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Cover Image Upload */}
                    <div>
                      <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Cover Image</label>
                      <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#b89047] bg-gradient-to-b from-[#fdfbf7] to-[#f3ecd8] rounded-lg cursor-pointer hover:border-[#8a682b] transition shadow-sm overflow-hidden group">
                        {imageUploading && !coverImage ? (
                          <Loader2 className="animate-spin text-[#b89047] h-6 w-6" />
                        ) : coverImage ? (
                           <>
                             <img src={coverImage} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <UploadCloud className="h-8 w-8 text-white drop-shadow-md" />
                             </div>
                           </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-[#b89047]">
                            <UploadCloud className="h-6 w-6 mb-2" />
                            <p className="text-[10px] text-center px-4">Drag & Drop or Click to Upload Cover Image</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
                      </label>
                      {coverImage && (
                        <div className="flex justify-end mt-1">
                          <button type="button" onClick={() => setCoverImage('')} className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1">
                            <Trash2 className="h-3 w-3" /> Remove Cover
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Coordinates */}
                    <div>
                      <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Coordinates (LNG, LAT)</label>
                      <div className="flex bg-[#fdfbf7] border border-[#d9cbb2] rounded overflow-hidden shadow-sm">
                        <div className="bg-[#f3ecd8] p-2 border-r border-[#d9cbb2] flex items-center justify-center text-[#b89047]">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={coordinatesStr}
                          onChange={(e) => setCoordinatesStr(e.target.value)}
                          className="w-full p-2 text-xs bg-transparent focus:outline-none"
                          placeholder="31.233, 30.044"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-[11px] font-serif text-gray-800 uppercase tracking-widest">Gallery Images</label>
                      <button
                        type="button"
                        onClick={addGalleryImageInput}
                        className="text-[10px] text-[#b89047] font-bold hover:text-[#8a682b] flex items-center gap-1 transition"
                      >
                        <Plus className="h-3 w-3" /> Add Image Box
                      </button>
                    </div>
                    
                    <div className="border border-dashed border-[#b89047] bg-[#fdfbf7] rounded-lg p-4 min-h-[120px]">
                      {galleryImages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-[#b89047] py-4">
                          <div className="flex gap-1 mb-2">
                            <ImageIcon className="h-6 w-6 opacity-70" />
                            <ImageIcon className="h-8 w-8" />
                            <ImageIcon className="h-6 w-6 opacity-70" />
                          </div>
                          <p className="text-[10px] text-center max-w-[200px]">Drag & Drop Images or Click 'Add Image Box' above for Visual Showcase.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {galleryImages.map((imgUrl, idx) => (
                            <div key={idx} className="flex flex-col gap-2 p-2 bg-white border border-[#d9cbb2] rounded shadow-sm relative group">
                              {imgUrl ? (
                                <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-24 object-cover rounded border border-[#d9cbb2]/50" />
                              ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-[#b89047]/50 rounded cursor-pointer hover:bg-[#f3ecd8] transition">
                                  <UploadCloud className="h-5 w-5 text-[#b89047] mb-1" />
                                  <span className="text-[9px] text-[#b89047]">Upload Image</span>
                                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'gallery', idx)} className="hidden" />
                                </label>
                              )}
                              <input
                                type="text"
                                value={imgUrl}
                                onChange={(e) => {
                                  const newGallery = [...galleryImages];
                                  newGallery[idx] = e.target.value;
                                  setGalleryImages(newGallery);
                                }}
                                placeholder="Or image URL..."
                                className="w-full p-1.5 text-[10px] border border-[#d9cbb2] rounded bg-[#fdfbf7] focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Details */}
              {activeStep === 3 && (
                <div className="h-full flex flex-col">
                  <label className="block text-[11px] font-serif text-gray-800 mb-1 uppercase tracking-widest">Description</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 min-h-[250px] w-full p-3 border border-[#d9cbb2] rounded text-sm bg-[#fdfbf7] focus:ring-1 focus:ring-[#b89047] focus:outline-none shadow-sm"
                    placeholder="Provide a detailed historic background, architectural details, and significance..."
                  ></textarea>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-[#d9cbb2]/40 bg-[#fdfbf7] flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={resetForm}
                className="bg-transparent border border-[#d9cbb2] text-gray-600 font-bold py-2 px-6 rounded-full text-xs hover:bg-[#f3ecd8] transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-[#b89047] to-[#8a682b] text-white font-bold py-2 px-6 rounded-full text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {editingId ? 'Update Landmark' : 'Save Landmark'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
        </div>
      ) : filteredLandmarks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed text-xs text-gray-400">
          No landmarks matched your criteria.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-500 text-white font-serif uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
              {currentLandmarks.map((l) => (
                <tr key={l._id} className="hover:bg-sand-50/50 transition">
                  <td className="px-6 py-4">
                    <img src={l.images?.[0]} alt={l.name} className="h-10 w-16 object-cover rounded shadow-sm bg-gray-100" />
                  </td>
                  <td className="px-6 py-4 font-semibold text-navy-500">{l.name}</td>
                  <td className="px-6 py-4 capitalize">{l.category}</td>
                  <td className="px-6 py-4 font-bold text-gold-600">${l.ticketPrice}</td>
                  <td className="px-6 py-4 text-right space-x-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(l)}
                      className="bg-gold-50 hover:bg-gold-100 text-gold-600 border border-gold-300/40 p-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow hover:shadow-gold-500/10"
                      title="Edit (Ankh of Transformation)"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 10C14.2 10 16 8.2 16 6C16 3.8 14.2 2 12 2C9.8 2 8 3.8 8 6C8 8.2 9.8 10 12 10Z" />
                        <path d="M6 12H18" />
                        <path d="M12 12V22" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteLandmark({ id: l._id, name: l.name })}
                      disabled={deleteMutation.isPending}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow hover:shadow-red-500/10"
                      title="Delete (Anubis Jackal Profile)"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 2L10 9H14L15 2" />
                        <path d="M7 10L5 14H19L17 10H7Z" />
                        <path d="M9 14V19L12 21L15 19V14" />
                        <path d="M7 16H17" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white border-t border-gray-200 px-6 py-4">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-semibold text-navy-500">{indexOfFirstItem + 1}</span> to{' '}
                <span className="font-semibold text-navy-500">
                  {Math.min(indexOfLastItem, filteredLandmarks.length)}
                </span>{' '}
                of <span className="font-semibold text-navy-500">{filteredLandmarks.length}</span> entries
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Previous
                </button>
                <button
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border bg-white disabled:opacity-50 text-xs font-bold text-navy-500 transition hover:bg-gold-500 hover:text-navy-955"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {confirmDeleteLandmark && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gold-500/20 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200 text-left">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="font-serif font-bold text-navy-500 text-base">Delete Landmark</h4>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Are you sure you want to permanently delete landmark <strong>{confirmDeleteLandmark.name}</strong>? This action cannot be undone and will remove all corresponding references.
            </p>
            <div className="flex space-x-3 justify-end text-xs pt-2">
              <button
                onClick={() => setConfirmDeleteLandmark(null)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(confirmDeleteLandmark.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition flex items-center space-x-1"
              >
                {deleteMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
