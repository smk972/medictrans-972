import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  variant?: 'full' | 'compact';
  className?: string;
  subtitle?: string;
  badge?: string;
  badgeAlwaysVisible?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/',
  variant = 'full',
  className = '',
  subtitle = 'Réseau Médical Conventionné',
  badge = 'Pro v2',
  badgeAlwaysVisible = false,
}) => {
  return (
    <Link to={to} className={`flex items-center gap-2.5 group shrink-0 ${className}`}>
      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-teal-800 to-sky-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-900/20 group-hover:scale-105 transition-transform shrink-0">
        C
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
            clinigo<span className="text-teal-600">.fr</span>
          </span>
          {badge && (
            <span className={`${badgeAlwaysVisible ? 'inline-block' : 'hidden sm:inline-block'} px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200/80 uppercase tracking-wider`}>
              {badge}
            </span>
          )}
        </div>
        {variant !== 'compact' && subtitle && (
          <span className="text-[10px] font-semibold text-slate-600 tracking-wide">
            {subtitle}
          </span>
        )}
      </div>
    </Link>
  );
};
