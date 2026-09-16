/**
 * Service de base de données géographique nationale (Clinigo / MedicTrans)
 * - Données géographiques simplifiées (GeoJSON Etalab 1000m & DROM)
 * - Chargement progressif avec cache mémoire
 * - Recherche indépendante via index local + API officielle geo.api.gouv.fr
 */

import { TerritoryId } from '../data/nationalTerritoriesData';

export interface GeoEntity {
  id: string;
  name: string;
  code: string; // INSEE ou numéro de département
  postalCode?: string;
  territoryId: TerritoryId;
  coordinates: [number, number]; // [longitude, latitude] (standard GeoJSON)
  type: 'commune' | 'department' | 'metropole';
  departmentName?: string;
  regionName?: string;
}

// ============================================================================
// 1. INDEX LOCAL HAUTE VITESSE (DÉPARTEMENTS + COMMUNES DROM + GRANDES VILLES)
// ============================================================================
export const LOCAL_DEPARTMENTS_INDEX: GeoEntity[] = [
  // Île-de-France
  { id: 'dep-75', name: 'Paris', code: '75', territoryId: 'METROPOLE', coordinates: [2.3488, 48.8534], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-77', name: 'Seine-et-Marne', code: '77', territoryId: 'METROPOLE', coordinates: [2.9038, 48.6083], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-78', name: 'Yvelines', code: '78', territoryId: 'METROPOLE', coordinates: [1.8893, 48.7846], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-91', name: 'Essonne', code: '91', territoryId: 'METROPOLE', coordinates: [2.2573, 48.5256], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-92', name: 'Hauts-de-Seine', code: '92', territoryId: 'METROPOLE', coordinates: [2.2356, 48.8354], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-93', name: 'Seine-Saint-Denis', code: '93', territoryId: 'METROPOLE', coordinates: [2.4832, 48.9137], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-94', name: 'Val-de-Marne', code: '94', territoryId: 'METROPOLE', coordinates: [2.4646, 48.7779], type: 'department', regionName: 'Île-de-France' },
  { id: 'dep-95', name: "Val-d'Oise", code: '95', territoryId: 'METROPOLE', coordinates: [2.1466, 49.0722], type: 'department', regionName: 'Île-de-France' },

  // Auvergne-Rhône-Alpes
  { id: 'dep-69', name: 'Rhône & Métropole de Lyon', code: '69', territoryId: 'METROPOLE', coordinates: [4.8357, 45.7640], type: 'department', regionName: 'Auvergne-Rhône-Alpes' },
  { id: 'dep-38', name: 'Isère (Grenoble)', code: '38', territoryId: 'METROPOLE', coordinates: [5.7245, 45.1885], type: 'department', regionName: 'Auvergne-Rhône-Alpes' },
  { id: 'dep-42', name: 'Loire (Saint-Étienne)', code: '42', territoryId: 'METROPOLE', coordinates: [4.3872, 45.4397], type: 'department', regionName: 'Auvergne-Rhône-Alpes' },
  { id: 'dep-63', name: 'Puy-de-Dôme (Clermont-Ferrand)', code: '63', territoryId: 'METROPOLE', coordinates: [3.0870, 45.7772], type: 'department', regionName: 'Auvergne-Rhône-Alpes' },
  { id: 'dep-74', name: 'Haute-Savoie (Annecy)', code: '74', territoryId: 'METROPOLE', coordinates: [6.1294, 45.8992], type: 'department', regionName: 'Auvergne-Rhône-Alpes' },

  // Provence-Alpes-Côte d'Azur
  { id: 'dep-13', name: 'Bouches-du-Rhône (Marseille / Aix)', code: '13', territoryId: 'METROPOLE', coordinates: [5.3698, 43.2965], type: 'department', regionName: "PACA" },
  { id: 'dep-06', name: 'Alpes-Maritimes (Nice / Cannes)', code: '06', territoryId: 'METROPOLE', coordinates: [7.2620, 43.7102], type: 'department', regionName: "PACA" },
  { id: 'dep-83', name: 'Var (Toulon)', code: '83', territoryId: 'METROPOLE', coordinates: [5.9280, 43.1242], type: 'department', regionName: "PACA" },

  // Nouvelle-Aquitaine
  { id: 'dep-33', name: 'Gironde (Bordeaux)', code: '33', territoryId: 'METROPOLE', coordinates: [-0.5792, 44.8378], type: 'department', regionName: 'Nouvelle-Aquitaine' },
  { id: 'dep-64', name: 'Pyrénées-Atlantiques (Pau / Bayonne)', code: '64', territoryId: 'METROPOLE', coordinates: [-0.3708, 43.2951], type: 'department', regionName: 'Nouvelle-Aquitaine' },

  // Occitanie
  { id: 'dep-31', name: 'Haute-Garonne (Toulouse)', code: '31', territoryId: 'METROPOLE', coordinates: [1.4442, 43.6047], type: 'department', regionName: 'Occitanie' },
  { id: 'dep-34', name: 'Hérault (Montpellier)', code: '34', territoryId: 'METROPOLE', coordinates: [3.8767, 43.6108], type: 'department', regionName: 'Occitanie' },

  // Bretagne & Pays de la Loire
  { id: 'dep-35', name: 'Ille-et-Vilaine (Rennes)', code: '35', territoryId: 'METROPOLE', coordinates: [-1.6778, 48.1173], type: 'department', regionName: 'Bretagne' },
  { id: 'dep-29', name: 'Finistère (Brest / Quimper)', code: '29', territoryId: 'METROPOLE', coordinates: [-4.4861, 48.3904], type: 'department', regionName: 'Bretagne' },
  { id: 'dep-44', name: 'Loire-Atlantique (Nantes)', code: '44', territoryId: 'METROPOLE', coordinates: [-1.5536, 47.2184], type: 'department', regionName: 'Pays de la Loire' },
  { id: 'dep-49', name: 'Maine-et-Loire (Angers)', code: '49', territoryId: 'METROPOLE', coordinates: [-0.5516, 47.4784], type: 'department', regionName: 'Pays de la Loire' },

  // Hauts-de-France & Grand Est & Normandie
  { id: 'dep-59', name: 'Nord (Lille)', code: '59', territoryId: 'METROPOLE', coordinates: [3.0573, 50.6292], type: 'department', regionName: 'Hauts-de-France' },
  { id: 'dep-67', name: 'Bas-Rhin (Strasbourg)', code: '67', territoryId: 'METROPOLE', coordinates: [7.7521, 48.5734], type: 'department', regionName: 'Grand Est' },
  { id: 'dep-76', name: 'Seine-Maritime (Rouen / Le Havre)', code: '76', territoryId: 'METROPOLE', coordinates: [1.0999, 49.4432], type: 'department', regionName: 'Normandie' },

  // DROM (Outre-Mer)
  { id: 'dep-971', name: 'Guadeloupe', code: '971', territoryId: 'GUADELOUPE', coordinates: [-61.551, 16.265], type: 'department', regionName: 'Antilles' },
  { id: 'dep-972', name: 'Martinique', code: '972', territoryId: 'MARTINIQUE', coordinates: [-61.024, 14.641], type: 'department', regionName: 'Antilles' },
  { id: 'dep-973', name: 'Guyane', code: '973', territoryId: 'GUYANE', coordinates: [-53.125, 3.933], type: 'department', regionName: 'Guyane' },
  { id: 'dep-974', name: 'La Réunion', code: '974', territoryId: 'REUNION', coordinates: [55.536, -21.115], type: 'department', regionName: 'Océan Indien' },

  // Communes Clés Outre-Mer (971, 972, 973, 974)
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
  { id: 'com-97311', name: 'Saint-Laurent-du-Maroni', code: '97311', postalCode: '97320', territoryId: 'GUYANE', coordinates: [-54.031, 5.501], type: 'commune', departmentName: 'Guyane' },

  { id: 'com-97411', name: 'Saint-Denis', code: '97411', postalCode: '97400', territoryId: 'REUNION', coordinates: [55.450, -20.882], type: 'commune', departmentName: 'La Réunion' },
  { id: 'com-97416', name: 'Saint-Pierre', code: '97416', postalCode: '97410', territoryId: 'REUNION', coordinates: [55.478, -21.341], type: 'commune', departmentName: 'La Réunion' },
  { id: 'com-97415', name: 'Saint-Paul', code: '97415', postalCode: '97460', territoryId: 'REUNION', coordinates: [55.269, -21.009], type: 'commune', departmentName: 'La Réunion' },
  { id: 'com-97414', name: 'Saint-Leu', code: '97414', postalCode: '97436', territoryId: 'REUNION', coordinates: [55.288, -21.165], type: 'commune', departmentName: 'La Réunion' },
];

