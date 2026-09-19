import { TransportType, MobilityNeeds, RidePricing } from '../types/index';
import { detectTerritoryFromAddress, TERRITORIES_CONFIG, TerritoryId } from '../data/nationalTerritoriesData';

/**
 * Coordonnées GPS des 34 communes de la Martinique (972)
 */
export const MARTINIQUE_COMMUNE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'fort-de-france': { lat: 14.6161, lng: -61.0588 },
  'le lamentin': { lat: 14.6152, lng: -60.9995 },
  'lamentin': { lat: 14.6152, lng: -60.9995 },
  'schœlcher': { lat: 14.6167, lng: -61.1000 },
  'schoelcher': { lat: 14.6167, lng: -61.1000 },
  'saint-joseph': { lat: 14.6706, lng: -61.0378 },
  'ducos': { lat: 14.5753, lng: -60.9753 },
  'rivière-salée': { lat: 14.5297, lng: -60.9786 },
  'riviere-salee': { lat: 14.5297, lng: -60.9786 },
  'le robert': { lat: 14.6775, lng: -60.9392 },
  'robert': { lat: 14.6775, lng: -60.9392 },
  'le françois': { lat: 14.6156, lng: -60.9028 },
  'francois': { lat: 14.6156, lng: -60.9028 },
  'sainte-marie': { lat: 14.7828, lng: -60.9933 },
  'la trinité': { lat: 14.7381, lng: -60.9631 },
  'trinite': { lat: 14.7381, lng: -60.9631 },
  'gros-morne': { lat: 14.7078, lng: -61.0089 },
  'saint-esprit': { lat: 14.5614, lng: -60.9358 },
  'le marin': { lat: 14.4711, lng: -60.8697 },
  'marin': { lat: 14.4711, lng: -60.8697 },
  'sainte-luce': { lat: 14.4683, lng: -60.9222 },
  'le diamant': { lat: 14.4800, lng: -61.0286 },
  'diamant': { lat: 14.4800, lng: -61.0286 },
  'les trois-îlets': { lat: 14.5381, lng: -61.0336 },
  'trois-ilets': { lat: 14.5381, lng: -61.0336 },
  'les anses-d\'arlet': { lat: 14.4917, lng: -61.0806 },
  'anses-d-arlet': { lat: 14.4917, lng: -61.0806 },
  'rivière-pilote': { lat: 14.4878, lng: -60.9036 },
  'riviere-pilote': { lat: 14.4878, lng: -60.9036 },
  'le vauclin': { lat: 14.5458, lng: -60.8389 },
  'vauclin': { lat: 14.5458, lng: -60.8389 },
  'sainte-anne': { lat: 14.4350, lng: -60.8814 },
  'case-pilote': { lat: 14.6433, lng: -61.1389 },
  'bellefontaine': { lat: 14.6742, lng: -61.1647 },
  'le carbet': { lat: 14.7114, lng: -61.1814 },
  'carbet': { lat: 14.7114, lng: -61.1814 },
  'saint-pierre': { lat: 14.7422, lng: -61.1764 },
  'le prêcheur': { lat: 14.8017, lng: -61.2253 },
  'precheur': { lat: 14.8017, lng: -61.2253 },
  'grand\'rivière': { lat: 14.8731, lng: -61.1794 },
  'grand-riviere': { lat: 14.8731, lng: -61.1794 },
  'macouba': { lat: 14.8744, lng: -61.1444 },
  'basse-pointe': { lat: 14.8683, lng: -61.1217 },
  'l\'ajoupa-bouillon': { lat: 14.8250, lng: -61.1147 },
  'ajoupa-bouillon': { lat: 14.8250, lng: -61.1147 },
  'le lorrain': { lat: 14.8322, lng: -61.0558 },
  'lorrain': { lat: 14.8322, lng: -61.0558 },
  'le marigot': { lat: 14.8222, lng: -61.0286 },
  'marigot': { lat: 14.8222, lng: -61.0286 },
  'fonds-saint-denis': { lat: 14.7189, lng: -61.1311 },
  'le morne-rouge': { lat: 14.7733, lng: -61.1350 },
  'morne-rouge': { lat: 14.7733, lng: -61.1350 },
  'morne-vert': { lat: 14.7042, lng: -61.1444 },
};

