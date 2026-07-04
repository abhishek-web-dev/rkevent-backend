import React from 'react';

export const Table = ({ children }) => (
  <div className="w-full overflow-x-auto scrollbar-thin">
    <table className="w-full text-left border-collapse">
      {children}
    </table>
  </div>
);

export const THead = ({ children }) => (
  <thead className="border-b border-white/5 bg-slate-900/40 sticky top-0 z-10 backdrop-blur-md">
    {children}
  </thead>
);

export const TBody = ({ children }) => (
  <tbody className="divide-y divide-white/5">
    {children}
  </tbody>
);

export const TH = ({ children, className = '' }) => (
  <th className={`py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400 ${className}`}>
    {children}
  </th>
);

export const TD = ({ children, className = '' }) => (
  <td className={`py-4 px-4 text-sm text-slate-200 ${className}`}>
    {children}
  </td>
);

export const TR = ({ children, className = '' }) => (
  <tr className={`hover:bg-white/[0.01] transition-colors ${className}`}>
    {children}
  </tr>
);