// Cache mémoire des fichiers GeoJSON pour affichage progressif
const geoJsonCache = new Map<TerritoryId, any>();

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
 * Recherche indépendante via la base de données :
 * 1. Recherche instantanée dans l'index local optimisé
 * 2. Si non trouvé ou requête détaillée, interrogation de l'API officielle data.gouv.fr (geo.api.gouv.fr)
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

  // Si on a déjà des résultats locaux précis ou si la requête est un numéro de département
  if (localMatches.length > 0 && clean.length <= 3) {
    return localMatches.slice(0, 8);
  }

  // 2. Recherche distante officielle via geo.api.gouv.fr (communes françaises)
  try {
    const apiParam = isPostalCode && clean.length === 5 ? `codePostal=${clean}` : `nom=${encodeURIComponent(clean)}`;
    const url = `https://geo.api.gouv.fr/communes?${apiParam}&fields=nom,code,centre,departement,codesPostaux&limit=6`;
    const resp = await fetch(url);

    if (resp.ok) {
      const gouvResults: any[] = await resp.json();
      const remoteEntities: GeoEntity[] = gouvResults
        .filter((c) => c.centre && c.centre.coordinates)
        .map((c) => {
          const depCode = c.departement?.code || c.code.slice(0, 2);
          let territoryId: TerritoryId = 'METROPOLE';
          if (depCode === '971' || c.code.startsWith('971')) territoryId = 'GUADELOUPE';
          else if (depCode === '972' || c.code.startsWith('972')) territoryId = 'MARTINIQUE';
          else if (depCode === '973' || c.code.startsWith('973')) territoryId = 'GUYANE';
          else if (depCode === '974' || c.code.startsWith('974')) territoryId = 'REUNION';

          return {
            id: `gouv-${c.code}`,
            name: c.nom,
            code: c.code,
            postalCode: c.codesPostaux ? c.codesPostaux[0] : undefined,
            territoryId,
            coordinates: [c.centre.coordinates[0], c.centre.coordinates[1]],
            type: 'commune',
            departmentName: c.departement?.nom || `Dép. ${depCode}`,
          };
        });

      // Fusion sans doublons
      const combined = [...localMatches];
      for (const rem of remoteEntities) {
        if (!combined.some((x) => x.name.toLowerCase() === rem.name.toLowerCase() && x.code === rem.code)) {
          combined.push(rem);
        }
      }
      return combined.slice(0, 10);
    }
  } catch (err) {
    console.warn('API geo.api.gouv.fr non joignable, fallback local activé:', err);
  }

  return localMatches.slice(0, 8);
}
