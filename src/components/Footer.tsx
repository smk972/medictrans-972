import React from 'react';
import { Link } from 'react-router-dom';
import { Ambulance, Phone, ShieldCheck, HeartPulse, Building2, Truck, FileCheck } from 'lucide-react';
import { MARTINIQUE_COMMUNES } from '../services/rideService';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Col 1 & 2 : Description & Urgence */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <Ambulance className="w-6 h-6 text-secondary-container" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  Médic'Trans <span className="text-xs bg-secondary text-white font-bold px-1.5 py-0.5 rounded">972</span>
                </span>
                <p className="text-xs text-slate-400">Plateforme de Régulation Sanitaire de Martinique</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-400 leading-relaxed pr-6">
              Médic'Trans 972 centralise et simplifie l'accès aux transports sanitaires prescrits (Ambulances, Véhicules Sanitaires Légers et Taxis Conventionnés) sur l'ensemble de la Martinique, en étroite conformité avec les directives de la CPAM Martinique et de l'ARS.
            </p>

            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <HeartPulse className="w-4 h-4 text-error" />
                Numéros d'Urgence Territoriaux
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>SAMU Martinique : <span className="text-white font-bold">15</span></div>
                <div>Numéro Européen : <span className="text-white font-bold">112</span></div>
                <div>CHU Zobda-Quitman : <span className="text-white font-bold">0596 55 20 00</span></div>
                <div>Régulation Médic'Trans : <span className="text-secondary font-bold">0596 75 20 20</span></div>
              </div>
            </div>
          </div>

          {/* Col 3 : Accès Patients & Démarches */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-secondary" />
              Patients & Usagers
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/reserver" className="hover:text-white transition-colors">Réserver un transport</Link></li>
              <li><Link to="/suivi" className="hover:text-white transition-colors">Suivi de dossier en direct</Link></li>
              <li><Link to="/droits-cpam" className="hover:text-white transition-colors">Droits & Remboursement CPAM</Link></li>
              <li><Link to="/droits-cpam#pmt" className="hover:text-white transition-colors">Prescription Médicale (PMT)</Link></li>
              <li><Link to="/droits-cpam#ald" className="hover:text-white transition-colors">Prise en charge à 100% (ALD)</Link></li>
              <li><Link to="/droits-cpam#modes" className="hover:text-white transition-colors">Ambulance vs VSL vs Taxi</Link></li>
            </ul>
          </div>

          {/* Col 4 : Professionnels & Établissements */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary-fixed-dim" />
              Établissements
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/etablissements" className="hover:text-white transition-colors">Portail Sorties d'Hôpital</Link></li>
              <li><Link to="/inscription/etablissement" className="hover:text-white transition-colors">Conventionner un établissement</Link></li>
              <li><span className="text-slate-500">CHU Pierre Zobda-Quitman</span></li>
              <li><span className="text-slate-500">Clinique Sainte-Marie</span></li>
              <li><span className="text-slate-500">Hôpital Louis Domergue (Trinité)</span></li>
              <li><span className="text-slate-500">Centres de Dialyse & EHPAD</span></li>
            </ul>
          </div>

          {/* Col 5 : Transporteurs & Conventionnement */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-sm tracking-wide uppercase flex items-center gap-2">
              <Truck className="w-4 h-4 text-secondary-fixed" />
              Transporteurs
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/transporteurs" className="hover:text-white transition-colors">Console de Dispatch</Link></li>
              <li><Link to="/inscription/transporteur" className="hover:text-white transition-colors">Rejoindre le Réseau 972</Link></li>
              <li><span className="text-slate-400 text-xs">Agrément ARS Martinique exigé</span></li>
              <li><span className="text-slate-400 text-xs">Convention CPAM à jour</span></li>
              <li><span className="text-slate-400 text-xs">Tiers-payant automatisé</span></li>
            </ul>
          </div>

        </div>

        {/* 34 Communes de Martinique */}
        <div className="py-8 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Couverture intégrale des 34 communes de Martinique (Nord, Centre & Sud)
            </h4>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-slate-400">
            {MARTINIQUE_COMMUNES.map((commune, idx) => (
              <span key={commune} className="hover:text-white transition-colors cursor-default">
                {commune}{idx < MARTINIQUE_COMMUNES.length - 1 && <span className="text-slate-600 ml-3">•</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Mentions légales & RGPD */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Médic'Trans Martinique. Tous droits réservés. Service conforme HDS (Hébergeur Données de Santé) et RGPD.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/droits-cpam" className="hover:text-slate-300">Mentions Légales</Link>
            <Link to="/droits-cpam" className="hover:text-slate-300">Confidentialité & Données Médicales</Link>
            <Link to="/droits-cpam" className="hover:text-slate-300">Charte Déontologique</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