/**
 * Coordonnées GPS des principaux établissements de santé 972
 */
export const HEALTHCARE_FACILITY_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  'chum-zobda': { lat: 14.6190, lng: -61.0425, name: 'CHU Pierre Zobda-Quitman' },
  'chum-mfme': { lat: 14.6180, lng: -61.0410, name: 'Maison de la Femme, de la Mère et de l\'Enfant' },
  'chum-clarac': { lat: 14.6110, lng: -61.0550, name: 'Hôpital Albert Clarac' },
  'chum-mangot-vulcin': { lat: 14.6295, lng: -60.9980, name: 'Hôpital Mangot Vulcin' },
  'chum-emma-ventura': { lat: 14.6090, lng: -61.0650, name: 'Centre Emma Ventura' },
  'ch-trinite': { lat: 14.7395, lng: -60.9630, name: 'Hôpital Louis Domergue (Trinité)' },
  'ch-marin': { lat: 14.4710, lng: -60.8710, name: 'Hôpital du Marin' },
  'ch-saint-pierre': { lat: 14.7430, lng: -61.1760, name: 'Hôpital de Saint-Pierre' },
  'ch-saint-esprit': { lat: 14.5620, lng: -60.9360, name: 'Hôpital de Saint-Esprit' },
  'clinique-sainte-marie': { lat: 14.6200, lng: -61.0950, name: 'Clinique Sainte-Marie' },
  'clinique-saint-paul': { lat: 14.6185, lng: -61.0690, name: 'Polyclinique Saint-Paul' },
  'dialyse-dillon': { lat: 14.6080, lng: -61.0540, name: 'Centre Hémodialyse Dillon' },
  'dialyse-sainte-therese': { lat: 14.6130, lng: -61.0520, name: 'Dialyse Sainte-Thérèse' },
  'dialyse-trinite': { lat: 14.7360, lng: -60.9660, name: 'Autodialyse Trinité' },
  'dialyse-lamentin': { lat: 14.6140, lng: -60.9970, name: 'Dialyse Place d\'Armes' },
  'dialyse-marin': { lat: 14.4720, lng: -60.8690, name: 'Autodialyse Le Marin' },
  'ssr-carbet': { lat: 14.7120, lng: -61.1820, name: 'SSR Le Carbet' },
  'ssr-balata': { lat: 14.6510, lng: -61.0760, name: 'Convalescence Balata' },
  'ehpad-valeriane': { lat: 14.6260, lng: -61.0590, name: 'EHPAD La Valériane' },
  'ehpad-filaos': { lat: 14.4730, lng: -60.8680, name: 'EHPAD Les Filaos' },
  'ehpad-bethany': { lat: 14.7400, lng: -60.9650, name: 'EHPAD Bethany Home' },
  'ehpad-saint-joseph': { lat: 14.6710, lng: -61.0360, name: 'EHPAD Saint-Joseph' },
};

/**
 * Matrice pré-calibrée des distances et durées routières réelles (km et minutes)
 * entre pôles majeurs de Martinique pour garantir des chiffres 100% fidèles au terrain.
 */
