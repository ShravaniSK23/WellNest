import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SessionExpiryModal } from '../auth/SessionExpiryModal';
import { MfaPromptModal } from '../auth/MfaPromptModal';
import { useAuth } from '../../hooks/useAuth';

export const Shell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        isSidebarOpen={sidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {isAuthenticated && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <main
          className={`flex-1 flex flex-col min-w-0 transition-all ${
            isAuthenticated ? 'lg:pl-64' : ''
          }`}
        >
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Global Modals for Session Expiry & MFA Challenges */}
      <SessionExpiryModal />
      <MfaPromptModal />
    </div>
  );
};
