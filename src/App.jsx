import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { useTranslation } from 'react-i18next';

// Layouts
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';

// Pages
import Home from './pages/Home';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Governorates from './pages/Governorates';
import GovernorateDetails from './pages/GovernorateDetails';
import Landmarks from './pages/Landmarks';
import LandmarkDetails from './pages/LandmarkDetails';
import Hotels from './pages/Hotels';
import HotelDetails from './pages/HotelDetails';
import Itineraries from './pages/Itineraries';
import ItineraryDetails from './pages/ItineraryDetails';
import BookItinerary from './pages/booking/BookItinerary';
import TripBuilder from './pages/TripBuilder';
import MapExplorer from './pages/MapExplorer';
import Payment from './pages/payment/Payment';
import PaymentSuccess from './pages/payment/PaymentSuccess';
import Flights from './pages/Flights';
import TourismCategories from './pages/TourismCategories';

// Dashboard
import DashboardLayout from './pages/dashboard/DashboardLayout';
import DashboardOverview from './pages/dashboard/DashboardOverview';
import MyBookings from './pages/dashboard/MyBookings';
import Favorites from './pages/dashboard/Favorites';
import Profile from './pages/dashboard/Profile';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminStats from './pages/admin/AdminStats';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminGovernorates from './pages/admin/AdminGovernorates';
import AdminLandmarks from './pages/admin/AdminLandmarks';
import AdminHotels from './pages/admin/AdminHotels';
import AdminFlights from './pages/admin/AdminFlights';
import AdminTourismTypes from './pages/admin/AdminTourismTypes';
import AdminItineraries from './pages/admin/AdminItineraries';
import AdminCommissionRates from './pages/admin/AdminCommissionRates';
import AdminCommissionDashboard from './pages/admin/AdminCommissionDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">{children}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  const { fetchCurrentUser } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  useEffect(() => {
    const lang = i18n.language || 'en';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/governorates" element={<Governorates />} />
            <Route path="/governorates/:slug" element={<GovernorateDetails />} />
            <Route path="/landmarks" element={<Landmarks />} />
            <Route path="/landmarks/:slug" element={<LandmarkDetails />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/:slug" element={<HotelDetails />} />
            <Route path="/itineraries" element={<Itineraries />} />
            <Route path="/itineraries/:slug" element={<ItineraryDetails />} />
            <Route path="/itineraries/book/:id" element={<BookItinerary />} />
            <Route path="/trip-builder" element={<TripBuilder />} />
            <Route path="/map" element={<MapExplorer />} />
            <Route path="/flights" element={<Flights />} />
            <Route path="/categories" element={<TourismCategories />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />

            {/* Dashboard Nested Routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="bookings" element={<MyBookings />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Admin Nested Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminStats />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="governorates" element={<AdminGovernorates />} />
              <Route path="landmarks" element={<AdminLandmarks />} />
              <Route path="hotels" element={<AdminHotels />} />
              <Route path="flights" element={<AdminFlights />} />
              <Route path="types" element={<AdminTourismTypes />} />
              <Route path="itineraries" element={<AdminItineraries />} />
              <Route path="commission-rates" element={<AdminCommissionRates />} />
              <Route path="commission-dashboard" element={<AdminCommissionDashboard />} />
            </Route>

            {/* 404 Fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
                  <h2 className="text-3xl font-serif font-black text-navy-500">404 — Page Not Found</h2>
                  <p className="text-gray-500 text-sm">The temple ruins you are seeking have vanished into the sands of time.</p>
                  <Link to="/" className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold px-6 py-2 rounded-lg text-xs shadow-md">
                    Return to Oasis
                  </Link>
                </div>
              }
            />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