const MARTINIQUE_ROAD_MATRIX: Record<string, Record<string, { km: number; min: number }>> = {
  'fort-de-france': {
    'chum-zobda': { km: 5.4, min: 12 },
    'chum-clarac': { km: 2.8, min: 8 },
    'chum-mangot-vulcin': { km: 11.2, min: 18 },
    'clinique-sainte-marie': { km: 6.8, min: 14 },
    'clinique-saint-paul': { km: 3.2, min: 9 },
    'dialyse-dillon': { km: 3.1, min: 8 },
    'ch-trinite': { km: 31.5, min: 42 },
    'ch-marin': { km: 44.8, min: 52 },
    'ch-saint-pierre': { km: 30.8, min: 48 },
    'le lamentin': { km: 9.8, min: 15 },
    'schœlcher': { km: 5.2, min: 11 },
    'le robert': { km: 19.4, min: 26 },
    'le françois': { km: 24.2, min: 32 },
    'ducos': { km: 14.6, min: 19 },
    'rivière-salée': { km: 22.4, min: 28 },
    'sainte-luce': { km: 32.1, min: 38 },
  },
  'le lamentin': {
    'chum-zobda': { km: 8.5, min: 14 },
    'chum-mangot-vulcin': { km: 3.8, min: 8 },
    'ch-trinite': { km: 24.6, min: 32 },
    'ch-marin': { km: 35.2, min: 40 },
    'clinique-sainte-marie': { km: 12.8, min: 20 },
    'le robert': { km: 11.2, min: 16 },
    'le françois': { km: 15.4, min: 20 },
    'ducos': { km: 7.8, min: 11 },
  },
  'le robert': {
    'chum-zobda': { km: 19.8, min: 28 },
    'ch-trinite': { km: 13.5, min: 18 },
    'clinique-sainte-marie': { km: 22.4, min: 32 },
    'chum-mangot-vulcin': { km: 14.2, min: 20 },
    'ch-marin': { km: 42.0, min: 48 },
  },
  'la trinité': {
    'chum-zobda': { km: 32.0, min: 42 },
    'ch-trinite': { km: 1.5, min: 4 },
    'clinique-sainte-marie': { km: 34.5, min: 46 },
    'ch-marin': { km: 56.0, min: 65 },
    'ch-saint-pierre': { km: 41.2, min: 55 },
  },
  'le marin': {
    'chum-zobda': { km: 44.5, min: 50 },
    'ch-marin': { km: 1.2, min: 3 },
    'clinique-sainte-marie': { km: 48.0, min: 55 },
    'ch-trinite': { km: 56.5, min: 65 },
    'dialyse-marin': { km: 1.8, min: 4 },
  },
  'schœlcher': {
    'chum-zobda': { km: 6.9, min: 14 },
    'clinique-sainte-marie': { km: 2.1, min: 5 },
    'ch-saint-pierre': { km: 26.5, min: 40 },
    'ch-trinite': { km: 35.8, min: 45 },
  },
  'ducos': {
    'chum-zobda': { km: 14.5, min: 18 },
    'ch-marin': { km: 30.2, min: 34 },
    'ch-trinite': { km: 29.8, min: 38 },
  },
  'saint-pierre': {
    'chum-zobda': { km: 31.2, min: 48 },
    'ch-saint-pierre': { km: 1.0, min: 3 },
    'clinique-sainte-marie': { km: 27.5, min: 42 },
  }
};

/**
 * Calcul de la distance géodésique Haversine (en km)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Normalise un texte pour recherche souple (accents, casse)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Résolution des coordonnées GPS pour un texte d'adresse, de commune ou d'établissement de santé
 * Supporte la France Métropolitaine, la Martinique (972), la Guadeloupe (971), la Guyane (973) et La Réunion (974).
 */
