/**
 * CLINIGO.FR — SERVICE OFFICIEL DE GESTION DES ZONES D'INTERVENTION
 * 
 * Nouveau système géographique basé sur :
 * - Régions françaises (13 métropolitaines + 5 DROM avec codes INSEE officiels)
 * - Villes / Communes administratives
 * - Base d'intervention confirmée (GPS / Recherche adresse / Déplacement manuel)
 * - Tracé libre de polygone avec sommets modifiables
 * - Option offres étendues (+30 km calculé depuis la BASE)
 * - Moteur de matching à 3 cas (Dans polygone, Étendu 30km, Hors zone)
 * - Persistance Supabase (table public.transporter_intervention_zones)
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface FrenchRegion {
  code: string; // Code INSEE officiel (ex: '76', '11', '02', '01', etc.)
  name: string;
  isDrom: boolean;
  defaultCenter: GeoPoint;
  defaultZoom: number;
}

export interface RegionCommune {
  name: string;
  insee: string;
  postalCode?: string;
  lat: number;
  lng: number;
}

export interface InterventionZone {
  id?: string;
  transporterId: string;
  regionCode: string;
  regionName: string;
  cityName: string;
  cityInsee?: string;
  baseAddress: string;
  baseLat: number;
  baseLng: number;
  baseSource: 'GPS' | 'ADDRESS' | 'MANUAL';
  polygonCoordinates: GeoPoint[];
  allowExtendedRadius: boolean;
  extendedRadiusKm: number; // Toujours 30 km par défaut
  updatedAt?: string;
}

// ============================================================================
// 1. LES 18 RÉGIONS FRANÇAISES OFFICIELLES (13 MÉTROPOLE + 5 DROM)
// ============================================================================
export const FRENCH_REGIONS: FrenchRegion[] = [
  // Régions métropolitaines
  { code: '84', name: 'Auvergne-Rhône-Alpes', isDrom: false, defaultCenter: { lat: 45.764, lng: 4.8357 }, defaultZoom: 8 },
  { code: '27', name: 'Bourgogne-Franche-Comté', isDrom: false, defaultCenter: { lat: 47.28, lng: 5.04 }, defaultZoom: 8 },
  { code: '53', name: 'Bretagne', isDrom: false, defaultCenter: { lat: 48.1173, lng: -1.6778 }, defaultZoom: 8 },
  { code: '24', name: 'Centre-Val de Loire', isDrom: false, defaultCenter: { lat: 47.9029, lng: 1.9093 }, defaultZoom: 8 },
  { code: '94', name: 'Corse', isDrom: false, defaultCenter: { lat: 41.9267, lng: 8.7369 }, defaultZoom: 9 },
  { code: '44', name: 'Grand Est', isDrom: false, defaultCenter: { lat: 48.5734, lng: 7.7521 }, defaultZoom: 8 },
  { code: '32', name: 'Hauts-de-France', isDrom: false, defaultCenter: { lat: 50.6292, lng: 3.0573 }, defaultZoom: 8 },
  { code: '11', name: 'Île-de-France', isDrom: false, defaultCenter: { lat: 48.8566, lng: 2.3522 }, defaultZoom: 10 },
  { code: '28', name: 'Normandie', isDrom: false, defaultCenter: { lat: 49.4432, lng: 1.0999 }, defaultZoom: 8 },
  { code: '75', name: 'Nouvelle-Aquitaine', isDrom: false, defaultCenter: { lat: 44.8378, lng: -0.5792 }, defaultZoom: 7 },
  { code: '76', name: 'Occitanie', isDrom: false, defaultCenter: { lat: 43.6047, lng: 1.4442 }, defaultZoom: 8 },
  { code: '52', name: 'Pays de la Loire', isDrom: false, defaultCenter: { lat: 47.2184, lng: -1.5536 }, defaultZoom: 8 },
  { code: '93', name: "Provence-Alpes-Côte d'Azur", isDrom: false, defaultCenter: { lat: 43.2965, lng: 5.3698 }, defaultZoom: 8 },

  // DROM (Outre-Mer)
  { code: '01', name: 'Guadeloupe', isDrom: true, defaultCenter: { lat: 16.265, lng: -61.55 }, defaultZoom: 10 },
  { code: '02', name: 'Martinique', isDrom: true, defaultCenter: { lat: 14.6415, lng: -61.0242 }, defaultZoom: 11 },
  { code: '03', name: 'Guyane', isDrom: true, defaultCenter: { lat: 4.9372, lng: -52.333 }, defaultZoom: 8 },
  { code: '04', name: 'La Réunion', isDrom: true, defaultCenter: { lat: -21.1151, lng: 55.5364 }, defaultZoom: 10 },
  { code: '06', name: 'Mayotte', isDrom: true, defaultCenter: { lat: -12.8275, lng: 45.1662 }, defaultZoom: 11 },
];

// Cache mémoire des communes par code région
const regionCommunesCache = new Map<string, RegionCommune[]>();

// Fallbacks de communes clés pour chaque région (garantie de disponibilité immédiate)
const FALLBACK_KEY_COMMUNES: Record<string, RegionCommune[]> = {
  '76': [ // Occitanie
    { name: 'Muret', insee: '31395', postalCode: '31600', lat: 43.4608, lng: 1.3267 },
    { name: 'Toulouse', insee: '31555', postalCode: '31000', lat: 43.6047, lng: 1.4442 },
    { name: 'Colomiers', insee: '31149', postalCode: '31770', lat: 43.6139, lng: 1.3347 },
    { name: 'Auterive', insee: '31033', postalCode: '31190', lat: 43.3514, lng: 1.4772 },
    { name: 'Montpellier', insee: '34172', postalCode: '34000', lat: 43.6108, lng: 3.8767 },
    { name: 'Nîmes', insee: '30189', postalCode: '30000', lat: 43.8367, lng: 4.3601 },
    { name: 'Perpignan', insee: '66136', postalCode: '66000', lat: 42.6887, lng: 2.8948 },
    { name: 'Tarbes', insee: '65440', postalCode: '65000', lat: 43.2329, lng: 0.0781 },
  ],
  '02': [ // Martinique
    { name: 'Fort-de-France', insee: '97209', postalCode: '97200', lat: 14.6161, lng: -61.0588 },
    { name: 'Le Lamentin', insee: '97213', postalCode: '97232', lat: 14.6152, lng: -61.0025 },
    { name: 'Schœlcher', insee: '97222', postalCode: '97233', lat: 14.6167, lng: -61.1000 },
    { name: 'Le Robert', insee: '97223', postalCode: '97231', lat: 14.6789, lng: -60.9411 },
    { name: 'Sainte-Marie', insee: '97228', postalCode: '97230', lat: 14.7831, lng: -60.9936 },
    { name: 'Le François', insee: '97210', postalCode: '97240', lat: 14.6156, lng: -60.9028 },
    { name: 'Ducos', insee: '97207', postalCode: '97224', lat: 14.5756, lng: -60.9744 },
    { name: 'Saint-Joseph', insee: '97225', postalCode: '97212', lat: 14.6708, lng: -61.0378 },
    { name: 'La Trinité', insee: '97230', postalCode: '97220', lat: 14.7381, lng: -60.9639 },
    { name: 'Le Marin', insee: '97217', postalCode: '97290', lat: 14.4719, lng: -60.8697 },
  ],
  '01': [ // Guadeloupe
    { name: 'Les Abymes', insee: '97101', postalCode: '97139', lat: 16.2706, lng: -61.5056 },
    { name: 'Pointe-à-Pitre', insee: '97120', postalCode: '97110', lat: 16.2411, lng: -61.5331 },
    { name: 'Baie-Mahault', insee: '97103', postalCode: '97122', lat: 16.2678, lng: -61.5872 },
    { name: 'Basse-Terre', insee: '97105', postalCode: '97100', lat: 15.9986, lng: -61.7289 },
    { name: 'Le Gosier', insee: '97113', postalCode: '97190', lat: 16.2064, lng: -61.4928 },
    { name: 'Sainte-Anne', insee: '97128', postalCode: '97180', lat: 16.2269, lng: -61.3853 },
  ],
  '03': [ // Guyane
    { name: 'Cayenne', insee: '97302', postalCode: '97300', lat: 4.9372, lng: -52.333 },
    { name: 'Matoury', insee: '97307', postalCode: '97351', lat: 4.8481, lng: -52.3303 },
    { name: 'Kourou', insee: '97305', postalCode: '97310', lat: 5.1583, lng: -52.6464 },
    { name: 'Saint-Laurent-du-Maroni', insee: '97311', postalCode: '97320', lat: 5.5019, lng: -54.0294 },
    { name: 'Remire-Montjoly', insee: '97309', postalCode: '97354', lat: 4.9083, lng: -52.2789 },
  ],
  '04': [ // La Réunion
    { name: 'Saint-Denis', insee: '97411', postalCode: '97400', lat: -20.8821, lng: 55.4504 },
    { name: 'Saint-Paul', insee: '97415', postalCode: '97460', lat: -21.0096, lng: 55.2697 },
    { name: 'Saint-Pierre', insee: '97416', postalCode: '97410', lat: -21.3414, lng: 55.4781 },
    { name: 'Le Tampon', insee: '97422', postalCode: '97430', lat: -21.2806, lng: 55.5181 },
    { name: 'Saint-André', insee: '97409', postalCode: '97440', lat: -20.9631, lng: 55.6517 },
  ],
  '06': [ // Mayotte
    { name: 'Mamoudzou', insee: '97611', postalCode: '97600', lat: -12.7806, lng: 45.2278 },
    { name: 'Dzaoudzi', insee: '97608', postalCode: '97615', lat: -12.7872, lng: 45.2711 },
    { name: 'Koungou', insee: '97610', postalCode: '97600', lat: -12.7333, lng: 45.2047 },
    { name: 'Dembeni', insee: '97607', postalCode: '97660', lat: -12.8428, lng: 45.1839 },
    { name: 'Bandrele', insee: '97603', postalCode: '97660', lat: -12.9392, lng: 45.1797 },
  ],
  '11': [ // Île-de-France
    { name: 'Paris', insee: '75056', postalCode: '75000', lat: 48.8566, lng: 2.3522 },
    { name: 'Boulogne-Billancourt', insee: '92012', postalCode: '92100', lat: 48.8356, lng: 2.2408 },
    { name: 'Saint-Denis', insee: '93066', postalCode: '93200', lat: 48.9362, lng: 2.3574 },
    { name: 'Argenteuil', insee: '95018', postalCode: '95100', lat: 48.9478, lng: 2.2483 },
    { name: 'Créteil', insee: '94028', postalCode: '94000', lat: 48.7904, lng: 2.4556 },
    { name: 'Versailles', insee: '78646', postalCode: '78000', lat: 48.8049, lng: 2.1204 },
  ],
  '94': [ // Corse
    { name: 'Ajaccio', insee: '2A004', postalCode: '20000', lat: 41.9267, lng: 8.7369 },
    { name: 'Bastia', insee: '2B033', postalCode: '20200', lat: 42.7028, lng: 9.4503 },
    { name: 'Porto-Vecchio', insee: '2A247', postalCode: '20137', lat: 41.5911, lng: 9.2794 },
    { name: 'Corte', insee: '2B096', postalCode: '20250', lat: 42.3061, lng: 9.1506 },
  ]
};

// ============================================================================
// 2. RÉCUPÉRATION DES COMMUNES OFFICIELLES D'UNE RÉGION
// ============================================================================
export async function fetchCommunesForRegion(regionCode: string): Promise<RegionCommune[]> {
  if (regionCommunesCache.has(regionCode)) {
    return regionCommunesCache.get(regionCode)!;
  }

  try {
    const url = `https://geo.api.gouv.fr/communes?codeRegion=${regionCode}&fields=nom,code,centre,codesPostaux`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data: any[] = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const communes: RegionCommune[] = data
          .filter((c) => c.centre && c.centre.coordinates)
          .map((c) => ({
            name: c.nom,
            insee: c.code,
            postalCode: c.codesPostaux ? c.codesPostaux[0] : undefined,
            lat: c.centre.coordinates[1],
            lng: c.centre.coordinates[0],
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

        regionCommunesCache.set(regionCode, communes);
        return communes;
      }
    }
  } catch (err) {
    console.warn(`[transporterZoneService] Erreur appel API geo.api.gouv.fr pour région ${regionCode}:`, err);
  }

  // Fallback si l'API officielle est inaccessible
  const fallback = FALLBACK_KEY_COMMUNES[regionCode] || [];
  return fallback;
}

// ============================================================================
// 3. ALGORITHMES GÉOGRAPHIQUES PRÉCIS (RAY-CASTING & DISTANCE HAVERSINE)
// ============================================================================

/**
 * Test Ray-Casting : Vérifie si un point géographique (lat, lng) se trouve à l'intérieur
 * d'un polygone fermé constitué d'un tableau de sommets.
 */
