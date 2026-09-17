import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-50/90 border-t border-slate-200/80 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="flex flex-col gap-3">
            <BrandLogo className="mb-1" />
            <p className="text-xs text-slate-600 leading-relaxed">
              Plateforme d'intermédiation et de régulation du transport sanitaire conventionné pour
              toute la Martinique (Ambulances, VSL et Taxis Conventionnés).
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-semibold self-start mt-1">
              <span className="material-symbols-outlined text-base text-teal-700">verified</span>
              <span>Opérateur Agréé ARS &amp; Conventionné CGSS 972</span>
            </div>
            <div className="flex flex-col gap-0.5 text-xs text-slate-500 mt-1">
              <span>Plateau Technique CHU Zobda-Quitman</span>
              <span>97200 Fort-de-France, Martinique</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Établissements Desservis
            </span>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600">
              <li>CHU de Martinique (P. Zobda-Quitman) - Fort-de-France</li>
              <li>Hôpital Mère-Enfant &amp; Clarac - Fort-de-France</li>
              <li>Hôpital Louis Domergue - La Trinité</li>
              <li>Hôpital du Saint-Esprit &amp; EHPAD</li>
              <li>Centre Hospitalier de Saint-Pierre</li>
              <li>Hôpital de Proximité - Le Marin</li>
              <li>Clinique Sainte-Marie - Schoelcher</li>
              <li>Clinique Saint-Paul - Fort-de-France</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Services &amp; Navigation
            </span>
            <ul className="flex flex-col gap-2 text-xs text-slate-600">
              <li>
                <Link to="/reserver" className="hover:text-slate-950 transition-colors">
                  Réserver un transport sanitaire
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-slate-950 font-semibold text-primary transition-colors flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">auto_stories</span>
                  <span>Guides, Conseils &amp; Blog</span>
                </Link>
              </li>
              <li>
                <Link to="/suivi" className="hover:text-slate-950 transition-colors">
                  Suivi de ma demande en direct
                </Link>
              </li>
              <li>
                <Link to="/droits-cpam" className="hover:text-slate-950 transition-colors">
                  Droits CPAM &amp; Prescription Médicale
                </Link>
              </li>
              <li>
                <Link to="/etablissements" className="hover:text-slate-950 transition-colors">
                  Portail Établissements de Santé
                </Link>
              </li>
              <li>
                <Link to="/transporteurs" className="hover:text-slate-950 transition-colors">
                  Espace Transporteurs Régulés
                </Link>
              </li>
              <li>
                <Link
                  to="/inscription/transporteur"
                  className="hover:text-slate-950 transition-colors"
                >
                  Adhésion Transporteur Sanitaire
                </Link>
              </li>
              <li>
                <Link
                  to="/offre-pro"
                  className="hover:text-slate-950 font-bold text-teal-700 transition-colors flex items-center gap-1.5"
                >
                  <span>Abonnement Pro 19,90 € (0% commission)</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">Offre</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Assistance &amp; Régulation 972
            </span>
            <p className="text-xs text-slate-600">
              Permanence d'accès aux soins et transfert médicalisé 24h/24 et 7j/7.
            </p>
            <a
              href="tel:0596720097"
              className="text-lg text-slate-900 font-extrabold hover:text-teal-700 transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg text-teal-600">call</span>
              05 96 72 00 97
            </a>
            <span className="text-xs text-slate-500">
              regulation@medtrans-mq.fr
            </span>
            <div className="mt-2 p-3 bg-white rounded-xl border border-rose-100 shadow-xs">
              <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs mb-1">
                <span className="material-symbols-outlined text-sm">emergency</span>
                Urgence Vitale Immédiate
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                En cas de détresse respiratoire ou circulatoire, contactez le{' '}
                <strong className="text-rose-600 font-bold">SAMU Centre 15</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/70 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} Clinigo (clinigo.fr) • Transport Médical &amp; Services. Plateforme certifiée HDS /
            ARS. Tous droits réservés.
          </span>
          <div className="flex items-center gap-4">
            <a href="#mentions" className="hover:text-slate-900 transition-colors">
              Mentions légales
            </a>
            <a href="#rgpd" className="hover:text-slate-900 transition-colors">
              Protection des données (RGPD Santé)
            </a>
            <a href="#cgu" className="hover:text-slate-900 transition-colors">
              Conditions Générales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
