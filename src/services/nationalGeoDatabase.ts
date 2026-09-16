/**
 * Service de base de données géographique nationale (Clinigo / MedicTrans)
 * - Données géographiques simplifiées (GeoJSON Etalab 1000m & DROM)
 * - Chargement progressif avec cache mémoire
 * - Recherche indépendante via index local + API officielle geo.api.gouv.fr et api-adresse.data.gouv.fr
 * - Géolocalisation par navigateur et reverse-geocoding précis au niveau de la rue
 * - Filtrage dynamique des communes par département
 */

import {
  TerritoryId,
  GUADELOUPE_COMMUNES_POLYGONS,
  GUYANE_COMMUNES_POLYGONS,
  REUNION_COMMUNES_POLYGONS,
} from '../data/nationalTerritoriesData';
import { MARTINIQUE_COMMUNES_POLYGONS } from '../data/martiniqueCommunesPolygons';

export interface GeoEntity {
  id: string;
  name: string;
  code: string; // INSEE ou numéro de département
  postalCode?: string;
  territoryId: TerritoryId;
  coordinates: [number, number]; // [longitude, latitude] (standard GeoJSON)
  type: 'commune' | 'department' | 'metropole' | 'street';
  departmentName?: string;
  regionName?: string;
  street?: string;
  housenumber?: string;
}

export interface DepartmentInfo {
  code: string;
  name: string;
  territoryId: TerritoryId;
  regionName?: string;
}

export interface ReverseGeocodeResult {
  label: string;
  street?: string;
  housenumber?: string;
  city: string;
  postalCode: string;
  departmentCode: string;
  departmentName?: string;
  coordinates: [number, number]; // [lng, lat]
  territoryId: TerritoryId;
}