export function isPointInPolygon(point: GeoPoint, polygon: GeoPoint[]): boolean {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calcul de distance géodésique sphérique en kilomètres (Haversine haute précision)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon moyen de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * MOTEUR DE MATCHING GÉOGRAPHIQUE À 3 CAS :
 * CAS 1 : Course dans le polygone → Couvert
 * CAS 2 : Course hors polygone MAIS "Offres au-delà" activé ET <= 30 km de la BASE → Couvert
 * CAS 3 : Course hors polygone ET > 30 km → Non couvert
 */
export function isRideCoveredByZone(
  rideCoords: GeoPoint,
  zone: InterventionZone
): {
  covered: boolean;
  reason: 'INSIDE_POLYGON' | 'EXTENDED_RADIUS' | 'NONE';
  distanceFromBaseKm: number;
} {
  const distFromBase = calculateHaversineDistanceKm(
    zone.baseLat,
    zone.baseLng,
    rideCoords.lat,
    rideCoords.lng
  );

  // Cas 1 : Dans le polygone
  if (isPointInPolygon(rideCoords, zone.polygonCoordinates)) {
    return {
      covered: true,
      reason: 'INSIDE_POLYGON',
      distanceFromBaseKm: distFromBase,
    };
  }

  // Cas 2 : Hors polygone mais offres au-delà activées et <= 30 km de la BASE
  if (zone.allowExtendedRadius && distFromBase <= (zone.extendedRadiusKm || 30)) {
    return {
      covered: true,
      reason: 'EXTENDED_RADIUS',
      distanceFromBaseKm: distFromBase,
    };
  }

  // Cas 3 : Hors zone
  return {
    covered: false,
    reason: 'NONE',
    distanceFromBaseKm: distFromBase,
  };
}

/**
 * Génère un polygone initial circulaire régulier (8 sommets) autour d'un point central
 * Permet au transporteur d'avoir immédiatement une base de départ modifiable sommet par sommet
 */
export function generateInitialPolygon(center: GeoPoint, radiusKm: number = 15): GeoPoint[] {
  const points: GeoPoint[] = [];
  const numVertices = 8;
  const latDelta = radiusKm / 111.32; // ~111.32 km par degré de latitude
  const lngDelta = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180));

  for (let i = 0; i < numVertices; i++) {
    const angle = (i * 2 * Math.PI) / numVertices;
    points.push({
      lat: Number((center.lat + latDelta * Math.sin(angle)).toFixed(6)),
      lng: Number((center.lng + lngDelta * Math.cos(angle)).toFixed(6)),
    });
  }

  return points;
}

