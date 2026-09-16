/**
 * Service de calcul et fourniture des villes juxtaposées (communes limitrophes et voisines directes)
 * adaptées dynamiquement à la zone/base sélectionnée par le transporteur.
 */

import { TerritoryId, TERRITORIES_CONFIG } from '../data/nationalTerritoriesData';
import { resolveCoordinates } from './pricingService';

// ============================================================================
// 1. MATRICE OFFICIELLE DES COMMUNES JUXTAPOSÉES (LIMITROPHES) - MARTINIQUE (972)
// Chaque commune est reliée à ses voisines directes partageant une frontière terrestre
// ============================================================================
export const MARTINIQUE_JUXTAPOSED_COMMUNES: Record<string, string[]> = {
  'Le Lamentin': ['Fort-de-France', 'Ducos', 'Saint-Joseph', 'Le Robert', 'Le François', 'Gros-Morne'],
  'Fort-de-France': ['Schoelcher', 'Saint-Joseph', 'Le Lamentin', 'Fonds-Saint-Denis'],
  'Schoelcher': ['Fort-de-France', 'Case-Pilote', 'Bellefontaine', 'Fonds-Saint-Denis'],
  'Ducos': ['Le Lamentin', 'Rivière-Salée', 'Saint-Esprit', 'Le François'],
  'Le Robert': ['Le Lamentin', 'Gros-Morne', 'La Trinité', 'Le François'],
  'Le François': ['Le Robert', 'Le Lamentin', 'Ducos', 'Saint-Esprit', 'Le Vauclin'],
  'Rivière-Salée': ['Ducos', 'Saint-Esprit', 'Rivière-Pilote', 'Sainte-Luce', 'Les Trois-Îlets', 'Le Diamant'],
  'Les Trois-Îlets': ['Les Anses-d\'Arlet', 'Le Diamant', 'Rivière-Salée'],
  'Le Diamant': ['Les Anses-d\'Arlet', 'Les Trois-Îlets', 'Rivière-Salée', 'Sainte-Luce'],
  'Sainte-Luce': ['Le Diamant', 'Rivière-Salée', 'Rivière-Pilote', 'Le Marin'],
  'Le Marin': ['Sainte-Luce', 'Rivière-Pilote', 'Sainte-Anne', 'Le Vauclin'],
  'Sainte-Anne': ['Le Marin', 'Rivière-Pilote'],
  'Le Vauclin': ['Le François', 'Saint-Esprit', 'Rivière-Pilote', 'Le Marin'],
  'Saint-Esprit': ['Ducos', 'Le François', 'Le Vauclin', 'Rivière-Pilote', 'Rivière-Salée'],
  'Rivière-Pilote': ['Rivière-Salée', 'Saint-Esprit', 'Le Vauclin', 'Le Marin', 'Sainte-Luce'],
  'Saint-Joseph': ['Fort-de-France', 'Le Lamentin', 'Gros-Morne', 'Fonds-Saint-Denis'],
  'Gros-Morne': ['Saint-Joseph', 'Le Lamentin', 'Le Robert', 'La Trinité', 'Sainte-Marie', 'Fonds-Saint-Denis'],
  'La Trinité': ['Sainte-Marie', 'Gros-Morne', 'Le Robert'],
  'Sainte-Marie': ['La Trinité', 'Gros-Morne', 'Marigot'],
  'Marigot': ['Sainte-Marie', 'Le Lorrain'],
  'Le Lorrain': ['Marigot', 'Basse-Pointe', 'L\'Ajoupa-Bouillon'],
  'Basse-Pointe': ['Le Lorrain', 'Macouba', 'L\'Ajoupa-Bouillon'],
  'Macouba': ['Basse-Pointe', 'Grand\'Rivière', 'L\'Ajoupa-Bouillon'],
  'Grand\'Rivière': ['Macouba', 'Le Prêcheur'],
  'Le Prêcheur': ['Grand\'Rivière', 'Saint-Pierre'],
  'Saint-Pierre': ['Le Prêcheur', 'Le Carbet', 'Fonds-Saint-Denis', 'Le Morne-Rouge'],
  'Le Carbet': ['Saint-Pierre', 'Bellefontaine', 'Fonds-Saint-Denis', 'Le Morne-Vert'],
  'Bellefontaine': ['Le Carbet', 'Case-Pilote', 'Le Morne-Vert'],
  'Case-Pilote': ['Bellefontaine', 'Schoelcher', 'Le Morne-Vert'],
  'Le Morne-Vert': ['Bellefontaine', 'Case-Pilote', 'Le Carbet', 'Fonds-Saint-Denis'],
  'Fonds-Saint-Denis': ['Fort-de-France', 'Schoelcher', 'Saint-Pierre', 'Le Carbet', 'Le Morne-Vert', 'Saint-Joseph', 'Gros-Morne'],
  'L\'Ajoupa-Bouillon': ['Basse-Pointe', 'Le Lorrain', 'Le Morne-Rouge', 'Saint-Pierre', 'Macouba'],
  'Le Morne-Rouge': ['Saint-Pierre', 'Fonds-Saint-Denis', 'L\'Ajoupa-Bouillon', 'Gros-Morne', 'Le Lorrain'],
  'Les Anses-d\'Arlet': ['Les Trois-Îlets', 'Le Diamant'],
};