// ============================================================================
// LISTE COMPLÈTE OFFICIELLE DES DÉPARTEMENTS FRANÇAIS (96 MÉTROPOLE + 4 DROM)
// ============================================================================
export const FRENCH_DEPARTMENTS_LIST: DepartmentInfo[] = [
  // Île-de-France
  { code: '75', name: 'Paris', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '77', name: 'Seine-et-Marne', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '78', name: 'Yvelines', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '91', name: 'Essonne', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '92', name: 'Hauts-de-Seine', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '93', name: 'Seine-Saint-Denis', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '94', name: 'Val-de-Marne', territoryId: 'METROPOLE', regionName: 'Île-de-France' },
  { code: '95', name: "Val-d'Oise", territoryId: 'METROPOLE', regionName: 'Île-de-France' },

  // Auvergne-Rhône-Alpes
  { code: '01', name: 'Ain (Bourg-en-Bresse)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '03', name: 'Allier (Moulins)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '07', name: 'Ardèche (Privas)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '15', name: 'Cantal (Aurillac)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '26', name: 'Drôme (Valence)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '38', name: 'Isère (Grenoble)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '42', name: 'Loire (Saint-Étienne)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '43', name: 'Haute-Loire (Le Puy)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '63', name: 'Puy-de-Dôme (Clermont-Ferrand)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '69', name: 'Rhône & Métropole de Lyon', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '73', name: 'Savoie (Chambéry)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },
  { code: '74', name: 'Haute-Savoie (Annecy)', territoryId: 'METROPOLE', regionName: 'Auvergne-Rhône-Alpes' },

  // Provence-Alpes-Côte d'Azur
  { code: '04', name: 'Alpes-de-Haute-Provence (Digne)', territoryId: 'METROPOLE', regionName: 'PACA' },
  { code: '05', name: 'Hautes-Alpes (Gap)', territoryId: 'METROPOLE', regionName: 'PACA' },
  { code: '06', name: 'Alpes-Maritimes (Nice / Cannes)', territoryId: 'METROPOLE', regionName: 'PACA' },
  { code: '13', name: 'Bouches-du-Rhône (Marseille / Aix)', territoryId: 'METROPOLE', regionName: 'PACA' },
  { code: '83', name: 'Var (Toulon)', territoryId: 'METROPOLE', regionName: 'PACA' },
  { code: '84', name: 'Vaucluse (Avignon)', territoryId: 'METROPOLE', regionName: 'PACA' },

  // Nouvelle-Aquitaine
  { code: '16', name: 'Charente (Angoulême)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '17', name: 'Charente-Maritime (La Rochelle)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '19', name: 'Corrèze (Tulle / Brive)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '23', name: 'Creuse (Guéret)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '24', name: 'Dordogne (Périgueux)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '33', name: 'Gironde (Bordeaux)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '40', name: 'Landes (Mont-de-Marsan)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '47', name: 'Lot-et-Garonne (Agen)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '64', name: 'Pyrénées-Atlantiques (Pau / Bayonne)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '79', name: 'Deux-Sèvres (Niort)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '86', name: 'Vienne (Poitiers)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },
  { code: '87', name: 'Haute-Vienne (Limoges)', territoryId: 'METROPOLE', regionName: 'Nouvelle-Aquitaine' },

  // Occitanie
  { code: '09', name: 'Ariège (Foix)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '11', name: 'Aude (Carcassonne)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '12', name: 'Aveyron (Rodez)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '30', name: 'Gard (Nîmes)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '31', name: 'Haute-Garonne (Toulouse)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '32', name: 'Gers (Auch)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '34', name: 'Hérault (Montpellier)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '46', name: 'Lot (Cahors)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '48', name: 'Lozère (Mende)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '65', name: 'Hautes-Pyrénées (Tarbes)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '66', name: 'Pyrénées-Orientales (Perpignan)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '81', name: 'Tarn (Albi)', territoryId: 'METROPOLE', regionName: 'Occitanie' },
  { code: '82', name: 'Tarn-et-Garonne (Montauban)', territoryId: 'METROPOLE', regionName: 'Occitanie' },

  // Bretagne & Pays de la Loire
  { code: '22', name: "Côtes-d'Armor (Saint-Brieuc)", territoryId: 'METROPOLE', regionName: 'Bretagne' },
  { code: '29', name: 'Finistère (Brest / Quimper)', territoryId: 'METROPOLE', regionName: 'Bretagne' },
  { code: '35', name: 'Ille-et-Vilaine (Rennes)', territoryId: 'METROPOLE', regionName: 'Bretagne' },
  { code: '56', name: 'Morbihan (Vannes / Lorient)', territoryId: 'METROPOLE', regionName: 'Bretagne' },
  { code: '44', name: 'Loire-Atlantique (Nantes)', territoryId: 'METROPOLE', regionName: 'Pays de la Loire' },
  { code: '49', name: 'Maine-et-Loire (Angers)', territoryId: 'METROPOLE', regionName: 'Pays de la Loire' },
  { code: '53', name: 'Mayenne (Laval)', territoryId: 'METROPOLE', regionName: 'Pays de la Loire' },
  { code: '72', name: 'Sarthe (Le Mans)', territoryId: 'METROPOLE', regionName: 'Pays de la Loire' },
  { code: '85', name: 'Vendée (La Roche-sur-Yon)', territoryId: 'METROPOLE', regionName: 'Pays de la Loire' },

  // Hauts-de-France & Grand Est & Normandie
  { code: '02', name: 'Aisne (Laon)', territoryId: 'METROPOLE', regionName: 'Hauts-de-France' },
  { code: '59', name: 'Nord (Lille / Dunkerque)', territoryId: 'METROPOLE', regionName: 'Hauts-de-France' },
  { code: '60', name: 'Oise (Beauvais / Compiègne)', territoryId: 'METROPOLE', regionName: 'Hauts-de-France' },
  { code: '62', name: 'Pas-de-Calais (Arras / Calais)', territoryId: 'METROPOLE', regionName: 'Hauts-de-France' },
  { code: '80', name: 'Somme (Amiens)', territoryId: 'METROPOLE', regionName: 'Hauts-de-France' },
  { code: '08', name: 'Ardennes (Charleville-Mézières)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '10', name: 'Aube (Troyes)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '51', name: 'Marne (Reims / Châlons)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '52', name: 'Haute-Marne (Chaumont)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '54', name: 'Meurthe-et-Moselle (Nancy)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '55', name: 'Meuse (Bar-le-Duc)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '57', name: 'Moselle (Metz)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '67', name: 'Bas-Rhin (Strasbourg)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '68', name: 'Haut-Rhin (Colmar / Mulhouse)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '88', name: 'Vosges (Épinal)', territoryId: 'METROPOLE', regionName: 'Grand Est' },
  { code: '14', name: 'Calvados (Caen)', territoryId: 'METROPOLE', regionName: 'Normandie' },
  { code: '27', name: 'Eure (Évreux)', territoryId: 'METROPOLE', regionName: 'Normandie' },
  { code: '50', name: 'Manche (Saint-Lô / Cherbourg)', territoryId: 'METROPOLE', regionName: 'Normandie' },
  { code: '61', name: 'Orne (Alençon)', territoryId: 'METROPOLE', regionName: 'Normandie' },
  { code: '76', name: 'Seine-Maritime (Rouen / Le Havre)', territoryId: 'METROPOLE', regionName: 'Normandie' },

  // Centre-Val de Loire & Bourgogne-Franche-Comté
  { code: '18', name: 'Cher (Bourges)', territoryId: 'METROPOLE', regionName: 'Centre-Val de Loire' },
  { code: '28', name: 'Eure-et-Loir (Chartres)', territoryId: 'METROPOLE', regionName: 'Centre-Val de Loire' },
  { code: '36', name: 'Indre (Châteauroux)', territoryId: 'METROPOLE', regionName: 'Centre-Val de Loire' },
  { code: '37', name: 'Indre-et-Loire (Tours)', territoryId: 'METROPOLE', regionName: 'Centre-Val de Loire' },
  { code: '41', name: 'Loir-et-Cher (Blois)', territoryId: 'METROPOLE', regionName: 'Centre-Val de Loire' },
  { code: '45', name: 'Loiret (Orléans)', territoryId: 'METROPOLE', regionName: 'Centre-Val de Loire' },
  { code: '21', name: "Côte-d'Or (Dijon)", territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '25', name: 'Doubs (Besançon)', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '39', name: 'Jura (Lons-le-Saunier)', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '58', name: 'Nièvre (Nevers)', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '70', name: 'Haute-Saône (Vesoul)', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '71', name: 'Saône-et-Loire (Mâcon)', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '89', name: 'Yonne (Auxerre)', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },
  { code: '90', name: 'Territoire de Belfort', territoryId: 'METROPOLE', regionName: 'Bourgogne-Franche-Comté' },

  // Corse
  { code: '2A', name: 'Corse-du-Sud (Ajaccio)', territoryId: 'METROPOLE', regionName: 'Corse' },
  { code: '2B', name: 'Haute-Corse (Bastia)', territoryId: 'METROPOLE', regionName: 'Corse' },

  // DROM (Outre-Mer)
  { code: '971', name: 'Guadeloupe', territoryId: 'GUADELOUPE', regionName: 'Antilles' },
  { code: '972', name: 'Martinique', territoryId: 'MARTINIQUE', regionName: 'Antilles' },
  { code: '973', name: 'Guyane', territoryId: 'GUYANE', regionName: 'Guyane' },
  { code: '974', name: 'La Réunion', territoryId: 'REUNION', regionName: 'Océan Indien' },
];

// ============================================================================
// 1. INDEX LOCAL HAUTE VITESSE
// ============================================================================
export const LOCAL_DEPARTMENTS_INDEX: GeoEntity[] = [
  ...FRENCH_DEPARTMENTS_LIST.map((d) => ({
    id: `dep-${d.code}`,
    name: d.name,
    code: d.code,
    territoryId: d.territoryId,
    coordinates: (d.code === '75' ? [2.3488, 48.8534] : [2.2, 46.5]) as [number, number],
    type: 'department' as const,
    regionName: d.regionName,
  })),

  // Communes Clés Outre-Mer
  { id: 'com-97105', name: 'Pointe-à-Pitre', code: '97105', postalCode: '97110', territoryId: 'GUADELOUPE', coordinates: [-61.534, 16.241], type: 'commune', departmentName: 'Guadeloupe' },
  { id: 'com-97106', name: 'Baie-Mahault', code: '97106', postalCode: '97122', territoryId: 'GUADELOUPE', coordinates: [-61.587, 16.267], type: 'commune', departmentName: 'Guadeloupe' },
  { id: 'com-97101', name: 'Les Abymes', code: '97101', postalCode: '97139', territoryId: 'GUADELOUPE', coordinates: [-61.503, 16.271], type: 'commune', departmentName: 'Guadeloupe' },
  { id: 'com-97104', name: 'Basse-Terre', code: '97104', postalCode: '97100', territoryId: 'GUADELOUPE', coordinates: [-61.728, 15.998], type: 'commune', departmentName: 'Guadeloupe' },

  { id: 'com-97209', name: 'Fort-de-France', code: '97209', postalCode: '97200', territoryId: 'MARTINIQUE', coordinates: [-61.058, 14.616], type: 'commune', departmentName: 'Martinique' },
  { id: 'com-97213', name: 'Le Lamentin', code: '97213', postalCode: '97232', territoryId: 'MARTINIQUE', coordinates: [-61.002, 14.615], type: 'commune', departmentName: 'Martinique' },
  { id: 'com-97222', name: 'Schœlcher', code: '97222', postalCode: '97233', territoryId: 'MARTINIQUE', coordinates: [-61.100, 14.616], type: 'commune', departmentName: 'Martinique' },

  { id: 'com-97302', name: 'Cayenne', code: '97302', postalCode: '97300', territoryId: 'GUYANE', coordinates: [-52.333, 4.937], type: 'commune', departmentName: 'Guyane' },
  { id: 'com-97305', name: 'Kourou', code: '97305', postalCode: '97310', territoryId: 'GUYANE', coordinates: [-52.646, 5.158], type: 'commune', departmentName: 'Guyane' },
  { id: 'com-97307', name: 'Matoury', code: '97307', postalCode: '97351', territoryId: 'GUYANE', coordinates: [-52.330, 4.848], type: 'commune', departmentName: 'Guyane' },

  { id: 'com-97411', name: 'Saint-Denis', code: '97411', postalCode: '97400', territoryId: 'REUNION', coordinates: [55.450, -20.882], type: 'commune', departmentName: 'La Réunion' },
  { id: 'com-97416', name: 'Saint-Pierre', code: '97416', postalCode: '97410', territoryId: 'REUNION', coordinates: [55.478, -21.341], type: 'commune', departmentName: 'La Réunion' },
  { id: 'com-97415', name: 'Saint-Paul', code: '97415', postalCode: '97460', territoryId: 'REUNION', coordinates: [55.269, -21.009], type: 'commune', departmentName: 'La Réunion' },
];

// Cache mémoire des fichiers GeoJSON pour affichage progressif
const geoJsonCache = new Map<TerritoryId, any>();
// Cache mémoire des communes par département
const departmentCommunesCache = new Map<string, GeoEntity[]>();

/**
 * URLs des fichiers GeoJSON simplifiés hébergés localement
 */
export const TERRITORY_GEOJSON_PATHS: Record<TerritoryId, string> = {
  METROPOLE: '/geo/departements-metropole-1000m.geojson',
  GUADELOUPE: '/geo/communes-971.geojson',
  MARTINIQUE: '/geo/communes-972.geojson',
  GUYANE: '/geo/communes-973.geojson',
  REUNION: '/geo/communes-974.geojson',
};

/**
 * Chargement progressif du GeoJSON avec mise en cache mémoire
 */
export async function loadTerritoryGeoJson(
  territoryId: TerritoryId,
  onProgress?: (status: 'loading' | 'cached' | 'loaded') => void
): Promise<any> {
  if (geoJsonCache.has(territoryId)) {
    if (onProgress) onProgress('cached');
    return geoJsonCache.get(territoryId);
  }

  if (onProgress) onProgress('loading');
  const path = TERRITORY_GEOJSON_PATHS[territoryId];
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Erreur de chargement du contour territorial : ${territoryId} (${response.statusText})`);
  }

  const data = await response.json();
  geoJsonCache.set(territoryId, data);
  if (onProgress) onProgress('loaded');
  return data;
}

/**
 * Récupère dynamiquement les communes d'un département donné.
 * - Pour les DROMs : exploite les polygones locaux vectoriels
 * - Pour la métropole : interroge geo.api.gouv.fr avec cache mémoire
 */
export async function fetchDepartmentCommunes(departmentCode: string): Promise<GeoEntity[]> {
  const codeClean = String(departmentCode || '').trim();
  if (!codeClean) return [];

  if (departmentCommunesCache.has(codeClean)) {
    return departmentCommunesCache.get(codeClean)!;
  }

  // 1. Cas DROMs (Données locales complètes)
  if (codeClean === '971') {
    const list: GeoEntity[] = GUADELOUPE_COMMUNES_POLYGONS.map((c) => ({
      id: `drom-${c.insee}`,
      name: c.name,
      code: c.insee,
      postalCode: c.postalCode,
      territoryId: 'GUADELOUPE',
      coordinates: [c.lng, c.lat],
      type: 'commune',
      departmentName: 'Guadeloupe',
    }));
    departmentCommunesCache.set(codeClean, list);
    return list;
  }

  if (codeClean === '972') {
    const list: GeoEntity[] = MARTINIQUE_COMMUNES_POLYGONS.map((c: any) => ({
      id: `drom-${c.insee}`,
      name: c.name,
      code: c.insee,
      postalCode: '972' + c.insee.slice(-2),
      territoryId: 'MARTINIQUE' as const,
      coordinates: [-61.0, 14.6] as [number, number],
      type: 'commune' as const,
      departmentName: 'Martinique',
    }));
    departmentCommunesCache.set(codeClean, list);
    return list;
  }

  if (codeClean === '973') {
    const list: GeoEntity[] = GUYANE_COMMUNES_POLYGONS.map((c) => ({
      id: `drom-${c.insee}`,
      name: c.name,
      code: c.insee,
      postalCode: c.postalCode,
      territoryId: 'GUYANE' as const,
      coordinates: [c.lng, c.lat] as [number, number],
      type: 'commune' as const,
      departmentName: 'Guyane',
    }));
    departmentCommunesCache.set(codeClean, list);
    return list;
  }

  if (codeClean === '974') {
    const list: GeoEntity[] = REUNION_COMMUNES_POLYGONS.map((c) => ({
      id: `drom-${c.insee}`,
      name: c.name,
      code: c.insee,
      postalCode: c.postalCode,
      territoryId: 'REUNION' as const,
      coordinates: [c.lng, c.lat] as [number, number],
      type: 'commune' as const,
      departmentName: 'La Réunion',
    }));
    departmentCommunesCache.set(codeClean, list);
    return list;
  }

  // 2. Cas Métropole : appel geo.api.gouv.fr
  try {
    const url = `https://geo.api.gouv.fr/departements/${codeClean}/communes?fields=nom,code,centre,codesPostaux,population`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data: any[] = await resp.json();
      const depInfo = FRENCH_DEPARTMENTS_LIST.find((d) => d.code === codeClean);
      const depName = depInfo ? depInfo.name : `Dép. ${codeClean}`;

      const list: GeoEntity[] = data
        .filter((c) => c.centre && c.centre.coordinates)
        .map((c) => ({
          id: `insee-${c.code}`,
          name: c.nom,
          code: c.code,
          postalCode: c.codesPostaux ? c.codesPostaux[0] : undefined,
          territoryId: 'METROPOLE' as const,
          coordinates: [c.centre.coordinates[0], c.centre.coordinates[1]] as [number, number],
          type: 'commune' as const,
          departmentName: depName,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

      departmentCommunesCache.set(codeClean, list);
      return list;
    }
  } catch (err) {
    console.warn(`Impossible de charger les communes du département ${codeClean}:`, err);
  }

  return [];
}

/**
 * Reverse Geocoding officiel haute précision (GPS -> Adresse, Rue, Commune, Département)
 * Utilise l'API nationale publique data.gouv.fr
 */
export async function reverseGeocode(lng: number, lat: number): Promise<ReverseGeocodeResult | null> {
  try {
    const url = `https://api-adresse.data.gouv.fr/reverse/?lon=${lng}&lat=${lat}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;

    const data = await resp.json();
    if (!data.features || data.features.length === 0) return null;

    const top = data.features[0];
    const props = top.properties || {};
    const coords: [number, number] = top.geometry?.coordinates || [lng, lat];

    const postcode = String(props.postcode || '');
    const citycode = String(props.citycode || '');

    // Détermination du département et du territoire
    let depCode = '';
    let territoryId: TerritoryId = 'METROPOLE';

    if (postcode.startsWith('971') || citycode.startsWith('971')) {
      depCode = '971';
      territoryId = 'GUADELOUPE';
    } else if (postcode.startsWith('972') || citycode.startsWith('972')) {
      depCode = '972';
      territoryId = 'MARTINIQUE';
    } else if (postcode.startsWith('973') || citycode.startsWith('973')) {
      depCode = '973';
      territoryId = 'GUYANE';
    } else if (postcode.startsWith('974') || citycode.startsWith('974')) {
      depCode = '974';
      territoryId = 'REUNION';
    } else if (citycode.startsWith('2A') || postcode.startsWith('200') || postcode.startsWith('201')) {
      depCode = '2A';
      territoryId = 'METROPOLE';
    } else if (citycode.startsWith('2B') || postcode.startsWith('202')) {
      depCode = '2B';
      territoryId = 'METROPOLE';
    } else {
      depCode = citycode.slice(0, 2) || postcode.slice(0, 2) || '75';
      territoryId = 'METROPOLE';
    }

    const depInfo = FRENCH_DEPARTMENTS_LIST.find((d) => d.code === depCode);

    return {
      label: props.label || props.name || 'Adresse détectée',
      street: props.street || (props.type === 'street' || props.type === 'housenumber' ? props.name : undefined),
      housenumber: props.housenumber,
      city: props.city || '',
      postalCode: postcode,
      departmentCode: depCode,
      departmentName: depInfo ? depInfo.name : undefined,
      coordinates: coords,
      territoryId,
    };
  } catch (err) {
    console.error('Erreur reverse geocode GPS:', err);
    return null;
  }
}

/**
 * Recherche indépendante via la base de données :
 * 1. Recherche instantanée dans l'index local optimisé (départements & grandes villes)
 * 2. Recherche d'adresses précises (rues, numéros) via api-adresse.data.gouv.fr
 * 3. Recherche de communes via geo.api.gouv.fr
 */
export async function searchNationalDatabase(query: string): Promise<GeoEntity[]> {
  const clean = String(query || '').trim();
  if (!clean || clean.length < 2) return [];

  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-'\s]/g, '');

  const qNorm = norm(clean);
  const isPostalCode = /^\d{2,5}$/.test(clean);
  const hasStreetIndicator = /\b(rue|av|ave|avenue|bd|boulevard|all|allee|chem|chemin|imp|impasse|pl|place|route|rte|\d+)\b/i.test(clean);

  // 1. Recherche prioritaire dans l'index local
  const localMatches = LOCAL_DEPARTMENTS_INDEX.filter((item) => {
    if (isPostalCode) {
      if (item.code.startsWith(clean) || (item.postalCode && item.postalCode.startsWith(clean))) {
        return true;
      }
    }
    return (
      norm(item.name).includes(qNorm) ||
      norm(item.code) === qNorm ||
      (item.postalCode && norm(item.postalCode).includes(qNorm))
    );
  });

  // Si l'utilisateur tape un numéro de département court (ex: "69", "13", "33")
  if (localMatches.length > 0 && clean.length <= 3 && !hasStreetIndicator) {
    return localMatches.slice(0, 8);
  }

  const combined: GeoEntity[] = [...localMatches];

  // 2. Recherche d'adresse et rue précise si indicateur de rue ou longueur suffisante
  if (hasStreetIndicator || clean.length >= 4) {
    try {
      const urlStreet = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(clean)}&limit=6`;
      const respStreet = await fetch(urlStreet);
      if (respStreet.ok) {
        const streetData = await respStreet.json();
        if (streetData.features) {
          for (const f of streetData.features) {
            const props = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const pCode = props.postcode || '';
            let territoryId: TerritoryId = 'METROPOLE';
            if (pCode.startsWith('971')) territoryId = 'GUADELOUPE';
            else if (pCode.startsWith('972')) territoryId = 'MARTINIQUE';
            else if (pCode.startsWith('973')) territoryId = 'GUYANE';
            else if (pCode.startsWith('974')) territoryId = 'REUNION';

            const depCode = props.citycode ? props.citycode.slice(0, 2) : pCode.slice(0, 2);

            combined.push({
              id: `addr-${props.id || Math.random()}`,
              name: props.label || props.name,
              code: props.citycode || pCode,
              postalCode: pCode,
              territoryId,
              coordinates: coords,
              type: props.type === 'housenumber' || props.type === 'street' ? 'street' : 'commune',
              departmentName: props.city ? `${props.city} (${depCode})` : undefined,
              street: props.street || props.name,
              housenumber: props.housenumber,
            });
          }
        }
      }
    } catch (err) {
      console.warn('API Adresse non joignable:', err);
    }
  }

  // 3. Recherche de commune via geo.api.gouv.fr
  try {
    const apiParam = isPostalCode && clean.length === 5 ? `codePostal=${clean}` : `nom=${encodeURIComponent(clean)}`;
    const urlCommune = `https://geo.api.gouv.fr/communes?${apiParam}&fields=nom,code,centre,departement,codesPostaux&limit=6`;
    const respCommune = await fetch(urlCommune);

    if (respCommune.ok) {
      const gouvResults: any[] = await respCommune.json();
      for (const c of gouvResults) {
        if (!c.centre || !c.centre.coordinates) continue;
        const depCode = c.departement?.code || c.code.slice(0, 2);
        let territoryId: TerritoryId = 'METROPOLE';
        if (depCode === '971' || c.code.startsWith('971')) territoryId = 'GUADELOUPE';
        else if (depCode === '972' || c.code.startsWith('972')) territoryId = 'MARTINIQUE';
        else if (depCode === '973' || c.code.startsWith('973')) territoryId = 'GUYANE';
        else if (depCode === '974' || c.code.startsWith('974')) territoryId = 'REUNION';

        if (!combined.some((x) => x.name.toLowerCase() === c.nom.toLowerCase() && x.code === c.code)) {
          combined.push({
            id: `gouv-${c.code}`,
            name: c.nom,
            code: c.code,
            postalCode: c.codesPostaux ? c.codesPostaux[0] : undefined,
            territoryId,
            coordinates: [c.centre.coordinates[0], c.centre.coordinates[1]],
            type: 'commune',
            departmentName: c.departement?.nom || `Dép. ${depCode}`,
          });
        }
      }
    }
  } catch (err) {
    console.warn('API geo.api.gouv.fr non joignable:', err);
  }

  return combined.slice(0, 10);
}
