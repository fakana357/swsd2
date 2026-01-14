import React from 'react';
import { DieType } from '../types';

interface DieIconProps {
  type: DieType;
  value?: number;
  isCrit?: boolean;
  isRerolled?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const DieIcon: React.FC<DieIconProps> = ({ 
  type, value, isCrit, isRerolled, size = 'md', className = '' 
}) => {
  const getPath = (t: DieType) => {
    switch (t) {
      case 'd4':
        // Triangle moved up slightly to center the number better
        return "M12 1 L22 19 L2 19 Z";
      case 'd6':
        // Perfect Square
        return "M4 4 h16 v16 h-16 Z";
      case 'd8':
        // Hexagon Silhouette
        return "M12 4 L19 8 L19 16 L12 20 L5 16 L5 8 Z";
      case 'd10':
        // Rhombus (Square rotated 45 degrees)
        return "M12 2 L22 12 L12 22 L2 12 Z";
      case 'd12': 
        // Pentagonal Silhouette
        return "M12 2 L22 9 L18 21 L6 21 L2 9 Z";
      case 'd20': 
        // Perfectly regular Hexagon
        return "M12 2 L20.66 7 L20.66 17 L12 22 L3.34 17 L3.34 7 Z";
      default: 
        return "M3 3h18v18H3z";
    }
  };

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textSizes = {
    xs: 'text-[8px]',
    sm: 'text-xs',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-4xl',
  };

  const labelSizeClasses = {
    xs: 'hidden',
    sm: 'text-[7px]',
    md: 'text-[8px]',
    lg: 'text-[9px]',
    xl: 'text-[11px]',
  };

  const getDieColor = () => {
    if (isCrit) return 'text-red-500 fill-red-950/60';
    if (isRerolled) return 'text-yellow-400 fill-yellow-950/40';
    return 'text-zinc-500 fill-zinc-900/80 shadow-2xl';
  };

  return (
    <div className={`relative flex flex-col items-center transition-all duration-200 ${className}`}>
      <span className={`mb-0.5 font-black text-white/30 tracking-[0.1em] uppercase ${labelSizeClasses[size]}`}>
        {type}
      </span>

      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className={`${sizeClasses[size]} ${getDieColor()}`}
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d={getPath(type)} />
        </svg>

        {value !== undefined && (
          <span 
            className={`absolute inset-0 flex items-center justify-center font-saga font-bold leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
              isCrit ? 'text-white' : (isRerolled ? 'text-yellow-300' : 'text-zinc-100')
            } ${textSizes[size]}`}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
};

export default DieIcon;