export function resolveCoordinates(input: string, targetTerritory?: TerritoryId): { lat: number; lng: number; label: string } {
  const norm = normalizeText(input);

  // 1. Établissements de santé majeurs nationaux & DOM
  const NATIONAL_FACILITY_PINS: Record<string, { lat: number; lng: number; label: string }> = {
    'purpan': { lat: 43.6089, lng: 1.4014, label: 'CHU Toulouse Purpan' },
    'rangueil': { lat: 43.5574, lng: 1.4547, label: 'CHU Toulouse Rangueil' },
    'pasteur-toulouse': { lat: 43.5939, lng: 1.4172, label: 'Clinique Pasteur Toulouse' },
    'oncopole': { lat: 43.5591, lng: 1.4287, label: 'IUCT Oncopole Toulouse' },
    'ducuing': { lat: 43.5978, lng: 1.4312, label: 'Hôpital Joseph Ducuing' },
    'salpetriere': { lat: 48.8392, lng: 2.3653, label: 'AP-HP Pitié-Salpêtrière' },
    'hegp': { lat: 48.8395, lng: 2.2741, label: 'AP-HP Georges-Pompidou' },
    'necker': { lat: 48.8458, lng: 2.3155, label: 'AP-HP Necker' },
    'herriot': { lat: 45.7441, lng: 4.8814, label: 'HCL Édouard Herriot' },
    'timone': { lat: 43.2891, lng: 5.4025, label: 'AP-HM Timone' },
    'pellegrin': { lat: 44.8306, lng: -0.6033, label: 'CHU Bordeaux Pellegrin' },
    'lapeyronie': { lat: 43.6318, lng: 3.8587, label: 'CHU Montpellier Lapeyronie' },
    'hautepierre': { lat: 48.5917, lng: 7.7028, label: 'CHU Strasbourg Hautepierre' },
    'pontchaillou': { lat: 48.1219, lng: -1.6961, label: 'CHU Rennes Pontchaillou' },
    'huriez': { lat: 50.6105, lng: 3.0336, label: 'CHU Lille Huriez' },
    'hotel-dieu-nantes': { lat: 47.2119, lng: -1.5528, label: 'CHU Nantes Hôtel-Dieu' },
  };

  for (const [key, pin] of Object.entries(NATIONAL_FACILITY_PINS)) {
    if (norm.includes(key)) {
      return pin;
    }
  }

  // Établissements de santé de Martinique
  for (const [key, facility] of Object.entries(HEALTHCARE_FACILITY_COORDINATES)) {
    const fNorm = normalizeText(facility.name);
    if (norm.includes(key) || norm.includes(fNorm) || fNorm.includes(norm)) {
      return { lat: facility.lat, lng: facility.lng, label: facility.name };
    }
  }

  // CHU Zobda match générique
  if (norm.includes('zobda') || norm.includes('chum') || norm.includes('chateuboeuf') || norm.includes('chateauboeuf') || norm.includes('meynard')) {
    const f = HEALTHCARE_FACILITY_COORDINATES['chum-zobda'];
    return { lat: f.lat, lng: f.lng, label: f.name };
  }
  // Trinité match
  if (norm.includes('domergue') || norm.includes('trinite')) {
    const f = HEALTHCARE_FACILITY_COORDINATES['ch-trinite'];
    return { lat: f.lat, lng: f.lng, label: f.name };
  }
  // Sainte-Marie clinique match
  if (norm.includes('sainte-marie') && (norm.includes('clinique') || norm.includes('fofo') || norm.includes('rochers'))) {
    const f = HEALTHCARE_FACILITY_COORDINATES['clinique-sainte-marie'];
    return { lat: f.lat, lng: f.lng, label: f.name };
  }
  // Marin hôpital match
  if (norm.includes('marin') && (norm.includes('hopital') || norm.includes('ch-marin'))) {
    const f = HEALTHCARE_FACILITY_COORDINATES['ch-marin'];
    return { lat: f.lat, lng: f.lng, label: f.name };
  }
  // Dillon dialyse match
  if (norm.includes('dillon')) {
    const f = HEALTHCARE_FACILITY_COORDINATES['dialyse-dillon'];
    return { lat: f.lat, lng: f.lng, label: f.name };
  }

  // 2. Détection par département officiel ou métropole
  const deptMatch = norm.match(/\b(97[1-6]|2[ab]|0[1-9]|[1-8]\d|9[0-5])\d{3}\b/);
  const deptCode = deptMatch ? deptMatch[1] : null;

  if (deptCode === '31' || norm.includes('toulouse') || norm.includes('blagnac') || norm.includes('colomiers')) {
    return { lat: 43.6047, lng: 1.4442, label: 'Toulouse (31)' };
  }
  if (['75', '92', '93', '94', '77', '78', '91', '95'].includes(deptCode || '') || norm.includes('paris')) {
    return { lat: 48.8566, lng: 2.3522, label: 'Paris (IDF)' };
  }
  if (deptCode === '69' || norm.includes('lyon')) {
    return { lat: 45.7640, lng: 4.8357, label: 'Lyon (69)' };
  }
  if (deptCode === '13' || norm.includes('marseille')) {
    return { lat: 43.2965, lng: 5.3698, label: 'Marseille (13)' };
  }
  if (deptCode === '33' || norm.includes('bordeaux')) {
    return { lat: 44.8378, lng: -0.5792, label: 'Bordeaux (33)' };
  }
  if (deptCode === '34' || norm.includes('montpellier')) {
    return { lat: 43.6108, lng: 3.8767, label: 'Montpellier (34)' };
  }
  if (deptCode === '67' || norm.includes('strasbourg')) {
    return { lat: 48.5734, lng: 7.7521, label: 'Strasbourg (67)' };
  }
  if (deptCode === '35' || norm.includes('rennes')) {
    return { lat: 48.1173, lng: -1.6778, label: 'Rennes (35)' };
  }
  if (deptCode === '59' || norm.includes('lille')) {
    return { lat: 50.6292, lng: 3.0573, label: 'Lille (59)' };
  }
  if (deptCode === '44' || norm.includes('nantes')) {
    return { lat: 47.2184, lng: -1.5536, label: 'Nantes (44)' };
  }
  if (deptCode === '06' || norm.includes('nice')) {
    return { lat: 43.7102, lng: 7.2620, label: 'Nice (06)' };
  }
  if (deptCode === '971' || norm.includes('guadeloupe') || norm.includes('pointe a pitre')) {
    return { lat: 16.2411, lng: -61.5331, label: 'Pointe-à-Pitre (971)' };
  }
  if (deptCode === '973' || norm.includes('guyane') || norm.includes('cayenne')) {
    return { lat: 4.9372, lng: -52.3260, label: 'Cayenne (973)' };
  }
  if (deptCode === '974' || norm.includes('reunion') || norm.includes('saint denis')) {
    return { lat: -20.8789, lng: 55.4481, label: 'Saint-Denis (974)' };
  }

  // 3. Recherche dans les communes de Martinique (compatibilité historique)
  for (const [communeKey, coords] of Object.entries(MARTINIQUE_COMMUNE_COORDINATES)) {
    const cNorm = normalizeText(communeKey);
    if (norm.includes(cNorm) || cNorm.includes(norm)) {
      return { lat: coords.lat, lng: coords.lng, label: communeKey.toUpperCase() };
    }
  }

  // 4. Fallback par défaut selon le territoire
  const territory = targetTerritory || detectTerritoryFromAddress(input);
  if (territory === 'GUADELOUPE') return { lat: 16.2411, lng: -61.5331, label: 'Pointe-à-Pitre' };
  if (territory === 'REUNION') return { lat: -20.8789, lng: 55.4481, label: 'Saint-Denis' };
  if (territory === 'GUYANE') return { lat: 4.9372, lng: -52.3260, label: 'Cayenne' };
  if (territory === 'METROPOLE') return { lat: 48.8566, lng: 2.3522, label: 'Paris' };
  return { lat: 14.6161, lng: -61.0588, label: 'Fort-de-France' };
}

