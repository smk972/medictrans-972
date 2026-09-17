/**
 * Définition officielle des Territoires et Secteurs / Bassins Sanitaires de Clinigo
 * Couverture : National & DOM (Martinique 972, Guadeloupe 971, Guyane 973, La Réunion 974, France Métropolitaine)
 */

import { detectTerritoryFromAddress, TerritoryId } from './nationalTerritoriesData';
import { Ride } from '../types';

export interface HealthSector {
  id: string;
  name: string;
  shortLabel: string;
  territoryId: TerritoryId | 'ALL';
  cities?: string[];
  departments?: string[];
  description?: string;
}

export interface TerritoryOption {
  id: TerritoryId | 'ALL';
  label: string;
  shortLabel: string;
  code: string;
  flag: string;
}

export const SUPERVISION_TERRITORIES: TerritoryOption[] = [
  { id: 'ALL', label: 'Tous les territoires (National & DOM)', shortLabel: 'National & DOM', code: 'FR-ALL', flag: '🌐' },
  { id: 'MARTINIQUE', label: 'Martinique (972)', shortLabel: 'Martinique', code: '972', flag: '🏝️' },
  { id: 'GUADELOUPE', label: 'Guadeloupe (971)', shortLabel: 'Guadeloupe', code: '971', flag: '🏝️' },
  { id: 'GUYANE', label: 'Guyane (973)', shortLabel: 'Guyane', code: '973', flag: '🌿' },
  { id: 'REUNION', label: 'La Réunion (974)', shortLabel: 'La Réunion', code: '974', flag: '🌋' },
  { id: 'METROPOLE', label: 'France Métropolitaine (Hexagone)', shortLabel: 'Métropole', code: 'FR', flag: '🗼' },
];

