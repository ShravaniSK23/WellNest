import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRoleHomePath } from '../components/auth/PublicRoute';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const homePath = getRoleHomePath(user?.role);
  const attemptedPath = (location.state as any)?.attemptedPath;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mb-6 shadow-md shadow-rose-200">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Restricted (403)</h1>
      <p className="text-sm text-slate-600 max-w-md mb-2">
        You do not have the required authorization or role permissions to access{' '}
        {attemptedPath ? <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">{attemptedPath}</code> : 'this section'}.
      </p>
      <p className="text-xs text-slate-500 mb-8">
        Your current role is: <span className="font-semibold text-slate-800">{user?.role || 'Guest'}</span>.
      </p>

      <div className="flex gap-4">
        <Link
          to={homePath}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Your Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
