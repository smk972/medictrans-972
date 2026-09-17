import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { SEOHead } from './SEOHead';
import { useAuth } from '../contexts/AuthContext';
import { BrandLogo } from './BrandLogo';

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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
      isActive
        ? 'bg-primary text-on-primary shadow-xs'
        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`;

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col font-sans">
      <SEOHead
        title={`${title} | Console de Régulation Clinigo`}
        description="Console d'administration et de régulation sanitaire régionale Clinigo."
        noIndex={true}
      />
      {/* Top Administration Bar */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/30 shadow-xs">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-2 xl:gap-4">
            {/* Left: Logo */}
            <div className="flex items-center gap-2.5 shrink-0">
              <BrandLogo to="/admin" />
            </div>

            {/* Middle: Back-Office Navigation Tabs (All 7 modules clearly visible) */}
            <nav className="hidden lg:flex items-center gap-0.5 bg-surface-container/60 p-1 rounded-2xl border border-outline-variant/20 shrink-0">
              <NavLink to="/admin" end className={navClass} title="Tour de Contrôle">
                <span className="material-symbols-outlined text-base">dashboard</span>
                <span>Contrôle</span>
              </NavLink>

              <NavLink to="/admin/supervision" className={navClass} title="Supervision Directe">
                <span className="material-symbols-outlined text-base">crisis_alert</span>
                <div className="flex items-center gap-1">
                  <span>Supervision</span>
                  {urgentCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-error text-white animate-pulse">
                      {urgentCount}
                    </span>
                  )}
                </div>
              </NavLink>

              <NavLink to="/admin/clients" className={navClass} title="Fiches Clients & PMT">
                <span className="material-symbols-outlined text-base">people</span>
                <span>Clients</span>
              </NavLink>

              <NavLink to="/admin/etablissements" className={navClass} title="Fiches Établissements">
                <span className="material-symbols-outlined text-base">local_hospital</span>
                <span>Établissements</span>
              </NavLink>

              <NavLink to="/admin/transporteurs" className={navClass} title="Sociétés de Transport & Agréments">
                <span className="material-symbols-outlined text-base">ambulance</span>
                <span>Transporteurs</span>
              </NavLink>

              <NavLink to="/admin/utilisateurs" className={navClass} title="Gouvernance des Comptes & Mots de passe">
                <span className="material-symbols-outlined text-base">manage_accounts</span>
                <span>Comptes</span>
              </NavLink>

              <NavLink to="/admin/parametres" className={navClass} title="Paramètres & Journal d'Audit">
                <span className="material-symbols-outlined text-base">tune</span>
                <span>Paramètres</span>
              </NavLink>

              <NavLink to="/admin/seo" className={navClass} title="Content Hub SEO & Générateur IA">
                <span className="material-symbols-outlined text-base text-amber-500">auto_awesome</span>
                <span>SEO AI</span>
              </NavLink>

              <NavLink to="/email-preview" className={navClass} title="Maquette E-mail de Bienvenue Resend">
                <span className="material-symbols-outlined text-base text-blue-600">mail</span>
                <span>E-mail</span>
              </NavLink>
            </nav>

            {/* Right: Status, User & Public Link */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Link to Guide PDF */}
              <a
                href="/Guide_Administrateur_MedicTrans_972.pdf"
                download="Guide_Administrateur_MedicTrans_972.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden 2xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-secondary/40 text-secondary hover:bg-secondary/10 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Télécharger le Guide d'Utilisation Administrateur (Format PDF)"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>Guide PDF</span>
              </a>

              {/* User badge */}
              <div className="flex items-center gap-2 pl-2 border-l border-outline-variant/30">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  {user ? (user.firstName?.[0]?.toUpperCase() || user.fullName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'R') : 'R'}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-on-surface">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Régulateur National'}
                  </span>
                  <span className="text-[10px] text-primary font-bold tracking-tight">
                    Régulation Sanitaire Nationale & DOM
                  </span>
                </div>
              </div>

              {/* Link back to public site */}
              <Link
                to="/"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                title="Retour au portail public"
              >
                <span className="material-symbols-outlined text-base">open_in_new</span>
                <span>Site</span>
              </Link>

              {/* Link to public blog */}
              <Link
                to="/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-primary hover:text-primary transition-colors"
                title="Consulter le Blog Public"
              >
                <span className="material-symbols-outlined text-base">auto_stories</span>
                <span>Blog</span>
              </Link>

              {/* Bouton Déconnexion Console Admin */}
              <button
                id="btn-logout-admin"
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rose-800 hover:to-rose-900 text-white text-xs font-bold shadow-md shadow-slate-950/10 active:scale-95 transition-all cursor-pointer"
                title="Se déconnecter de la console d'administration"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar (Horizontal Scroll for 7 modules) */}
        <div className="lg:hidden border-t border-outline-variant/20 px-3 py-2 bg-surface-container-low overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          <NavLink to="/admin" end className={navClass}>
            Contrôle
          </NavLink>
          <NavLink to="/admin/supervision" className={navClass}>
            Supervision
          </NavLink>
          <NavLink to="/admin/clients" className={navClass}>
            Clients
          </NavLink>
          <NavLink to="/admin/etablissements" className={navClass}>
            Établissements
          </NavLink>
          <NavLink to="/admin/transporteurs" className={navClass}>
            Transporteurs
          </NavLink>
          <NavLink to="/admin/utilisateurs" className={navClass}>
            Comptes
          </NavLink>
          <NavLink to="/admin/parametres" className={navClass}>
            Paramètres
          </NavLink>
          <NavLink to="/admin/seo" className={navClass}>
            SEO AI
          </NavLink>
          <a
            href="/Guide_Administrateur_MedicTrans_972.pdf"
            download="Guide_Administrateur_MedicTrans_972.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-secondary/40 text-secondary text-xs font-bold shrink-0"
          >
            PDF
          </a>
        </div>
      </header>

      {/* Page Header Title & Actions */}
      <section className="bg-surface-container-lowest border-b border-outline-variant/30 py-5 px-4 sm:px-6 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <span className="material-symbols-outlined text-sm">tune</span>
              <span>CONSOLE DE RÉGULATION NATIONALE & DOM</span>
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
          {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer Administration */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-4 px-4 sm:px-6 text-center text-xs text-on-surface-variant">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Clinigo (clinigo.fr) • Plateforme de Régulation des Transports Sanitaires (ARS &amp; CGSS)
          </span>
          <span className="font-mono text-[11px] text-outline">
            v2.5.0-prod • Horodatage BPEC certifié • Accès sécurisé
          </span>
        </div>
      </footer>
    </div>
  );
};
