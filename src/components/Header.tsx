import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAiChat } from '../context/AiChatContext';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { openChat } = useAiChat();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 px-2.5 2xl:px-3.5 py-2 rounded-xl text-xs xl:text-[13px] 2xl:text-sm font-semibold transition-all duration-150 inline-flex items-center justify-center leading-none ${isActive
      ? 'bg-primary-container text-on-primary font-bold shadow-xs'
      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
    }`;

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'FACILITY':
        return { label: 'Établissement', color: 'bg-secondary/15 text-secondary border-secondary/30' };
      case 'TRANSPORTER':
        return { label: 'Transporteur', color: 'bg-amber-500/15 text-amber-700 border-amber-500/30' };
      case 'ADMIN':
        return { label: 'Régulation', color: 'bg-purple-500/15 text-purple-700 border-purple-500/30' };
      case 'PATIENT':
      default:
        return { label: 'Patient / Famille', color: 'bg-primary/15 text-primary border-primary/30' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(11,28,48,0.06)] border-b border-outline-variant/20">
      <div className="h-20 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
          <img
            alt="Logo Médic'Trans Martinique"
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform shrink-0"
            src="/assets/logo-icon.svg"
          />
          <div className="flex flex-col justify-center">
            <span className="text-base sm:text-lg font-black text-primary tracking-tight leading-none whitespace-nowrap">
              Médic'Trans
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-secondary tracking-wider uppercase leading-none mt-1 whitespace-nowrap">
              Martinique 972
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1 2xl:gap-2 shrink-0">
          <NavLink to="/" end className={navLinkClass}>
            Accueil
          </NavLink>
          <NavLink to="/reserver" className={navLinkClass}>
            Réserver un transport
          </NavLink>
          <NavLink to="/suivi" className={navLinkClass}>
            Mes Demandes
          </NavLink>
          <NavLink to="/etablissements" className={navLinkClass}>
            Portail Établissements
          </NavLink>
          <NavLink to="/transporteurs" className={navLinkClass}>
            Espace Transporteurs
          </NavLink>
        </nav>

        {/* Right Info & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3 2xl:gap-4 shrink-0">
          {/* Bouton d'Aide sur le site (remplace l'ancien Régulation 24/7) */}
          <button
            type="button"
            id="btn-header-help-ai"
            onClick={() => openChat()}
            className="flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl bg-surface-container hover:bg-primary/10 text-primary border border-primary/20 hover:border-primary/40 font-bold text-xs transition-all shadow-2xs group shrink-0"
            title="Eva - Aide à la réservation"
          >
            <span className="material-symbols-outlined text-base sm:text-lg text-primary group-hover:scale-110 transition-transform">
              support_agent
            </span>
            <span className="hidden sm:inline whitespace-nowrap">Eva - Aide à la réservation</span>
          </button>

          {/* User Profile / Login Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="btn-header-profile"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 sm:px-2.5 rounded-2xl hover:bg-surface-container transition-all border border-outline-variant/30 text-left shrink-0"
                >
                  {user.avatarUrl ? (
                    <img
                      alt={user.firstName}
                      className="w-9 h-9 rounded-full object-cover shadow-xs ring-2 ring-primary/20 shrink-0"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-primary/20 shrink-0">
                      {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col max-w-[120px] 2xl:max-w-[160px]">
                    <span className="font-label-md text-label-md text-on-surface font-bold leading-tight truncate">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email?.split('@')[0] || 'Utilisateur')}
                    </span>
                    <span className="font-label-xs text-[11px] text-on-surface-variant leading-tight mt-0.5 truncate">
                      {user.facilityName || user.transporterName || roleBadge?.label}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-lg text-on-surface-variant hidden md:inline shrink-0">
                    {userDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface-container-lowest shadow-xl border border-outline-variant/30 py-2 z-50 animate-fadeIn">
                  <div className="px-4 py-2.5 border-b border-outline-variant/20">
                    <p className="text-xs font-semibold text-on-surface truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {user.email}
                    </p>
                    {roleBadge && (
                      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-purple-600">
                          tune
                        </span>
                        Tour de Contrôle & Supervision
                      </Link>
                    )}

                    {user.role === 'FACILITY' && (
                      <Link
                        to="/etablissements"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-secondary">
                          local_hospital
                        </span>
                        Portail Établissements (Sorties)
                      </Link>
                    )}

                    {user.role === 'TRANSPORTER' && (
                      <Link
                        to="/transporteurs"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-amber-600">
                          ambulance
                        </span>
                        Espace Dispatch Transporteur
                      </Link>
                    )}

                    <Link
                      to="/suivi"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">
                        history
                      </span>
                      Mes Demandes & Trajets
                    </Link>

                    <Link
                      to="/reserver"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-base text-primary">
                        add_circle
                      </span>
                      Nouvelle réservation
                    </Link>
                  </div>

                  <div className="border-t border-outline-variant/20 pt-1">
                    <button
                      type="button"
                      id="btn-dropdown-logout"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-base">
                        logout
                      </span>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton direct Déconnexion 1-clic sur grand écran */}
            <button
              id="btn-header-logout"
              type="button"
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-error/30 text-error hover:bg-error/10 text-xs font-bold transition-all duration-150 active:scale-95 shadow-2xs"
              title="Se déconnecter de votre compte à tout moment"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Déconnexion</span>
            </button>
          </div>
          ) : (
            <Link
              to="/connexion"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md font-bold shadow-sm hover:bg-primary-container hover:text-on-primary transition-all duration-150 active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              <span className="hidden sm:inline">Connexion</span>
              <span className="sm:hidden">Accès</span>
            </Link>
          )}

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
          {isAuthenticated && user ? (
            <div className="mb-4 p-3 rounded-2xl bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {user.avatarUrl ? (
                  <img
                    alt={user.firstName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-on-surface">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email?.split('@')[0] || 'Utilisateur')}
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    {user.email}
                  </div>
                </div>
              </div>
              <button
                type="button"
                id="btn-mobile-drawer-logout"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-error bg-error/10 hover:bg-error/20 transition-colors text-xs font-bold shrink-0"
                title="Déconnexion"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="mb-4">
              <Link
                to="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Se connecter / S'identifier</span>
              </Link>
            </div>
          )}

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
              Mes Demandes & Trajets
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
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-lg font-label-md font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors flex items-center justify-between"
            >
              <span>Tour de Contrôle & Régulation 972</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>

            {isAuthenticated && (
              <div className="pt-2 border-t border-outline-variant/20 mt-2">
                <button
                  id="btn-mobile-drawer-nav-logout"
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-error hover:bg-error/10 font-label-md font-bold transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Se déconnecter de mon compte</span>
                </button>
              </div>
            )}
          </nav>
          <div className="mt-4 pt-3 border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <button
              type="button"
              id="btn-mobile-help-ai"
              onClick={() => {
                setMobileMenuOpen(false);
                openChat();
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-base">support_agent</span>
              <span>Eva - Aide à la réservation</span>
            </button>
            <a href="tel:0596720097" className="font-label-md font-bold text-on-surface-variant text-xs flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">call</span>
              05 96 72 00 97
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
