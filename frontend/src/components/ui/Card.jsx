import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, hoverEffect = false, ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'glass-card rounded-3xl p-6 relative overflow-hidden',
          hoverEffect && 'hover:border-white/10 hover:shadow-brand/5 hover:translate-y-[-2px] transition-all duration-300',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
