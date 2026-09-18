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
  badge,
  badgeAlwaysVisible = false,
  dark = false,
}) => {
  // Mode compact / icône
  if (variant === 'compact' || variant === 'icon-only') {
    return (
      <Link to={to} className={`flex items-center group shrink-0 ${className}`} title="clinigo.fr">
        <img
          src="/assets/clinigo-logo.png"
          alt="Clinigo"
          className="h-8 sm:h-9 w-auto max-w-[120px] object-contain shrink-0 group-hover:scale-105 transition-transform"
        />
      </Link>
    );
  }

  // Logo officiel authentique clinigo.fr (croix médicale avec route + texte + sous-titre)
  // Parfaitement proportionné pour le header sans aucune modification graphique
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      <Link
        to={to}
        className="flex items-center gap-2 group shrink-0"
        title="clinigo.fr - Transport Médical & Services"
      >
        <img
          src="/assets/clinigo-logo.png"
          alt="clinigo.fr - Transport Médical & Services"
          className="h-10 sm:h-11 md:h-12 w-auto max-h-[48px] object-contain shrink-0 group-hover:opacity-95 transition-opacity"
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
    </div>
  );
};
