import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { User, Mail, Globe, Phone, Tag, Check, Loader2, AlertCircle, CheckCircle, Trash2, ShieldAlert, CreditCard, Lock, Wallet, Camera, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../../api/endpoints';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, deleteProfile, uploadAvatar, error, clearError } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateInfoModal, setShowUpdateInfoModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Only image files (jpeg, jpg, png, gif, webp) are allowed.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image must be under 5MB.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    setPendingAvatarFile(file);
    setPendingAvatarUrl(URL.createObjectURL(file));
  };

  const confirmAvatarUpload = async () => {
    if (!pendingAvatarFile) return;

    setAvatarUploading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await uploadAvatar(pendingAvatarFile);
      setSuccessMsg('Profile photo updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      setPendingAvatarFile(null);
      setPendingAvatarUrl(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload avatar.');
    } finally {
      setAvatarUploading(false);
      // Reset input so re-selecting the same file still triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelAvatarUpload = () => {
    setPendingAvatarFile(null);
    setPendingAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };



  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    nationality: '',
    phone_number: '',
    preferred_language: 'English',
    interestsStr: '',
  });



  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        nationality: user.nationality || '',
        phone_number: user.phone_number || '',
        preferred_language: user.preferred_language || 'English',
        interestsStr: user.interests?.join(', ') || '',
      });
    }
    clearError();
  }, [user, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const interests = formData.interestsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await updateProfile({
        full_name: formData.full_name,
        nationality: formData.nationality,
        phone_number: formData.phone_number,
        preferred_language: formData.preferred_language,
        interests,
      });

      setSuccessMsg('Your profile has been updated successfully!');
      setShowUpdateInfoModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMsg('');
    try {
      await deleteProfile();
      navigate('/');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Avatar Hero Section ────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 rounded-2xl p-6 sm:p-8 overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with upload overlay */}
          <div className="relative group">
            <div className="h-28 w-28 rounded-full ring-4 ring-gold-500/40 ring-offset-4 ring-offset-navy-900 shadow-2xl overflow-hidden bg-gradient-to-br from-gold-400 to-gold-600">
              {pendingAvatarUrl ? (
                <img
                  src={pendingAvatarUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : user?.avatar ? (
                <img
                  src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/${user.avatar}`}
                  alt={user?.full_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-navy-900 font-black text-3xl font-serif">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>

            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute inset-0 h-28 w-28 rounded-full bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-all duration-300 cursor-pointer"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center">
                {avatarUploading ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin mx-auto" />
                ) : (
                  <>
                    <Camera className="h-5 w-5 text-white mx-auto" />
                    <span className="text-[9px] text-white font-bold uppercase tracking-wider mt-1 block">Change</span>
                  </>
                )}
              </div>
            </button>

            {/* Status indicator */}
            <div className="absolute bottom-0.5 right-0.5 h-5 w-5 rounded-full bg-green-500 border-[3px] border-navy-900 shadow-lg" />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleAvatarChange}
            className="hidden"
            id="avatar-upload"
          />

          {/* User info */}
          <div className="text-center sm:text-left flex-1 space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-serif font-black !text-white tracking-wide">
                {user?.full_name || 'Traveler'}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-gold-500/20 text-gold-400 border border-gold-500/30 w-fit mx-auto sm:mx-0">
                {user?.role === 'admin' ? '⚡ Admin' : '🏛️ Explorer'}
              </span>
            </div>
            <p className="text-xs text-gold-500">{user?.email}</p>
            <p className="text-[10px] text-gold-500">
              Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}
            </p>

            {/* Quick action button */}
            {pendingAvatarFile ? (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmAvatarUpload}
                  disabled={avatarUploading}
                  className="inline-flex items-center space-x-1.5 bg-green-500 hover:bg-green-600 border border-green-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
                >
                  {avatarUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>{avatarUploading ? 'Uploading...' : 'Confirm'}</span>
                </button>
                <button
                  type="button"
                  onClick={cancelAvatarUpload}
                  disabled={avatarUploading}
                  className="inline-flex items-center space-x-1.5 bg-red-500 hover:bg-red-600 border border-red-400 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-200 shadow-lg"
                >
                  <span>Cancel</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="mt-3 inline-flex items-center space-x-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span>Update Photo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Details Section Header ───────────────── */}
      <div className="border-b border-gray-100 pb-4 space-y-1">
        <h3 className="text-lg font-serif font-bold text-navy-500">Personal Information</h3>
        <p className="text-xs text-gray-500">Manage your contact details and travel preferences.</p>
      </div>

      {successMsg && (
        <div className="text-xs text-green-700 bg-green-50 p-3 rounded-lg border border-green-200 flex items-center space-x-2">
          <CheckCircle className="h-4.5 w-4.5 text-green-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 flex items-center space-x-2">
          <AlertCircle className="h-4.5 w-4.5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Read-Only Info Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</span>
            <span className="text-xs font-semibold text-navy-900">{user?.full_name || 'N/A'}</span>
          </div>

          <div className="space-y-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</span>
            <span className="text-xs font-semibold text-navy-900">{user?.email || 'N/A'}</span>
          </div>

          <div className="space-y-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nationality</span>
            <span className="text-xs font-semibold text-navy-900">{user?.nationality || 'Not specified'}</span>
          </div>

          <div className="space-y-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</span>
            <span className="text-xs font-semibold text-navy-900">{user?.phone_number || 'Not specified'}</span>
          </div>

          <div className="space-y-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preferred Language</span>
            <span className="text-xs font-semibold text-navy-900">{user?.preferred_language || 'English'}</span>
          </div>

          <div className="space-y-1 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Travel Interests</span>
            <span className="text-xs font-semibold text-navy-900 truncate block">
              {user?.interests?.join(', ') || 'None selected'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-start pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              clearError();
              setFormData({
                full_name: user?.full_name || '',
                email: user?.email || '',
                nationality: user?.nationality || '',
                phone_number: user?.phone_number || '',
                preferred_language: user?.preferred_language || 'English',
                interestsStr: user?.interests?.join(', ') || '',
              });
              setShowUpdateInfoModal(true);
            }}
            className="bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold py-2.5 px-6 rounded-lg shadow-md transition duration-200 text-xs flex items-center space-x-1.5 justify-center"
          >
            <User className="h-4 w-4" />
            <span>Update Information</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 font-bold py-2.5 px-6 rounded-lg transition duration-200 text-xs flex items-center space-x-1.5 justify-center"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Update Info Popup Modal */}
      <AnimatePresence>
        {showUpdateInfoModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-gold-500/20 shadow-2xl p-6 space-y-6 text-left"
            >
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-2.5 text-navy-500">
                  <User className="h-5 w-5" />
                  <h3 className="text-lg font-serif font-bold">Update Personal Information</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpdateInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="full_name"
                        required
                        value={formData.full_name}
                        onChange={handleChange}
                        className="pl-9 w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none bg-gray-50/50"
                        placeholder="Tutankhamun"
                      />
                    </div>
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address (Primary)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        disabled
                        value={formData.email}
                        className="pl-9 w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-100 text-gray-400 cursor-not-allowed focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Nationality */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nationality</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className="pl-9 w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none bg-gray-50/50"
                        placeholder="e.g. British"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        className="pl-9 w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none bg-gray-50/50"
                        placeholder="+44 77..."
                      />
                    </div>
                  </div>

                  {/* Preferred Language */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preferred Language</label>
                    <select
                      name="preferred_language"
                      value={formData.preferred_language}
                      onChange={handleChange}
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none"
                    >
                      <option value="English">English</option>
                      <option value="Arabic">Arabic</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Spanish">Spanish</option>
                    </select>
                  </div>

                  {/* Interests */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Travel Interests (Comma separated)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="interestsStr"
                        value={formData.interestsStr}
                        onChange={handleChange}
                        className="pl-9 w-full p-2.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-gold-500 focus:outline-none bg-gray-50/50"
                        placeholder="Pharaonic, Pyramids, Cruises, Beach"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 text-xs pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowUpdateInfoModal(false)}
                    className="w-1/2 py-3 border border-gray-300 rounded-lg font-bold text-navy-500 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-1/2 py-3 bg-navy-500 hover:bg-navy-600 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center space-x-1"
                  >
                    {loading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span>Save Profile Info</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>




      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-red-500/20 shadow-2xl p-6 space-y-6"
            >
              <div className="flex items-center space-x-3 text-red-600">
                <ShieldAlert className="h-8 w-8" />
                <h3 className="text-lg font-serif font-bold">Permanently Delete Account?</h3>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed">
                This action is irreversible. All of your historical bookings, favorites, custom trip plans, and account records will be permanently deleted from our database.
              </p>

              <div className="flex space-x-3 text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="w-1/2 py-3 border border-gray-300 rounded-lg font-bold text-navy-500 hover:bg-gray-50 transition"
                >
                  Cancel, Keep
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="w-1/2 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center space-x-1"
                >
                  {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Yes, Delete Account</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[9999] text-xs px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 border transition-all duration-300 transform translate-y-0 ${toast.type === 'success'
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-red-50 text-red-700 border-red-200'
          }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-red-600" />
          )}
          <span className="font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  );
}