// ============================================================================
// 2. MATRICE OFFICIELLE DES COMMUNES JUXTAPOSÉES - GUADELOUPE (971)
// ============================================================================
export const GUADELOUPE_JUXTAPOSED_COMMUNES: Record<string, string[]> = {
  'Pointe-à-Pitre': ['Les Abymes', 'Baie-Mahault', 'Le Gosier'],
  'Les Abymes': ['Pointe-à-Pitre', 'Le Gosier', 'Baie-Mahault', 'Morne-à-l\'Eau', 'Sainte-Anne'],
  'Baie-Mahault': ['Pointe-à-Pitre', 'Les Abymes', 'Petit-Bourg', 'Lamentin'],
  'Le Gosier': ['Pointe-à-Pitre', 'Les Abymes', 'Sainte-Anne'],
  'Basse-Terre': ['Baillif', 'Saint-Claude', 'Gourbeyre'],
  'Saint-Claude': ['Basse-Terre', 'Baillif', 'Gourbeyre', 'Capesterre-Belle-Eau'],
  'Gourbeyre': ['Basse-Terre', 'Saint-Claude', 'Trois-Rivières', 'Vieux-Fort'],
  'Petit-Bourg': ['Baie-Mahault', 'Goyave', 'Lamentin'],
  'Capesterre-Belle-Eau': ['Goyave', 'Trois-Rivières', 'Saint-Claude'],
  'Sainte-Anne': ['Le Gosier', 'Les Abymes', 'Saint-François', 'Le Moule'],
  'Saint-François': ['Sainte-Anne', 'Le Moule', 'La Désirade'],
  'Le Moule': ['Morne-à-l\'Eau', 'Sainte-Anne', 'Saint-François', 'Petit-Canal'],
  'Morne-à-l\'Eau': ['Les Abymes', 'Le Moule', 'Petit-Canal', 'Baie-Mahault'],
  'Lamentin': ['Baie-Mahault', 'Petit-Bourg', 'Sainte-Rose'],
  'Sainte-Rose': ['Lamentin', 'Deshaies', 'Pointe-Noire'],
  'Deshaies': ['Sainte-Rose', 'Pointe-Noire'],
  'Bouillante': ['Pointe-Noire', 'Vieux-Habitants'],
  'Vieux-Habitants': ['Bouillante', 'Baillif', 'Saint-Claude'],
  'Baillif': ['Vieux-Habitants', 'Basse-Terre', 'Saint-Claude'],
};

