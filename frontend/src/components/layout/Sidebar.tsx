import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Smile,
  Users,
  Search,
  Calendar,
  FileCheck,
  ShieldAlert,
  ClipboardList,
  Sliders,
  User,
  LogOut,
  LifeBuoy,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role;

  const renderNavLinks = () => {
    switch (role) {
      case 'HELP_SEEKER':
        return (
          <>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Wellness</div>
            <NavLink
              to="/dashboard"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-brand-600" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/moods"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Smile className="w-4 h-4 text-emerald-600" />
              <span>Mood Tracking</span>
            </NavLink>
            <NavLink
              to="/community"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>Community Forum</span>
            </NavLink>
            <NavLink
              to="/therapists"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Search className="w-4 h-4 text-indigo-600" />
              <span>Find Therapists</span>
            </NavLink>
          </>
        );

      case 'THERAPIST':
        return (
          <>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Therapist Workspace</div>
            <NavLink
              to="/therapist/portal"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Appointments</span>
            </NavLink>
            <NavLink
              to="/therapist/credentials"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Credentials & Status</span>
            </NavLink>
          </>
        );

      case 'MODERATOR':
        return (
          <>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Safety & Moderation</div>
            <NavLink
              to="/moderation"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-purple-50 text-purple-700 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              <span>Moderation Queue</span>
            </NavLink>
          </>
        );

      case 'ADMIN':
        return (
          <>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Administration</div>
            <NavLink
              to="/admin"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-amber-50 text-amber-800 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>Admin Center</span>
            </NavLink>
            <NavLink
              to="/admin/verifications"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-amber-50 text-amber-800 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>Therapist Verifications</span>
            </NavLink>
            <NavLink
              to="/admin/audit-logs"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-amber-50 text-amber-800 font-semibold shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <ClipboardList className="w-4 h-4 text-slate-600" />
              <span>Audit Logs</span>
            </NavLink>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        data-testid="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-35 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between p-4`}
      >
        <div className="space-y-6 overflow-y-auto">
          <nav className="space-y-1.5" aria-label="Role Navigation">
            {renderNavLinks()}
          </nav>
        </div>

        {/* Bottom Profile and Safety Links */}
        <div className="pt-4 border-t border-slate-200 space-y-1">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                isActive ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Profile & Security</span>
          </NavLink>

          <button
            type="button"
            onClick={() => {
              onClose();
              logout();
            }}
            data-testid="sidebar-logout-btn"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition text-left"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Sign Out</span>
          </button>

          <div className="mt-3 p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 text-[11px] text-rose-800 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Crisis Helpline: Dial 988 anytime</span>
          </div>
        </div>
      </aside>
    </>
  );
};
