import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAiChat } from '../context/AiChatContext';
import { BrandLogo } from './BrandLogo';

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
    `whitespace-nowrap shrink-0 px-3.5 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all duration-150 inline-flex items-center justify-center ${
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
    <header className="sticky top-3 sm:top-4 z-50 w-full px-4 sm:px-6">
      <div className="max-w-6xl mx-auto h-16 sm:h-[68px] rounded-full bg-white/85 backdrop-blur-xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-4 sm:px-6 flex items-center justify-between transition-all duration-300">
        {/* Logo */}
        <BrandLogo />

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1 sm:gap-1.5 shrink-0">
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
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Bouton Eva IA */}
          <button
            type="button"
            id="btn-header-help-ai"
            onClick={() => openChat()}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100/80 text-teal-800 border border-teal-200/70 font-semibold text-xs transition-all group shrink-0"
            title="Eva - Aide à la réservation"
          >
            <span className="material-symbols-outlined text-base text-teal-700 group-hover:scale-110 transition-transform">
              support_agent
            </span>
            <span className="whitespace-nowrap">Eva</span>
          </button>

          {/* User Profile / Login Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="btn-header-profile"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100/80 transition-all border border-slate-200/80 text-left shrink-0"
                >
                  {user.avatarUrl ? (
                    <img
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 shrink-0"
                      src={user.avatarUrl}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs ring-2 ring-slate-200 shrink-0">
                      {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="hidden md:flex flex-col max-w-[120px] 2xl:max-w-[150px]">
                    <span className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email?.split('@')[0] || 'Utilisateur')}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">
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
                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-purple-600">
                            tune
                          </span>
                          Supervision & Régulation
                        </Link>
                      )}

                      {user.role === 'FACILITY' && (
                        <Link
                          to="/etablissements"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-teal-600">
                            local_hospital
                          </span>
                          Portail Établissements
                        </Link>
                      )}

                      {user.role === 'TRANSPORTER' && (
                        <Link
                          to="/transporteurs"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-base text-amber-600">
                            ambulance
                          </span>
                          Espace Transporteurs
                        </Link>
                      )}

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

              {/* Bouton direct Déconnexion 1-clic */}
              <button
                id="btn-header-logout"
                type="button"
                onClick={handleLogout}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all active:scale-95"
                title="Se déconnecter"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <Link
              to="/connexion"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Connexion</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
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
        <div className="xl:hidden mt-2 max-w-7xl mx-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 p-4 shadow-2xl animate-fadeIn">
          {isAuthenticated && user ? (
            <div className="mb-4 p-3 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200/60">
              <div className="flex items-center gap-2.5">
                {user.avatarUrl ? (
                  <img
                    alt={user.firstName}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200"
                    src={user.avatarUrl}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                    {user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (user.fullName || user.email?.split('@')[0] || 'Utilisateur')}
                  </div>
                  <div className="text-xs text-slate-500">
                    {user.email}
                  </div>
                </div>
              </div>
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
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-sm hover:bg-slate-800 transition-all"
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
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Portail Établissements
            </Link>
            <Link
              to="/transporteurs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Espace Transporteurs
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center justify-between"
            >
              <span>Tour de Contrôle & Régulation</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>

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
            <button
              type="button"
              id="btn-mobile-help-ai"
              onClick={() => {
                setMobileMenuOpen(false);
                openChat();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 font-semibold text-xs hover:bg-teal-100 transition-colors"
            >
              <span className="material-symbols-outlined text-base">support_agent</span>
              <span>Eva - Aide à la réservation</span>
            </button>
            <a href="tel:0596720097" className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">call</span>
              05 96 72 00 97
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
