import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { Menu, X, Compass, User, LogOut, LayoutDashboard, Heart, ShieldCheck, Sun, Moon, Globe, Bell, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE, notificationsAPI } from '../../api/endpoints';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch notifications periodically
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then(res => res.data.data),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('kemet-theme', 'light');
    window.dispatchEvent(new CustomEvent('kemet-theme-change', { detail: 'light' }));
  }, []);


  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleHashClick = (e, to) => {
    if (to.startsWith('/#')) {
      e.preventDefault();
      const targetId = to.substring(2);
      if (window.location.pathname === '/') {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/');
        setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  };

  const navLinks = [
    { to: '/landmarks', label: t('nav.landmarks') || 'Landmarks' },
    { to: '/hotels', label: t('nav.hotels') || 'Hotels' },
    { to: '/itineraries', label: t('nav.itineraries') || 'Itineraries' },
    { to: '/flights', label: t('nav.flights') || 'Flights' },
    { to: '/trip-builder', label: t('nav.tripBuilder') || 'Trip Builder', highlight: true },
  ];

  return (
    <nav className="bg-navy-500 text-white sticky top-0 z-50 shadow-md border-b border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-2xl text-gold-500 group-hover:rotate-12 transition-transform duration-300">𓂀</span>
            <span className="font-serif text-2xl font-bold tracking-widest text-gold-500 group-hover:text-gold-400 transition-colors">
              KEMET
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={(e) => handleHashClick(e, link.to)}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    link.highlight
                      ? 'bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-md shadow-md font-semibold px-4'
                      : link.to.includes('#')
                      ? 'text-gray-300 hover:text-gold-500'
                      : isActive
                      ? 'text-gold-500 border-b-2 border-gold-500'
                      : 'text-gray-300 hover:text-gold-500'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-4">


            {isAuthenticated ? (
              <div className="flex items-center space-x-5">
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      setProfileOpen(false);
                    }}
                    className="relative p-2 text-gray-300 hover:text-gold-500 transition-colors focus:outline-none"
                  >
                    <Bell className="h-5 w-5" />
                    {notificationsData?.unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-navy-500">
                        {notificationsData.unreadCount > 9 ? '9+' : notificationsData.unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-80 bg-navy-600 border border-gold-500/20 rounded-lg shadow-xl z-50 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gold-500/10 flex justify-between items-center bg-navy-700">
                          <div className="font-bold text-gold-500 text-sm tracking-widest uppercase">Notifications</div>
                          {notificationsData?.unreadCount > 0 && (
                            <button 
                              onClick={() => markAllAsReadMutation.mutate()}
                              className="text-xs text-gold-500 hover:text-gold-400 font-medium"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notificationsData?.notifications?.length > 0 ? (
                            notificationsData.notifications.map(notif => (
                              <div 
                                key={notif._id} 
                                onClick={() => {
                                  if (!notif.isRead) markAsReadMutation.mutate(notif._id);
                                  if (notif.link) {
                                    navigate(notif.link);
                                    setNotificationsOpen(false);
                                  }
                                }}
                                className={`px-4 py-3 border-b border-gold-500/10 cursor-pointer transition-colors ${notif.isRead ? 'opacity-60 hover:bg-navy-500' : 'bg-navy-500 hover:bg-navy-400'}`}
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-semibold text-xs text-white">{notif.title}</div>
                                  {!notif.isRead && <span className="h-2 w-2 rounded-full bg-gold-500 shrink-0 mt-1"></span>}
                                </div>
                                <p className="text-[11px] text-gray-300 leading-snug">{notif.message}</p>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center text-gray-400 text-xs">
                              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              <p>No notifications yet</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Profile */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setProfileOpen(!profileOpen);
                      setNotificationsOpen(false);
                    }}
                    className="h-9 w-9 rounded-full overflow-hidden border border-gold-500 bg-gold-600 flex items-center justify-center text-navy-900 font-bold focus:outline-none focus:ring-2 focus:ring-gold-500 hover:border-gold-400 transition-colors"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/${user.avatar}`}
                        alt={user?.full_name || user?.name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{(user?.full_name || user?.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-3 w-56 bg-navy-600 border border-gold-500/20 rounded-lg shadow-xl py-2 z-50 text-xs text-gray-200"
                      >
                        <div className="px-4 py-2 border-b border-gold-500/10">
                          <p className="font-bold text-white truncate">{user?.full_name || user?.name}</p>
                          <p className="text-gray-400 truncate text-[10px]">{user?.email}</p>
                        </div>

                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center space-x-2 px-4 py-2.5 hover:bg-navy-700 hover:text-gold-500 font-bold transition-colors"
                          >
                            <ShieldCheck className="h-4 w-4 text-gold-500" />
                            <span>Admin Panel</span>
                          </Link>
                        )}

                        <Link
                          to="/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2.5 hover:bg-navy-700 hover:text-gold-500 transition-colors"
                        >
                          <LayoutDashboard className="h-4.5 w-4.5" />
                          <span>Dashboard</span>
                        </Link>

                        <hr className="border-gold-500/10 my-1" />

                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left flex items-center space-x-2 px-4 py-2.5 text-red-400 hover:bg-navy-700 hover:text-red-300 transition-colors font-semibold"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center space-x-1 text-sm text-gray-300 hover:text-gold-500 transition-colors bg-navy-600 px-4 py-2 rounded-md border border-gold-500/30"
              >
                <User className="h-4 w-4 text-gold-500" />
                <span>Login / Register</span>
              </Link>
            )}
          </div>

          {/* Mobile Theme Toggle & Menu Button */}
          <div className="lg:hidden flex items-center space-x-2">

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-navy-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-navy-600 border-t border-gold-500/20 px-4 py-4 space-y-3"
          >
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={(e) => {
                  setIsOpen(false);
                  handleHashClick(e, link.to);
                }}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  link.highlight
                    ? 'bg-gold-500 text-navy-900 text-center font-semibold'
                    : 'text-gray-300 hover:bg-navy-500 hover:text-gold-500'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <hr className="border-gray-700" />

            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-gold-400 bg-gold-500 flex items-center justify-center text-navy-900 font-bold shrink-0">
                    {user?.avatar ? (
                      <img
                        src={user.avatar.startsWith('http') ? user.avatar : `${API_BASE}/${user.avatar}`}
                        alt={user?.full_name || user?.name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{(user?.full_name || user?.name || 'U').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="font-medium text-gray-200">{user?.full_name || user?.name}</span>
                </div>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gold-500 hover:bg-navy-500"
                  >
                    Admin Panel
                  </Link>
                )}
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-navy-500 hover:text-gold-500"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-navy-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-navy-700 border border-gold-500/30 text-base font-medium text-gold-500"
              >
                <User className="h-5 w-5" />
                <span>Login / Register</span>
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
