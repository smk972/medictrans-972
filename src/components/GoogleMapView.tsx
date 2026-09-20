import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  resolveCoordinates, 
  calculateNationalRoadDistance, 
  HEALTHCARE_FACILITY_COORDINATES 
} from '../services/pricingService';
import { detectTerritoryFromAddress } from '../data/nationalTerritoriesData';
import { getGoogleMapsApi } from '../services/googleMapsLoader';

// Source: Google Maps Platform Code Assist

export interface GoogleMapViewProps {
  mode?: 'route' | 'tracking' | 'fleet' | 'facility';
  origin?: string;
  destination?: string;
  facilityName?: string;
  territory?: string;
  height?: string;
  className?: string;
  interactive?: boolean;
  showControls?: boolean;
  etaMinutes?: number;
  driverName?: string;
  vehiclePlate?: string;
  driverLat?: number;
  driverLng?: number;
  onRouteComputed?: (distKm: number, durMin: number) => void;
}

const HEXAGONE_HUBS = [
  { lat: 48.8392, lng: 2.3653, name: 'AP-HP Pitié-Salpêtrière (Paris)' },
  { lat: 48.8395, lng: 2.2741, name: 'AP-HP Georges-Pompidou (Paris)' },
  { lat: 45.7441, lng: 4.8814, name: 'HCL Édouard Herriot (Lyon)' },
  { lat: 43.2891, lng: 5.4025, name: 'AP-HM La Timone (Marseille)' },
  { lat: 44.8306, lng: -0.6033, name: 'CHU de Bordeaux (Pellegrin)' },
  { lat: 43.6089, lng: 1.4014, name: 'CHU de Toulouse (Purpan)' },
  { lat: 50.6105, lng: 3.0336, name: 'CHU de Lille (Huriez)' },
  { lat: 47.2119, lng: -1.5528, name: 'CHU de Nantes (Hôtel-Dieu)' },
  { lat: 48.5917, lng: 7.7028, name: 'CHU de Strasbourg (Hautepierre)' },
  { lat: 43.6318, lng: 3.8587, name: 'CHU de Montpellier (Lapeyronie)' },
  { lat: 48.1219, lng: -1.6961, name: 'CHU de Rennes (Pontchaillou)' },
  { lat: 43.7258, lng: 7.2831, name: 'CHU de Nice (Pasteur)' },
  { lat: 49.4402, lng: 1.1091, name: 'CHU de Rouen (Charles-Nicolle)' },
  { lat: 47.3216, lng: 5.0683, name: 'CHU de Dijon (Bourgogne)' },
];

const GUADELOUPE_HUBS = [
  { lat: 16.2650, lng: -61.5160, name: 'CHU de Guadeloupe (Les Abymes)' },
  { lat: 15.9960, lng: -61.7300, name: 'Centre Hospitalier de Basse-Terre' },
  { lat: 16.2160, lng: -61.5830, name: 'Clinique des Eaux Claires' },
];

const GUYANE_HUBS = [
  { lat: 4.9372, lng: -52.3260, name: 'Centre Hospitalier de Cayenne (CHAR)' },
  { lat: 5.1580, lng: -52.6480, name: 'Centre Hospitalier de Kourou' },
  { lat: 5.5010, lng: -54.0290, name: 'CH de l\'Ouest Guyanais' },
];

