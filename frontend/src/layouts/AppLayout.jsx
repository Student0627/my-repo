import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';

export default function AppLayout({ currentPage, onNavigate, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <TopNav
          currentPage={currentPage}
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          onNavigate={onNavigate}
        />

        <main className="flex-1 p-5 lg:p-7 max-w-6xl w-full mx-auto">
          {children}
        </main>

        <footer className="py-4 px-6 border-t border-slate-800/80 text-center text-xs text-slate-400">
          FineGuard • B.Tech CSE Final Year Project (Data Science & AI)
        </footer>
      </div>
    </div>
  );
}