// ============================================================================
// 3. MATRICE DES COMMUNES JUXTAPOSÉES - GUYANE (973)
// ============================================================================
export const GUYANE_JUXTAPOSED_COMMUNES: Record<string, string[]> = {
  'Cayenne': ['Remire-Montjoly', 'Matoury', 'Macouria'],
  'Remire-Montjoly': ['Cayenne', 'Matoury', 'Roura'],
  'Matoury': ['Cayenne', 'Remire-Montjoly', 'Roura', 'Montsinéry-Tonnegrande', 'Macouria'],
  'Kourou': ['Macouria', 'Sinnamary', 'Montsinéry-Tonnegrande', 'Iracoubo'],
  'Macouria': ['Cayenne', 'Matoury', 'Kourou', 'Montsinéry-Tonnegrande'],
  'Saint-Laurent-du-Maroni': ['Mana', 'Apatou', 'Grand-Santi'],
};

// ============================================================================
// 4. MATRICE DES COMMUNES JUXTAPOSÉES - LA RÉUNION (974)
// ============================================================================
export const REUNION_JUXTAPOSED_COMMUNES: Record<string, string[]> = {
  'Saint-Denis': ['Sainte-Marie', 'La Possession', 'Salazie'],
  'Sainte-Marie': ['Saint-Denis', 'Sainte-Suzanne', 'Salazie'],
  'Sainte-Suzanne': ['Sainte-Marie', 'Saint-André', 'Salazie'],
  'Saint-André': ['Sainte-Suzanne', 'Bras-Panon', 'Salazie'],
  'Bras-Panon': ['Saint-André', 'Saint-Benoît'],
  'Saint-Benoît': ['Bras-Panon', 'Sainte-Rose', 'La Plaine-des-Palmistes'],
  'Saint-Paul': ['La Possession', 'Le Port', 'Trois-Bassins', 'Saint-Leu'],
  'Le Port': ['La Possession', 'Saint-Paul'],
  'La Possession': ['Saint-Denis', 'Le Port', 'Saint-Paul'],
  'Saint-Pierre': ['Saint-Louis', 'Le Tampon', 'Petite-Île', 'Entre-Deux'],
  'Le Tampon': ['Saint-Pierre', 'Entre-Deux', 'Saint-Benoît', 'La Plaine-des-Palmistes'],
  'Saint-Louis': ['Saint-Pierre', 'Les Avirons', 'Cilaos', 'Entre-Deux'],
};

// ============================================================================
// 5. MATRICE DES GRANDES AGGLOMÉRATIONS HEXAGONALES
// ============================================================================
export const METROPOLE_MAJOR_JUXTAPOSED: Record<string, string[]> = {
  'Nice': ['Saint-Laurent-du-Var', 'Cagnes-sur-Mer', 'Villefranche-sur-Mer', 'Falicon', 'Tourrette-Levens', 'Antibes'],
  'Marseille': ['Allauch', 'Aubagne', 'Plan-de-Cuques', 'Cassis', 'Septèmes-les-Vallons', 'Aix-en-Provence'],
  'Lyon': ['Villeurbanne', 'Caluire-et-Cuire', 'Vénissieux', 'Bron', 'Oullins', 'Sainte-Foy-lès-Lyon'],
  'Paris': ['Boulogne-Billancourt', 'Neuilly-sur-Seine', 'Levallois-Perret', 'Saint-Ouen', 'Montreuil', 'Ivry-sur-Seine'],
  'Toulouse': ['Blagnac', 'Colomiers', 'Tournefeuille', 'Ramonville-Saint-Agne', 'Balma', 'L\'Union'],
  'Bordeaux': ['Mérignac', 'Pessac', 'Talence', 'Bègles', 'Cenon', 'Floirac', 'Le Bouscat'],
  'Lille': ['Roubaix', 'Tourcoing', 'Villeneuve-d\'Ascq', 'Marcq-en-Barœul', 'Lambersart', 'La Madeleine'],
  'Strasbourg': ['Schiltigheim', 'Illkirch-Graffenstaden', 'Bischheim', 'Ostwald', 'Lingolsheim'],
  'Nantes': ['Saint-Herblain', 'Rezé', 'Orvault', 'Vertou', 'Sainte-Luce-sur-Loire'],
  'Montpellier': ['Castelnau-le-Lez', 'Lattes', 'Saint-Jean-de-Védas', 'Mauguio', 'Juvignac'],
  'Rennes': ['Cesson-Sévigné', 'Saint-Grégoire', 'Chantepie', 'Saint-Jacques-de-la-Lande', 'Pacé'],
  'Toulon': ['La Seyne-sur-Mer', 'La Valette-du-Var', 'Ollioules', 'Le Pradet', 'Hyères'],
};

