import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Compass, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { authAPI } from '../api/endpoints';
import { validateField } from '../utils/validation';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [passwords, setPasswords] = useState({ password: '', confirmPassword: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    const errors = {};
    errors.password = validateField('password', passwords.password);
    
    if (passwords.password !== passwords.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (errors.password || errors.confirmPassword) {
      setFormErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, { password: passwords.password });
      setSuccessMsg('Your password has been successfully reset!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. The link might be invalid or expired.');
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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Create a new strong password for your account.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center space-x-2 bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-md text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 bg-green-50 border-l-4 border-green-500 p-4 text-green-700 rounded-r-md text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!successMsg ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  required
                  value={passwords.password}
                  onChange={handleChange}
                  className={`pl-10 w-full px-4 py-2.5 bg-gray-50 border ${formErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.password && <p className="text-red-500 text-[10px] mt-1">{formErrors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  className={`pl-10 w-full px-4 py-2.5 bg-gray-50 border ${formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none`}
                  placeholder="••••••••"
                />
              </div>
              {formErrors.confirmPassword && <p className="text-red-500 text-[10px] mt-1">{formErrors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <div className="text-center mt-6">
            <Link to="/auth" className="inline-flex items-center text-sm font-medium bg-gold-500 hover:bg-gold-600 text-navy-900 px-6 py-2 rounded-lg shadow transition duration-200">
              Go to Login
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
