import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from './BrandLogo';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

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

  // Cible de navigation dynamique : un transporteur connecté va directement sur son dashboard
  const transporterPath = isAuthenticated && user?.role === 'TRANSPORTER'
    ? '/portal-transporteur'
    : '/transporteurs';

  const profileDashboardPath = () => {
    if (!user) return '/connexion';
    switch (user.role) {
      case 'TRANSPORTER':
        return '/portal-transporteur';
      case 'FACILITY':
        return '/etablissements';
      case 'ADMIN':
        return '/profil';
      case 'PATIENT':
      default:
        return '/suivi';
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap shrink-0 px-2 lg:px-2.5 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-xs 2xl:text-sm font-medium transition-all duration-150 inline-flex items-center justify-center ${
      isActive
        ? 'bg-slate-900 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
    }`;

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'FACILITY':
        return { label: 'Établissement', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'TRANSPORTER':
        return { label: 'Transporteur', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'ADMIN':
        return { label: 'Régulation', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'PATIENT':
      default:
        return { label: 'Patient / Famille', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <header className="sticky top-3 sm:top-4 z-50 w-full px-3 sm:px-6">
      <div className="max-w-[1360px] mx-auto h-16 sm:h-[68px] rounded-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-3 sm:px-5 lg:px-6 flex items-center justify-between transition-all duration-300 gap-1.5 sm:gap-3">
        {/* Logo */}
        <BrandLogo subtitleClassName="hidden 2xl:inline-block" />

        {/* Desktop Nav (libellés concis et élégants; version longue uniquement dès 2xl: 1536px) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 shrink-0 min-w-0">
          <NavLink to="/reserver" className={navLinkClass}>
            <span className="hidden 2xl:inline">Réserver un transport</span>
            <span className="2xl:hidden">Réserver</span>
          </NavLink>
          <NavLink to="/suivi" className={navLinkClass}>
            Mes Demandes
          </NavLink>
          <NavLink
            to="/etablissements"
            className={({ isActive }) =>
              `whitespace-nowrap shrink-0 px-2.5 lg:px-3 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-xs 2xl:text-sm font-medium transition-all duration-150 inline-flex items-center justify-center ${
                isActive || location.pathname.startsWith('/etablissement')
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
              }`
            }
          >
            <span className="hidden 2xl:inline">Portail Établissements</span>
            <span className="2xl:hidden">Établissements</span>
          </NavLink>
          <NavLink
            to={transporterPath}
            className={({ isActive }) =>
              `whitespace-nowrap shrink-0 px-2.5 lg:px-3 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-xs 2xl:text-sm font-medium transition-all duration-150 inline-flex items-center justify-center ${
                isActive || location.pathname.startsWith('/portal-transporteur') || location.pathname.startsWith('/dispatch-transporteur')
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
              }`
            }
          >
            <span className="hidden 2xl:inline">Espace Transporteurs</span>
            <span className="2xl:hidden">Transporteurs</span>
          </NavLink>
          <NavLink
            to="/blog"
            className={({ isActive }) =>
              `whitespace-nowrap shrink-0 px-2.5 lg:px-3 2xl:px-3.5 py-1.5 2xl:py-2 rounded-xl text-xs 2xl:text-sm font-medium transition-all duration-150 inline-flex items-center gap-1.5 justify-center ${
                isActive || location.pathname.startsWith('/blog')
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
              }`
            }
            title="Consulter les guides, articles et conseils Clinigo"
          >
            <span className="material-symbols-outlined text-[17px] text-primary">auto_stories</span>
            <span className="hidden lg:inline">Guides &amp; Blog</span>
            <span className="lg:hidden">Blog</span>
          </NavLink>
        </nav>

        {/* Right Info & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 shrink-0">

          {/* User Profile / Login Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="btn-header-profile"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2 sm:py-1.5 rounded-full hover:bg-slate-100/80 transition-all border border-slate-200/80 text-left shrink min-w-0"
                >
                  {user.avatarUrl ? (
                    <img
                      alt={user.firstName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-slate-200 shrink-0"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs ring-2 ring-slate-200 shrink-0">
                      {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col min-w-0 max-w-[70px] lg:max-w-[85px] xl:max-w-[105px] 2xl:max-w-[150px]">
                    <span className="text-xs font-bold text-slate-900 leading-tight truncate" title={user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email)}>
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email?.split('@')[0] || 'Utilisateur')}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate" title={user.facilityName || user.transporterName || roleBadge?.label}>
                      {user.facilityName || user.transporterName || roleBadge?.label}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-base text-slate-500 hidden md:inline shrink-0">
                    {userDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/80 p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user.email}
                      </p>
                      {roleBadge && (
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.color}`}>
                          {roleBadge.label}
                        </span>
                      )}
                    </div>

                    <div className="py-1">
                      {user.role === 'FACILITY' && (
                        <Link
                          to="/etablissements"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/80 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-emerald-600">
                            local_hospital
                          </span>
                          Mon Portail Établissement
                        </Link>
                      )}

                      {user.role === 'TRANSPORTER' && (
                        <Link
                          to="/portal-transporteur"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-800 bg-amber-50/60 hover:bg-amber-100/80 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-amber-600">
                            ambulance
                          </span>
                          Mon Dashboard Transporteur
                        </Link>
                      )}

                      {/* Espace Mon Profil & Informations */}
                      <Link
                        to="/profil"
                        id="link-dropdown-profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50/70 hover:bg-teal-100/90 transition-colors border border-teal-200/50 mb-1"
                      >
                        <span className="material-symbols-outlined text-base text-teal-700">
                          manage_accounts
                        </span>
                        <span>Mon Profil &amp; Coordonnées</span>
                      </Link>

                      <Link
                        to="/suivi"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-slate-600">
                          history
                        </span>
                        Mes Demandes & Trajets
                      </Link>

                      <Link
                        to="/reserver"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-slate-600">
                          add_circle
                        </span>
                        Nouvelle réservation
                      </Link>

                      <Link
                        to="/blog"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base text-primary">
                          auto_stories
                        </span>
                        Guides &amp; Blog Clinigo
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        id="btn-dropdown-logout"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
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

              {/* Bouton direct Déconnexion 1-clic (icône compacte sous 2xl, texte dès 2xl) */}
              <button
                id="btn-header-logout"
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center justify-center gap-1.5 p-2 2xl:px-3.5 2xl:py-1.5 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rose-800 hover:to-rose-900 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                title="Se déconnecter"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span className="hidden 2xl:inline">Déconnexion</span>
              </button>
            </div>
          ) : (
            <Link
              to="/connexion"
              className="inline-flex items-center gap-2 px-3.5 xl:px-4 py-2 rounded-full bg-gradient-to-r from-teal-800 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white text-xs font-bold shadow-md shadow-teal-950/10 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Connexion</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
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
        <div className="md:hidden mt-2 max-w-7xl mx-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 p-4 shadow-2xl animate-fadeIn">
          {isAuthenticated && user ? (
            <div className="mb-4 p-3 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200/60">
              <Link
                to={profileDashboardPath()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                {user.avatarUrl ? (
                  <img
                    alt={user.firstName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200 shrink-0"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email?.split('@')[0] || 'Utilisateur')}</span>
                    <span className="material-symbols-outlined text-xs text-teal-600">arrow_forward</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {user.facilityName || user.transporterName || roleBadge?.label || user.email}
                  </div>
                </div>
              </Link>
              <button
                type="button"
                id="btn-mobile-drawer-logout"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors text-xs font-bold shrink-0"
                title="Déconnexion"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <Link
                to="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-800 to-sky-900 hover:from-teal-700 hover:to-sky-800 text-white font-bold text-sm shadow-md shadow-teal-950/15 transition-all"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>Se connecter</span>
              </Link>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Accueil & Présentation
            </Link>
            <Link
              to="/reserver"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Réserver un transport
            </Link>
            <Link
              to="/suivi"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Mes Demandes
            </Link>
            <Link
              to="/etablissements"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <span>Portail Établissements</span>
              {user?.role === 'FACILITY' && <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Mon Portail</span>}
            </Link>
            <Link
              to={transporterPath}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-between"
            >
              <span>Espace Transporteurs</span>
              {user?.role === 'TRANSPORTER' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Mon Dashboard</span>}
            </Link>
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base text-primary">auto_stories</span>
              <span>Guides &amp; Blog</span>
            </Link>
            {/* Espace Mon Profil Mobile */}
            {isAuthenticated && (
              <Link
                to="/profil"
                id="link-mobile-drawer-profile"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-bold text-teal-900 bg-teal-50/80 hover:bg-teal-100 transition-colors flex items-center justify-between border border-teal-200/60 my-1"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-teal-700">manage_accounts</span>
                  <span>Mon Profil &amp; Coordonnées</span>
                </div>
                <span className="material-symbols-outlined text-sm text-teal-700">arrow_forward</span>
              </Link>
            )}

            {isAuthenticated && (
              <div className="pt-2 border-t border-slate-100 mt-2">
                <button
                  id="btn-mobile-drawer-nav-logout"
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-sm font-semibold transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Se déconnecter</span>
                </button>
              </div>
            )}
          </nav>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5 py-1"
            >
              <span className="material-symbols-outlined text-sm text-teal-600">mail</span>
              <span>Contact &amp; Support (support@clinigo.fr)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