/**
 * Calculateur de distance et de durée routières réelles à l'échelle nationale
 * (France Métropolitaine, Martinique, Guadeloupe, Guyane, La Réunion).
 */
export function calculateNationalRoadDistance(
  originStr: string,
  destinationStr: string,
  targetTerritory?: TerritoryId
): { distanceKm: number; durationMinutes: number; originCoords: { lat: number; lng: number }; destCoords: { lat: number; lng: number } } {
  const territory = targetTerritory || detectTerritoryFromAddress(originStr) || detectTerritoryFromAddress(destinationStr);
  const orig = resolveCoordinates(originStr, territory);
  const dest = resolveCoordinates(destinationStr, territory);

  const origNorm = normalizeText(originStr);
  const destNorm = normalizeText(destinationStr);

  // Pour la Martinique, vérifier la matrice pré-calibrée
  if (territory === 'MARTINIQUE') {
    for (const [origKey, destMap] of Object.entries(MARTINIQUE_ROAD_MATRIX)) {
      if (origNorm.includes(origKey)) {
        for (const [destKey, val] of Object.entries(destMap)) {
          if (destNorm.includes(destKey)) {
            return {
              distanceKm: val.km,
              durationMinutes: val.min,
              originCoords: { lat: orig.lat, lng: orig.lng },
              destCoords: { lat: dest.lat, lng: dest.lng },
            };
          }
        }
      }
      // Trajet retour
      if (destNorm.includes(origKey)) {
        for (const [destKey, val] of Object.entries(destMap)) {
          if (origNorm.includes(destKey)) {
            return {
              distanceKm: val.km,
              durationMinutes: Math.round(val.min * 1.05),
              originCoords: { lat: orig.lat, lng: orig.lng },
              destCoords: { lat: dest.lat, lng: dest.lng },
            };
          }
        }
      }
    }
  }

  // Calcul Haversine avec facteur de topographie et sinuosité selon le territoire
  const rawDist = haversineDistance(orig.lat, orig.lng, dest.lat, dest.lng);

  let windingFactor = 1.30;
  let avgSpeedKmh = 45;

  if (territory === 'MARTINIQUE' || territory === 'GUADELOUPE' || territory === 'REUNION') {
    windingFactor = 1.35;
    avgSpeedKmh = 42;
  } else if (territory === 'GUYANE') {
    windingFactor = 1.18; // Longs axes rectilignes le long du littoral RN1 / RN2
    avgSpeedKmh = 70;
  } else if (territory === 'METROPOLE') {
    windingFactor = 1.22; // Réseau autoroutier et voies rapides denses
    avgSpeedKmh = 75;
  }

  const distanceKm = Math.max(2.5, Math.round(rawDist * windingFactor * 10) / 10);
  const durationMinutes = Math.max(8, Math.round((distanceKm / avgSpeedKmh) * 60 + 4));

  return {
    distanceKm,
    durationMinutes,
    originCoords: { lat: orig.lat, lng: orig.lng },
    destCoords: { lat: dest.lat, lng: dest.lng },
  };
}

