import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const REGIONS = [
  { id: 'cairo', name: 'القاهرة', nameEn: 'Cairo', lat: 30.0444, lng: 31.2357, zoom: 11, bbox: [[29.9, 31.1], [30.2, 31.4]] },
  { id: 'alex', name: 'الإسكندرية', nameEn: 'Alexandria', lat: 31.2001, lng: 29.9187, zoom: 11, bbox: [[31.0, 29.7], [31.4, 30.1]] },
  { id: 'giza', name: 'الجيزة', nameEn: 'Giza', lat: 30.0131, lng: 31.2089, zoom: 10, bbox: [[29.8, 31.0], [30.2, 31.4]] },
  { id: 'luxor', name: 'الأقصر', nameEn: 'Luxor', lat: 25.6872, lng: 32.6396, zoom: 12, bbox: [[25.5, 32.5], [25.9, 32.8]] },
  { id: 'aswan', name: 'أسوان', nameEn: 'Aswan', lat: 24.0889, lng: 32.8998, zoom: 11, bbox: [[23.9, 32.7], [24.3, 33.1]] },
  { id: 'redsea', name: 'البحر الأحمر', nameEn: 'Red Sea', lat: 25.5925, lng: 33.6828, zoom: 8, bbox: [[22.0, 32.0], [28.0, 37.0]] },
  { id: 'ssinai', name: 'جنوب سيناء', nameEn: 'South Sinai', lat: 28.5358, lng: 33.9750, zoom: 9, bbox: [[27.7, 32.8], [29.5, 35.0]] },
  { id: 'nsinai', name: 'شمال سيناء', nameEn: 'North Sinai', lat: 30.8768, lng: 33.7996, zoom: 9, bbox: [[29.8, 32.5], [31.3, 34.8]] },
  { id: 'matrouh', name: 'مطروح', nameEn: 'Matrouh', lat: 29.5696, lng: 27.2453, zoom: 8, bbox: [[28.5, 25.0], [31.5, 29.5]] },
  { id: 'ismailia', name: 'الإسماعيلية', nameEn: 'Ismailia', lat: 30.5965, lng: 32.2715, zoom: 11, bbox: [[30.4, 32.1], [30.8, 32.5]] },
  { id: 'suez', name: 'السويس', nameEn: 'Suez', lat: 29.9668, lng: 32.5498, zoom: 11, bbox: [[29.7, 32.3], [30.2, 32.8]] },
  { id: 'portsaid', name: 'بورسعيد', nameEn: 'Port Said', lat: 31.2565, lng: 32.2841, zoom: 12, bbox: [[31.1, 32.1], [31.4, 32.4]] },
  { id: 'damietta', name: 'دمياط', nameEn: 'Damietta', lat: 31.4165, lng: 31.8133, zoom: 12, bbox: [[31.3, 31.6], [31.5, 32.0]] },
  { id: 'dakahlia', name: 'الدقهلية', nameEn: 'Dakahlia', lat: 31.0413, lng: 31.3785, zoom: 11, bbox: [[30.8, 31.1], [31.3, 31.6]] },
  { id: 'sharkia', name: 'الشرقية', nameEn: 'Sharkia', lat: 30.7326, lng: 31.7136, zoom: 10, bbox: [[30.4, 31.3], [31.0, 32.0]] },
  { id: 'qalyubia', name: 'القليوبية', nameEn: 'Qalyubia', lat: 30.4100, lng: 31.1850, zoom: 11, bbox: [[30.2, 31.0], [30.6, 31.3]] },
  { id: 'gharbia', name: 'الغربية', nameEn: 'Gharbia', lat: 30.7865, lng: 31.0004, zoom: 11, bbox: [[30.6, 30.8], [30.9, 31.2]] },
  { id: 'monufia', name: 'المنوفية', nameEn: 'Monufia', lat: 30.5242, lng: 30.9919, zoom: 11, bbox: [[30.3, 30.8], [30.7, 31.2]] },
  { id: 'beheira', name: 'البحيرة', nameEn: 'Beheira', lat: 31.0371, lng: 30.4722, zoom: 10, bbox: [[30.5, 30.0], [31.3, 30.8]] },
  { id: 'kafrsheikh', name: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', lat: 31.1107, lng: 30.9388, zoom: 11, bbox: [[30.9, 30.7], [31.3, 31.2]] },
  { id: 'fayoum', name: 'الفيوم', nameEn: 'Fayoum', lat: 29.3084, lng: 30.8428, zoom: 11, bbox: [[29.1, 30.6], [29.5, 31.0]] },
  { id: 'benisuef', name: 'بني سويف', nameEn: 'Beni Suef', lat: 29.0731, lng: 31.0979, zoom: 11, bbox: [[28.9, 30.9], [29.3, 31.3]] },
  { id: 'minya', name: 'المنيا', nameEn: 'Minya', lat: 28.0871, lng: 30.7618, zoom: 10, bbox: [[27.8, 30.5], [28.4, 31.0]] },
  { id: 'assiut', name: 'أسيوط', nameEn: 'Assiut', lat: 27.1783, lng: 31.1859, zoom: 10, bbox: [[26.9, 30.9], [27.4, 31.4]] },
  { id: 'sohag', name: 'سوهاج', nameEn: 'Sohag', lat: 26.5590, lng: 31.6948, zoom: 10, bbox: [[26.3, 31.4], [26.8, 31.9]] },
  { id: 'qena', name: 'قنا', nameEn: 'Qena', lat: 26.1551, lng: 32.7160, zoom: 10, bbox: [[25.9, 32.4], [26.4, 32.9]] },
  { id: 'newvalley', name: 'الوادي الجديد', nameEn: 'New Valley', lat: 25.4413, lng: 30.5516, zoom: 8, bbox: [[22.0, 27.0], [28.0, 33.0]] }
];

const FALLBACK_LANDMARKS = {
  Cairo: [
    { _id: '1', name: 'Great Pyramids of Giza', slug: 'pyramids-giza', category: 'pharaonic', location: { coordinates: [31.1342, 29.9792] }, images: ['https://images.unsplash.com/photo-1539650116574-8efeb43e2750'], ticketPrice: 20, averageRating: 4.9, address: 'Al Haram, Giza', workingHours: '08:00 AM - 05:00 PM' },
    { _id: '2', name: 'The Egyptian Museum', slug: 'egyptian-museum', category: 'museum', location: { coordinates: [31.2336, 30.0478] }, images: ['https://images.unsplash.com/photo-1544013919-4b4b45bc79cc'], ticketPrice: 15, averageRating: 4.7, address: 'Tahrir Square, Cairo', workingHours: '09:00 AM - 07:00 PM' },
    { _id: '3', name: 'Al-Azhar Mosque', slug: 'al-azhar-mosque', category: 'islamic', location: { coordinates: [31.2626, 30.0457] }, images: [], ticketPrice: 0, averageRating: 4.8, address: 'El-Darb El-Ahmar, Cairo', workingHours: '24 Hours' }
  ],
  Alexandria: [
    { _id: '4', name: 'Citadel of Qaitbay', slug: 'qaitbay-citadel', category: 'islamic', location: { coordinates: [29.8822, 31.2140] }, images: [], ticketPrice: 10, averageRating: 4.6, address: 'As Sayalah Sharq, Alexandria', workingHours: '09:00 AM - 05:00 PM' },
    { _id: '5', name: 'Bibliotheca Alexandrina', slug: 'alexandria-library', category: 'museum', location: { coordinates: [29.9092, 31.2089] }, images: [], ticketPrice: 8, averageRating: 4.8, address: 'Al Azaritah, Alexandria', workingHours: '09:00 AM - 04:00 PM' }
  ],
  Luxor: [
    { _id: '6', name: 'Karnak Temple', slug: 'karnak-temple', category: 'temple', location: { coordinates: [32.6586, 25.7188] }, images: [], ticketPrice: 25, averageRating: 4.9, address: 'Karnak, Luxor', workingHours: '06:00 AM - 05:30 PM' },
    { _id: '7', name: 'Valley of the Kings', slug: 'valley-kings', category: 'pharaonic', location: { coordinates: [32.6018, 25.7401] }, images: [], ticketPrice: 30, averageRating: 4.9, address: 'West Bank, Luxor', workingHours: '06:00 AM - 04:00 PM' }
  ]
};

const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '🏺', color: '#C9963B' },
  { value: 'pharaonic', label: 'Pharaonic', emoji: '👑', color: '#ffb300' },
  { value: 'islamic', label: 'Islamic', emoji: '🕌', color: '#2e7d32' },
  { value: 'coptic', label: 'Coptic', emoji: '⛪', color: '#1565c0' },
  { value: 'temple', label: 'Temples', emoji: '🏛️', color: '#d84315' },
  { value: 'museum', label: 'Museums', emoji: '🖼️', color: '#6a1b9a' },
  { value: 'beach', label: 'Beaches', emoji: '🏖️', color: '#00838f' },
  { value: 'hotel', label: 'Hotels', emoji: '🏨', color: '#4CAF50' }
];

