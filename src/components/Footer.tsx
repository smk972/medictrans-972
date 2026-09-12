import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-surface-container-low border-t border-outline-variant/30 mt-space-xl">
      <div className="max-w-[1280px] mx-auto px-margin md:px-margin-md lg:px-margin-lg py-space-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-xl mb-space-xl">
          {/* Col 1 */}
          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-2 mb-space-xs">
              <img
                src="/assets/logo-icon.svg"
                alt="Médic'Trans"
                className="w-7 h-7 object-contain"
              />
              <span className="font-headline-sm text-headline-sm text-primary font-bold">
                Médic'Trans Martinique
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Plateforme d'intermédiation et de régulation du transport sanitaire conventionné pour
              toute la Martinique (Ambulances, VSL et Taxis Conventionnés).
            </p>
            <div className="flex items-center gap-space-xs text-secondary font-label-md text-label-md mt-1">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Opérateur Agréé ARS &amp; Conventionné CGSS 972</span>
            </div>
            <div className="flex flex-col gap-0.5 text-xs text-on-surface-variant mt-2">
              <span>Plateau Technique CHU Zobda-Quitman</span>
              <span>97200 Fort-de-France, Martinique</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Établissements Desservis
            </span>
            <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
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
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Services &amp; Navigation
            </span>
            <ul className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
              <li>
                <Link to="/reserver" className="hover:text-primary transition-colors">
                  Réserver un transport sanitaire
                </Link>
              </li>
              <li>
                <Link to="/suivi" className="hover:text-primary transition-colors">
                  Suivi de ma demande en direct
                </Link>
              </li>
              <li>
                <Link to="/droits-cpam" className="hover:text-primary transition-colors">
                  Droits CPAM &amp; Prescription Médicale
                </Link>
              </li>
              <li>
                <Link to="/etablissements" className="hover:text-primary transition-colors">
                  Portail Établissements de Santé
                </Link>
              </li>
              <li>
                <Link to="/transporteurs" className="hover:text-primary transition-colors">
                  Espace Transporteurs Régulés
                </Link>
              </li>
              <li>
                <Link
                  to="/inscription/transporteur"
                  className="hover:text-primary transition-colors"
                >
                  Adhésion Transporteur Sanitaire
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface font-bold">
              Assistance &amp; Régulation 972
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Permanence d'accès aux soins et transfert médicalisé 24h/24 et 7j/7.
            </p>
            <a
              href="tel:0596720097"
              className="font-headline-sm text-headline-sm text-primary font-bold hover:text-primary-container transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-xl">call</span>
              05 96 72 00 97
            </a>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              regulation@medtrans-mq.fr
            </span>
            <div className="mt-2 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30">
              <div className="flex items-center gap-1.5 text-error font-bold text-xs mb-1">
                <span className="material-symbols-outlined text-sm">emergency</span>
                Urgence Vitale Immédiate
              </div>
              <p className="text-xs text-on-surface-variant">
                En cas de détresse respiratoire ou circulatoire, contactez le{' '}
                <strong className="text-error font-bold">SAMU Centre 15</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-space-lg border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-space-md text-xs text-on-surface-variant">
          <span>
            © {new Date().getFullYear()} Médic'Trans Martinique (972). Plateforme certifiée HDS /
            ARS Martinique. Tous droits réservés.
          </span>
          <div className="flex items-center gap-4">
            <a href="#mentions" className="hover:text-primary transition-colors">
              Mentions légales
            </a>
            <a href="#rgpd" className="hover:text-primary transition-colors">
              Protection des données (RGPD Santé)
            </a>
            <a href="#cgu" className="hover:text-primary transition-colors">
              Conditions Générales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
