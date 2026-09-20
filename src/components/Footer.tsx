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
              Plateforme d'intermédiation et de régulation du transport sanitaire conventionné en France (Ambulances, VSL et Taxis Conventionnés).
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-semibold self-start mt-1">
              <span className="material-symbols-outlined text-base text-teal-700">verified</span>
              <span>Opérateur Agréé ARS &amp; Conventionné Assurance Maladie (CPAM)</span>
            </div>
            <div className="flex flex-col gap-0.5 text-xs text-slate-500 mt-1">
              <span>Coordination Sanitaire Nationale</span>
              <span>Hexagone &amp; Départements d'Outre-Mer</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Réseau Hospitalier Desservi
            </span>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600">
              <li>Centres Hospitaliers Universitaires (CHU &amp; AP-HP)</li>
              <li>Hôpitaux Publics &amp; Centres Hospitaliers Généraux</li>
              <li>Cliniques Médico-Chirurgicales Conventionnées</li>
              <li>Centres de Lutte Contre le Cancer &amp; Radiothérapie</li>
              <li>Centres d'Hémodialyse &amp; Néphrologie</li>
              <li>Centres de Soins Médicaux et de Réadaptation (SMR)</li>
              <li>Établissements d'Hébergement pour Personnes Âgées (EHPAD)</li>
              <li>Réseaux CHU Outre-Mer (Martinique, Guadeloupe, Guyane, Réunion)</li>
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
                <Link to="/contact" className="hover:text-slate-950 font-medium transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-teal-700">mail</span>
                  <span>Contact &amp; Assistance (support@clinigo.fr)</span>
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

          {/* Col 4 - Support & Contact */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Support &amp; Assistance
            </span>
            <p className="text-xs text-slate-600">
              Une question sur une réservation, un devis conventionné ou vos démarches CPAM ?
            </p>

            <Link
              to="/contact"
              className="p-4 rounded-2xl bg-gradient-to-br from-teal-800 to-sky-950 text-white shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group flex flex-col gap-2 border border-teal-700/40"
              title="Accéder au formulaire de contact officiel Clinigo"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-teal-300">
                    <span className="material-symbols-outlined text-lg">mail</span>
                  </span>
                  <span className="text-xs font-bold text-white tracking-tight">Formulaire de Contact</span>
                </div>
                <span className="material-symbols-outlined text-base text-teal-300 group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
              <p className="text-[11px] text-teal-100/80 leading-snug">
                Écrire à notre équipe support avec choix du sujet
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-teal-200">
                <span className="font-mono font-medium">support@clinigo.fr</span>
                <span className="font-semibold text-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  Réponse rapide
                </span>
              </div>
            </Link>

            <div className="mt-1 p-3 bg-white rounded-xl border border-rose-100 shadow-xs">
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

        <div className="pt-8 border-t border-slate-200/70 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center md:text-left">
          <span>
            © {new Date().getFullYear()} Clinigo (clinigo.fr) • Transport Médical &amp; Services. Plateforme certifiée HDS /
            ARS. Tous droits réservés.
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
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