export default function MapExplorer() {
  const navigate = useNavigate();
  const [selectedGov, setSelectedGov] = useState(null);
  const [landmarks, setLandmarks] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);


  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const leafletRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Load Leaflet and initialize map once
  useEffect(() => {
    let mapInstance;
    const initLeafletMap = async () => {
      const L = await import('leaflet');
      leafletRef.current = L;

      // Inject Leaflet CSS
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

      // Init Map centered on Egypt
      mapInstance = L.map(mapContainerRef.current, {
        center: [26.8206, 30.8025],
        zoom: 6,
        zoomControl: false
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

      // Create Layer Group for markers
      markersLayerRef.current = L.layerGroup().addTo(mapInstance);

      // Add governorate labels as divIcons
      REGIONS.forEach((gov) => {
        const labelIcon = L.divIcon({
          className: 'custom-gov-label',
          html: `<span>${gov.nameEn}</span>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15]
        });

        L.marker([gov.lat, gov.lng], { icon: labelIcon })
          .addTo(mapInstance)
          .on('click', () => {
            handleGovClick(gov);
          });
      });
    };

    initLeafletMap();

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  // Sync map tiles with the application theme dynamically
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

  // Fetch landmarks and hotels for governorate
  const fetchLandmarks = async (govNameEn) => {
    setLoading(true);
    try {
      let slug = govNameEn.toLowerCase().replace(/\s+/g, '-');
      if (slug === 'matrouh') slug = 'marsa-matruh';
      if (slug === 'assiut') slug = 'asyut';

      const response = await fetch(`${API_BASE}/governorates/${slug}`);
      if (!response.ok) throw new Error('API failed');
      const json = await response.json();
      
      const payload = json.data?.data || json.data || {};
      const landmarksList = payload.landmarks || [];
      const hotelsList = payload.hotels || [];

      const mappedHotels = hotelsList.map(h => ({
        ...h,
        category: 'hotel',
        ticketPrice: h.pricePerNight || 0 // Display price per night in the same spot
      }));

      const combined = [...landmarksList, ...mappedHotels];

      if (combined.length > 0) {
        setLandmarks(combined);
      } else {
        setLandmarks(FALLBACK_LANDMARKS[govNameEn] || []);
      }
    } catch (e) {
      setLandmarks(FALLBACK_LANDMARKS[govNameEn] || []);
    } finally {
      setLoading(false);
    }
  };

  // Render Category Pins on the Map
  const renderMarkers = useCallback((items) => {
    const L = leafletRef.current;
    if (!L || !markersLayerRef.current || !mapRef.current) return;

    // Clear old markers
    markersLayerRef.current.clearLayers();

    items.forEach((item) => {
      const coords = item.location?.coordinates;
      if (!coords || coords.length !== 2) return;

      const catInfo = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[0];
      const pinColor = catInfo.color;
      const emoji = catInfo.emoji;

      // Custom marker Pin HTML
      const pinHtml = `
        <div class="map-marker-pin" style="--mc: ${pinColor}">
          <div class="pin-inner">${emoji}</div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'marker-pin-wrapper',
        html: pinHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const popupHtml = `
        <div class="map-popup-card">
          <div class="popup-img-wrapper">
            ${item.images?.[0] 
              ? `<img src="${item.images[0]}" alt="${item.name}" />`
              : `<div class="popup-placeholder">${emoji}</div>`
            }
          </div>
          <div class="popup-details">
            <h4 class="popup-title">${item.name}</h4>
            <span class="popup-badge" style="background: ${pinColor}22; color: ${pinColor}">${item.category}</span>
            <div class="popup-meta">
              <span class="popup-rating">⭐ ${item.averageRating || '4.5'}</span>
              <span class="popup-price">$${item.ticketPrice || '0'}</span>
            </div>
            <a href="/landmarks/${item.slug}" class="popup-btn">Explore Details</a>
          </div>
        </div>
      `;

      L.marker([coords[1], coords[0]], { icon: customIcon })
        .bindPopup(popupHtml, { maxWidth: 220 })
        .addTo(markersLayerRef.current);
    });
  }, []);

  // Governorates click handler
  const handleGovClick = useCallback((gov) => {
    setSelectedGov(gov);
    setSidebarOpen(true);
    fetchLandmarks(gov.nameEn);

    const L = leafletRef.current;
    if (L && mapRef.current) {
      mapRef.current.flyToBounds(gov.bbox, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, []);

  // Trigger marker rendering when landmarks or activeCategory changes
  useEffect(() => {
    const displayedLandmarks = landmarks.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    renderMarkers(displayedLandmarks);
  }, [landmarks, search, activeCategory, renderMarkers]);

  // Sidebar item selection to zoom to marker
  const handleSidebarItemClick = (item) => {
    const coords = item.location?.coordinates;
    if (coords && coords.length === 2 && mapRef.current) {
      mapRef.current.setView([coords[1], coords[0]], 14);
    }
  };

  // Filter logic for sidebar list view
  const visibleLandmarks = landmarks.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="map-explorer-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Cinzel:wght@700;900&display=swap');

        .map-explorer-root {
          --gold: #C9963B;
          --bg: #0a0a0f;
          --panel: rgba(8, 8, 12, 0.95);
          --border: rgba(201, 150, 59, 0.2);
          
          font-family: 'Cairo', sans-serif;
          background: var(--bg);
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .map-canvas-container {
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* DivIcon Label styles */
        .custom-gov-label {
          background: #0f172a;
          border: 1px solid #C1A249;
          border-radius: 20px;
          color: #C1A249;
          text-align: center;
          line-height: 28px;
          font-weight: 700;
          font-size: 11px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .custom-gov-label:hover {
          background: #C1A249;
          color: #0f172a;
          border-color: #0f172a;
          transform: scale(1.08);
        }

        /* Marker Pin Shape */
        .map-marker-pin {
          width: 30px;
          height: 30px;
          background: var(--mc);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 5px rgba(0,0,0,0.4);
          border: 2px solid #fff;
        }
        .pin-inner {
          transform: rotate(45deg);
          font-size: 16px;
        }

        /* Leaflet Popups override */
        .leaflet-popup-content-wrapper {
          background: #0f0f15 !important;
          color: #fff !important;
          border: 1px solid var(--border) !important;
          border-radius: 16px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          width: 220px !important;
        }
        .leaflet-popup-tip {
          background: #0f0f15 !important;
          border: 1px solid var(--border) !important;
        }

        .map-popup-card {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .popup-img-wrapper {
          width: 100%;
          height: 100px;
          overflow: hidden;
          background: #181822;
        }
        .popup-img-wrapper img {
          width: 100%;
          height: 100%;
          object-cover: cover;
        }
        .popup-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }
        .popup-details {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .popup-title {
          font-weight: 700;
          font-size: 13px;
          margin: 0;
          color: #fff;
          line-height: 1.3;
        }
        .popup-badge {
          align-self: flex-start;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .popup-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #bbb;
        }
        .popup-btn {
          margin-top: 4px;
          background: var(--gold);
          color: #000;
          text-align: center;
          padding: 6px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 11px;
          text-decoration: none;
          transition: background 0.2s;
        }
        .popup-btn:hover {
          background: #d8a34b;
        }

        /* Sidebar structure */
        .map-sidebar {
          position: absolute;
          top: 0;
          right: 0;
          width: 360px;
          height: 100%;
          background: var(--panel);
          backdrop-filter: blur(12px);
          border-left: 1px solid var(--border);
          z-index: 999;
          transform: translateX(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: -10px 0 30px rgba(0,0,0,0.5);
          color: #fff;
        }
        .map-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-header {
          padding: 20px;
          border-b: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sidebar-title {
          font-family: 'Cinzel', serif;
          font-size: 18px;
          color: var(--gold);
          margin: 0;
        }
        .sidebar-count {
          font-size: 11px;
          color: #888;
          font-weight: 600;
        }
        .sidebar-close {
          background: none;
          border: none;
          color: #fff;
          cursor: pointer;
          opacity: 0.7;
        }
        .sidebar-close:hover {
          opacity: 1;
        }

        .sidebar-content {
          padding: 20px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
        }

        .search-box {
          position: relative;
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 10px 10px 10px 32px;
          color: #fff;
          font-size: 12px;
          outline: none;
        }
        .search-input:focus {
          border-color: var(--gold);
        }
        .search-icon-svg {
          position: absolute;
          left: 10px;
          top: 11px;
          color: #888;
        }

        .filter-chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .filter-chip {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .filter-chip.active, .filter-chip:hover {
          background: var(--gold);
          color: #000;
          border-color: var(--gold);
        }

        .list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-grow: 1;
        }

        .list-item-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.04);
          border-radius: 12px;
          padding: 10px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .list-item-card:hover {
          border-color: var(--gold);
          background: rgba(251, 192, 45, 0.03);
          transform: translateY(-2px);
        }

        .item-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .item-info {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-width: 0;
        }
        .item-name {
          font-weight: 700;
          font-size: 12px;
          margin: 0;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-sub {
          font-size: 10px;
          color: #888;
          text-transform: capitalize;
        }
        .item-price {
          font-size: 11px;
          font-weight: 700;
          color: var(--gold);
        }

        .loader-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-grow: 1;
          gap: 10px;
          color: var(--gold);
        }
        .spinner-svg {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          color: #666;
          font-size: 12px;
          padding: 40px 0;
        }

        @media (max-width: 768px) {
          .map-sidebar {
            width: 100%;
            height: 55vh;
            top: auto;
            bottom: 0;
            transform: translateY(100%);
            border-left: none;
            border-top: 1px solid var(--border);
          }
          .map-sidebar.open {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Leaflet container */}
      <div ref={mapContainerRef} className="map-canvas-container" />

      {/* Interactive Sidebar Panel */}
      <div className={`map-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div>
            <h3 className="sidebar-title">{selectedGov ? selectedGov.nameEn : 'Governorate'}</h3>
            <span className="sidebar-count">{visibleLandmarks.length} Discoveries</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="sidebar-content">
          {/* Search box input */}
          <div className="search-box">
            <svg className="search-icon-svg h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search landmarks by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Category selection chips */}
          <div className="filter-chips">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`filter-chip ${activeCategory === cat.value ? 'active' : ''}`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Body content loader/list */}
          {loading ? (
            <div className="loader-spinner">
              <Compass className="spinner-svg h-10 w-10 animate-spin" />
              <span>Seeking ancient records...</span>
            </div>
          ) : visibleLandmarks.length === 0 ? (
            <div className="empty-state">
              <Compass className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No monuments match your search query in this region.</p>
            </div>
          ) : (
            <div className="list-container">
              {visibleLandmarks.map((item) => {
                const catInfo = CATEGORIES.find(c => c.value === item.category) || CATEGORIES[0];
                return (
                  <div
                    key={item._id}
                    onClick={() => handleSidebarItemClick(item)}
                    className="list-item-card"
                  >
                    <div className="item-icon-wrapper" style={{ color: catInfo.color }}>
                      {catInfo.emoji}
                    </div>
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <span className="item-sub">{item.category}</span>
                    </div>
                    <span className="item-price">${item.ticketPrice || '0'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
