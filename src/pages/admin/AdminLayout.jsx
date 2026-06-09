import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { BarChart3, Users, Calendar, ShieldCheck, Compass, Globe, Building2, Plane, Tag, DollarSign, Map } from 'lucide-react';

const sidebarLinks = [
  { to: '/admin', label: 'Overview & Stats', icon: BarChart3, end: true },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
  { to: '/admin/bookings', label: 'Manage Bookings', icon: Calendar },
  { to: '/admin/governorates', label: 'Manage Governorates', icon: Globe },
  { to: '/admin/landmarks', label: 'Manage Landmarks', icon: Compass },
  { to: '/admin/hotels', label: 'Manage Hotels', icon: Building2 },
  { to: '/admin/flights', label: 'Manage Flights', icon: Plane },
  { to: '/admin/types', label: 'Manage Tourism Types', icon: Tag },
  { to: '/admin/itineraries', label: 'Manage Itineraries', icon: Map },
  { to: '/admin/commission-rates', label: 'Commission Rates', icon: DollarSign },
  { to: '/admin/commission-dashboard', label: 'Commission & Payouts', icon: DollarSign },
];

export default function AdminLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex items-center justify-center">
        <Compass className="h-10 w-10 text-gold-500 animate-spin" />
      </div>
    );
  }

  // Admin access check
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 shrink-0 bg-navy-900 text-white rounded-xl border border-gold-500/20 shadow-lg p-6 space-y-6 h-fit">
          <div className="flex items-center space-x-3 pb-6 border-b border-gray-800">
            <div className="h-10 w-10 rounded-full bg-gold-500 text-navy-900 font-bold flex items-center justify-center text-sm border border-gold-400">
              A
            </div>
            <div>
              <span className="font-serif font-bold text-gold-500 text-sm tracking-wide">Kemet Control</span>
              <span className="text-[10px] text-gray-400 block font-semibold uppercase">Administrator</span>
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
                      ? 'bg-gold-500 text-navy-900 shadow-md'
                      : 'text-gray-300 hover:bg-navy-800 hover:text-gold-500'
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