// ============================================================================
// 4. PERSISTANCE SUPABASE & MIGRATION SILENCIEUSE DU LOCALSTORAGE
// ============================================================================

const LOCAL_STORAGE_ZONE_KEY = 'clinigo_transporter_intervention_zone_v3';

export async function loadTransporterZone(transporterId: string): Promise<InterventionZone | null> {
  if (!transporterId) return null;

  // 1. Recherche dans Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('transporter_intervention_zones')
        .select('*')
        .eq('transporter_id', transporterId)
        .maybeSingle();

      if (!error && data) {
        const zone: InterventionZone = {
          id: data.id,
          transporterId: data.transporter_id,
          regionCode: data.region_code,
          regionName: data.region_name,
          cityName: data.city_name,
          cityInsee: data.city_insee || undefined,
          baseAddress: data.base_address,
          baseLat: data.base_lat,
          baseLng: data.base_lng,
          baseSource: data.base_source || 'MANUAL',
          polygonCoordinates: Array.isArray(data.polygon_coordinates)
            ? data.polygon_coordinates
            : JSON.parse(data.polygon_coordinates || '[]'),
          allowExtendedRadius: !!data.allow_extended_radius,
          extendedRadiusKm: data.extended_radius_km || 30,
          updatedAt: data.updated_at,
        };

        // Cache local
        localStorage.setItem(LOCAL_STORAGE_ZONE_KEY, JSON.stringify(zone));
        return zone;
      }
    } catch (err) {
      console.warn('[transporterZoneService] Erreur lecture Supabase:', err);
    }
  }

  // 2. Fallback Cache Local
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ZONE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.transporterId === transporterId) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return null;
}

