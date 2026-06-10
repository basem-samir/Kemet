import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kemet_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh or auth failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('kemet_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { token } = res.data;
          localStorage.setItem('kemet_access_token', token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('kemet_access_token');
        localStorage.removeItem('kemet_refresh_token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// API Endpoints Services
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => {
    const refreshToken = localStorage.getItem('kemet_refresh_token');
    localStorage.removeItem('kemet_access_token');
    localStorage.removeItem('kemet_refresh_token');
    return api.post('/auth/logout', { refreshToken });
  },
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  deleteProfile: () => api.delete('/auth/profile'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
};

export const governoratesAPI = {
  getAll: (params) => api.get('/governorates', { params }),
  getBySlug: (slug) => api.get(`/governorates/${slug}`),
  create: (data) => api.post('/governorates', data),
  update: (id, data) => api.put(`/governorates/${id}`, data),
  delete: (id) => api.delete(`/governorates/${id}`),
};

export const landmarksAPI = {
  getAll: (params) => api.get('/landmarks', { params }),
  getNearby: (params) => api.get('/landmarks/nearby', { params }),
  getBySlug: (slug) => api.get(`/landmarks/${slug}`),
  create: (data) => api.post('/landmarks', data),
  update: (id, data) => api.put(`/landmarks/${id}`, data),
  delete: (id) => api.delete(`/landmarks/${id}`),
};

export const hotelsAPI = {
  getAll: (params) => api.get('/hotels', { params }),
  getBySlug: (slug) => api.get(`/hotels/${slug}`),
  create: (data) => api.post('/hotels', data),
  update: (id, data) => api.put(`/hotels/${id}`, data),
  delete: (id) => api.delete(`/hotels/${id}`),
};

export const flightsAPI = {
  search: (params) => api.get('/flights/search', { params }),
  getById: (id) => api.get(`/flights/${id}`),
  create: (data) => api.post('/flights', data),
  update: (id, data) => api.put(`/flights/${id}`, data),
  delete: (id) => api.delete(`/flights/${id}`),
};

export const tourismTypesAPI = {
  getAll: (params) => api.get('/types', { params }),
  getBySlug: (slug) => api.get(`/types/${slug}`),
  create: (data) => api.post('/types', data),
  update: (id, data) => api.put(`/types/${id}`, data),
  delete: (id) => api.delete(`/types/${id}`),
};

export const itinerariesAPI = {
  getTemplates: () => api.get('/itineraries/templates'),
  getTemplateBySlug: (slug) => api.get(`/itineraries/templates/${slug}`),
  createTemplate: (data) => api.post('/itineraries/templates', data),
  updateTemplate: (id, data) => api.put(`/itineraries/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/itineraries/templates/${id}`),
  buildCustom: (data) => api.post('/itineraries/custom', data),
  getUserItineraries: () => api.get('/itineraries/user'),
  createUserItinerary: (data) => api.post('/itineraries/user', data),
  updateUserItinerary: (id, data) => api.put(`/itineraries/user/${id}`, data),
  deleteUserItinerary: (id) => api.delete(`/itineraries/user/${id}`),
};

export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  bookFlight: (data) => api.post('/bookings/flight', data),
  bookHotel: (data) => api.post('/bookings/hotel', data),
  bookItinerary: (data) => api.post('/bookings/itinerary', data),
  bookCustomTrip: (data) => api.post('/bookings/custom-trip', data),
  bookLandmark: (data) => api.post('/bookings/landmark', data),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

export const favoritesAPI = {
  getAll: (params) => api.get('/favorites', { params }),
  toggle: (item_type, item_id) => api.post('/favorites', { item_type, item_id }),
};

export const reviewsAPI = {
  create: (data) => api.post('/reviews', data),
  getByItem: (type, itemId) => api.get(`/reviews/${type}/${itemId}`),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  remove: (id) => api.delete(`/reviews/${id}`),
};

export const paymentAPI = {
  createPaymentIntent: (data) => api.post('/payment/create-payment-intent', data),
  createPaypalOrder: (data) => api.post('/payment/paypal-order', data),
  captureOrder: (data) => api.post('/payment/capture-order', data),
};

export const usersAPI = {
  // FIX: Content-Type set to undefined so axios auto-generates multipart/form-data with correct boundary.
  // Setting it manually to 'multipart/form-data' omits the boundary, causing multer to fail parsing.
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, {
      headers: { 'Content-Type': undefined },
    }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  banUser: (id, data) => api.put(`/admin/users/${id}/ban`, data),
  getBookings: () => api.get('/admin/bookings'),
  // FIX: same Content-Type fix as uploadAvatar above
  uploadImage: (formData) =>
    api.post('/admin/upload', formData, {
      headers: { 'Content-Type': undefined },
    }),
  getCommissionRates: () => api.get('/admin/commission-rates'),
  updateCommissionRate: (key, value) => api.put(`/admin/commission-rates/${key}`, { value }),
  getCommissionDashboard: () => api.get('/admin/commission/dashboard'),
  requestWithdrawal: (data) => api.post('/admin/commission/withdraw', data),
};

export default api;