/**
 * Calcul mathématique rapide de la distance Haversine en km
 */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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
 * Normalise un nom de ville pour comparaison souple
 */
function cleanCityName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(le|la|les|l'|d'|de)\s+/i, '')
    .replace(/\s*\(\d+\)$/, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Renvoie la liste ordonnée des villes juxtaposées (limitrophes et voisines directes)
 * en fonction du territoire et de la commune de base active.
 */
export function getJuxtaposedCities(
  baseCommune: string,
  territoryId: TerritoryId = 'MARTINIQUE',
  maxCities: number = 6
): string[] {
  if (!baseCommune) return [];

  const cleanBase = cleanCityName(baseCommune);

  // 1. Vérification dans la matrice prédéfinie selon le territoire
  let predefinedMap: Record<string, string[]> = {};
  if (territoryId === 'MARTINIQUE') predefinedMap = MARTINIQUE_JUXTAPOSED_COMMUNES;
  else if (territoryId === 'GUADELOUPE') predefinedMap = GUADELOUPE_JUXTAPOSED_COMMUNES;
  else if (territoryId === 'GUYANE') predefinedMap = GUYANE_JUXTAPOSED_COMMUNES;
  else if (territoryId === 'REUNION') predefinedMap = REUNION_JUXTAPOSED_COMMUNES;
  else if (territoryId === 'METROPOLE') predefinedMap = METROPOLE_MAJOR_JUXTAPOSED;

  for (const [cityName, neighbors] of Object.entries(predefinedMap)) {
    if (cleanCityName(cityName) === cleanBase || cleanBase.includes(cleanCityName(cityName)) || cleanCityName(cityName).includes(cleanBase)) {
      return neighbors.slice(0, maxCities);
    }
  }

  // 2. Si le territoire dispose de zones avec coordonnées (ex: DOMs ou communes référencées)
  const config = TERRITORIES_CONFIG[territoryId];
  if (config && config.zones.length > 0) {
    const baseCoords = resolveCoordinates(baseCommune, territoryId);
    if (baseCoords.lat && baseCoords.lng) {
      const candidates = config.zones
        .filter((z) => cleanCityName(z.name) !== cleanBase)
        .map((z) => {
          const zCoords = 'lat' in z && z.lat ? { lat: z.lat, lng: z.lng } : resolveCoordinates(z.name, territoryId);
          const dist = haversineKm(baseCoords.lat, baseCoords.lng, zCoords.lat, zCoords.lng);
          return { name: z.name, dist };
        })
        .filter((item) => item.dist > 0.5) // Exclure la ville elle-même
        .sort((a, b) => a.dist - b.dist);

      if (candidates.length > 0) {
        return candidates.slice(0, maxCities).map((c) => c.name);
      }
    }
  }

  // 3. Fallback par défaut selon le territoire si non trouvé
  if (territoryId === 'MARTINIQUE') {
    return ['Fort-de-France', 'Ducos', 'Saint-Joseph', 'Le Robert', 'Schoelcher'];
  }
  if (territoryId === 'GUADELOUPE') {
    return ['Les Abymes', 'Baie-Mahault', 'Le Gosier', 'Petit-Bourg'];
  }
  if (territoryId === 'GUYANE') {
    return ['Remire-Montjoly', 'Matoury', 'Macouria'];
  }
  if (territoryId === 'REUNION') {
    return ['Sainte-Marie', 'La Possession', 'Sainte-Suzanne', 'Saint-Paul'];
  }

  return ['Agglomération directe', 'Secteur Ouest', 'Secteur Est', 'Secteur Sud'];
}
