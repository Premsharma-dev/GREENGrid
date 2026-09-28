import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Gauge,
  Zap,
  Receipt,
  SunMedium,
  BarChart3,
  Bell,
  FileSpreadsheet,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { alertService } from '../../services/alertService';
import { Alert } from '../../types';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await alertService.getAlerts({ status: 'New' });
      setAlerts(data);
    } catch {
      // Ignore background notification error
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Facilities',
      path: '/facilities',
      icon: Building2,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Energy Readings',
      path: '/energy/readings',
      icon: Zap,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Meters',
      path: '/meters',
      icon: Gauge,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Billing & Tariffs',
      path: '/billing',
      icon: Receipt,
      roles: ['ADMIN', 'MANAGER'],
    },
    {
      label: 'Renewable Energy',
      path: '/renewable',
      icon: SunMedium,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Alerts',
      path: '/alerts',
      icon: Bell,
      badge: alerts.length > 0 ? alerts.length : undefined,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    },
    {
      label: 'Users',
      path: '/users',
      icon: Users,
      roles: ['ADMIN'], // Admin only
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['ADMIN'],
    },
  ];

  const filteredNavItems = navItems.filter(item =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Zap className="w-5 h-5 fill-emerald-400 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-white text-lg tracking-tight">GREEN<span className="text-emerald-400">Grid</span></span>
              <span className="block text-[10px] text-slate-400 font-mono tracking-wider -mt-1 uppercase">EMIS Platform</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Scope / Role Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-400">Active Profile</div>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                user?.role === 'ADMIN'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                  : user?.role === 'MANAGER'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {user?.role || 'VIEWER'}
            </span>
          </div>
          <div className="text-sm font-medium text-white truncate mt-1">
            {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="bg-slate-800/60 rounded-xl p-3 mb-2 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="text-slate-200 block font-semibold">Grid Engine v2.4</span>
              <span>REST & MySQL Sync Active</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>EMIS Telemetry:</span>
              <span className="text-slate-900 font-bold">5 Facilities Monitored</span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50"
                  onClick={() => setNotificationOpen(false)}
                >
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Active Notifications</span>
                    <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                      {alerts.length} New
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {alerts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        No active alerts. All facilities operating normally.
                      </div>
                    ) : (
                      alerts.map((alt) => (
                        <div
                          key={alt.id}
                          onClick={() => navigate('/alerts')}
                          className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                              alt.severity === 'Critical' ? 'text-rose-500' : 'text-amber-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">{alt.title}</p>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{alt.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {alt.facility_name} • {new Date(alt.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <Link to="/alerts" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                      View all alerts & recommendations →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.first_name ? user.first_name[0] : (user?.username ? user.username[0].toUpperCase() : 'U')}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
                  </div>
                  <div className="text-[10px] text-slate-500">{user?.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900">{user?.username}</p>
                    <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <Link to="/settings" className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700">
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      Tariffs & System Settings
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-rose-600 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
