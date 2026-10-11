import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="text-center sm:text-left">
          <p className="font-medium text-slate-700">WellNest Mental Wellness Support Portal &copy; 2026</p>
          <p className="mt-1 text-[11px] text-slate-500">
            <strong>Non-Diagnostic Disclaimer:</strong> Content, mood logs, and insights provided are informational and
            do not constitute clinical or medical diagnosis.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-rose-700 font-medium">Crisis Lifeline: Dial 988</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Privacy &amp; Safety First</span>
        </div>
      </div>
    </footer>
  );
};
