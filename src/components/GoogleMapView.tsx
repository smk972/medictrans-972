import React, { useEffect, useRef, useState, useMemo } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { 
  resolveCoordinates, 
  calculateMartiniqueRoadDistance, 
  HEALTHCARE_FACILITY_COORDINATES 
} from '../services/pricingService';

export interface GoogleMapViewProps {
  mode?: 'route' | 'tracking' | 'fleet' | 'facility';
  origin?: string;
  destination?: string;
  facilityName?: string;
  height?: string;
  className?: string;
  interactive?: boolean;
  showControls?: boolean;
  etaMinutes?: number;
  driverName?: string;
  vehiclePlate?: string;
  onRouteComputed?: (distKm: number, durMin: number) => void;
}

// Positions simulées des flottes sanitaires en patrouille en Martinique
const FLEET_VEHICLES = [
  { id: 'amb-1', name: 'Ambulance ASSU 01', type: 'AMBULANCE', city: 'Fort-de-France', lat: 14.6190, lng: -61.0425, status: 'EN_ROUTE' },
  { id: 'amb-2', name: 'Ambulance 04', type: 'AMBULANCE', city: 'La Trinité', lat: 14.7395, lng: -60.9630, status: 'DISPONIBLE' },
  { id: 'vsl-1', name: 'VSL Médic 02', type: 'VSL', city: 'Le Lamentin', lat: 14.6152, lng: -60.9995, status: 'DISPONIBLE' },
  { id: 'taxi-1', name: 'Taxi Conv. 972', type: 'TAXI', city: 'Ducos', lat: 14.5753, lng: -60.9753, status: 'EN_MISSION' },
  { id: 'vsl-2', name: 'VSL Sud Sanitaire', type: 'VSL', city: 'Le Marin', lat: 14.4710, lng: -60.8710, status: 'DISPONIBLE' },
];

let gmpConfigured = false;