const REUNION_HUBS = [
  { lat: -20.8980, lng: 55.4590, name: 'CHU Félix Guyon (Saint-Denis)' },
  { lat: -21.3390, lng: 55.4780, name: 'CHU Sud Réunion (Saint-Pierre)' },
  { lat: -20.9990, lng: 55.2950, name: 'CH Ouest Réunion' },
];

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  mode = 'fleet',
  origin = 'Fort-de-France',
  destination = 'CHU Pierre Zobda-Quitman, Fort-de-France',
  facilityName,
  territory,
  height = '320px',
  className = '',
  interactive = true,
  showControls = true,
  etaMinutes = 15,
  driverName,
  vehiclePlate,
  driverLat,
  driverLng,
  onRouteComputed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // 'm' = Roadmap, 'k' = Satellite
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Détection et priorité de territoire
  const activeTerritory = useMemo(() => {
    if (territory) {
      const t = territory.toUpperCase();
      if (t === 'NATIONAL' || t === 'METROPOLE' || t === 'HEXAGONE') return 'METROPOLE';
      if (t === '972' || t === 'MARTINIQUE') return 'MARTINIQUE';
      if (t === '971' || t === 'GUADELOUPE') return 'GUADELOUPE';
      if (t === '973' || t === 'GUYANE') return 'GUYANE';
      if (t === '974' || t === 'REUNION') return 'REUNION';
    }
    const destLower = (destination || '').toLowerCase();
    const origLower = (origin || '').toLowerCase();
    if (destLower.includes('paris') || destLower.includes('france') || destLower.includes('hexagone') || origLower.includes('paris') || origLower.includes('france') || origLower.includes('hexagone')) {
      return 'METROPOLE';
    }
    const terr = detectTerritoryFromAddress(origin) || detectTerritoryFromAddress(destination);
    return terr;
  }, [territory, origin, destination]);

  // Calcul des coordonnées GPS réelles et distance routière officielle
  const routeData = useMemo(() => {
    const terr = activeTerritory;
    const originCoords = resolveCoordinates(origin, terr);
    const destCoords = resolveCoordinates(destination, terr);
    const roadCalc = calculateNationalRoadDistance(origin, destination, terr);

    return {
      originCoords,
      destCoords,
      distanceKm: roadCalc.distanceKm,
      durationMinutes: roadCalc.durationMinutes,
    };
  }, [origin, destination, activeTerritory]);

  const mapTerritoryBadge = useMemo(() => {
    if (activeTerritory === 'GUADELOUPE') return '971 GP';
    if (activeTerritory === 'GUYANE') return '973 GF';
    if (activeTerritory === 'REUNION') return '974 RE';
    if (activeTerritory === 'METROPOLE') return 'Hexagone FR';
    return '972 MQ';
  }, [activeTerritory]);

  useEffect(() => {
    if (onRouteComputed) {
      onRouteComputed(routeData.distanceKm, routeData.durationMinutes);
    }
  }, [routeData, onRouteComputed]);

  // Synchronisation dynamique du type de carte Google Maps (Plan vs Satellite)
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType === 'k' ? 'satellite' : 'roadmap');
    }
  }, [mapType]);

  // Initialisation et actualisation de Google Maps JavaScript API
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        setIsLoading(true);
        setLoadError(null);

        const googleMaps = await getGoogleMapsApi();
        if (!isMounted || !mapContainerRef.current) return;

        let center = { lat: 46.603354, lng: 2.213749 }; // Centre Hexagone (France) par défaut
        let zoom = 6;

        if (mode === 'fleet') {
          if (activeTerritory === 'METROPOLE') {
            center = { lat: 46.603354, lng: 2.213749 };
            zoom = 6;
          } else if (activeTerritory === 'GUADELOUPE') {
            center = { lat: 16.2650, lng: -61.5510 };
            zoom = 11;
          } else if (activeTerritory === 'GUYANE') {
            center = { lat: 4.9372, lng: -52.3260 };
            zoom = 9;
          } else if (activeTerritory === 'REUNION') {
            center = { lat: -21.1151, lng: 55.5364 };
            zoom = 10;
          } else {
            center = { lat: 14.6415, lng: -61.0242 };
            zoom = 11;
          }
        } else if (mode === 'route') {
          center = {
            lat: (routeData.originCoords.lat + routeData.destCoords.lat) / 2,
            lng: (routeData.originCoords.lng + routeData.destCoords.lng) / 2,
          };
          zoom = 12;
        } else if (mode === 'tracking') {
          center = routeData.destCoords;
          zoom = 13;
        } else if (mode === 'facility' && facilityName) {
          const fCoords = resolveCoordinates(facilityName, activeTerritory);
          center = { lat: fCoords.lat, lng: fCoords.lng };
          zoom = 14;
        }

        // Nettoyage des anciens marqueurs
        markersRef.current.forEach(m => {
          if (m && typeof m.setMap === 'function') m.setMap(null);
        });
        markersRef.current = [];

        if (polylineRef.current) {
          polylineRef.current.setMap(null);
          polylineRef.current = null;
        }

        let map = mapInstanceRef.current;
        if (!map) {
          map = new googleMaps.Map(mapContainerRef.current, {
            center,
            zoom,
            mapTypeId: mapType === 'k' ? 'satellite' : 'roadmap',
            disableDefaultUI: !showControls,
            zoomControl: interactive && showControls,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: interactive && showControls,
            gestureHandling: interactive ? 'greedy' : 'none',
            // Attribut officiel de tracking Google Maps Platform
            internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
          });
          mapInstanceRef.current = map;
        } else {
          map.setCenter(center);
          map.setZoom(zoom);
          map.setMapTypeId(mapType === 'k' ? 'satellite' : 'roadmap');
        }

        // Marqueurs selon le mode
        if (mode === 'route') {
          // Marqueur Départ (Prise en charge)
          const startMarker = new googleMaps.Marker({
            map,
            position: routeData.originCoords,
            title: `Départ : ${origin}`,
            icon: {
              path: googleMaps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#005b60',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          markersRef.current.push(startMarker);

          // Marqueur Destination (Établissement de santé)
          const endMarker = new googleMaps.Marker({
            map,
            position: routeData.destCoords,
            title: `Arrivée : ${destination}`,
            icon: {
              path: googleMaps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#dc2626',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          markersRef.current.push(endMarker);

          // Ligne de parcours Google Maps
          const routePath = new googleMaps.Polyline({
            path: [routeData.originCoords, routeData.destCoords],
            geodesic: true,
            strokeColor: '#005b60',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
          routePath.setMap(map);
          polylineRef.current = routePath;
        } else if (mode === 'fleet') {
          // Marqueurs Hôpitaux selon le territoire actif
          let facilitiesToPlot: Array<{ lat: number; lng: number; name: string }> = [];
          if (activeTerritory === 'METROPOLE') {
            facilitiesToPlot = HEXAGONE_HUBS;
          } else if (activeTerritory === 'GUADELOUPE') {
            facilitiesToPlot = GUADELOUPE_HUBS;
          } else if (activeTerritory === 'GUYANE') {
            facilitiesToPlot = GUYANE_HUBS;
          } else if (activeTerritory === 'REUNION') {
            facilitiesToPlot = REUNION_HUBS;
          } else {
            facilitiesToPlot = Object.values(HEALTHCARE_FACILITY_COORDINATES);
          }

          facilitiesToPlot.forEach((f) => {
            const hMarker = new googleMaps.Marker({
              map,
              position: { lat: f.lat, lng: f.lng },
              title: f.name,
              icon: {
                path: googleMaps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: '#0284c7',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1.5,
              },
            });
            markersRef.current.push(hMarker);
          });

          // Marqueur Véhicule sanitaire en direct (si coordonnées GPS réelles)
          if (driverLat && driverLng) {
            const vMarker = new googleMaps.Marker({
              map,
              position: { lat: driverLat, lng: driverLng },
              title: driverName || 'Véhicule sanitaire en mission',
              icon: {
                path: googleMaps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 7,
                fillColor: '#059669',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });
            markersRef.current.push(vMarker);
          }
        } else if (mode === 'tracking') {
          const destMarker = new googleMaps.Marker({
            map,
            position: routeData.destCoords,
            title: destination,
            icon: {
              path: googleMaps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#dc2626',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          });
          markersRef.current.push(destMarker);
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur chargement Google Maps:', err);
        if (isMounted) {
          setLoadError('Connexion Google Maps indisponible.');
          setIsLoading(false);
        }
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [mode, origin, destination, facilityName, territory, activeTerritory, routeData, showControls, interactive, driverLat, driverLng, driverName]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 bg-surface-container-high ${className}`}
      style={{ height, minHeight: '160px' }}
    >
      {/* Conteneur principal Google Maps JavaScript API natif */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
      />

      {/* État de chargement Google Maps officiel */}
      {isLoading && (
        <div className="absolute inset-0 bg-surface-container-low/80 backdrop-blur-xs flex items-center justify-center gap-2 z-20 text-xs font-bold text-primary animate-fadeIn">
          <span className="w-3 h-3 rounded-full bg-primary animate-ping"></span>
          <span>Chargement Google Maps...</span>
        </div>
      )}

      {/* Erreur éventuelle avec bouton de rechargement direct */}
      {loadError && !isLoading && (
        <div className="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
          <span className="material-symbols-outlined text-amber-500 text-3xl mb-1">map</span>
          <p className="text-xs font-bold text-on-surface">{loadError}</p>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(origin + ' ' + destination)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <span>Ouvrir dans Google Maps</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </a>
        </div>
      )}

      {/* Badge Officiel Google Maps Platform */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="bg-surface-container-lowest/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md flex items-center gap-2 border border-outline-variant/30 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">map</span>
            Google Maps
          </span>
          <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
            {mapTerritoryBadge}
          </span>
        </div>

        {mode === 'route' && (
          <div className="bg-primary/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5 animate-fade-in">
            <span className="material-symbols-outlined text-[15px]">directions</span>
            <span>{routeData.distanceKm} km</span>
            <span className="opacity-60">•</span>
            <span>~{routeData.durationMinutes} min</span>
          </div>
        )}

        {mode === 'tracking' && (
          <div className="bg-amber-600/95 text-white backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <span className="material-symbols-outlined text-[15px]">radar</span>
            <span>Véhicule en approche (ETA {etaMinutes} min)</span>
          </div>
        )}
      </div>

      {/* Contrôles interactifs de carte (Satellite / Plan & Accès Google Maps) */}
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-outline-variant/30 flex text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapType('m')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
                mapType === 'm'
                  ? 'bg-primary text-white font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Plan
            </button>
            <button
              type="button"
              onClick={() => setMapType('k')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs cursor-pointer ${
                mapType === 'k'
                  ? 'bg-primary text-white font-bold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Satellite
            </button>
          </div>

          <a
            href={
              mode === 'route'
                ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facilityName || destination || 'Martinique')}`
            }
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir l'itinéraire dans Google Maps"
            className="w-8 h-8 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-md border border-outline-variant/30 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>
      )}

      {/* Overlay spécifique : Suivi en direct du transporteur */}
      {mode === 'tracking' && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-lg">ambulance</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">
                  {driverName || 'Transporteur en cours d’attribution'}
                </span>
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-mono">
                  {vehiclePlate && <span>{vehiclePlate} • </span>}
                  {driverLat && driverLng ? (
                    <span className="text-emerald-700 font-bold">Position actualisée</span>
                  ) : (
                    <span className="text-slate-500">Position du transporteur indisponible</span>
                  )}
                </span>
              </div>
            </div>

            {etaMinutes ? (
              <div className="text-right">
                <span className="text-[11px] text-on-surface-variant">Arrivée estimée</span>
                <div className="text-sm font-extrabold text-primary">{etaMinutes} min</div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
