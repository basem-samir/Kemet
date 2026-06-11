import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { authAPI } from '../api/endpoints';
import { validateField } from '../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const validationError = validateField('email', email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }
    setEmailError('');
    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      setSuccessMsg('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to send reset email. Please try again.');
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
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
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
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 w-full px-4 py-2.5 bg-gray-50 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-gold-500 focus:outline-none`}
                  placeholder="you@example.com"
                />
              </div>
              {emailError && <p className="text-red-500 text-[10px] mt-1">{emailError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-3 px-4 rounded-lg shadow-lg transition duration-200"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-sm text-gray-600 text-center mb-6">
              Please check your email inbox and spam folder.
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/auth" className="inline-flex items-center text-sm font-medium text-gold-600 hover:text-gold-500 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