function setupGmpLoader(): boolean {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!key || key === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return false;
  }
  if (!gmpConfigured) {
    try {
      setOptions({
        key,
        v: 'weekly',
        language: 'fr',
        region: 'MQ',
      });
      gmpConfigured = true;
    } catch {
      return false;
    }
  }
  return true;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  mode = 'fleet',
  origin = 'Fort-de-France',
  destination = 'CHU Pierre Zobda-Quitman, Fort-de-France',
  facilityName,
  height = '100%',
  className = '',
  showControls = true,
  etaMinutes = 14,
  driverName = 'J. Maréchal (Ambulances Madinina)',
  vehiclePlate = 'FA-972-MQ',
  onRouteComputed,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [useJsApi, setUseJsApi] = useState<boolean>(false);
  const [mapType, setMapType] = useState<'m' | 'k'>('m'); // m = road map, k = satellite
  const [activeLayer, setActiveLayer] = useState<'all' | 'ambulances' | 'hospitals'>('all');
  const [trackingOffset, setTrackingOffset] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });

  // Résolution des coordonnées selon les adresses fournies
  const routeData = useMemo(() => {
    return calculateMartiniqueRoadDistance(origin, destination);
  }, [origin, destination]);

  useEffect(() => {
    if (onRouteComputed) {
      onRouteComputed(routeData.distanceKm, routeData.durationMinutes);
    }
  }, [routeData, onRouteComputed]);

  // Animation de déplacement du chauffeur en direct en mode tracking
  useEffect(() => {
    if (mode !== 'tracking') return;
    const interval = setInterval(() => {
      setTrackingOffset((prev) => {
        // Déplacement progressif vers la destination
        const stepLat = (routeData.destCoords.lat - routeData.originCoords.lat) * 0.005;
        const stepLng = (routeData.destCoords.lng - routeData.originCoords.lng) * 0.005;
        return {
          lat: prev.lat + (Math.random() * 0.0004 - 0.0002) + stepLat * 0.1,
          lng: prev.lng + (Math.random() * 0.0004 - 0.0002) + stepLng * 0.1,
        };
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [mode, routeData]);

  // Initialisation du Google Maps JavaScript API si une clé est disponible
  useEffect(() => {
    let isMounted = true;
    const hasKey = setupGmpLoader();

    if (!hasKey || !mapContainerRef.current) {
      setUseJsApi(false);
      return;
    }

    async function initMap() {
      try {
        const mapsLib = (await importLibrary('maps')) as any;
        const markerLib = (await importLibrary('marker')) as any;

        if (!isMounted || !mapContainerRef.current) return;

        let center = { lat: 14.6415, lng: -61.0242 }; // Centre Martinique
        let zoom = 11;

        if (mode === 'route') {
          center = {
            lat: (routeData.originCoords.lat + routeData.destCoords.lat) / 2,
            lng: (routeData.originCoords.lng + routeData.destCoords.lng) / 2,
          };
          zoom = 12;
        } else if (mode === 'tracking') {
          center = routeData.destCoords;
          zoom = 13;
        } else if (mode === 'facility' && facilityName) {
          const fCoords = resolveCoordinates(facilityName);
          center = { lat: fCoords.lat, lng: fCoords.lng };
          zoom = 14;
        }

        const map = new mapsLib.Map(mapContainerRef.current, {
          center,
          zoom,
          mapId: 'DEMO_MAP_ID',
          mapTypeId: mapType === 'k' ? 'satellite' : 'roadmap',
          disableDefaultUI: !showControls,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          // Attribut officiel de tracking Google Maps Platform
          internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
        });

        // Marqueurs selon le mode
        if (mode === 'route') {
          // Marqueur Départ (Maison / Patient)
          const startPin = document.createElement('div');
          startPin.className = 'w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs';
          startPin.innerHTML = '<span class="material-symbols-outlined text-[18px]">home</span>';

          new markerLib.AdvancedMarkerElement({
            map,
            position: routeData.originCoords,
            title: `Départ : ${origin}`,
            content: startPin,
          });

          // Marqueur Destination (Hôpital)
          const endPin = document.createElement('div');
          endPin.className = 'w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs';
          endPin.innerHTML = '<span class="material-symbols-outlined text-[18px]">local_hospital</span>';

          new markerLib.AdvancedMarkerElement({
            map,
            position: routeData.destCoords,
            title: `Arrivée : ${destination}`,
            content: endPin,
          });

          // Ligne de parcours
          const routePath = new mapsLib.Polyline({
            path: [routeData.originCoords, routeData.destCoords],
            geodesic: true,
            strokeColor: '#005b60',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          });
          routePath.setMap(map);
        } else if (mode === 'fleet') {
          // Marqueurs Hôpitaux
          Object.values(HEALTHCARE_FACILITY_COORDINATES).forEach((f) => {
            const hPin = document.createElement('div');
            hPin.className = 'w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center shadow-md border-2 border-white text-[12px]';
            hPin.innerHTML = '<span class="material-symbols-outlined text-[14px]">local_hospital</span>';

            new markerLib.AdvancedMarkerElement({
              map,
              position: { lat: f.lat, lng: f.lng },
              title: f.name,
              content: hPin,
            });
          });

          // Marqueurs Véhicules sanitaires en direct
          FLEET_VEHICLES.forEach((veh) => {
            const vPin = document.createElement('div');
            vPin.className = 'w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-white animate-bounce';
            vPin.innerHTML = '<span class="material-symbols-outlined text-[14px]">ambulance</span>';

            new markerLib.AdvancedMarkerElement({
              map,
              position: { lat: veh.lat, lng: veh.lng },
              title: `${veh.name} • ${veh.city}`,
              content: vPin,
            });
          });
        }

        setUseJsApi(true);
      } catch (err) {
        console.warn('Google Maps JS API failed to initialize, using interactive Google Maps Embed:', err);
        setUseJsApi(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [mode, routeData, mapType, showControls, facilityName, origin, destination]);

  // Construction de l'URL Google Maps Embed officiel pour le rendu interactif sans clé ou en fallback
  const embedUrl = useMemo(() => {
    const t = mapType; // 'm' = normal, 'k' = satellite
    if (mode === 'route') {
      const saddr = encodeURIComponent(`${origin}, Martinique`);
      const daddr = encodeURIComponent(`${destination}, Martinique`);
      return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&hl=fr&t=${t}&z=12&output=embed`;
    }

    if (mode === 'tracking') {
      const q = encodeURIComponent(`${routeData.destCoords.lat},${routeData.destCoords.lng}`);
      return `https://maps.google.com/maps?q=${q}&hl=fr&t=${t}&z=14&output=embed`;
    }

    if (mode === 'facility' && facilityName) {
      const q = encodeURIComponent(`${facilityName}, Martinique`);
      return `https://maps.google.com/maps?q=${q}&hl=fr&t=${t}&z=15&output=embed`;
    }

    // Default 'fleet' : Vue globale Martinique centrée sur la baie de Fort-de-France / Lamentin
    return `https://maps.google.com/maps?q=Fort-de-France,Martinique&hl=fr&t=${t}&z=11&output=embed`;
  }, [mode, origin, destination, facilityName, mapType, routeData]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-sm border border-outline-variant/30 bg-surface-container-high ${className}`}
      style={{ height, minHeight: '160px' }}
    >
      {/* Conteneur pour Google Maps JavaScript API (quand la clé est configurée) */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full ${useJsApi ? 'block' : 'hidden'}`}
      />

      {/* Rendu interactif officiel Google Maps via Embed (sans clé ou en complément) */}
      {!useJsApi && (
        <div className="relative w-full h-full overflow-hidden bg-slate-100">
          <iframe
            title="Carte Google Maps Martinique 972"
            src={embedUrl}
            className="w-full h-full border-0 absolute inset-0 filter saturate-[1.05]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
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
            972 MQ
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

      {/* Contrôles interactifs de carte (Satellite / Plan & Filtres) */}
      {showControls && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-outline-variant/30 flex text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMapType('m')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                mapType === 'm'
                  ? 'bg-primary text-white font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Plan
            </button>
            <button
              type="button"
              onClick={() => setMapType('k')}
              className={`px-2.5 py-1 rounded-lg transition-colors text-xs ${
                mapType === 'k'
                  ? 'bg-primary text-white font-bold'
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
            title="Ouvrir dans Google Maps"
            className="w-8 h-8 rounded-xl bg-surface-container-lowest/95 backdrop-blur-md flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-md border border-outline-variant/30"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>
      )}

      {/* Overlay spécifique : Tracking en direct avec fiche chauffeur */}
      {mode === 'tracking' && (
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-xl shadow-lg border border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-lg">ambulance</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">{driverName}</span>
                <span className="text-[11px] text-on-surface-variant flex items-center gap-1 font-mono">
                  <span>{vehiclePlate}</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-bold">GPS Actif</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-on-surface-variant">Arrivée estimée</span>
              <div className="text-sm font-extrabold text-primary">{etaMinutes} minutes</div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay spécifique : Filtres de flottes sanitaires en mode Fleet */}
      {mode === 'fleet' && (
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5">
          <div className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md border border-outline-variant/30 text-[11px] font-semibold text-on-surface flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>18 Hôpitaux &amp; Dialyses</span>
            </span>
            <span className="opacity-40">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              <span>14 Ambulances / VSL en service</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
