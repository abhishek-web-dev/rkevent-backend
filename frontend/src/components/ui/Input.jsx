import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(
  ({ label, error, icon: Icon, className, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <Icon className="w-4 h-4" />
            </span>
          )}
          <input
            ref={ref}
            type={type}
            className={twMerge(
              clsx(
                'w-full py-3 pr-4 rounded-2xl glass-input text-white text-sm outline-none placeholder:text-slate-500',
                Icon ? 'pl-10' : 'pl-4',
                error ? 'border-rose-500/50 focus:border-rose-500 focus:box-shadow-rose' : '',
                className
              )
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-rose-500 text-xs font-medium mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
