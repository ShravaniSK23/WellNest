import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Heart,
  Menu,
  X,
  User,
  LogOut,
  PhoneCall,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { CrisisResourceBanner } from '../common/CrisisResourceBanner';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'HELP_SEEKER':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-teal-100 text-teal-800">Help Seeker</span>;
      case 'THERAPIST':
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Therapist
          </span>
        );
      case 'MODERATOR':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">Moderator</span>;
      case 'ADMIN':
        return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 font-semibold">Admin</span>;
      default:
        return null;
    }
  };

  const displayName =
    user?.helpSeeker?.fullName ||
    user?.therapist?.fullName ||
    user?.email?.split('@')[0] ||
    'User';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Brand and Mobile Toggle */}
          <div className="flex items-center gap-3">
            {isAuthenticated && onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none"
                aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            )}

            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5 fill-white/20" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-brand-700 transition-colors">
                Well<span className="text-brand-600">Nest</span>
              </span>
            </Link>
          </div>

          {/* Right Actions: Crisis Trigger + User Status */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Direct Quick 988 Crisis Trigger */}
            <button
              type="button"
              onClick={() => setShowCrisisModal(true)}
              data-testid="navbar-crisis-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-rose-400"
              title="Immediate Crisis Lifeline 988"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">Crisis Support</span>
              <span className="font-extrabold">988</span>
            </button>

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  data-testid="user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-700"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-semibold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-slate-500">{user.email}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:inline" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
                    <div
                      data-testid="user-dropdown-menu"
                      className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-fade-in text-sm"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-medium text-slate-900 truncate">{displayName}</div>
                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                        <div className="mt-1.5">{getRoleBadge()}</div>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        data-testid="nav-profile-link"
                        className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        <span>Profile & Security</span>
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        data-testid="nav-logout-btn"
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-brand-700 transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden banner triggering modal if user clicked navbar crisis button */}
      {showCrisisModal && (
        <div className="p-2 bg-rose-100/80 border-t border-rose-200">
          <CrisisResourceBanner compact className="max-w-7xl mx-auto" />
        </div>
      )}
    </header>
  );
};
