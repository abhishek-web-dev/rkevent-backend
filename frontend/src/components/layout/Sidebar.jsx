import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Settings', path: '/settings/company', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-[#06040b]/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-45 w-64 bg-[#0a0715] border-r border-white/5 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0' : '-translate-x-0 -translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-light to-brand rounded-lg flex items-center justify-center shadow shadow-brand/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-wide font-sans">
              RK Event Backend
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => {
                if (isOpen) toggleSidebar(); // auto close on mobile clicks
              }}
              className={({ isActive }) =>
                `flex items-center space-x-3.5 px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-light/10 to-brand/20 text-brand-light border-l-4 border-brand-light shadow shadow-brand-light/5'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-4 border-transparent'
                }`
              }
            >
              <link.icon className="w-5 h-5" />
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profile Card Summary */}
        {user && (
          <div className="p-4 border-t border-white/5 m-4 bg-white/[0.01] rounded-2xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logged in as</p>
            <p className="text-sm font-semibold text-slate-200 mt-1 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize mt-0.5">{user.role}</p>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
