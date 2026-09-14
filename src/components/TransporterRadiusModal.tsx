import React, { useMemo, useState } from 'react';
import { calculateMartiniqueRoadDistance } from '../services/pricingService';
import { Ride } from '../types/index';
import {
  MARTINIQUE_COMMUNES_POLYGONS,
  MARTINIQUE_SVG_VIEWBOX,
  MARTINIQUE_UNITS_PER_KM,
  ALL_34_COMMUNES_NAMES,
  MartiniqueCommunePolygon,
} from '../data/martiniqueCommunesPolygons';

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
  const [hoveredCommune, setHoveredCommune] = useState<MartiniqueCommunePolygon | null>(null);
  const [showAllLabels, setShowAllLabels] = useState(true);

  // Commune de base active (centre du cercle d'action)
  const basePolygon = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[-'\s]/g, '');
    const found = MARTINIQUE_COMMUNES_POLYGONS.find((c) => norm(c.name) === norm(baseCommune));
    if (found) return found;
    const partial = MARTINIQUE_COMMUNES_POLYGONS.find(
      (c) => norm(c.name).includes(norm(baseCommune)) || norm(baseCommune).includes(norm(c.name))
    );
    return partial || MARTINIQUE_COMMUNES_POLYGONS.find((c) => c.name === 'Le Lamentin')!;
  }, [baseCommune]);

  // Centre du cercle d'action en coordonnées SVG
  const centerX = basePolygon.centroidX;
  const centerY = basePolygon.centroidY;

  // Rayon du cercle en unités SVG (~1000 unités par km)
  const circleRadiusSvg = radiusKm * MARTINIQUE_UNITS_PER_KM;

  // Analyse des communes : distance routière et géométrique par rapport à la base
  const communesAnalysis = useMemo(() => {
    return MARTINIQUE_COMMUNES_POLYGONS.map((c) => {
      const isBase = c.insee === basePolygon.insee;
      const roadDist = calculateMartiniqueRoadDistance(basePolygon.name, c.name).distanceKm;
      const geoDistUnits = Math.hypot(c.centroidX - centerX, c.centroidY - centerY);
      const isInside = roadDist <= radiusKm || geoDistUnits <= circleRadiusSvg;
      return {
        ...c,
        isBase,
        roadDist,
        geoDistKm: geoDistUnits / MARTINIQUE_UNITS_PER_KM,
        isInside,
      };
    });
  }, [basePolygon, centerX, centerY, circleRadiusSvg, radiusKm]);

  // Communes couvertes
  const coveredCommunes = useMemo(() => {
    return communesAnalysis.filter((c) => c.isInside);
  }, [communesAnalysis]);

  // Analyse des missions clientes reçues géoréférencées
  const missionsWithPosition = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[-'\s]/g, '');
    return allPendingMissions.map((m) => {
      const city = m.pickupCity || m.pickupAddress || '';
      const matched = MARTINIQUE_COMMUNES_POLYGONS.find((c) => norm(c.name) === norm(city)) ||
        MARTINIQUE_COMMUNES_POLYGONS.find((c) => city.toLowerCase().includes(c.name.toLowerCase())) ||
        basePolygon;

      const dist = calculateMartiniqueRoadDistance(basePolygon.name, city).distanceKm;
      const isInside = dist <= radiusKm;

      return {
        ...m,
        matchedCommune: matched,
        svgX: matched.centroidX,
        svgY: matched.centroidY,
        distanceFromBase: dist,
        isInside,
      };
    });
  }, [allPendingMissions, basePolygon, radiusKm]);

  const insideMissions = missionsWithPosition.filter((m) => m.isInside);
  const outsideMissions = missionsWithPosition.filter((m) => !m.isInside);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* EN-TÊTE DU MODAL                                                          */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-on-surface">
                  Rayon d'Action &amp; Cercle d'Intervention
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary text-white shadow-2xs">
                  {radiusKm} km
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/30">
                  34 Communes de Martinique
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
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
            title="Fermer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CORPS : CARTE SVG OFFICIELLE DES COMMUNES + PANNEAU DE CONTRÔLE           */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLONNE GAUCHE : CARTE DES COMMUNES MARTINIQUE (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-950 rounded-2xl p-3 relative overflow-hidden border border-slate-800 shadow-2xl min-h-[480px]">
            {/* Barre d'outils supérieure de la carte */}
            <div className="flex items-center justify-between gap-2 z-10 mb-2 px-1 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700/80 text-sky-300 font-bold flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
                  <span>Base : {basePolygon.name}</span>
                </div>
                <div className="bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-700/80 text-emerald-300 font-medium flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{coveredCommunes.length} communes couvertes</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowAllLabels(!showAllLabels)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    showAllLabels
                      ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                  title="Afficher ou masquer les noms des communes sur la carte"
                >
                  <span className="material-symbols-outlined text-xs align-middle mr-1">label</span>
                  {showAllLabels ? 'Noms visibles' : 'Noms masqués'}
                </button>
              </div>
            </div>

            {/* Visualiseur SVG interactif des 34 communes */}
            <div className="relative flex-1 flex items-center justify-center">
              <svg
                viewBox={MARTINIQUE_SVG_VIEWBOX}
                className="w-full h-full max-h-[560px] select-none"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
              >
                <defs>
                  {/* Grille cartographique / radar */}
                  <pattern id="marineGrid" width="4000" height="4000" patternUnits="userSpaceOnUse">
                    <path
                      d="M 4000 0 L 0 0 0 4000"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="60"
                      strokeOpacity="0.4"
                    />
                  </pattern>

                  {/* Dégradé de fond marin */}
                  <linearGradient id="oceanBgGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#080e1e" />
                    <stop offset="50%" stopColor="#0b1329" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Dégradé du cercle de rayon d'action */}
                  <radialGradient id="radiusCircleGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.30" />
                    <stop offset="70%" stopColor="#0284c7" stopOpacity="0.16" />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.65" />
                  </radialGradient>

                  {/* Dégradé de remplissage pour commune active dans le rayon */}
                  <linearGradient id="coveredCommuneGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0369a1" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.22" />
                  </linearGradient>

                  {/* Ombre portée pour lisibilité maximale des libellés */}
                  <filter id="labelShadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="80" stdDeviation="100" floodColor="#000000" floodOpacity="0.95" />
                  </filter>
                </defs>

                {/* 1. Fond Océan Atlantique & Mer des Caraïbes */}
                <rect width="45333" height="53138" fill="url(#oceanBgGradient)" rx="1200" />
                <rect width="45333" height="53138" fill="url(#marineGrid)" />

                {/* Rose des vents décorative / Orientation Nord */}
                <g transform="translate(4000, 48000)" opacity="0.4">
                  <circle r="2200" fill="none" stroke="#334155" strokeWidth="80" />
                  <path d="M 0 -2100 L 400 0 L 0 400 L -400 0 Z" fill="#38bdf8" />
                  <path d="M 0 2100 L 400 0 L 0 -400 L -400 0 Z" fill="#64748b" />
                  <text x="0" y="-2400" fill="#38bdf8" fontSize="1400" fontWeight="bold" textAnchor="middle">
                    N
                  </text>
                  <text x="0" y="3400" fill="#64748b" fontSize="1000" fontWeight="bold" textAnchor="middle">
                    Martinique (972)
                  </text>
                </g>

                {/* 2. Les 34 polygones des communes de Martinique */}
                <g id="communes-group">
                  {communesAnalysis.map((c) => {
                    const isHovered = hoveredCommune?.insee === c.insee;
                    let fill = '#1e293b';
                    let stroke = '#334155';
                    let strokeWidth = 120;

                    if (c.isBase) {
                      fill = '#0284c7';
                      stroke = '#38bdf8';
                      strokeWidth = 280;
                    } else if (c.isInside) {
                      fill = isHovered ? '#0284c7' : 'url(#coveredCommuneGradient)';
                      stroke = '#38bdf8';
                      strokeWidth = isHovered ? 260 : 160;
                    } else if (isHovered) {
                      fill = '#334155';
                      stroke = '#94a3b8';
                      strokeWidth = 200;
                    }

                    return (
                      <polygon
                        key={c.insee}
                        id={c.insee}
                        points={c.points}
                        fill={fill}
                        fillOpacity={c.isBase ? 0.65 : c.isInside ? 0.85 : 0.95}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeLinejoin="round"
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredCommune(c)}
                        onMouseLeave={() => setHoveredCommune(null)}
                        onClick={() => onBaseCommuneChange(c.name)}
                      />
                    );
                  })}
                </g>

                {/* 3. Anneaux concentriques guides de distance (10km, 25km, 45km) */}
                {[10, 25, 45].map((dist) => {
                  const r = dist * MARTINIQUE_UNITS_PER_KM;
                  return (
                    <g key={dist} pointerEvents="none">
                      <circle
                        cx={centerX}
                        cy={centerY}
                        r={r}
                        fill="none"
                        stroke="#475569"
                        strokeWidth="100"
                        strokeDasharray="400 400"
                        strokeOpacity="0.45"
                      />
                      <rect
                        x={centerX + r - 1200}
                        y={centerY - 550}
                        width="2400"
                        height="900"
                        rx="300"
                        fill="#0f172a"
                        fillOpacity="0.85"
                        stroke="#334155"
                        strokeWidth="50"
                      />
                      <text
                        x={centerX + r}
                        y={centerY + 60}
                        fill="#94a3b8"
                        fontSize="650"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {dist} km
                      </text>
                    </g>
                  );
                })}

                {/* 4. LE CERCLE DE RAYON D'ACTION (ÉLÉMENT DEMANDÉ PAR L'UTILISATEUR) */}
                <g pointerEvents="none">
                  {/* Surface circulaire translucide */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={circleRadiusSvg}
                    fill="url(#radiusCircleGradient)"
                    stroke="#0284c7"
                    strokeWidth="380"
                    strokeDasharray="900 450"
                    className="transition-all duration-300"
                  />

                  {/* Ondulation pulsante sur le pourtour */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={circleRadiusSvg}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="200"
                    opacity="0.5"
                    className="animate-ping"
                    style={{
                      transformOrigin: `${centerX}px ${centerY}px`,
                      animationDuration: '3.5s',
                    }}
                  />

                  {/* Poignée indicatrice sur la circonférence droite */}
                  <g transform={`translate(${centerX + circleRadiusSvg}, ${centerY})`}>
                    <circle r="650" fill="#0284c7" stroke="#ffffff" strokeWidth="180" />
                    <rect x="800" y="-600" width="3800" height="1200" rx="400" fill="#0284c7" stroke="#38bdf8" strokeWidth="80" />
                    <text x="2700" y="240" fill="#ffffff" fontSize="720" fontWeight="bold" textAnchor="middle">
                      {radiusKm} km
                    </text>
                  </g>
                </g>

                {/* 5. Noms des communes pour une lisibilité parfaite (Demande utilisateur) */}
                {showAllLabels && (
                  <g id="communes-labels" pointerEvents="none">
                    {communesAnalysis.map((c) => {
                      const isBase = c.isBase;
                      const isInside = c.isInside;

                      // Styles de texte calibrés
                      const fontSize = isBase ? 1200 : c.isMajor ? 1000 : 800;
                      const fontWeight = isBase || c.isMajor ? '900' : '700';
                      const textColor = isBase ? '#38bdf8' : isInside ? '#ffffff' : '#94a3b8';

                      return (
                        <g key={`lbl-${c.insee}`} transform={`translate(${c.labelX}, ${c.labelY})`}>
                          {/* Fond semi-opaque pour les communes majeures pour détacher le texte */}
                          {(isBase || c.isMajor) && (
                            <rect
                              x={-(c.name.length * (fontSize * 0.32) + 300)}
                              y={-(fontSize * 0.65)}
                              width={c.name.length * (fontSize * 0.64) + 600}
                              height={fontSize + 300}
                              rx="350"
                              fill="#090d16"
                              fillOpacity="0.75"
                              stroke={isBase ? '#38bdf8' : '#334155'}
                              strokeWidth={isBase ? '90' : '40'}
                            />
                          )}
                          <text
                            x="0"
                            y={fontSize * 0.25}
                            fill={textColor}
                            fontSize={fontSize}
                            fontWeight={fontWeight}
                            textAnchor="middle"
                            filter="url(#labelShadow)"
                            letterSpacing="15"
                          >
                            {isBase ? `📍 ${c.name}` : c.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* 6. Épingles des courses clientes réelles en attente */}
                <g id="client-missions-pins" pointerEvents="none">
                  {missionsWithPosition.map((m) => {
                    const isInside = m.isInside;
                    const color = isInside ? '#10b981' : '#f59e0b';
                    return (
                      <g key={m.id} transform={`translate(${m.svgX}, ${m.svgY})`}>
                        <circle r="750" fill={color} fillOpacity="0.4" className="animate-ping" />
                        <circle r="450" fill={color} stroke="#ffffff" strokeWidth="120" />
                        <rect
                          x="550"
                          y="-450"
                          width="3200"
                          height="900"
                          rx="300"
                          fill="#0f172a"
                          fillOpacity="0.9"
                          stroke={color}
                          strokeWidth="70"
                        />
                        <text x="2150" y="160" fill="#ffffff" fontSize="550" fontWeight="bold" textAnchor="middle">
                          #{m.reference}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* 7. Marqueur balise du dépôt de base */}
                <g transform={`translate(${centerX}, ${centerY})`} pointerEvents="none">
                  <circle r="1100" fill="#38bdf8" fillOpacity="0.3" className="animate-ping" />
                  <circle r="600" fill="#0284c7" stroke="#ffffff" strokeWidth="160" />
                  <circle r="250" fill="#ffffff" />
                </g>
              </svg>

              {/* Info-bulle flottante interactive au survol d'une commune */}
              {hoveredCommune && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-sky-500/40 text-xs text-white shadow-2xl flex items-center justify-between gap-3 animate-fadeIn pointer-events-none">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sky-400 text-lg">location_city</span>
                    <div>
                      <div className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>{hoveredCommune.name}</span>
                        {hoveredCommune.insee === basePolygon.insee && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/40">
                            Base actuelle
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Distance routière depuis {basePolygon.name} :{' '}
                        <strong>
                          {calculateMartiniqueRoadDistance(basePolygon.name, hoveredCommune.name).distanceKm.toFixed(1)} km
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {calculateMartiniqueRoadDistance(basePolygon.name, hoveredCommune.name).distanceKm <= radiusKm ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        Dans votre rayon
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        Hors zone
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Légende en bas de carte */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300 px-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Base d'intervention</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-600/50 border border-sky-400"></span>
                  <span>Commune dans le rayon ({coveredCommunes.length})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700"></span>
                  <span>Hors zone ({34 - coveredCommunes.length})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Demande cliente</span>
                </span>
              </div>
              <span className="text-slate-500 text-[9px]">Cadastre IGN 34 Communes • 972</span>
            </div>
          </div>

          {/* COLONNE DROITE : CONTRÔLES DU RAYON & CHOIX DE BASE (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              {/* Choix de la Commune de Base */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                  <span>Commune de base (Centre du cercle) :</span>
                </label>
                <select
                  id="modal-select-base-commune"
                  value={baseCommune}
                  onChange={(e) => onBaseCommuneChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest font-bold text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
                >
                  {ALL_34_COMMUNES_NAMES.map((communeName) => (
                    <option key={communeName} value={communeName}>
                      📍 {communeName} {communeName === 'Le Lamentin' ? '(Centre & Dépôt principal)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-on-surface-variant">
                  Astuce : vous pouvez aussi cliquer directement sur n'importe quelle commune de la carte pour la définir comme base.
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
                      {p === 60 ? "Toute l'île" : `${p} km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Case à cocher : Recevoir hors zone d'intervention */}
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

              {/* Synthèse de couverture sur les 34 communes de l'île */}
              <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 space-y-2 text-xs">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Communes couvertes :</span>
                  <span className="font-bold text-on-surface">
                    {coveredCommunes.length} / 34 communes de Martinique
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