export const SUPERVISION_SECTORS: Record<TerritoryId | 'ALL', HealthSector[]> = {
  ALL: [
    { id: 'ALL', name: 'Tous les secteurs', shortLabel: 'Tous', territoryId: 'ALL' },
    { id: 'DOM_972', name: 'Martinique (972) - Tous bassins', shortLabel: 'Martinique (972)', territoryId: 'ALL', departments: ['972'] },
    { id: 'DOM_971', name: 'Guadeloupe (971) - Tous bassins', shortLabel: 'Guadeloupe (971)', territoryId: 'ALL', departments: ['971'] },
    { id: 'DOM_973', name: 'Guyane (973) - Tous bassins', shortLabel: 'Guyane (973)', territoryId: 'ALL', departments: ['973'] },
    { id: 'DOM_974', name: 'La Réunion (974) - Tous bassins', shortLabel: 'La Réunion (974)', territoryId: 'ALL', departments: ['974'] },
    { id: 'METRO_IDF', name: 'Île-de-France (Paris 75, 92, 93, 94...)', shortLabel: 'Île-de-France', territoryId: 'ALL', departments: ['75', '77', '78', '91', '92', '93', '94', '95'] },
    { id: 'METRO_AURA', name: 'Auvergne-Rhône-Alpes (Lyon 69, 38, 63...)', shortLabel: 'Auvergne-Rhône-Alpes', territoryId: 'ALL', departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
    { id: 'METRO_PACA', name: 'Provence-Alpes-Côte d\'Azur (Marseille 13, 06, 83...)', shortLabel: 'PACA', territoryId: 'ALL', departments: ['04', '05', '06', '13', '83', '84'] },
    { id: 'METRO_NA', name: 'Nouvelle-Aquitaine (Bordeaux 33, 64, 17...)', shortLabel: 'Nouvelle-Aquitaine', territoryId: 'ALL', departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
    { id: 'METRO_OCC', name: 'Occitanie (Toulouse 31, Montpellier 34...)', shortLabel: 'Occitanie', territoryId: 'ALL', departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
    { id: 'METRO_HDF', name: 'Hauts-de-France (Lille 59, Amiens 80...)', shortLabel: 'Hauts-de-France', territoryId: 'ALL', departments: ['02', '59', '60', '62', '80'] },
    { id: 'METRO_BRE_PDL', name: 'Bretagne & Pays de la Loire (Rennes 35, Nantes 44...)', shortLabel: 'Bretagne & Pays de la Loire', territoryId: 'ALL', departments: ['22', '29', '35', '56', '44', '49', '53', '72', '85'] },
    { id: 'METRO_EST', name: 'Grand Est & Bourgogne (Strasbourg 67, Dijon 21...)', shortLabel: 'Grand Est & Bourgogne', territoryId: 'ALL', departments: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88', '21', '25', '39', '58', '70', '71', '89', '90'] },
  ],

  MARTINIQUE: [
    { id: 'ALL', name: 'Tous les secteurs de Martinique', shortLabel: 'Tous secteurs 972', territoryId: 'MARTINIQUE' },
    {
      id: 'CENTRE',
      name: 'Bassin Centre (FDF, Lamentin, Schœlcher, Ducos, St-Joseph)',
      shortLabel: 'Centre & Agglomération',
      territoryId: 'MARTINIQUE',
      cities: ['Fort-de-France', 'Le Lamentin', 'Schœlcher', 'Ducos', 'Saint-Joseph']
    },
    {
      id: 'SUD',
      name: 'Bassin Sud (Marin, Ste-Luce, Rivière-Salée, Diamant, Ste-Anne...)',
      shortLabel: 'Sud Martinique',
      territoryId: 'MARTINIQUE',
      cities: ['Le Marin', 'Sainte-Luce', 'Rivière-Salée', 'Le Diamant', 'Les Trois-Îlets', 'Sainte-Anne', 'Rivière-Pilote', 'Le Vauclin', 'Les Anses-d\'Arlet', 'Saint-Esprit']
    },
    {
      id: 'NORD_ATLANTIQUE',
      name: 'Nord Atlantique (Trinité, Ste-Marie, Robert, Gros-Morne, Lorrain...)',
      shortLabel: 'Nord Atlantique',
      territoryId: 'MARTINIQUE',
      cities: ['La Trinité', 'Sainte-Marie', 'Le Robert', 'Gros-Morne', 'Le Lorrain', 'Marigot', 'Basse-Pointe', 'Macouba', 'Grand\'Rivière', 'L\'Ajoupa-Bouillon', 'Le François']
    },
    {
      id: 'NORD_CARAIBE',
      name: 'Nord Caraïbe (Saint-Pierre, Case-Pilote, Carbet, Bellefontaine...)',
      shortLabel: 'Nord Caraïbe',
      territoryId: 'MARTINIQUE',
      cities: ['Saint-Pierre', 'Case-Pilote', 'Bellefontaine', 'Carbet', 'Le Prêcheur', 'Le Morne-Rouge', 'Morne-Vert', 'Fonds-Saint-Denis']
    }
  ],

  GUADELOUPE: [
    { id: 'ALL', name: 'Tous les secteurs de Guadeloupe', shortLabel: 'Tous secteurs 971', territoryId: 'GUADELOUPE' },
    {
      id: 'GRANDE_TERRE',
      name: 'Bassin Grande-Terre (Pointe-à-Pitre, Abymes, Gosier, Ste-Anne, Moule...)',
      shortLabel: 'Grande-Terre',
      territoryId: 'GUADELOUPE',
      cities: ['Pointe-à-Pitre', 'Les Abymes', 'Le Gosier', 'Sainte-Anne', 'Saint-François', 'Le Moule', 'Morne-à-l\'Eau', 'Petit-Canal', 'Port-Louis', 'Anse-Bertrand']
    },
    {
      id: 'BASSE_TERRE',
      name: 'Bassin Basse-Terre & Côte-sous-le-vent (Basse-Terre, Baie-Mahault, Petit-Bourg...)',
      shortLabel: 'Basse-Terre',
      territoryId: 'GUADELOUPE',
      cities: ['Basse-Terre', 'Baie-Mahault', 'Petit-Bourg', 'Sainte-Rose', 'Lamentin', 'Capesterre-Belle-Eau', 'Gourbeyre', 'Bouillante', 'Vieux-Habitants', 'Trois-Rivières', 'Saint-Claude', 'Goyave', 'Pointe-Noire', 'Baillif', 'Deshaies', 'Vieux-Fort']
    },
    {
      id: 'ILES_DU_SUD',
      name: 'Îles du Sud & Dépendances (Marie-Galante, Les Saintes, La Désirade)',
      shortLabel: 'Îles du Sud',
      territoryId: 'GUADELOUPE',
      cities: ['Grand-Bourg', 'Capesterre-de-Marie-Galante', 'Saint-Louis', 'Terre-de-Haut', 'Terre-de-Bas', 'La Désirade', 'Marie-Galante', 'Les Saintes']
    }
  ],

  GUYANE: [
    { id: 'ALL', name: 'Tous les secteurs de Guyane', shortLabel: 'Tous secteurs 973', territoryId: 'GUYANE' },
    {
      id: 'CENTRE_LITTORAL',
      name: 'Centre Littoral / CACL (Cayenne, Matoury, Remire-Montjoly, Roura...)',
      shortLabel: 'Centre Littoral (CACL)',
      territoryId: 'GUYANE',
      cities: ['Cayenne', 'Matoury', 'Remire-Montjoly', 'Roura', 'Macouria', 'Montsinéry-Tonnegrande']
    },
    {
      id: 'SAVANES',
      name: 'Bassin Savanes & Spatial (Kourou, Sinnamary, Iracoubo)',
      shortLabel: 'Bassin Savanes',
      territoryId: 'GUYANE',
      cities: ['Kourou', 'Sinnamary', 'Iracoubo', 'Saint-Élie']
    },
    {
      id: 'OUEST_GUYANAIS',
      name: 'Ouest Guyanais & Maroni (Saint-Laurent, Mana, Maripasoula...)',
      shortLabel: 'Ouest Guyanais',
      territoryId: 'GUYANE',
      cities: ['Saint-Laurent-du-Maroni', 'Mana', 'Awala-Yalimapo', 'Maripasoula', 'Grand-Santi', 'Papaïchton', 'Apatou']
    },
    {
      id: 'OYAPOCK',
      name: 'Bassin de l\'Oyapock (Saint-Georges, Camopi, Régina, Ouanary)',
      shortLabel: 'Oyapock',
      territoryId: 'GUYANE',
      cities: ['Saint-Georges', 'Saint-Georges-de-l\'Oyapock', 'Camopi', 'Régina', 'Ouanary']
    }
  ],

  REUNION: [
    { id: 'ALL', name: 'Tous les secteurs de La Réunion', shortLabel: 'Tous secteurs 974', territoryId: 'REUNION' },
    {
      id: 'NORD',
      name: 'Micro-Région Nord (Saint-Denis, Sainte-Marie, Sainte-Suzanne)',
      shortLabel: 'Nord Réunion',
      territoryId: 'REUNION',
      cities: ['Saint-Denis', 'Sainte-Marie', 'Sainte-Suzanne']
    },
    {
      id: 'OUEST',
      name: 'Micro-Région Ouest (Saint-Paul, Le Port, La Possession, Saint-Leu...)',
      shortLabel: 'Ouest Réunion',
      territoryId: 'REUNION',
      cities: ['Saint-Paul', 'Le Port', 'La Possession', 'Saint-Leu', 'Trois-Bassins']
    },
    {
      id: 'SUD',
      name: 'Micro-Région Sud (Saint-Pierre, Le Tampon, Saint-Louis, Saint-Joseph...)',
      shortLabel: 'Sud Réunion',
      territoryId: 'REUNION',
      cities: ['Saint-Pierre', 'Le Tampon', 'Saint-Louis', 'Saint-Joseph', 'Petite-Île', 'Entre-Deux', 'Cilaos', 'L\'Étang-Salé', 'Les Avirons']
    },
    {
      id: 'EST',
      name: 'Micro-Région Est (Saint-Benoît, Bras-Panon, Saint-André, Salazie...)',
      shortLabel: 'Est Réunion',
      territoryId: 'REUNION',
      cities: ['Saint-Benoît', 'Bras-Panon', 'Saint-André', 'Salazie', 'Sainte-Rose', 'La Plaine-des-Palmistes']
    }
  ],

  METROPOLE: [
    { id: 'ALL', name: 'Toutes les régions métropolitaines', shortLabel: 'Toute la Métropole', territoryId: 'METROPOLE' },
    {
      id: 'IDF',
      name: 'Île-de-France (Paris 75, 92, 93, 94, 77, 78, 91, 95)',
      shortLabel: 'Île-de-France',
      territoryId: 'METROPOLE',
      departments: ['75', '77', '78', '91', '92', '93', '94', '95'],
      cities: ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Montreuil', 'Créteil', 'Versailles', 'Argenteuil', 'Nanterre']
    },
    {
      id: 'AURA',
      name: 'Auvergne-Rhône-Alpes (Lyon 69, Grenoble 38, Clermont-Ferrand 63...)',
      shortLabel: 'Auvergne-Rhône-Alpes',
      territoryId: 'METROPOLE',
      departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
      cities: ['Lyon', 'Saint-Étienne', 'Grenoble', 'Villeurbanne', 'Clermont-Ferrand', 'Annecy', 'Chambéry', 'Valence']
    },
    {
      id: 'PACA',
      name: 'Provence-Alpes-Côte d\'Azur (Marseille 13, Nice 06, Toulon 83...)',
      shortLabel: 'PACA',
      territoryId: 'METROPOLE',
      departments: ['04', '05', '06', '13', '83', '84'],
      cities: ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence', 'Avignon', 'Cannes', 'Antibes']
    },
    {
      id: 'NA',
      name: 'Nouvelle-Aquitaine (Bordeaux 33, Pau 64, La Rochelle 17...)',
      shortLabel: 'Nouvelle-Aquitaine',
      territoryId: 'METROPOLE',
      departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
      cities: ['Bordeaux', 'Limoges', 'Poitiers', 'Pau', 'La Rochelle', 'Mérignac', 'Pessac', 'Bayonne', 'Angoulême']
    },
    {
      id: 'OCC',
      name: 'Occitanie (Toulouse 31, Montpellier 34, Nîmes 30...)',
      shortLabel: 'Occitanie',
      territoryId: 'METROPOLE',
      departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
      cities: ['Toulouse', 'Montpellier', 'Nîmes', 'Perpignan', 'Béziers', 'Montauban', 'Narbonne', 'Albi', 'Carcassonne']
    },
    {
      id: 'HDF',
      name: 'Hauts-de-France (Lille 59, Amiens 80, Roubaix 59...)',
      shortLabel: 'Hauts-de-France',
      territoryId: 'METROPOLE',
      departments: ['02', '59', '60', '62', '80'],
      cities: ['Lille', 'Amiens', 'Roubaix', 'Tourcoing', 'Dunkerque', 'Calais', 'Villeneuve-d\'Ascq', 'Beauvais']
    },
    {
      id: 'BRE_PDL',
      name: 'Bretagne & Pays de la Loire (Rennes 35, Nantes 44, Brest 29...)',
      shortLabel: 'Bretagne & Pays de la Loire',
      territoryId: 'METROPOLE',
      departments: ['22', '29', '35', '56', '44', '49', '53', '72', '85'],
      cities: ['Nantes', 'Rennes', 'Angers', 'Brest', 'Le Mans', 'Saint-Nazaire', 'Quimper', 'Lorient', 'Vannes']
    },
    {
      id: 'EST_BFC',
      name: 'Grand Est & Bourgogne-Franche-Comté (Strasbourg 67, Reims 51, Dijon 21...)',
      shortLabel: 'Grand Est & BFC',
      territoryId: 'METROPOLE',
      departments: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88', '21', '25', '39', '58', '70', '71', '89', '90'],
      cities: ['Strasbourg', 'Reims', 'Dijon', 'Metz', 'Besançon', 'Nancy', 'Mulhouse', 'Troyes']
    }
  ]
};

/**
 * Détection du territoire d'une course médicale.
 */
export function getRideTerritory(ride: Ride): TerritoryId {
  const checkString = `${ride.patient?.postalCode || ''} ${ride.pickupCity || ''} ${ride.pickupAddress || ''} ${ride.dropoffCity || ''} ${ride.dropoffAddress || ''}`;
  return detectTerritoryFromAddress(checkString);
}

/**
 * Détecte le département ou indicatif d'une course pour affichage dans le badge du tableau.
 */
export function getRideDepartmentBadge(ride: Ride): { code: string; label: string; bgClass: string; textClass: string } {
  const terr = getRideTerritory(ride);
  const postal = ride.patient?.postalCode || '';

  if (terr === 'MARTINIQUE') {
    return { code: '972', label: 'Martinique', bgClass: 'bg-emerald-50 border-emerald-200', textClass: 'text-emerald-800' };
  }
  if (terr === 'GUADELOUPE') {
    return { code: '971', label: 'Guadeloupe', bgClass: 'bg-cyan-50 border-cyan-200', textClass: 'text-cyan-800' };
  }
  if (terr === 'GUYANE') {
    return { code: '973', label: 'Guyane', bgClass: 'bg-amber-50 border-amber-200', textClass: 'text-amber-800' };
  }
  if (terr === 'REUNION') {
    return { code: '974', label: 'La Réunion', bgClass: 'bg-rose-50 border-rose-200', textClass: 'text-rose-800' };
  }

  // Métropole : extrait le code départemental des 2 premiers chiffres du code postal
  const matchDep = postal.match(/^(\d{2})/);
  const depCode = matchDep ? matchDep[1] : 'FR';
  return { code: depCode, label: `Métropole (${depCode})`, bgClass: 'bg-blue-50 border-blue-200', textClass: 'text-blue-800' };
}

/**
 * Normalisation de chaîne pour recherche insensible aux accents et à la casse
 */
function normStr(str?: string): string {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

/**
 * Vérifie si une course correspond au territoire et au secteur sélectionnés.
 */
export function matchRideSector(ride: Ride, territory: TerritoryId | 'ALL', sectorId: string): boolean {
  const rideTerritory = getRideTerritory(ride);

  // 1. Filtrage par Territoire
  if (territory !== 'ALL' && rideTerritory !== territory) {
    return false;
  }

  // 2. Si aucun sous-secteur sélectionné, la course est valide
  if (!sectorId || sectorId === 'ALL') {
    return true;
  }

  // 3. Recherche de la définition du secteur
  const sectorList = SUPERVISION_SECTORS[territory] || [];
  const sectorDef = sectorList.find(s => s.id === sectorId);
  if (!sectorDef) return true;

  const pickupCityNorm = normStr(ride.pickupCity);
  const dropoffCityNorm = normStr(ride.dropoffCity);
  const pickupAddressNorm = normStr(ride.pickupAddress);
  const dropoffAddressNorm = normStr(ride.dropoffAddress);
  const postalCode = ride.patient?.postalCode || '';

  // Correspondance par département (ex: '75', '971', '972'...)
  if (sectorDef.departments && sectorDef.departments.length > 0) {
    const matchesDep = sectorDef.departments.some(d => postalCode.startsWith(d));
    if (matchesDep) return true;
  }

  // Correspondance par ville
  if (sectorDef.cities && sectorDef.cities.length > 0) {
    const matchesCity = sectorDef.cities.some(c => {
      const cNorm = normStr(c);
      return (
        pickupCityNorm.includes(cNorm) ||
        cNorm.includes(pickupCityNorm) ||
        dropoffCityNorm.includes(cNorm) ||
        cNorm.includes(dropoffCityNorm) ||
        pickupAddressNorm.includes(cNorm) ||
        dropoffAddressNorm.includes(cNorm)
      );
    });
    if (matchesCity) return true;
  }

  return false;
}
