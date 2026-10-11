import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mb-6">
        <HelpCircle className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">Page Not Found (404)</h1>
      <p className="text-sm text-slate-600 max-w-md mb-8">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold text-sm hover:bg-slate-900 transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return Home</span>
      </Link>
    </div>
  );
};
