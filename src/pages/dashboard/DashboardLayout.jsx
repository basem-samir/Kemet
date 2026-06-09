import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Calendar, Heart, User, Compass } from 'lucide-react';

const sidebarLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
  { to: '/dashboard/favorites', label: 'My Favorites', icon: Heart },
  { to: '/dashboard/profile', label: 'My Profile', icon: User },
];

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <Compass className="h-10 w-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 bg-white rounded-xl border border-gold-500/10 shadow-md p-6 space-y-6 h-fit">
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-100">
            {user?.avatar ? (
              <img
                src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${user.avatar}`}
                alt={user?.full_name}
                className="h-10 w-10 rounded-full object-cover border-2 border-gold-400 shadow-sm"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gold-500 text-navy-900 font-bold flex items-center justify-center text-sm border border-gold-400">
                {user?.name?.charAt(0).toUpperCase() || user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="text-xs truncate">
              <span className="font-semibold block text-navy-500 text-sm truncate">{user?.name || user?.full_name}</span>
              <span className="text-gray-400 block truncate">{user?.email}</span>
            </div>
          </div>

          <nav className="flex flex-col space-y-1.5">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `flex items-center space-x-2.5 px-4 py-3 rounded-lg text-xs font-bold transition duration-150 ${
                    isActive
                      ? 'bg-gold-500 text-navy-900 shadow-sm'
                      : 'text-gray-600 hover:bg-sand-50 hover:text-navy-900'
                  }`
                }
              >
                <link.icon className="h-4.5 w-4.5" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Dashboard Views Content */}
        <main className="flex-1 bg-white rounded-xl border border-gold-500/10 shadow-md p-6 sm:p-8 min-h-[50vh]">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