export async function saveTransporterZone(zone: InterventionZone): Promise<InterventionZone> {
  const payload = {
    transporter_id: zone.transporterId,
    region_code: zone.regionCode,
    region_name: zone.regionName,
    city_name: zone.cityName,
    city_insee: zone.cityInsee || null,
    base_address: zone.baseAddress,
    base_lat: zone.baseLat,
    base_lng: zone.baseLng,
    base_source: zone.baseSource,
    polygon_coordinates: zone.polygonCoordinates,
    allow_extended_radius: zone.allowExtendedRadius,
    extended_radius_km: 30, // Fixe à 30 km selon CDC
    updated_at: new Date().toISOString(),
  };

  // 1. Sauvegarde locale immédiate
  localStorage.setItem(LOCAL_STORAGE_ZONE_KEY, JSON.stringify(zone));

  // 2. Sauvegarde Supabase
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('transporter_intervention_zones')
      .upsert(payload, { onConflict: 'transporter_id' })
      .select()
      .single();

    if (error) {
      console.error('[transporterZoneService] Erreur sauvegarde Supabase:', error);
      throw new Error(`Erreur d'enregistrement de la zone dans Supabase: ${error.message}`);
    }

    if (data) {
      zone.id = data.id;
      zone.updatedAt = data.updated_at;
      localStorage.setItem(LOCAL_STORAGE_ZONE_KEY, JSON.stringify(zone));
    }
  }

  return zone;
}
