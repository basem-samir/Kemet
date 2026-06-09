import { create } from 'zustand';
import { authAPI, usersAPI } from '../api/endpoints';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.login(credentials);
      const { token, refreshToken } = res.data;
      const user = res.data.data?.user || res.data.user;
      
      localStorage.setItem('kemet_access_token', token);
      if (refreshToken) {
        localStorage.setItem('kemet_refresh_token', refreshToken);
      }
      
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.register(userData);
      const { token, refreshToken } = res.data;
      const user = res.data.data?.user || res.data.user;

      localStorage.setItem('kemet_access_token', token);
      if (refreshToken) {
        localStorage.setItem('kemet_refresh_token', refreshToken);
      }

      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout API failed:', err);
    } finally {
      localStorage.removeItem('kemet_access_token');
      localStorage.removeItem('kemet_refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchCurrentUser: async () => {
    const token = localStorage.getItem('kemet_access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
    
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.getMe();
      const userData = res.data.data?.user || res.data.user || res.data.data || res.data;
      set({ user: userData, isAuthenticated: true, isLoading: false });
      return userData;
    } catch (err) {
      localStorage.removeItem('kemet_access_token');
      localStorage.removeItem('kemet_refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authAPI.updateProfile(data);
      const userData = res.data.data?.user || res.data.user || res.data.data || res.data;
      set({ user: userData, isLoading: false });
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Profile update failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },



  deleteProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      await authAPI.deleteProfile();
      localStorage.removeItem('kemet_access_token');
      localStorage.removeItem('kemet_refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (err) {
      const message = err.response?.data?.message || 'Profile deletion failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  uploadAvatar: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await usersAPI.uploadAvatar(formData);
      // Refresh full user data so avatar URL propagates everywhere
      const res = await authAPI.getMe();
      const userData = res.data.data?.user || res.data.user || res.data.data || res.data;
      set({ user: userData, isLoading: false });
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || 'Avatar upload failed';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