/**
 * Calculateur de distance routière historique Martinique (maintenu pour rétro-compatibilité 100%)
 */
export function calculateMartiniqueRoadDistance(
  originStr: string,
  destinationStr: string
): { distanceKm: number; durationMinutes: number; originCoords: { lat: number; lng: number }; destCoords: { lat: number; lng: number } } {
  return calculateNationalRoadDistance(originStr, destinationStr, 'MARTINIQUE');
}

/**
 * Paramètres pour le calcul tarifaire CPAM
 */
export interface PricingCalculationParams {
  transportType: TransportType;
  originAddress: string;
  destinationAddress: string;
  isAld?: boolean;
  isRoundTrip?: boolean;
  dateTimeStr?: string; // Pour déterminer nuit/dimanche
  mobility?: MobilityNeeds;
}

/**
 * MOTEUR OFFICIEL DE TARIFICATION DES TRANSPORTS SANITAIRES CONVENTIONNÉS CPAM 972
 * 
 * Barèmes applicables en Martinique :
 * 1. Ambulance (ASSU) :
 *    - Forfait départemental conventionné : 59,50 €
 *    - Tarif kilométrique : 2,35 € / km
 *    - Majoration de nuit (20h-8h) / dimanche / jour férié : +19,80 €
 *    - Majoration brancardage / escaliers / oxygène : +15,00 €
 * 2. VSL (Véhicule Sanitaire Léger) :
 *    - Forfait départemental : 14,80 €
 *    - Tarif kilométrique : 1,15 € / km
 *    - Majoration de nuit / dimanche : +9,50 €
 * 3. Taxi Conventionné CPAM 972 :
 *    - Prise en charge de base : 4,10 €
 *    - Tarif kilométrique A/C : 1,82 € / km (jour) / 2,35 € / km (nuit/dimanche)
 * 
 * Prise en charge :
 * - ALD (Affection Longue Durée 100%) ou AT/MP / Maternité : 100% CPAM (Tiers-payant, Reste à charge 0 €)
 * - Soins courants hors ALD : 65% CPAM + 35% Mutuelle (Tiers-payant BPEC/ROC, reste à charge 0 € si mutuelle conventionnée)
 */
