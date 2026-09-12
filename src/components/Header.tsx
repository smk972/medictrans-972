import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg font-label-md text-label-md transition-all duration-150 ${
      isActive
        ? 'bg-primary-container text-on-primary font-bold shadow-xs'
        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.06)] border-b border-outline-variant/20">
      <div className="h-20 max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg flex items-center justify-between gap-space-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <img
            alt="Logo Médic'Trans Martinique"
            className="h-9 w-auto object-contain group-hover:scale-105 transition-transform"
            src="/assets/logo-icon.svg"
          />
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
              Médic'Trans
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold -mt-1">
              Martinique 972
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Accueil & Présentation
          </NavLink>
          <NavLink to="/reserver" className={navLinkClass}>
            Réserver un transport
          </NavLink>
          <NavLink to="/suivi" className={navLinkClass}>
            Mes Demandes
          </NavLink>
          <NavLink to="/droits-cpam" className={navLinkClass}>
            Droits CPAM
          </NavLink>
          <NavLink to="/etablissements" className={navLinkClass}>
            Portail Établissements
          </NavLink>
          <NavLink to="/transporteurs" className={navLinkClass}>
            Espace Transporteurs
          </NavLink>
        </nav>

        {/* Right Info & Profile */}
        <div className="flex items-center gap-space-md shrink-0">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">
                Disponible 24/7
              </span>
            </div>
            <a
              href="tel:0596720097"
              className="font-label-lg text-label-lg text-primary tracking-tight font-bold hover:text-primary-container transition-colors"
            >
              05 96 72 00 97
            </a>
          </div>

          <div className="flex items-center gap-space-sm pl-space-sm">
            <img
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover shadow-sm ring-1 ring-outline-variant/30"
              src="/assets/headshot.png"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface font-semibold leading-none">
                Coord. Clinique
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none mt-1">
                CHU P. Zobda-Quitman
              </span>
            </div>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
            aria-label="Menu de navigation"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-surface-container-lowest border-t border-outline-variant/30 px-margin py-space-md shadow-lg animate-fadeIn">
          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Accueil & Présentation
            </Link>
            <Link
              to="/reserver"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Réserver un transport
            </Link>
            <Link
              to="/suivi"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Mes Demandes
            </Link>
            <Link
              to="/droits-cpam"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Droits CPAM & Remboursement
            </Link>
            <Link
              to="/etablissements"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Portail Établissements (CHU / Cliniques)
            </Link>
            <Link
              to="/transporteurs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Espace Transporteurs (Dispatch)
            </Link>
          </nav>
          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="font-label-sm text-secondary font-bold">Régulation 24/7</span>
            </div>
            <a href="tel:0596720097" className="font-label-md font-bold text-primary">
              05 96 72 00 97
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
