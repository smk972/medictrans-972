import React, { useMemo } from 'react';
import { calculateMartiniqueRoadDistance, resolveCoordinates } from '../services/pricingService';
import { Ride } from '../types/index';

export interface TransporterRadiusModalProps {
  isOpen: boolean;
  onClose: () => void;
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  includeOutsideRadius: boolean;
  onToggleIncludeOutside: (include: boolean) => void;
  baseCommune: string;
  onBaseCommuneChange: (commune: string) => void;
  allPendingMissions: Ride[];
}

const MAJOR_COMMUNES = [
  'Le Lamentin',
  'Fort-de-France',
  'Schœlcher',
  'Ducos',
  'Saint-Joseph',
  'Le Robert',
  'Le François',
  'Rivière-Salée',
  'La Trinité',
  'Sainte-Marie',
  'Le Lorrain',
  'Saint-Pierre',
  'Le Carbet',
  'Le Marin',
  'Sainte-Luce',
  'Le Diamant',
  'Les Trois-Îlets',
  'Le Vauclin',
  'Sainte-Anne',
  'Grand\'Rivière',
];

const COMMUNE_PINS = [
  { name: 'Le Lamentin', lat: 14.6152, lng: -60.9995 },
  { name: 'Fort-de-France', lat: 14.6161, lng: -61.0588 },
  { name: 'Schœlcher', lat: 14.6167, lng: -61.1000 },
  { name: 'Ducos', lat: 14.5753, lng: -60.9753 },
  { name: 'Saint-Joseph', lat: 14.6706, lng: -61.0378 },
  { name: 'Le Robert', lat: 14.6775, lng: -60.9392 },
  { name: 'Le François', lat: 14.6156, lng: -60.9028 },
  { name: 'Rivière-Salée', lat: 14.5297, lng: -60.9786 },
  { name: 'La Trinité', lat: 14.7381, lng: -60.9631 },
  { name: 'Sainte-Marie', lat: 14.7828, lng: -60.9933 },
  { name: 'Le Lorrain', lat: 14.8322, lng: -61.0558 },
  { name: 'Saint-Pierre', lat: 14.7422, lng: -61.1764 },
  { name: 'Le Carbet', lat: 14.7114, lng: -61.1814 },
  { name: 'Le Marin', lat: 14.4711, lng: -60.8697 },
  { name: 'Sainte-Luce', lat: 14.4683, lng: -60.9222 },
  { name: 'Le Diamant', lat: 14.4800, lng: -61.0286 },
  { name: 'Les Trois-Îlets', lat: 14.5381, lng: -61.0336 },
  { name: 'Le Vauclin', lat: 14.5458, lng: -60.8389 },
  { name: 'Sainte-Anne', lat: 14.4350, lng: -60.8814 },
  { name: 'Grand\'Rivière', lat: 14.8731, lng: -61.1794 },
];

