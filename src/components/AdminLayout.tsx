import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  urgentCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
  urgentCount = 0
}) => {
  const { user } = useAuth();
  const location = useLocation();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
      isActive
        ? 'bg-primary text-on-primary shadow-xs'
        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans">
      {/* Top Administration Bar */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Left: Logo + Administration Badge */}
            <div className="flex items-center gap-4">
              <Link to="/admin" className="flex items-center gap-2.5 shrink-0 group">
                <img
                  alt="Logo Médic'Trans"
                  className="h-8 w-auto object-contain group-hover:scale-105 transition-transform"
                  src="/assets/logo-icon.svg"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-sm sm:text-base text-primary font-extrabold tracking-tight">
                      Médic'Trans
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                      RÉGULATION 972
                    </span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant -mt-0.5">
                    Tour de Contrôle Sanitaire Régionale
                  </span>
                </div>
              </Link>
            </div>

            {/* Middle: Back-Office Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 bg-surface-container/60 p-1 rounded-2xl border border-outline-variant/20">
              <NavLink to="/admin" end className={navClass}>
                <span className="material-symbols-outlined text-lg">dashboard</span>
                <span>Tour de Contrôle</span>
              </NavLink>

              <NavLink to="/admin/supervision" className={navClass}>
                <span className="material-symbols-outlined text-lg">crisis_alert</span>
                <div className="flex items-center gap-1.5">
                  <span>Supervision Directe</span>
                  {urgentCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-error text-white animate-pulse">
                      {urgentCount}
                    </span>
                  )}
                </div>
              </NavLink>

              <NavLink to="/admin/transporteurs" className={navClass}>
                <span className="material-symbols-outlined text-lg">ambulance</span>
                <span>Transporteurs & Agréments</span>
              </NavLink>

              <NavLink to="/admin/etablissements" className={navClass}>
                <span className="material-symbols-outlined text-lg">local_hospital</span>
                <span>Établissements & Cadres</span>
              </NavLink>
            </nav>

            {/* Right: Status, User & Public Link */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-emerald-800">
                  Flux ARS/CGSS Connecté
                </span>
              </div>

              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  {user ? user.firstName[0]?.toUpperCase() : 'R'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-on-surface leading-none">
                    {user ? `${user.firstName} ${user.lastName}` : 'Régulation Centrale'}
                  </span>
                  <span className="text-[10px] text-on-surface-variant leading-none mt-1">
                    Cadre ARS Martinique
                  </span>
                </div>
              </div>

              {/* Link back to public site */}
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                title="Retour au portail patient / public"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                <span>Site Public</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden border-t border-outline-variant/20 px-4 py-2 bg-surface-container-low overflow-x-auto flex items-center gap-2">
          <NavLink to="/admin" end className={navClass}>
            Tour de Contrôle
          </NavLink>
          <NavLink to="/admin/supervision" className={navClass}>
            Supervision
          </NavLink>
          <NavLink to="/admin/transporteurs" className={navClass}>
            Transporteurs
          </NavLink>
          <NavLink to="/admin/etablissements" className={navClass}>
            Établissements
          </NavLink>
        </div>
      </header>

      {/* Page Header Title & Actions */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/30 py-5 px-4 sm:px-6 shadow-xs">
        <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>CONSOLE RÉGIONALE DE TRANSPORT SANITAIRE 972</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer Administration */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-4 px-4 sm:px-6 text-center text-xs text-on-surface-variant">
        <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Médic'Trans Martinique • Plateforme Territoriale de Régulation des Transports Sanitaires (ARS Martinique & CGSS 972)
          </span>
          <span className="font-mono text-[11px] text-outline">
            v2.4.0-prod • Horodatage BPEC certifié
          </span>
        </div>
      </footer>
    </div>
  );
};
