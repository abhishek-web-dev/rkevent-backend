import React, { useState } from 'react';
import { Menu, LogOut, User, Settings, Bell, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  // Helper to map route paths to page titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/customers')) {
      if (path.includes('/trash')) return 'Customer Trash';
      if (path.includes('/add')) return 'Add Customer';
      if (path.includes('/edit')) return 'Edit Customer';
      return 'Customers';
    }
    if (path.startsWith('/invoices')) {
      if (path.includes('/trash')) return 'Invoice Trash';
      if (path.includes('/create')) return 'Create Invoice';
      if (path.includes('/details')) return 'Invoice Details';
      return 'Invoices';
    }
    if (path.startsWith('/payments')) return 'Payments';
    if (path.startsWith('/settings')) {
      if (path.includes('/profile')) return 'Settings - Profile';
      if (path.includes('/backup')) return 'Settings - Backup & System';
      return 'Settings - Company Config';
    }
    return 'RK Event System';
  };

  return (
    <header className="h-16 border-b border-white/5 bg-[#0F0B1A]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-[100]">
      <div className="flex items-center space-x-4">
        {/* Toggle Sidebar (Mobile) */}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white font-sans hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-6">
        {/* Notification Bell stub */}
        <button className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full" />
        </button>

        {/* User profile actions dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 text-slate-300 hover:text-white transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-brand/20 border border-brand/35 flex items-center justify-center text-brand font-bold text-sm">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-sm font-semibold hidden md:block select-none">{user?.name}</span>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden md:block" />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay to close on outside clicks */}
              <div onClick={() => setDropdownOpen(false)} className="fixed inset-0 z-40" />

              <div className="absolute right-0 mt-3.5 w-56 glass-card rounded-2xl p-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-white/5 mb-1.5">
                  <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
                </div>

                <Link
                  to="/settings/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/settings/company"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors font-medium mt-0.5"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium border-t border-white/5 mt-1.5 pt-2.5"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
