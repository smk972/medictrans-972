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
  // Icône seule / mode compact
  if (variant === 'compact' || variant === 'icon-only') {
    return (
      <Link to={to} className={`flex items-center group shrink-0 ${className}`} title="clinigo.fr">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 flex items-center justify-center font-extrabold text-white text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0 select-none">
          C
        </div>
      </Link>
    );
  }

  // Logo complet vectoriel : carré turquoise arrondi avec 'C' + texte clinigo.fr
  return (
    <div className={`flex flex-col shrink-0 ${className}`}>
      <Link to={to} className="flex items-center gap-2.5 group shrink-0" title="clinigo.fr">
        {/* Carré turquoise arrondi avec 'C' */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-600 flex items-center justify-center font-extrabold text-white text-base sm:text-lg shadow-sm group-hover:scale-105 transition-transform shrink-0 select-none">
          C
        </div>

        {/* Texte vectoriel clinigo.fr */}
        <div className="flex items-center gap-1.5">
          <span className={`text-lg sm:text-xl font-extrabold tracking-tight leading-none ${dark ? 'text-white' : 'text-slate-900'}`}>
            clinigo<span className={dark ? 'text-teal-400' : 'text-teal-600'}>.fr</span>
          </span>
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
        </div>
      </Link>
      {subtitle && (
        <span
          className={`text-[9px] font-semibold tracking-wide pl-1 mt-0.5 ${
            dark ? 'text-teal-200/60' : 'text-slate-500'
          } ${subtitleClassName}`}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
};
