import React from 'react';
import { NavLink } from 'react-router-dom';
import { Building, User, Database } from 'lucide-react';

const SettingsTabs = () => {
  const tabs = [
    { name: 'Company Configuration', path: '/settings/company', icon: Building },
    { name: 'Account Profile', path: '/settings/profile', icon: User },
    { name: 'System Backups', path: '/settings/backup', icon: Database },
  ];

  return (
    <div className="flex border-b border-white/5 space-x-1.5 mb-6 overflow-x-auto pb-px scrollbar-thin">
      {tabs.map((tab) => (
        <NavLink
          key={tab.name}
          to={tab.path}
          className={({ isActive }) =>
            `flex items-center space-x-2 px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all duration-150 whitespace-nowrap ${
              isActive
                ? 'border-brand-light text-brand-light font-bold bg-gradient-to-t from-brand-light/5 to-transparent'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <tab.icon className="w-4.5 h-4.5" />
          <span>{tab.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default SettingsTabs;
