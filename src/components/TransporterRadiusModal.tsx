import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { calculateNationalRoadDistance } from '../services/pricingService';
import { Ride } from '../types/index';
import {
  TerritoryId,
  TerritoryZonePolygon,
  TERRITORIES_CONFIG,
  ALL_TERRITORIES_LIST,
  detectTerritoryFromAddress,
} from '../data/nationalTerritoriesData';
import { D3InteractiveGeoMap } from './D3InteractiveGeoMap';
import {
  searchNationalDatabase,
  GeoEntity,
  FRENCH_DEPARTMENTS_LIST,
  fetchDepartmentCommunes,
  reverseGeocode,
} from '../services/nationalGeoDatabase';

const BASE_COMMUNE_STORAGE_KEY = 'medictrans_transporter_base_commune';
const RADIUS_STORAGE_KEY = 'medictrans_transporter_radius_km';
const OUTSIDE_RADIUS_STORAGE_KEY = 'medictrans_transporter_include_outside';

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
  userAddress?: string;
  activeTerritory?: TerritoryId;
  onTerritoryChange?: (territory: TerritoryId) => void;
}

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
  userAddress = '',
  activeTerritory: controlledTerritory,
  onTerritoryChange,
}) => {
  // Territoire actif (auto-détecté ou sélectionné)
  const [internalTerritory, setInternalTerritory] = useState<TerritoryId>(() => {
    return controlledTerritory || detectTerritoryFromAddress(baseCommune || userAddress);
  });

  // Synchronise si le parent change explicitement le territoire
  useEffect(() => {
    if (controlledTerritory) {
      setInternalTerritory(controlledTerritory);
    }
  }, [controlledTerritory]);

  const activeTerritory = internalTerritory;
  const territoryConfig = TERRITORIES_CONFIG[activeTerritory] || TERRITORIES_CONFIG.MARTINIQUE;

  const [hoveredCommune, setHoveredCommune] = useState<TerritoryZonePolygon | null>(null);
  const [showAllLabels, setShowAllLabels] = useState(true);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [searchSuccessNotice, setSearchSuccessNotice] = useState<string | null>(null);

  // Moteur cartographique actif (D3 Géographique par défaut ou Radar vectoriel)
  const [mapEngine, setMapEngine] = useState<'D3_GEO' | 'RADAR_VECTOR'>('D3_GEO');
  const [databaseSearchResults, setDatabaseSearchResults] = useState<GeoEntity[]>([]);
  const [isSearchingDatabase, setIsSearchingDatabase] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<[number, number] | null>(null);

  // Département actif pour filtrage dynamique des communes & zoom automatique
  const [selectedDepartment, setSelectedDepartment] = useState<string>(() => {
    const active = controlledTerritory || detectTerritoryFromAddress(baseCommune || userAddress);
    if (active === 'GUADELOUPE') return '971';
    if (active === 'MARTINIQUE') return '972';
    if (active === 'GUYANE') return '973';
    if (active === 'REUNION') return '974';
    const match = (baseCommune || userAddress).match(/\b(0[1-9]|[1-8]\d|9[0-5]|2[abAB])\d{3}\b/);
    if (match) return match[1];
    return '75'; // Paris par défaut en métropole
  });

  const [departmentCommunesList, setDepartmentCommunesList] = useState<GeoEntity[]>([]);
  const [isLoadingDepartmentCommunes, setIsLoadingDepartmentCommunes] = useState(false);
  const [exactStreetAddress, setExactStreetAddress] = useState('');
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [geolocationNotice, setGeolocationNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Chargement des communes d'un département donné avec cache
  const loadDepartmentCommunes = useCallback(async (depCode: string) => {
    setIsLoadingDepartmentCommunes(true);
    try {
      const list = await fetchDepartmentCommunes(depCode);
      setDepartmentCommunesList(list);
      return list;
    } catch (err) {
      console.error('Erreur chargement communes département:', err);
      return [];
    } finally {
      setIsLoadingDepartmentCommunes(false);
    }
  }, []);

  // Initialisation à l'ouverture du modal uniquement
  useEffect(() => {
    if (isOpen) {
      const initialTerritory = controlledTerritory || detectTerritoryFromAddress(baseCommune || userAddress);
      setInternalTerritory(initialTerritory);

      let targetDep = '75';
      if (initialTerritory === 'GUADELOUPE') targetDep = '971';
      else if (initialTerritory === 'MARTINIQUE') targetDep = '972';
      else if (initialTerritory === 'GUYANE') targetDep = '973';
      else if (initialTerritory === 'REUNION') targetDep = '974';
      else {
        const match = (baseCommune || userAddress).match(/\b(0[1-9]|[1-8]\d|9[0-5]|2[abAB])\d{3}\b/);
        if (match) targetDep = match[1];
      }

      setSelectedDepartment(targetDep);
      loadDepartmentCommunes(targetDep);
    }
  }, [isOpen]); // Exécuté uniquement à l'ouverture du modal

  const handleSelectTerritory = async (territoryId: TerritoryId) => {
    setInternalTerritory(territoryId);
    setSelectedCoordinates(null);
    setExactStreetAddress('');
    setDepartmentCommunesList([]);
    if (onTerritoryChange) {
      onTerritoryChange(territoryId);
    }

    let defaultDep = '75';
    if (territoryId === 'GUADELOUPE') defaultDep = '971';
    else if (territoryId === 'MARTINIQUE') defaultDep = '972';
    else if (territoryId === 'GUYANE') defaultDep = '973';
    else if (territoryId === 'REUNION') defaultDep = '974';

    setSelectedDepartment(defaultDep);
    const targetConfig = TERRITORIES_CONFIG[territoryId];
    onBaseCommuneChange(targetConfig.defaultCommune);

    const communes = await loadDepartmentCommunes(defaultDep);
    if (communes.length > 0) {
      const matchDefault = communes.find((c: GeoEntity) => c.name.toLowerCase() === targetConfig.defaultCommune.toLowerCase());
      if (matchDefault) {
        setSelectedCoordinates(matchDefault.coordinates);
      } else {
        setSelectedCoordinates(communes[0].coordinates);
      }
    }
  };

  // Sélection d'un département (depuis le menu déroulant ou par clic sur la carte D3)
  const handleDepartmentSelect = async (depCode: string) => {
    setSelectedDepartment(depCode);
    const depInfo = FRENCH_DEPARTMENTS_LIST.find((d) => d.code === depCode);
    if (depInfo && depInfo.territoryId !== activeTerritory) {
      setInternalTerritory(depInfo.territoryId);
      if (onTerritoryChange) {
        onTerritoryChange(depInfo.territoryId);
      }
    }
    const communes = await loadDepartmentCommunes(depCode);
    if (communes.length > 0) {
      const exists = communes.some((c: GeoEntity) => c.name.toLowerCase() === baseCommune.toLowerCase());
      if (!exists) {
        onBaseCommuneChange(communes[0].name);
        setSelectedCoordinates(communes[0].coordinates);
      }
    }
    setSearchSuccessNotice(`📍 Département sélectionné : ${depInfo?.name || depCode}`);
    setTimeout(() => setSearchSuccessNotice(null), 3000);
  };

  // Géolocalisation GPS via le navigateur et reverse-geocoding haute précision
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeolocationNotice({
        type: 'error',
        message: "La géolocalisation n'est pas supportée par votre navigateur.",
      });
      setTimeout(() => setGeolocationNotice(null), 4500);
      return;
    }

    setIsGeolocating(true);
    setGeolocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { longitude, latitude } = pos.coords;
          const result = await reverseGeocode(longitude, latitude);

          if (result) {
            if (result.territoryId !== activeTerritory) {
              handleSelectTerritory(result.territoryId);
            }
            setSelectedDepartment(result.departmentCode);
            await loadDepartmentCommunes(result.departmentCode);
            onBaseCommuneChange(result.city || result.label);
            if (result.street) {
              setExactStreetAddress(result.label);
            }
            setSelectedCoordinates(result.coordinates);
            setGeolocationNotice({
              type: 'success',
              message: `Position détectée : ${result.label}`,
            });
            setSearchSuccessNotice(`📍 Géolocalisé : ${result.label}`);
          } else {
            setSelectedCoordinates([longitude, latitude]);
            setGeolocationNotice({
              type: 'success',
              message: `Position GPS : [${longitude.toFixed(4)}, ${latitude.toFixed(4)}]`,
            });
          }
        } catch (err) {
          console.error('Erreur géolocalisation:', err);
          setGeolocationNotice({
            type: 'error',
            message: 'Impossible de convertir votre position en adresse.',
          });
        } finally {
          setIsGeolocating(false);
          setTimeout(() => setGeolocationNotice(null), 5000);
          setTimeout(() => setSearchSuccessNotice(null), 4000);
        }
      },
      (err) => {
        setIsGeolocating(false);
        let msg = 'Erreur lors de la géolocalisation.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Veuillez autoriser l’accès à votre position GPS.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Signal GPS non disponible.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Délai GPS dépassé.';
        }
        setGeolocationNotice({ type: 'error', message: msg });
        setTimeout(() => setGeolocationNotice(null), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Commune de base active (centre du cercle d'action)
  const basePolygon = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[-'\s]/g, '');
    const found = territoryConfig.zones.find((c) => norm(c.name) === norm(baseCommune));
    if (found) return found;

    const partial = territoryConfig.zones.find(
      (c) => norm(c.name).includes(norm(baseCommune)) || norm(baseCommune).includes(norm(c.name))
    );
    return partial || territoryConfig.zones.find((c) => c.name === territoryConfig.defaultCommune) || territoryConfig.zones[0];
  }, [territoryConfig, baseCommune]);

  // Centre du cercle d'action en coordonnées SVG
  const centerX = basePolygon.centroidX;
  const centerY = basePolygon.centroidY;

  // Rayon du cercle en unités SVG selon l'échelle métrique du territoire
  const circleRadiusSvg = radiusKm * territoryConfig.unitsPerKm;

  // Analyse des communes : distance routière et géométrique par rapport à la base
  const communesAnalysis = useMemo(() => {
    return territoryConfig.zones.map((c) => {
      const isBase = c.insee === basePolygon.insee;
      const roadDist = calculateNationalRoadDistance(basePolygon.name, c.name, activeTerritory).distanceKm;
      const geoDistUnits = Math.hypot(c.centroidX - centerX, c.centroidY - centerY);
      const isInside = roadDist <= radiusKm || geoDistUnits <= circleRadiusSvg;
      return {
        ...c,
        isBase,
        roadDist,
        geoDistKm: geoDistUnits / territoryConfig.unitsPerKm,
        isInside,
      };
    });
  }, [territoryConfig, basePolygon, centerX, centerY, circleRadiusSvg, radiusKm, activeTerritory]);

  // Communes couvertes
  const coveredCommunes = useMemo(() => {
    return communesAnalysis.filter((c) => c.isInside);
  }, [communesAnalysis]);

  // Analyse des missions clientes reçues géoréférencées dans ce territoire
  const missionsWithPosition = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().replace(/[-'\s]/g, '');
    return allPendingMissions
      .map((m) => {
        const city = m.pickupCity || m.pickupAddress || '';
        const matched =
          territoryConfig.zones.find((c) => norm(c.name) === norm(city)) ||
          territoryConfig.zones.find((c) => city.toLowerCase().includes(c.name.toLowerCase()));

        if (!matched) return null;

        const dist = calculateNationalRoadDistance(basePolygon.name, city, activeTerritory).distanceKm;
        const isInside = dist <= radiusKm;

        return {
          ...m,
          matchedCommune: matched,
          svgX: matched.centroidX,
          svgY: matched.centroidY,
          distanceFromBase: dist,
          isInside,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [allPendingMissions, territoryConfig, basePolygon, radiusKm, activeTerritory]);

  const insideMissions = missionsWithPosition.filter((m) => m.isInside);
  const outsideMissions = missionsWithPosition.filter((m) => !m.isInside);

  // Coordonnées GPS géographiques de base [longitude, latitude]
  const baseCoords = useMemo<[number, number]>(() => {
    if (selectedCoordinates) return selectedCoordinates;
    if (basePolygon && basePolygon.lng && basePolygon.lat) {
      return [basePolygon.lng, basePolygon.lat];
    }
    if (activeTerritory === 'GUADELOUPE') return [-61.533, 16.241];
    if (activeTerritory === 'MARTINIQUE') return [-61.002, 14.615];
    if (activeTerritory === 'GUYANE') return [-52.333, 4.937];
    if (activeTerritory === 'REUNION') return [55.450, -20.882];
    return [2.3488, 48.8534]; // Paris
  }, [selectedCoordinates, basePolygon, activeTerritory]);

  // Recherche indépendante via la base de données (locale + geo.api.gouv.fr)
  const handleAddressSearch = async (query: string) => {
    setAddressSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setDatabaseSearchResults([]);
      setShowSuggestionsDropdown(false);
      return;
    }

    // Auto-détection préliminaire du territoire par code postal
    const detectedTerritory = detectTerritoryFromAddress(query);
    if (detectedTerritory !== activeTerritory && query.trim().length >= 3) {
      handleSelectTerritory(detectedTerritory);
    }

    setIsSearchingDatabase(true);
    setShowSuggestionsDropdown(true);

    try {
      const results = await searchNationalDatabase(query);
      setDatabaseSearchResults(results);
    } catch (err) {
      console.error('Erreur recherche nationale:', err);
    } finally {
      setIsSearchingDatabase(false);
    }
  };

  // Sélection d'une entité dans la liste des résultats de recherche
  const handleSelectDatabaseEntity = (entity: GeoEntity) => {
    setAddressSearchQuery(entity.name);
    setShowSuggestionsDropdown(false);

    if (entity.territoryId !== activeTerritory) {
      handleSelectTerritory(entity.territoryId);
    }

    if (entity.type === 'street' && entity.street) {
      setExactStreetAddress(entity.name);
    }

    if (entity.type === 'department') {
      handleDepartmentSelect(entity.code);
    } else {
      const depCode = entity.code.length >= 2 ? entity.code.slice(0, 2) : '';
      if (depCode && FRENCH_DEPARTMENTS_LIST.some((d) => d.code === depCode)) {
        setSelectedDepartment(depCode);
        loadDepartmentCommunes(depCode);
      }
      onBaseCommuneChange(entity.name);
      setSelectedCoordinates(entity.coordinates);
    }

    setSearchSuccessNotice(`📍 Sélectionné : ${entity.name}`);
    setTimeout(() => setSearchSuccessNotice(null), 3500);
  };

  const handleApply = () => {
    if (onTerritoryChange && activeTerritory) {
      onTerritoryChange(activeTerritory);
    }
    if (onBaseCommuneChange && baseCommune) {
      onBaseCommuneChange(baseCommune);
    }
    if (onRadiusChange && radiusKm) {
      onRadiusChange(radiusKm);
    }
    if (onToggleIncludeOutside) {
      onToggleIncludeOutside(includeOutsideRadius);
    }
    try {
      localStorage.setItem('clinigo_transporter_territory', activeTerritory);
      localStorage.setItem(BASE_COMMUNE_STORAGE_KEY, baseCommune);
      localStorage.setItem(RADIUS_STORAGE_KEY, String(radiusKm));
      localStorage.setItem(OUTSIDE_RADIUS_STORAGE_KEY, String(includeOutsideRadius));
      if (exactStreetAddress) {
        localStorage.setItem('medictrans_transporter_street_address', exactStreetAddress);
      }
    } catch (e) {}
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* ========================================================================= */}
        {/* EN-TÊTE DU MODAL : TITRE, BADGES & SÉLECTEUR DE TERRITOIRE NATIONAL       */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low/60 space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
                  <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
                  <path d="M16.24 7.76A6 6 0 1 0 8.23 16.24" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-on-surface tracking-tight">
                    Rayon d'Action &amp; Cercle d'Intervention
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-extrabold bg-primary text-white shadow-2xs">
                    {radiusKm} km
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-surface-container text-on-surface border border-outline-variant/30">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary">
                      {territoryConfig.code}
                    </span>
                    <span>{territoryConfig.name}</span>
                    <span className="text-on-surface-variant font-medium">({territoryConfig.zones.length} zones)</span>
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  La carte interactive et les communes s'adaptent dynamiquement à votre secteur ({territoryConfig.name}).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
              title="Fermer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Onglets de sélection des territoires */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant mr-1.5 shrink-0 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Territoire :</span>
            </span>
            {ALL_TERRITORIES_LIST.map((t) => {
              const isActive = t.id === activeTerritory;
              return (
                <button
                  key={t.id}
                  id={`tab-territory-${t.id.toLowerCase()}`}
                  type="button"
                  onClick={() => handleSelectTerritory(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-container-high text-primary'
                  }`}>
                    {t.code}
                  </span>
                  <span>{t.shortName}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CORPS : CARTE SVG OFFICIELLE DES COMMUNES + PANNEAU DE CONTRÔLE           */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLONNE GAUCHE : CARTE RADAR VECTORIELLE (7 COLS) */}
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
                  <span>
                    {coveredCommunes.length} / {territoryConfig.zones.length} couvert(e)s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setMapEngine('D3_GEO')}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      mapEngine === 'D3_GEO'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Carte interactive D3 avec zoom, pan et contours administratifs réels"
                  >
                    D3 Carto Gouv
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapEngine('RADAR_VECTOR')}
                    className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      mapEngine === 'RADAR_VECTOR'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Vue radar vectorielle synthétique"
                  >
                    Radar Synthétique
                  </button>
                </div>

                {mapEngine === 'RADAR_VECTOR' && (
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
                    {showAllLabels ? 'Noms visibles' : 'Noms masqués'}
                  </button>
                )}
              </div>
            </div>

            {/* Moteur 1 : Carte vectorielle D3 officielle simplifiée (Zoom, Pan, Noms adaptatifs) */}
            {mapEngine === 'D3_GEO' ? (
              <div className="relative flex-1 w-full min-h-[480px]">
                <D3InteractiveGeoMap
                  territoryId={activeTerritory}
                  baseCoordinates={baseCoords}
                  baseName={baseCommune}
                  exactAddress={exactStreetAddress}
                  radiusKm={radiusKm}
                  selectedDepartmentCode={activeTerritory === 'METROPOLE' ? selectedDepartment : null}
                  onGeolocate={handleGeolocate}
                  onSelectDepartment={(dept) => {
                    handleDepartmentSelect(dept.code);
                  }}
                  onSelectEntity={(entity) => {
                    if (entity.type === 'street') {
                      if (entity.street) setExactStreetAddress(entity.street);
                      onBaseCommuneChange(entity.name);
                      setSelectedCoordinates(entity.coordinates);
                      setSearchSuccessNotice(`📍 Adresse sélectionnée : ${entity.name}`);
                    } else if (entity.type === 'department') {
                      handleDepartmentSelect(entity.code);
                    } else {
                      onBaseCommuneChange(entity.name);
                      setSelectedCoordinates(entity.coordinates);
                      setSearchSuccessNotice(`📍 Base sélectionnée : ${entity.name} [${entity.code}]`);
                    }
                    setTimeout(() => setSearchSuccessNotice(null), 3000);
                  }}
                />
              </div>
            ) : (
              /* Moteur 2 : Visualiseur SVG interactif classique */
              <div className="relative flex-1 flex items-center justify-center">
              <svg
                viewBox={territoryConfig.viewBox}
                className="w-full h-full max-h-[560px] select-none"
                style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))' }}
              >
                <defs>
                  {/* Grille cartographique / radar */}
                  <pattern
                    id={`marineGrid-${activeTerritory}`}
                    width={territoryConfig.width / 12}
                    height={territoryConfig.height / 12}
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d={`M ${territoryConfig.width / 12} 0 L 0 0 0 ${territoryConfig.height / 12}`}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth={territoryConfig.width / 800}
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
                    <feDropShadow
                      dx="0"
                      dy={territoryConfig.width / 600}
                      stdDeviation={territoryConfig.width / 500}
                      floodColor="#000000"
                      floodOpacity="0.95"
                    />
                  </filter>
                </defs>

                {/* 1. Fond cartographique océanique */}
                <rect
                  width={territoryConfig.width}
                  height={territoryConfig.height}
                  fill="url(#oceanBgGradient)"
                  rx={territoryConfig.width / 40}
                />
                <rect
                  width={territoryConfig.width}
                  height={territoryConfig.height}
                  fill={`url(#marineGrid-${activeTerritory})`}
                />

                {/* Rose des vents décorative / Orientation Nord */}
                <g transform={`translate(${territoryConfig.width * 0.1}, ${territoryConfig.compassY})`} opacity="0.45">
                  <circle r={territoryConfig.width / 22} fill="none" stroke="#334155" strokeWidth={territoryConfig.width / 550} />
                  <path
                    d={`M 0 -${territoryConfig.width / 24} L ${territoryConfig.width / 110} 0 L 0 ${territoryConfig.width / 110} L -${territoryConfig.width / 110} 0 Z`}
                    fill="#38bdf8"
                  />
                  <path
                    d={`M 0 ${territoryConfig.width / 24} L ${territoryConfig.width / 110} 0 L 0 -${territoryConfig.width / 110} L -${territoryConfig.width / 110} 0 Z`}
                    fill="#64748b"
                  />
                  <text
                    x="0"
                    y={-territoryConfig.width / 20}
                    fill="#38bdf8"
                    fontSize={territoryConfig.width / 32}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    N
                  </text>
                  <text
                    x="0"
                    y={territoryConfig.width / 16}
                    fill="#94a3b8"
                    fontSize={territoryConfig.width / 45}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {territoryConfig.name}
                  </text>
                  <text
                    x="0"
                    y={territoryConfig.width / 12}
                    fill="#64748b"
                    fontSize={territoryConfig.width / 60}
                    textAnchor="middle"
                  >
                    {territoryConfig.seaLabel}
                  </text>
                </g>

                {/* 2. Polygones des communes / zones */}
                <g id="communes-group">
                  {communesAnalysis.map((c) => {
                    const isHovered = hoveredCommune?.insee === c.insee;
                    const strokeWidthBase = territoryConfig.width / 380;
                    let fill = '#1e293b';
                    let stroke = '#334155';
                    let strokeWidth = strokeWidthBase;

                    if (c.isBase) {
                      fill = '#0284c7';
                      stroke = '#38bdf8';
                      strokeWidth = strokeWidthBase * 2.3;
                    } else if (c.isInside) {
                      fill = isHovered ? '#0284c7' : 'url(#coveredCommuneGradient)';
                      stroke = '#38bdf8';
                      strokeWidth = isHovered ? strokeWidthBase * 2 : strokeWidthBase * 1.3;
                    } else if (isHovered) {
                      fill = '#334155';
                      stroke = '#94a3b8';
                      strokeWidth = strokeWidthBase * 1.6;
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

                {/* 3. Anneaux concentriques guides de distance */}
                {territoryConfig.distanceRings.map((dist) => {
                  const r = dist * territoryConfig.unitsPerKm;
                  const labelW = territoryConfig.width / 18;
                  const labelH = territoryConfig.height / 55;
                  const fontSz = territoryConfig.width / 70;
                  return (
                    <g key={dist} pointerEvents="none">
                      <circle
                        cx={centerX}
                        cy={centerY}
                        r={r}
                        fill="none"
                        stroke="#475569"
                        strokeWidth={territoryConfig.width / 500}
                        strokeDasharray={`${territoryConfig.width / 120} ${territoryConfig.width / 120}`}
                        strokeOpacity="0.45"
                      />
                      <rect
                        x={centerX + r - labelW / 2}
                        y={centerY - labelH / 2}
                        width={labelW}
                        height={labelH}
                        rx={labelH / 3}
                        fill="#0f172a"
                        fillOpacity="0.85"
                        stroke="#334155"
                        strokeWidth={territoryConfig.width / 1000}
                      />
                      <text
                        x={centerX + r}
                        y={centerY + fontSz * 0.35}
                        fill="#94a3b8"
                        fontSize={fontSz}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {dist} km
                      </text>
                    </g>
                  );
                })}

                {/* 4. LE CERCLE DE RAYON D'ACTION INTERACTIF */}
                <g pointerEvents="none">
                  {/* Surface circulaire translucide */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={circleRadiusSvg}
                    fill="url(#radiusCircleGradient)"
                    stroke="#0284c7"
                    strokeWidth={territoryConfig.width / 120}
                    strokeDasharray={`${territoryConfig.width / 50} ${territoryConfig.width / 100}`}
                    className="transition-all duration-300"
                  />

                  {/* Ondulation pulsante */}
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={circleRadiusSvg}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={territoryConfig.width / 250}
                    opacity="0.5"
                    className="animate-ping"
                    style={{
                      transformOrigin: `${centerX}px ${centerY}px`,
                      animationDuration: '3.5s',
                    }}
                  />

                  {/* Poignée indicatrice sur la circonférence droite */}
                  <g transform={`translate(${centerX + circleRadiusSvg}, ${centerY})`}>
                    <circle
                      r={territoryConfig.width / 70}
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth={territoryConfig.width / 260}
                    />
                    <rect
                      x={territoryConfig.width / 55}
                      y={-territoryConfig.height / 90}
                      width={territoryConfig.width / 12}
                      height={territoryConfig.height / 45}
                      rx={territoryConfig.height / 120}
                      fill="#0284c7"
                      stroke="#38bdf8"
                      strokeWidth={territoryConfig.width / 600}
                    />
                    <text
                      x={territoryConfig.width / 55 + territoryConfig.width / 24}
                      y={territoryConfig.height / 200}
                      fill="#ffffff"
                      fontSize={territoryConfig.width / 60}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {radiusKm} km
                    </text>
                  </g>
                </g>

                {/* 5. Noms des communes pour une lisibilité parfaite */}
                {showAllLabels && (
                  <g id="communes-labels" pointerEvents="none">
                    {communesAnalysis.map((c) => {
                      const isBase = c.isBase;
                      const isInside = c.isInside;

                      const baseFont = territoryConfig.width / 45;
                      const fontSize = isBase ? baseFont * 1.15 : c.isMajor ? baseFont : baseFont * 0.8;
                      const fontWeight = isBase || c.isMajor ? '900' : '700';
                      const textColor = isBase ? '#38bdf8' : isInside ? '#ffffff' : '#94a3b8';

                      return (
                        <g key={`lbl-${c.insee}`} transform={`translate(${c.labelX}, ${c.labelY})`}>
                          {(isBase || c.isMajor) && (
                            <rect
                              x={-(c.name.length * (fontSize * 0.32) + fontSize * 0.25)}
                              y={-(fontSize * 0.65)}
                              width={c.name.length * (fontSize * 0.64) + fontSize * 0.5}
                              height={fontSize + fontSize * 0.25}
                              rx={fontSize * 0.3}
                              fill="#090d16"
                              fillOpacity="0.75"
                              stroke={isBase ? '#38bdf8' : '#334155'}
                              strokeWidth={isBase ? territoryConfig.width / 500 : territoryConfig.width / 1100}
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

                {/* 6. Missions clientes géoréférencées dans ce territoire */}
                <g id="client-missions-pins" pointerEvents="none">
                  {missionsWithPosition.map((m) => {
                    const isInside = m.isInside;
                    const color = isInside ? '#10b981' : '#f59e0b';
                    const pinR = territoryConfig.width / 70;
                    return (
                      <g key={m.id} transform={`translate(${m.svgX}, ${m.svgY})`}>
                        <circle r={pinR * 1.4} fill={color} fillOpacity="0.4" className="animate-ping" />
                        <circle r={pinR} fill={color} stroke="#ffffff" strokeWidth={territoryConfig.width / 400} />
                        <rect
                          x={pinR * 1.2}
                          y={-pinR}
                          width={territoryConfig.width / 15}
                          height={pinR * 2}
                          rx={pinR * 0.6}
                          fill="#0f172a"
                          fillOpacity="0.9"
                          stroke={color}
                          strokeWidth={territoryConfig.width / 700}
                        />
                        <text
                          x={pinR * 1.2 + territoryConfig.width / 30}
                          y={pinR * 0.35}
                          fill="#ffffff"
                          fontSize={territoryConfig.width / 80}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          #{m.reference}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* 7. Marqueur balise du dépôt de base */}
                <g transform={`translate(${centerX}, ${centerY})`} pointerEvents="none">
                  <circle
                    r={territoryConfig.width / 40}
                    fill="#38bdf8"
                    fillOpacity="0.3"
                    className="animate-ping"
                  />
                  <circle
                    r={territoryConfig.width / 75}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth={territoryConfig.width / 280}
                  />
                  <circle r={territoryConfig.width / 180} fill="#ffffff" />
                </g>
              </svg>

              {/* Info-bulle flottante au survol */}
              {hoveredCommune && (
                <div className="absolute bottom-3 left-3 right-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-sky-500/40 text-xs text-white shadow-2xl flex items-center justify-between gap-3 animate-fadeIn pointer-events-none">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div>
                      <div className="font-extrabold text-sm text-white flex items-center gap-2">
                        <span>{hoveredCommune.name}</span>
                        {hoveredCommune.postalCode && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                            {hoveredCommune.postalCode}
                          </span>
                        )}
                        {hoveredCommune.insee === basePolygon.insee && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/40">
                            Base actuelle
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">
                        Distance routière depuis {basePolygon.name} :{' '}
                        <strong>
                          {calculateNationalRoadDistance(basePolygon.name, hoveredCommune.name, activeTerritory).distanceKm.toFixed(1)} km
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {calculateNationalRoadDistance(basePolygon.name, hoveredCommune.name, activeTerritory).distanceKm <= radiusKm ? (
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
          )}

            {/* Légende en bas de carte */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-300 px-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <span>Base d'intervention</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-600/50 border border-sky-400"></span>
                  <span>Dans le rayon ({coveredCommunes.length})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700"></span>
                  <span>Hors zone ({territoryConfig.zones.length - coveredCommunes.length})</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Demande cliente</span>
                </span>
              </div>
              <span className="text-slate-500 text-[9px]">
                {territoryConfig.name} • {territoryConfig.zones.length} Zones
              </span>
            </div>
          </div>

          {/* COLONNE DROITE : CONTRÔLES DU RAYON & CHOIX DE BASE (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* CARTE 1 : POINT D'ANCRAGE & COMMUNE DE BASE */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-black text-on-surface uppercase tracking-wider block">
                      Point d'ancrage & Commune de base
                    </span>
                  </div>
                </div>

                {/* Bouton Géolocalisation GPS direct */}
                <button
                  id="btn-geolocate-user"
                  type="button"
                  onClick={handleGeolocate}
                  disabled={isGeolocating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Détecter automatiquement ma position GPS"
                >
                  <svg className={`w-3.5 h-3.5 text-primary ${isGeolocating ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="22" y1="12" x2="18" y2="12" />
                    <line x1="6" y1="12" x2="2" y2="12" />
                    <line x1="12" y1="6" x2="12" y2="2" />
                    <line x1="12" y1="22" x2="12" y2="18" />
                  </svg>
                  <span>{isGeolocating ? 'GPS...' : 'Me géolocaliser'}</span>
                </button>
              </div>

              {geolocationNotice && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border animate-fadeIn ${
                    geolocationNotice.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700'
                  }`}
                >
                  <span className="font-semibold">{geolocationNotice.message}</span>
                </div>
              )}

              {/* Recherche intelligente par adresse / rue / code postal */}
              <div className="relative">
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-on-surface-variant pointer-events-none">
                    <svg className="w-3.5 h-3.5 text-on-surface-variant" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    id="input-address-search"
                    type="text"
                    value={addressSearchQuery}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    onFocus={() => {
                      if (databaseSearchResults.length > 0) setShowSuggestionsDropdown(true);
                    }}
                    placeholder="Rechercher une adresse, commune, code postal..."
                    className="w-full pl-9 pr-9 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary placeholder:text-on-surface-variant/50 shadow-xs"
                  />
                  {isSearchingDatabase && (
                    <span className="absolute right-3 w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                  )}
                </div>

                {/* Suggestions dropdown */}
                {showSuggestionsDropdown && databaseSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-outline-variant/10">
                    <div className="px-3 py-1.5 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center justify-between">
                      <span>Base Nationale ({databaseSearchResults.length} résultats)</span>
                      <button
                        type="button"
                        onClick={() => setShowSuggestionsDropdown(false)}
                        className="text-xs text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {databaseSearchResults.map((res) => (
                      <button
                        key={res.id}
                        id={`geo-result-${res.id}`}
                        type="button"
                        onClick={() => handleSelectDatabaseEntity(res)}
                        className="w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {res.type === 'street' ? 'Rue' : res.code}
                          </span>
                          <span className="font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                            {res.name}
                          </span>
                          {res.departmentName && (
                            <span className="text-[10px] text-on-surface-variant truncate">
                              ({res.departmentName})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-on-surface-variant shrink-0">
                          {res.type === 'street' ? '📍 Adresse' : res.territoryId}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {searchSuccessNotice && (
                <p className="text-[11px] font-bold text-emerald-600 animate-fadeIn flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{searchSuccessNotice}</span>
                </p>
              )}

              {/* Sélection Département (si France hexagonale) */}
              {activeTerritory === 'METROPOLE' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                      Département :
                    </label>
                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.2 rounded">
                      Dép. {selectedDepartment}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      id="modal-select-department"
                      value={selectedDepartment}
                      onChange={(e) => handleDepartmentSelect(e.target.value)}
                      className="w-full p-2 pr-7 rounded-xl border border-outline-variant/30 bg-surface-container-lowest font-bold text-xs text-on-surface outline-none focus:border-primary cursor-pointer shadow-xs appearance-none"
                    >
                      {FRENCH_DEPARTMENTS_LIST.filter((d) => d.territoryId === 'METROPOLE').map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name} ({d.regionName})
                        </option>
                      ))}
                    </select>
                    <svg className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Sélection Ville de Base */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                    Commune de stationnement (Centre du cercle) :
                  </label>
                  {isLoadingDepartmentCommunes && (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      <span className="w-2.5 h-2.5 border border-primary border-t-transparent rounded-full animate-spin"></span>
                      <span>Chargement...</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <select
                    id="modal-select-base-commune"
                    value={baseCommune}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      onBaseCommuneChange(selectedName);
                      const list = departmentCommunesList.length > 0 ? departmentCommunesList : territoryConfig.zones;
                      const found = list.find((z) => z.name.toLowerCase() === selectedName.toLowerCase());
                      if (found) {
                        const coords = 'coordinates' in found ? found.coordinates : [found.lng, found.lat];
                        setSelectedCoordinates(coords as [number, number]);
                      }
                    }}
                    className="w-full p-2 pr-7 rounded-xl border border-outline-variant/30 bg-surface-container-lowest font-bold text-xs text-on-surface outline-none focus:border-primary cursor-pointer shadow-xs appearance-none"
                  >
                    {baseCommune && !(
                      (departmentCommunesList.length > 0 ? departmentCommunesList : territoryConfig.zones).some(
                        (c) => c.name.toLowerCase() === baseCommune.toLowerCase()
                      )
                    ) && (
                      <option value={baseCommune}>
                        📍 {baseCommune}
                      </option>
                    )}
                    {departmentCommunesList.length > 0 ? (
                      departmentCommunesList.map((c) => (
                        <option key={c.id} value={c.name}>
                          📍 {c.name} {c.postalCode ? `(${c.postalCode})` : ''}
                        </option>
                      ))
                    ) : (
                      territoryConfig.zones.map((zone) => (
                        <option key={zone.insee} value={zone.name}>
                          📍 {zone.name} {zone.postalCode ? `(${zone.postalCode})` : ''}
                        </option>
                      ))
                    )}
                  </select>
                  <svg className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Rue ou adresse précise (Optionnelle) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                    Adresse ou rue exacte (Optionnel) :
                  </label>
                  {exactStreetAddress && (
                    <button
                      type="button"
                      onClick={() => setExactStreetAddress('')}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      Effacer
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={exactStreetAddress}
                  onChange={(e) => setExactStreetAddress(e.target.value)}
                  placeholder="Ex: 24 Rue Victor Hugo, Boulevard Général de Gaulle..."
                  className="w-full px-3 py-1.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-xs text-on-surface outline-none focus:border-primary placeholder:text-on-surface-variant/40 shadow-xs"
                />
              </div>
            </div>

            {/* CARTE 2 : RAYON D'ACTION & COUVERTURE */}
            <div className="bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/20 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34" />
                      <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35" />
                      <path d="M16.24 7.76A6 6 0 1 0 8.23 16.24" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </div>
                  <span className="text-xs font-black text-on-surface uppercase tracking-wider">
                    Rayon d'action (Cercle en km)
                  </span>
                </div>
                <span className="text-sm font-black font-mono text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                  {radiusKm} km
                </span>
              </div>

              {/* Slider interactif */}
              <input
                type="range"
                min="5"
                max={territoryConfig.maxRadius}
                step="1"
                value={radiusKm}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
              />

              {/* Presets rapides (Segmented control) */}
              <div className="inline-flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/30 gap-1 w-full justify-between flex-wrap">
                {territoryConfig.radiusPresets.map((p) => (
                  <button
                    key={p}
                    id={`modal-preset-${p}km`}
                    type="button"
                    onClick={() => onRadiusChange(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex-1 text-center ${
                      radiusKm === p
                        ? 'bg-primary text-white shadow-xs scale-102'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {p === territoryConfig.maxRadius ? "Tout" : `${p} km`}
                  </button>
                ))}
              </div>

              {/* Case à cocher : Recevoir hors zone d'intervention */}
              <label htmlFor="modal-include-outside" className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  id="modal-include-outside"
                  checked={includeOutsideRadius}
                  onChange={(e) => onToggleIncludeOutside(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant/40 text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
                />
                <div className="text-xs">
                  <span className="font-bold text-on-surface group-hover:text-primary transition-colors block">
                    Recevoir les demandes au-delà de {radiusKm} km
                  </span>
                  <span className="text-[11px] text-on-surface-variant block mt-0.5">
                    {includeOutsideRadius
                      ? 'Courses hors zone affichées avec badge "Hors zone"'
                      : 'Seules les courses situées dans le rayon sont proposées'}
                  </span>
                </div>
              </label>
            </div>

            {/* CARTE 3 : TÉLÉMÉTRIE EN TEMPS RÉEL (BENTO TILES) */}
            <div className="bg-surface-container-low/70 p-3.5 rounded-2xl border border-outline-variant/20 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Couverture</span>
                <span className="text-xs font-black text-on-surface mt-0.5 block">
                  {coveredCommunes.length} / {territoryConfig.zones.length}
                </span>
                <span className="text-[10px] text-on-surface-variant">communes</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Dans rayon</span>
                <span className="text-xs font-black text-emerald-600 mt-0.5 block">
                  {insideMissions.length}
                </span>
                <span className="text-[10px] text-emerald-700/70">reçue(s)</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container-lowest border border-outline-variant/20">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant block">Hors zone</span>
                <span className="text-xs font-black text-amber-700 mt-0.5 block">
                  {outsideMissions.length}
                </span>
                <span className="text-[10px] text-on-surface-variant">
                  {includeOutsideRadius ? 'visibles' : 'masquées'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PIED DU MODAL : SYNTHÈSE & BOUTONS D'ACTION (FIXE AU BAS DU DIALOG)      */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 py-3.5 border-t border-outline-variant/20 bg-surface-container-low/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-on-surface font-semibold">
              Base : <strong className="text-primary">{baseCommune}</strong> ({territoryConfig.shortName})
            </span>
            <span className="text-on-surface-variant">•</span>
            <span className="text-on-surface font-semibold">
              Rayon actif : <strong className="text-primary font-mono">{radiusKm} km</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="btn-apply-radius-modal"
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Appliquer ce rayon ({radiusKm} km)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

