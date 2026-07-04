import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Badge = ({ children, className, variant = 'info', ...props }) => {
  const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border';
  
  const variants = {
    Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Partial: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Overdue: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    slate: 'bg-slate-800/50 text-slate-300 border-slate-750',
  };

  // Check if children text maps directly to a status
  const key = typeof children === 'string' ? children.trim() : variant;
  const currentVariant = variants[key] || variants[variant] || variants.info;

  return (
    <span className={twMerge(clsx(baseStyles, currentVariant, className))} {...props}>
      {children}
    </span>
  );
};

export default Badge;
