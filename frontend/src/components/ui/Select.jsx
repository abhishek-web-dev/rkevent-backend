import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Select = forwardRef(
  ({ label, error, options = [], className, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={twMerge(
            clsx(
              'w-full py-3 px-4 rounded-2xl glass-input text-white text-sm outline-none bg-[#110b21] appearance-none cursor-pointer',
              error ? 'border-rose-500/50 focus:border-rose-500' : '',
              className
            )
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#110b21] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-rose-500 text-xs font-medium mt-1">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
