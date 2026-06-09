import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Compass, Mail, Lock, User, Globe, Phone, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    nationality: '',
    phone_number: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, fetchCurrentUser } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const tokenParam = searchParams.get('token');
  const refreshTokenParam = searchParams.get('refreshToken');

  useEffect(() => {
    if (tokenParam && refreshTokenParam) {
      localStorage.setItem('kemet_access_token', tokenParam);
      localStorage.setItem('kemet_refresh_token', refreshTokenParam);
      fetchCurrentUser().then(() => navigate(redirect));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleAuth = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
      } else {
        await register(formData);
      }
      navigate(redirect);
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-tr from-navy-600 via-navy-500 to-navy-700">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gold-500/20"
      >
        <div className="text-center">
          <Compass className="mx-auto h-12 w-12 text-gold-500 animate-spin-slow" />
          <h2 className="mt-6 text-3xl font-serif font-black tracking-wider text-navy-500">
            {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Log in to access your Egyptian wonders' : 'Create an account to build and book your dream trip'}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-md text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`w-1/2 py-3 text-center font-medium border-b-2 transition-colors ${
              isLogin ? 'border-gold-500 text-gold-600 font-bold' : 'border-transparent text-gray-500 hover:text-navy-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`w-1/2 py-3 text-center font-medium border-b-2 transition-colors ${
              !isLogin ? 'border-gold-500 text-gold-600 font-bold' : 'border-transparent text-gray-500 hover:text-navy-900'
            }`}
          >
            Register
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    placeholder="Tutankhamun"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nationality</label>
                  <div className="mt-1 relative">
                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none"
                      placeholder="e.g. UK"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none"
                      placeholder="+44 77..."
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <div className="mt-1 relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="mt-1 relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="pl-10 w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.78 0 3.3.61 4.56 1.8l3.42-3.42C17.9 1.54 15.17.96 12 .96c-5.07 0-9.4 3.03-11.24 7.42l3.8 2.94c.9-2.7 3.42-4.28 7.44-4.28z"/>
            <path fill="#4285F4" d="M23.5 12.24c0-.82-.07-1.6-.2-2.38H12v4.51h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.71-4.94 3.71-8.58z"/>
            <path fill="#FBBC05" d="M4.56 8.38c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L.76 1.08C-.25 3.1-.8 5.4-.8 7.8s.55 4.7 1.56 6.72l3.8-2.94z"/>
            <path fill="#34A853" d="M12 23.04c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.08.72-2.48 1.15-4.26 1.15-4.02 0-6.54-1.58-7.44-4.28L.76 17.06c1.84 4.39 6.17 7.42 11.24 7.42z"/>
          </svg>
          <span>Google Account</span>
        </button>
      </motion.div>
    </div>
  );
}