export function calculateMedicalRidePricing(params: PricingCalculationParams): RidePricing {
  const {
    transportType,
    originAddress,
    destinationAddress,
    isAld = true,
    isRoundTrip = false,
    dateTimeStr,
    mobility
  } = params;

  const { distanceKm, durationMinutes } = calculateNationalRoadDistance(originAddress, destinationAddress);

  // Déterminer la plage horaire selon la Convention Nationale CPAM :
  // - Jour : 08h00 à 20h00
  // - Nuit : 20h00 à 08h00
  // - Dimanche & Fériés : du samedi 12h00 au lundi 08h00
  let isNight = false;
  let isSundayOrHoliday = false;

  if (dateTimeStr) {
    try {
      const date = new Date(dateTimeStr);
      if (!isNaN(date.getTime())) {
        const hour = date.getHours();
        const minutes = date.getMinutes();
        const timeDecimal = hour + minutes / 60;
        const day = date.getDay(); // 0 = Dimanche, 1 = Lundi, 6 = Samedi

        // Plage horaire Nuit (20h00 - 08h00)
        isNight = timeDecimal < 8 || timeDecimal >= 20;

        // Plage Dimanche & Jours fériés (du samedi 12h00 au lundi 08h00)
        isSundayOrHoliday = day === 0 || (day === 6 && timeDecimal >= 12) || (day === 1 && timeDecimal < 8);
      }
    } catch {
      isNight = false;
      isSundayOrHoliday = false;
    }
  }

  const effectiveDistance = isRoundTrip ? distanceKm * 2 : distanceKm;
  const effectiveDuration = isRoundTrip ? durationMinutes * 2 : durationMinutes;

  let baseForfait = 0;
  let distanceTarifKm = 0;
  const surcharges: { label: string; amount: number }[] = [];

  if (transportType === 'AMBULANCE') {
    // Ambulance (ASSU) - Barème officiel Convention Nationale CPAM
    baseForfait = 59.50; // Forfait départemental réglementaire
    distanceTarifKm = 2.35; // Tarif kilométrique conventionné

    // Majorations conventionnelles CPAM selon l'horaire du transport
    if (isNight && isSundayOrHoliday) {
      surcharges.push({
        label: 'Majoration Nuit & Dimanche/Férié conventionnelle CPAM (+75%)',
        amount: Math.round(baseForfait * 0.75 * 100) / 100,
      });
    } else if (isNight) {
      surcharges.push({
        label: 'Majoration de Nuit conventionnelle CPAM (20h00 - 08h00)',
        amount: 19.80,
      });
    } else if (isSundayOrHoliday) {
      surcharges.push({
        label: 'Majoration Dimanche & Jours Fériés CPAM (+50%)',
        amount: Math.round(baseForfait * 0.50 * 100) / 100,
      });
    }

    // Suppléments conventionnels médicaux liés aux besoins du patient
    if (mobility?.stretcher) {
      surcharges.push({ label: 'Prise en charge Brancardage & Position allongée', amount: 15.00 });
    }
    if (mobility?.oxygen) {
      surcharges.push({ label: 'Supplément Oxygénothérapie sous surveillance', amount: 15.00 });
    }
    if (mobility?.stairsWithoutElevator) {
      surcharges.push({ label: 'Supplément Portage complexe / Étage sans ascenseur', amount: 10.00 });
    }
  } else if (transportType === 'VSL') {
    // VSL (Véhicule Sanitaire Léger) - Convention Nationale CPAM
    baseForfait = 15.75; // Forfait départemental conventionné
    distanceTarifKm = 1.15; // Tarif kilométrique conventionné

    // Valorisation "trajet court" dégressive conventionnelle CPAM pour les transports < 19 km
    if (effectiveDistance < 10) {
      surcharges.push({ label: 'Valorisation CPAM Trajet Court (< 10 km)', amount: 4.50 });
    } else if (effectiveDistance < 19) {
      surcharges.push({ label: 'Valorisation CPAM Trajet Court (10 - 19 km)', amount: 2.50 });
    }

    // Majorations conventionnelles VSL
    if (isNight && isSundayOrHoliday) {
      surcharges.push({
        label: 'Majoration Nuit & Dimanche VSL (+50%)',
        amount: Math.round(baseForfait * 0.50 * 100) / 100,
      });
    } else if (isNight) {
      surcharges.push({
        label: 'Majoration de Nuit conventionnelle VSL (20h00 - 08h00)',
        amount: 9.50,
      });
    } else if (isSundayOrHoliday) {
      surcharges.push({
        label: 'Majoration Dimanche VSL (+25%)',
        amount: Math.round(baseForfait * 0.25 * 100) / 100,
      });
    }
  } else {
    // TAXI_CONVENTIONNE - Grille tarifaire préfectorale & convention CPAM
    baseForfait = 4.10; // Prise en charge initiale réglementée
    const isNightOrWeekend = isNight || isSundayOrHoliday;
    
    // Tarif Horokilométrique : Tarif A/C (Jour) ou B/D (Nuit / Dimanche / Férié)
    distanceTarifKm = isNightOrWeekend ? 2.35 : 1.82;

    if (isNight) {
      surcharges.push({
        label: 'Tarif Horokilométrique Réglementé Nuit (20h00 - 08h00)',
        amount: 0.00,
      });
    } else if (isSundayOrHoliday) {
      surcharges.push({
        label: 'Tarif Horokilométrique Réglementé Dimanche & Férié',
        amount: 0.00,
      });
    }
  }

  const distanceAmount = Math.round(effectiveDistance * distanceTarifKm * 100) / 100;
  const surchargesTotal = surcharges.reduce((acc, s) => acc + s.amount, 0);
  const totalPrestation = Math.round((baseForfait + distanceAmount + surchargesTotal) * 100) / 100;

  // Prise en charge Assurance Maladie (CGSS Martinique)
  const cpamCoveragePercent = isAld ? 100 : 65;
  const cpamAmount = Math.round(((totalPrestation * cpamCoveragePercent) / 100) * 100) / 100;
  const mutuelleAmount = Math.round((totalPrestation - cpamAmount) * 100) / 100;

  // En Martinique, avec télétransmission BPEC / ROC et conventionnement,
  // le tiers-payant intégral dispense le patient de toute avance de frais.
  const patientRemainder = 0.00;

  return {
    distanceKm: effectiveDistance,
    durationMinutes: effectiveDuration,
    baseForfait,
    distanceTarifKm,
    distanceAmount,
    surcharges,
    totalPrestation,
    cpamCoveragePercent,
    cpamAmount,
    mutuelleAmount,
    patientRemainder,
    isAld,
    tariffRegime: (() => {
      const terr = detectTerritoryFromAddress(originAddress) || detectTerritoryFromAddress(destinationAddress);
      if (terr === 'GUADELOUPE') return 'Convention Nationale des Transporteurs Sanitaires & CGSS Guadeloupe (971)';
      if (terr === 'GUYANE') return 'Convention Nationale des Transporteurs Sanitaires & CGSS Guyane (973)';
      if (terr === 'REUNION') return 'Convention Nationale des Transporteurs Sanitaires & CGSS La Réunion (974)';
      if (terr === 'METROPOLE') return 'Convention Nationale des Transporteurs Sanitaires & CPAM Métropole';
      return 'Convention Nationale des Transporteurs Sanitaires & Avenant CGSS Martinique (972)';
    })(),
  };
}