const RADIUS_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export const TransporterRadiusModal: React.FC<TransporterRadiusModalProps> = ({
  isOpen,
  onClose,
  radiusKm,
  onRadiusChange,
  includeOutsideRadius,
  onToggleIncludeOutside,
  baseCommune,
  onBaseCommuneChange,
  allPendingMissions,
}) => {
  if (!isOpen) return null;

  // Calcul coordonnées de base
  const baseCoords = useMemo(() => {
    return resolveCoordinates(baseCommune);
  }, [baseCommune]);

  // Échelle de projection SVG pour la Martinique
  const MAP_WIDTH = 480;
  const MAP_HEIGHT = 500;
  const PADDING = 35;

  const projectCoords = (lat: number, lng: number) => {
    const minLat = 14.36;
    const maxLat = 14.90;
    const minLng = -61.25;
    const maxLng = -60.80;

    const x = PADDING + ((lng - minLng) / (maxLng - minLng)) * (MAP_WIDTH - 2 * PADDING);
    const y = PADDING + ((maxLat - lat) / (maxLat - minLat)) * (MAP_HEIGHT - 2 * PADDING);
    return { x, y };
  };

  // Facteur d'échelle pixel / km
  // 60 km d'envergure Nord-Sud sur (MAP_HEIGHT - 2*PADDING) px
  const pixelsPerKm = (MAP_HEIGHT - 2 * PADDING) / 59.8;
  const basePoint = projectCoords(baseCoords.lat, baseCoords.lng);
  const circlePixelRadius = Math.max(12, Math.min(radiusKm * pixelsPerKm, 450));

  // Analyse des missions clientes reçues par rapport au rayon
  const missionsWithDistance = useMemo(() => {
    return allPendingMissions.map((m) => {
      const dist = calculateMartiniqueRoadDistance(baseCommune, m.pickupCity || m.pickupAddress).distanceKm;
      const coords = resolveCoordinates(m.pickupCity || m.pickupAddress);
      const isInside = dist <= radiusKm;
      return {
        ...m,
        distanceFromBase: dist,
        coords,
        isInside,
      };
    });
  }, [allPendingMissions, baseCommune, radiusKm]);

  const insideMissions = missionsWithDistance.filter((m) => m.isInside);
  const outsideMissions = missionsWithDistance.filter((m) => !m.isInside);

  // Communes couvertes par le rayon actuel
  const coveredCommunes = useMemo(() => {
    return COMMUNE_PINS.filter((pin) => {
      const dist = calculateMartiniqueRoadDistance(baseCommune, pin.name).distanceKm;
      return dist <= radiusKm;
    });
  }, [baseCommune, radiusKm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-on-surface">
                  Rayon d'Action &amp; Cercle d'Intervention
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-2xs">
                  {radiusKm} km
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Réglez à l'aide du cercle la distance maximale pour recevoir les demandes clients en Martinique.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
            title="Fermer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Corps du Modal : Carte SVG Interactive + Panneau de Contrôle */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne Gauche : Visualiseur Cartographique Cercle Radar Martinique (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-4 relative overflow-hidden border border-slate-800 shadow-inner">
            {/* Légende radar */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 text-[10px] text-slate-300 pointer-events-none">
              <div className="bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span>Base : {baseCommune}</span>
              </div>
              <div className="bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-primary"></span>
                <span>Cercle : Rayon {radiusKm} km</span>
              </div>
            </div>

            {/* SVG Carte de Martinique avec Cercle Dynamique */}
            <svg
              viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
              className="w-full max-w-[420px] h-auto drop-shadow-md select-none"
            >
              <defs>
                {/* Dégradé du cercle de couverture */}
                <radialGradient id="radiusGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0e7490" stopOpacity="0.30" />
                  <stop offset="70%" stopColor="#0e7490" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0e7490" stopOpacity="0.05" />
                </radialGradient>

                {/* Motif radar */}
                <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
              </defs>

              {/* Grille de fond radar */}
              <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#radarGrid)" />

              {/* Silhouette géographique simplifiée et fidèle de la Martinique */}
              <path
                d="
                  M 155,55 
                  C 195,50 240,70 265,95 
                  C 285,115 315,130 350,150 
                  C 390,170 410,185 395,210 
                  C 375,225 330,225 305,230 
                  C 315,260 345,290 380,310 
                  C 390,325 385,345 365,365 
                  C 345,385 315,410 330,440 
                  C 310,465 285,465 265,445 
                  C 230,410 190,405 160,405 
                  C 140,405 130,380 150,360 
                  C 170,345 190,340 210,335 
                  C 200,315 170,300 150,295 
                  C 130,290 145,265 175,260 
                  C 165,240 145,220 130,200 
                  C 115,175 105,145 110,110 
                  C 115,85 135,60 155,55 Z
                "
                fill="#1e293b"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.6"
              />

              {/* Anneaux guides de distance concentriques (10km, 25km, 45km) */}
              {[10, 25, 45].map((dist) => {
                const r = dist * pixelsPerKm;
                return (
                  <g key={dist}>
                    <circle
                      cx={basePoint.x}
                      cy={basePoint.y}
                      r={r}
                      fill="none"
                      stroke="#475569"
                      strokeWidth="0.8"
                      strokeDasharray="3 3"
                      strokeOpacity="0.5"
                    />
                    <text
                      x={basePoint.x + r + 3}
                      y={basePoint.y - 3}
                      fill="#64748b"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {dist} km
                    </text>
                  </g>
                );
              })}

              {/* ========================================================================= */}
              {/* LE CERCLE DE RAYON D'ACTION (ÉLÉMENT DEMANDÉ PAR L'UTILISATEUR)          */}
              {/* ========================================================================= */}
              {/* Cercle plein dégradé */}
              <circle
                cx={basePoint.x}
                cy={basePoint.y}
                r={circlePixelRadius}
                fill="url(#radiusGradient)"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeDasharray="6 3"
                className="transition-all duration-300"
              />

              {/* Ondulation pulsante sur le pourtour */}
              <circle
                cx={basePoint.x}
                cy={basePoint.y}
                r={circlePixelRadius}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                opacity="0.4"
                className="animate-ping origin-center"
                style={{
                  transformOrigin: `${basePoint.x}px ${basePoint.y}px`,
                  animationDuration: '3s',
                }}
              />

              {/* Poignée indicatrice sur le bord droit du cercle */}
              <g
                transform={`translate(${basePoint.x + circlePixelRadius}, ${basePoint.y})`}
                className="cursor-pointer group"
              >
                <circle r="7" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <rect x="10" y="-10" width="46" height="20" rx="6" fill="#0369a1" />
                <text x="33" y="4" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                  {radiusKm} km
                </text>
              </g>

              {/* Marqueurs des communes de Martinique */}
              {COMMUNE_PINS.map((pin) => {
                const pt = projectCoords(pin.lat, pin.lng);
                const dist = calculateMartiniqueRoadDistance(baseCommune, pin.name).distanceKm;
                const isCovered = dist <= radiusKm;
                const isCurrentBase = pin.name === baseCommune;

                if (isCurrentBase) return null; // traité séparément pour la base

                return (
                  <g key={pin.name} className="cursor-pointer" onClick={() => onBaseCommuneChange(pin.name)}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isCovered ? 3.5 : 2}
                      fill={isCovered ? '#10b981' : '#64748b'}
                      opacity={isCovered ? 0.9 : 0.5}
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 5}
                      fill={isCovered ? '#cbd5e1' : '#475569'}
                      fontSize="8"
                      fontWeight={isCovered ? 'bold' : 'normal'}
                      textAnchor="middle"
                    >
                      {pin.name}
                    </text>
                  </g>
                );
              })}

              {/* Marqueurs des demandes clientes en attente (Rides PENDING) */}
              {missionsWithDistance.map((m) => {
                const pt = projectCoords(m.coords.lat, m.coords.lng);
                return (
                  <g key={m.id}>
                    {/* Pulsation si mission hors zone reçue */}
                    {!m.isInside && includeOutsideRadius && (
                      <circle cx={pt.x} cy={pt.y} r="8" fill="#f59e0b" opacity="0.3" className="animate-ping" />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5.5"
                      fill={m.isInside ? '#10b981' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <title>
                      {`Course #${m.reference} (${m.pickupCity}) • Distance : ${m.distanceFromBase} km • ${
                        m.isInside ? 'Dans votre rayon' : 'Hors zone d\'intervention'
                      }`}
                    </title>
                  </g>
                );
              })}

              {/* Marqueur de la BASE TRANSPORTEUR (Dépôt) au centre du cercle */}
              <g transform={`translate(${basePoint.x}, ${basePoint.y})`}>
                <circle r="14" fill="#0284c7" opacity="0.25" className="animate-pulse" />
                <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                <circle r="3" fill="#ffffff" />
                <rect x="-38" y="12" width="76" height="18" rx="5" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
                <text x="0" y="24" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  DÉPÔT BASE
                </text>
              </g>
            </svg>

            {/* Légende bas de carte */}
            <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Dans le rayon ({insideMissions.length})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Hors zone ({outsideMissions.length})</span>
                </span>
              </div>
              <span className="text-slate-500 text-[10px]">Martinique (972)</span>
            </div>
          </div>

          {/* Colonne Droite : Paramétrage & Contrôles du Cercle (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              {/* Choix de la Commune de Base */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span>Commune de base (Centre du cercle) :</span>
                </label>
                <select
                  value={baseCommune}
                  onChange={(e) => onBaseCommuneChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-bold text-xs text-on-surface outline-none focus:border-primary"
                >
                  {MAJOR_COMMUNES.map((c) => (
                    <option key={c} value={c}>
                      📍 {c} {c === 'Le Lamentin' ? '(Centre & Dépôt principal)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-on-surface-variant">
                  Le cercle d'action est calculé depuis le centre de cette commune.
                </p>
              </div>

              {/* Réglage du Rayon en km (Slider + Stepper) */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">radio_button_checked</span>
                    <span>Rayon d'action (Cercle) :</span>
                  </label>
                  <span className="text-xl font-black font-mono text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/25">
                    {radiusKm} km
                  </span>
                </div>

                {/* Slider interactif */}
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="1"
                  value={radiusKm}
                  onChange={(e) => onRadiusChange(Number(e.target.value))}
                  className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                />

                {/* Boutons presets rapides */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {RADIUS_PRESETS.map((p) => (
                    <button
                      key={p}
                      id={`modal-preset-${p}km`}
                      type="button"
                      onClick={() => onRadiusChange(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        radiusKm === p
                          ? 'bg-primary text-white shadow-xs'
                          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                    >
                      {p === 60 ? 'Toute l\'île' : `${p} km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* CASE À COCHER : RECEVOIR LES DEMANDES EN DEHORS DE LA ZONE D'INTERVENTION */}
              {/* ========================================================================= */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <label htmlFor="modal-include-outside" className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="modal-include-outside"
                    checked={includeOutsideRadius}
                    onChange={(e) => onToggleIncludeOutside(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded border-amber-400 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                  />
                  <div>
                    <span className="text-xs font-extrabold text-on-surface block leading-tight">
                      Recevoir également les demandes en dehors de ma zone d'intervention
                    </span>
                    <span className="text-[11px] text-on-surface-variant block mt-1 leading-relaxed">
                      Si cette case est cochée, les opportunités situées au-delà de votre rayon de{' '}
                      <strong>{radiusKm} km</strong> continueront à vous être proposées (signalées par un badge orange « Hors zone »).
                    </span>
                  </div>
                </label>
              </div>

              {/* Synthèse de couverture */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2 text-xs">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Communes couvertes :</span>
                  <span className="font-bold text-on-surface">
                    {coveredCommunes.length} / {COMMUNE_PINS.length} communes
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Demandes clientes dans le rayon :</span>
                  <span className="font-bold text-emerald-600">{insideMissions.length} reçue(s)</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Demandes hors zone d'intervention :</span>
                  <span className="font-bold text-amber-700">
                    {outsideMissions.length} {includeOutsideRadius ? 'reçue(s)' : 'masquée(s)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton de validation & fermeture */}
            <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2.5">
              <button
                id="btn-apply-radius-modal"
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
              >
                Appliquer ce rayon d'action ({radiusKm} km)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
