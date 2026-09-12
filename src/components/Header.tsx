import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Phone, 
  Menu, 
  X, 
  Ambulance, 
  Calendar, 
  Building2, 
  Truck, 
  FileText, 
  MapPin 
} from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 shadow-xs">
      {/* Top Banner: Urgence médicale & Hotline */}
      <div className="bg-primary text-on-primary text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-error text-white font-bold px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
              Urgence Vitale
            </span>
            <span>En cas d'urgence absolue, composez immédiatement le <strong>15 (SAMU)</strong> ou le <strong>112</strong></span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="tel:0596552000" className="hover:underline flex items-center gap-1 opacity-90 hover:opacity-100">
              <Phone className="w-3 h-3" />
              Régulation Martinique : 0596 55 20 00
            </a>
            <span className="hidden md:inline text-white/50">|</span>
            <span className="hidden md:inline opacity-80">Réseau Conventionné CPAM & ARS Martinique</span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Ambulance className="w-7 h-7 text-secondary-container" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-primary flex items-center gap-1.5">
                Médic'Trans <span className="text-xs bg-secondary text-white font-bold px-1.5 py-0.5 rounded">972</span>
              </span>
              <span className="text-xs font-medium text-slate-500">
                Transport Sanitaire Régulé de Martinique
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link 
              to="/" 
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                isActive('/') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 hover:text-primary hover:bg-surface-container'
              }`}
            >
              Accueil
            </Link>

            <Link 
              to="/reserver" 
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/reserver') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 hover:text-primary hover:bg-surface-container'
              }`}
            >
              <Calendar className="w-4 h-4 text-primary" />
              Réserver
            </Link>

            <Link 
              to="/suivi" 
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/suivi') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 hover:text-primary hover:bg-surface-container'
              }`}
            >
              <MapPin className="w-4 h-4 text-secondary" />
              Suivi en direct
            </Link>

            <Link 
              to="/droits-cpam" 
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                isActive('/droits-cpam') 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-slate-600 hover:text-primary hover:bg-surface-container'
              }`}
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Droits CPAM
            </Link>

            <div className="h-6 w-[1px] bg-slate-200 mx-2" />

            {/* Portails Professionnels */}
            <Link 
              to="/etablissements" 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                isActive('/etablissements')
                  ? 'bg-primary text-white border-primary'
                  : 'text-primary border-primary/20 hover:bg-primary/5'
              }`}
              title="CHU & Cliniques"
            >
              <Building2 className="w-3.5 h-3.5" />
              Hôpitaux & Cliniques
            </Link>

            <Link 
              to="/transporteurs" 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                isActive('/transporteurs')
                  ? 'bg-secondary text-white border-secondary'
                  : 'text-secondary border-secondary/20 hover:bg-secondary/5'
              }`}
              title="Ambulanciers & Taxis"
            >
              <Truck className="w-3.5 h-3.5" />
              Espace Transporteur
            </Link>
          </nav>

          {/* Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/reserver"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-container shadow-sm hover:shadow transition-all duration-200"
            >
              Demande Express
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-primary hover:bg-surface-container focus:outline-hidden"
              aria-label="Menu principal"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link 
            to="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-surface-container"
          >
            Accueil
          </Link>
          <Link 
            to="/reserver" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-primary hover:bg-surface-container"
          >
            Réserver un transport médical
          </Link>
          <Link 
            to="/suivi" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-surface-container"
          >
            Suivi en direct (Dossier)
          </Link>
          <Link 
            to="/droits-cpam" 
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-surface-container"
          >
            Droits & Prise en charge CPAM
          </Link>
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Link 
              to="/etablissements" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs text-primary bg-primary/5"
            >
              <Building2 className="w-4 h-4" />
              Portail Hôpitaux & Cliniques (Sorties)
            </Link>
            <Link 
              to="/transporteurs" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-xs text-secondary bg-secondary/5"
            >
              <Truck className="w-4 h-4" />
              Espace Transporteurs (Dispatch)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
