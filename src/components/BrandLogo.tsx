import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
  subtitle?: string;
  subtitleClassName?: string;
  badge?: string;
  badgeAlwaysVisible?: boolean;
  dark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/',
  variant = 'full',
  className = '',
  subtitle = 'Réseau Médical Conventionné',
  subtitleClassName = '',
  badge,
  badgeAlwaysVisible = false,
  dark = false,
}) => {
  if (variant === 'compact' || variant === 'icon-only') {
    return (
      <Link to={to} className={`flex items-center group shrink-0 ${className}`} title="Clinigo.fr">
        <img
          src="/assets/clinigo-icon.png"
          alt="Clinigo"
          className="w-9 h-9 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform shrink-0"
        />
      </Link>
    );
  }

  return (
    <div className={`flex flex-col shrink-0 ${className}`}>
      <Link to={to} className="flex items-center gap-2 group shrink-0">
        <img
          src={dark ? '/assets/clinigo-logo-white.png' : '/assets/clinigo-logo.png'}
          alt="clinigo.fr"
          className="h-7 sm:h-8 w-auto object-contain shrink-0 group-hover:opacity-90 transition-opacity"
        />
        {badge && (
          <span
            className={`${
              badgeAlwaysVisible ? 'inline-block' : 'hidden 2xl:inline-block'
            } px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit shrink-0 ${
              dark
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'bg-teal-50 text-teal-800 border border-teal-200/80'
            }`}
          >
            {badge}
          </span>
        )}
      </Link>
      {subtitle && (
        <span
          className={`text-[9px] font-semibold tracking-wide mt-0.5 pl-1 ${
            dark ? 'text-teal-200/60' : 'text-slate-500'
          } ${subtitleClassName}`}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};

