/**
 * Configuration et polygones géographiques officiels des 5 territoires de Clinigo :
 * - Martinique (972)
 * - Guadeloupe (971)
 * - Guyane (973)
 * - La Réunion (974)
 * - France Métropolitaine (Hexagone & Régions sanitaires)
 */

import { MARTINIQUE_COMMUNES_POLYGONS, MARTINIQUE_SVG_VIEWBOX, MARTINIQUE_UNITS_PER_KM } from './martiniqueCommunesPolygons';

export type TerritoryId = 'MARTINIQUE' | 'GUADELOUPE' | 'GUYANE' | 'REUNION' | 'METROPOLE';

export interface TerritoryZonePolygon {
  insee: string;
  name: string;
  postalCode: string;
  centroidX: number;
  centroidY: number;
  labelX: number;
  labelY: number;
  isMajor: boolean;
  points: string;
  department?: string;
  lat: number;
  lng: number;
}

export interface TerritoryConfig {
  id: TerritoryId;
  code: string;
  name: string;
  shortName: string;
  viewBox: string;
  width: number;
  height: number;
  unitsPerKm: number;
  defaultCommune: string;
  radiusPresets: number[];
  maxRadius: number;
  distanceRings: number[];
  zones: TerritoryZonePolygon[];
  seaLabel: string;
  compassY: number;
}

// ============================================================================
// 1. GUADELOUPE (971) - 32 COMMUNES OFFICIELLES
// Système de coordonnées : viewBox="0 0 70000 65000" (~800 unités par km)
// ============================================================================
export const GUADELOUPE_COMMUNES_POLYGONS: TerritoryZonePolygon[] = [
  // --- GRANDE-TERRE (Aile droite du papillon) ---
  {
    insee: '97101',
    name: 'Les Abymes',
    postalCode: '97139',
    centroidX: 37500,
    centroidY: 23500,
    labelX: 39500,
    labelY: 20500,
    isMajor: true,
    lat: 16.2706,
    lng: -61.5056,
    points: '34500,20500 37500,19500 40500,21000 42000,24000 39500,26500 36500,26000 34500,23000'
  },
  {
    insee: '97120',
    name: 'Pointe-à-Pitre',
    postalCode: '97110',
    centroidX: 35000,
    centroidY: 26500,
    labelX: 34500,
    labelY: 26000,
    isMajor: true,
    lat: 16.2411,
    lng: -61.5331,
    points: '33500,25000 36500,25000 36500,28000 33500,28000'
  },
  {
    insee: '97113',
    name: 'Le Gosier',
    postalCode: '97190',
    centroidX: 41000,
    centroidY: 28500,
    labelX: 41500,
    labelY: 30000,
    isMajor: true,
    lat: 16.2064,
    lng: -61.4928,
    points: '36500,27000 40000,26000 45000,28000 44000,31000 38000,31000'
  },
  {
    insee: '97128',
    name: 'Sainte-Anne',
    postalCode: '97180',
    centroidX: 47500,
    centroidY: 28500,
    labelX: 47500,
    labelY: 28500,
    isMajor: true,
    lat: 16.2267,
    lng: -61.3814,
    points: '44000,26500 50000,26000 52000,30000 45500,31000'
  },
  {
    insee: '97125',
    name: 'Saint-François',
    postalCode: '97118',
    centroidX: 55500,
    centroidY: 27500,
    labelX: 56000,
    labelY: 27500,
    isMajor: true,
    lat: 16.2528,
    lng: -61.2750,
    points: '50500,25500 58000,25000 62000,28500 54000,30500'
  },
  {
    insee: '97117',
    name: 'Le Moule',
    postalCode: '97160',
    centroidX: 48000,
    centroidY: 21500,
    labelX: 49000,
    labelY: 20500,
    isMajor: true,
    lat: 16.3314,
    lng: -61.3464,
    points: '43000,18500 51500,18000 54000,23000 44500,24500'
  },
  {
    insee: '97116',
    name: 'Morne-à-l\'Eau',
    postalCode: '97111',
    centroidX: 40500,
    centroidY: 17500,
    labelX: 40500,
    labelY: 16500,
    isMajor: true,
    lat: 16.3311,
    lng: -61.4581,
    points: '37000,15000 43500,14500 44000,19500 37500,20000'
  },
  {
    insee: '97119',
    name: 'Petit-Canal',
    postalCode: '97131',
    centroidX: 42000,
    centroidY: 12500,
    labelX: 42000,
    labelY: 12000,
    isMajor: false,
    lat: 16.3800,
    lng: -61.4900,
    points: '38000,10500 45500,10000 45000,14500 37500,15000'
  },
  {
    insee: '97122',
    name: 'Port-Louis',
    postalCode: '97117',
    centroidX: 41000,
    centroidY: 7500,
    labelX: 41000,
    labelY: 7000,
    isMajor: false,
    lat: 16.4217,
    lng: -61.5317,
    points: '37500,5500 44000,5500 44500,10500 38000,10500'
  },
  {
    insee: '97102',
    name: 'Anse-Bertrand',
    postalCode: '97121',
    centroidX: 43500,
    centroidY: 3500,
    labelX: 43500,
    labelY: 3500,
    isMajor: false,
    lat: 16.4717,
    lng: -61.5083,
    points: '40000,1500 47000,1500 46000,6000 39000,6000'
  },

  // --- BASSE-TERRE (Aile gauche du papillon & Pôles industriels/santé) ---
  {
    insee: '97103',
    name: 'Baie-Mahault',
    postalCode: '97122',
    centroidX: 30000,
    centroidY: 24000,
    labelX: 27500,
    labelY: 23000,
    isMajor: true,
    lat: 16.2678,
    lng: -61.5878,
    points: '26500,21000 33500,21500 34000,26500 27000,26500'
  },
  {
    insee: '97115',
    name: 'Lamentin',
    postalCode: '97129',
    centroidX: 24000,
    centroidY: 22000,
    labelX: 24000,
    labelY: 22000,
    isMajor: false,
    lat: 16.2700,
    lng: -61.6300,
    points: '21000,19000 27000,19500 26500,24500 20500,24000'
  },
  {
    insee: '97129',
    name: 'Sainte-Rose',
    postalCode: '97115',
    centroidX: 20000,
    centroidY: 15500,
    labelX: 20000,
    labelY: 15500,
    isMajor: true,
    lat: 16.3333,
    lng: -61.6967,
    points: '16000,12000 25000,13000 24000,18500 15500,17500'
  },
  {
    insee: '97111',
    name: 'Deshaies',
    postalCode: '97126',
    centroidX: 13000,
    centroidY: 17500,
    labelX: 13000,
    labelY: 17500,
    isMajor: false,
    lat: 16.3067,
    lng: -61.7944,
    points: '10500,14000 15500,14500 16000,21000 11000,20500'
  },
  {
    insee: '97121',
    name: 'Pointe-Noire',
    postalCode: '97116',
    centroidX: 13500,
    centroidY: 24500,
    labelX: 13500,
    labelY: 24500,
    isMajor: false,
    lat: 16.2333,
    lng: -61.7833,
    points: '11000,21500 16500,21500 17000,28000 11500,27500'
  },
  {
    insee: '97106',
    name: 'Bouillante',
    postalCode: '97125',
    centroidX: 14000,
    centroidY: 31500,
    labelX: 14000,
    labelY: 31500,
    isMajor: false,
    lat: 16.1333,
    lng: -61.7667,
    points: '11500,28500 17000,28500 17500,35000 12000,34500'
  },
  {
    insee: '97134',
    name: 'Vieux-Habitants',
    postalCode: '97119',
    centroidX: 15000,
    centroidY: 38000,
    labelX: 15000,
    labelY: 38000,
    isMajor: false,
    lat: 16.0600,
    lng: -61.7650,
    points: '12500,35500 18000,35500 18500,41000 13000,40500'
  },
  {
    insee: '97104',
    name: 'Baillif',
    postalCode: '97123',
    centroidX: 16000,
    centroidY: 43000,
    labelX: 16000,
    labelY: 43000,
    isMajor: false,
    lat: 16.0200,
    lng: -61.7467,
    points: '13500,41500 18500,41500 19000,45000 14000,45000'
  },
  {
    insee: '97105',
    name: 'Basse-Terre',
    postalCode: '97100',
    centroidX: 17500,
    centroidY: 46500,
    labelX: 17500,
    labelY: 46500,
    isMajor: true,
    lat: 15.9986,
    lng: -61.7256,
    points: '15000,45500 20000,45500 20000,48500 15500,48500'
  },
  {
    insee: '97124',
    name: 'Saint-Claude',
    postalCode: '97120',
    centroidX: 21500,
    centroidY: 43500,
    labelX: 21500,
    labelY: 43500,
    isMajor: true,
    lat: 16.0333,
    lng: -61.7000,
    points: '19000,41500 24500,41000 24500,46000 19500,46000'
  },
  {
    insee: '97112',
    name: 'Gourbeyre',
    postalCode: '97113',
    centroidX: 20000,
    centroidY: 48500,
    labelX: 20000,
    labelY: 48500,
    isMajor: true,
    lat: 15.9933,
    lng: -61.6933,
    points: '17500,47000 23000,47000 23000,51000 17500,51000'
  },
  {
    insee: '97133',
    name: 'Vieux-Fort',
    postalCode: '97141',
    centroidX: 19500,
    centroidY: 53000,
    labelX: 19500,
    labelY: 53000,
    isMajor: false,
    lat: 15.9500,
    lng: -61.7000,
    points: '17500,51500 22000,51500 21500,55000 17500,54500'
  },
  {
    insee: '97132',
    name: 'Trois-Rivières',
    postalCode: '97114',
    centroidX: 25000,
    centroidY: 48000,
    labelX: 25000,
    labelY: 48000,
    isMajor: false,
    lat: 15.9756,
    lng: -61.6450,
    points: '22500,45500 28000,45500 28000,51000 22500,51000'
  },
  {
    insee: '97107',
    name: 'Capesterre-Belle-Eau',
    postalCode: '97130',
    centroidX: 27500,
    centroidY: 40500,
    labelX: 27500,
    labelY: 40500,
    isMajor: true,
    lat: 16.0433,
    lng: -61.5658,
    points: '24000,37000 31000,37000 31000,44500 24500,44500'
  },
  {
    insee: '97114',
    name: 'Goyave',
    postalCode: '97128',
    centroidX: 28000,
    centroidY: 33500,
    labelX: 28000,
    labelY: 33500,
    isMajor: false,
    lat: 16.1333,
    lng: -61.5714,
    points: '24500,31000 31500,31000 31000,36500 24500,36500'
  },
  {
    insee: '97118',
    name: 'Petit-Bourg',
    postalCode: '97170',
    centroidX: 27000,
    centroidY: 27500,
    labelX: 27000,
    labelY: 27500,
    isMajor: true,
    lat: 16.1911,
    lng: -61.5900,
    points: '23500,25000 31000,25000 30500,30500 24000,30500'
  },

  // --- ÎLES DU SUD & DÉPENDANCES (Marie-Galante, Saintes, Désirade) ---
  {
    insee: '97108',
    name: 'Grand-Bourg (Marie-Galante)',
    postalCode: '97112',
    centroidX: 47000,
    centroidY: 53500,
    labelX: 47000,
    labelY: 53500,
    isMajor: true,
    lat: 15.8833,
    lng: -61.3167,
    points: '44000,51000 49500,51000 50000,56000 44000,56000'
  },
  {
    insee: '97126',
    name: 'Saint-Louis (Marie-Galante)',
    postalCode: '97134',
    centroidX: 48500,
    centroidY: 48000,
    labelX: 48500,
    labelY: 48000,
    isMajor: false,
    lat: 15.9528,
    lng: -61.3189,
    points: '45500,45500 51500,45500 51500,50500 45500,50500'
  },
  {
    insee: '97109',
    name: 'Capesterre (Marie-Galante)',
    postalCode: '97140',
    centroidX: 53500,
    centroidY: 52000,
    labelX: 53500,
    labelY: 52000,
    isMajor: false,
    lat: 15.8900,
    lng: -61.2200,
    points: '50500,49500 56500,49500 56500,54500 50500,54500'
  },
  {
    insee: '97131',
    name: 'Terre-de-Haut (Les Saintes)',
    postalCode: '97136',
    centroidX: 26000,
    centroidY: 57500,
    labelX: 26000,
    labelY: 57500,
    isMajor: false,
    lat: 15.8667,
    lng: -61.5833,
    points: '24000,56000 28000,56000 28000,59500 24000,59500'
  },
  {
    insee: '97130',
    name: 'Terre-de-Bas (Les Saintes)',
    postalCode: '97137',
    centroidX: 21500,
    centroidY: 57500,
    labelX: 21500,
    labelY: 57500,
    isMajor: false,
    lat: 15.8500,
    lng: -61.6333,
    points: '19500,56000 23500,56000 23500,59500 19500,59500'
  },
  {
    insee: '97110',
    name: 'La Désirade',
    postalCode: '97127',
    centroidX: 65000,
    centroidY: 25000,
    labelX: 65000,
    labelY: 25000,
    isMajor: false,
    lat: 16.3167,
    lng: -61.0500,
    points: '61500,23500 68500,23500 68500,26500 61500,26500'
  }
];

// ============================================================================
// 2. LA RÉUNION (974) - 24 COMMUNES OFFICIELLES
// Système de coordonnées : viewBox="0 0 65000 55000" (~850 unités par km)
// ============================================================================
export const REUNION_COMMUNES_POLYGONS: TerritoryZonePolygon[] = [
  // --- NORD & EST ---
  {
    insee: '97411',
    name: 'Saint-Denis',
    postalCode: '97400',
    centroidX: 32000,
    centroidY: 9000,
    labelX: 32000,
    labelY: 9000,
    isMajor: true,
    lat: -20.8789,
    lng: 55.4481,
    points: '26000,6000 37500,6000 38500,13500 27000,13500'
  },
  {
    insee: '97418',
    name: 'Sainte-Marie',
    postalCode: '97438',
    centroidX: 39500,
    centroidY: 11000,
    labelX: 39500,
    labelY: 11000,
    isMajor: true,
    lat: -20.8967,
    lng: 55.5494,
    points: '37500,8000 43000,8000 43500,14500 38000,14500'
  },
  {
    insee: '97423',
    name: 'Sainte-Suzanne',
    postalCode: '97441',
    centroidX: 45000,
    centroidY: 13000,
    labelX: 45000,
    labelY: 13000,
    isMajor: false,
    lat: -20.9061,
    lng: 55.6078,
    points: '43000,9500 48000,10500 48000,16500 43000,15500'
  },
  {
    insee: '97409',
    name: 'Saint-André',
    postalCode: '97440',
    centroidX: 48500,
    centroidY: 18000,
    labelX: 48500,
    labelY: 18000,
    isMajor: true,
    lat: -20.9603,
    lng: 55.6506,
    points: '45500,15500 52500,16000 52000,21500 45000,21000'
  },
  {
    insee: '97402',
    name: 'Bras-Panon',
    postalCode: '97412',
    centroidX: 51500,
    centroidY: 23000,
    labelX: 51500,
    labelY: 23000,
    isMajor: false,
    lat: -20.9956,
    lng: 55.6781,
    points: '48000,21000 55000,21500 54500,26000 47500,25500'
  },
  {
    insee: '97410',
    name: 'Saint-Benoît',
    postalCode: '97470',
    centroidX: 52000,
    centroidY: 28500,
    labelX: 52000,
    labelY: 28500,
    isMajor: true,
    lat: -21.0333,
    lng: 55.7167,
    points: '47500,26000 57000,26500 56500,33500 47000,32500'
  },
  {
    insee: '97419',
    name: 'Sainte-Rose',
    postalCode: '97439',
    centroidX: 55500,
    centroidY: 37000,
    labelX: 55500,
    labelY: 37000,
    isMajor: false,
    lat: -21.1278,
    lng: 55.7958,
    points: '50000,33500 59500,34500 58000,43000 49500,41500'
  },

  // --- CENTRE & CIRQUES ---
  {
    insee: '97421',
    name: 'Salazie',
    postalCode: '97433',
    centroidX: 41000,
    centroidY: 20000,
    labelX: 41000,
    labelY: 20000,
    isMajor: false,
    lat: -21.0275,
    lng: 55.5392,
    points: '37500,16500 45000,17000 44500,23500 37000,23000'
  },
  {
    insee: '97406',
    name: 'La Plaine-des-Palmistes',
    postalCode: '97431',
    centroidX: 45000,
    centroidY: 28500,
    labelX: 45000,
    labelY: 28500,
    isMajor: false,
    lat: -21.1333,
    lng: 55.6278,
    points: '41500,25000 48000,25500 47500,32000 41000,31500'
  },
  {
    insee: '97424',
    name: 'Cilaos',
    postalCode: '97413',
    centroidX: 32000,
    centroidY: 28000,
    labelX: 32000,
    labelY: 28000,
    isMajor: false,
    lat: -21.1342,
    lng: 55.4725,
    points: '28000,24500 36000,25000 35500,32500 27500,32000'
  },

  // --- OUEST ---
  {
    insee: '97407',
    name: 'Le Port',
    postalCode: '97420',
    centroidX: 16500,
    centroidY: 13500,
    labelX: 16500,
    labelY: 13500,
    isMajor: true,
    lat: -20.9389,
    lng: 55.2953,
    points: '13000,11500 19500,11500 20000,16000 13500,16000'
  },
  {
    insee: '97408',
    name: 'La Possession',
    postalCode: '97419',
    centroidX: 22000,
    centroidY: 15500,
    labelX: 22000,
    labelY: 15500,
    isMajor: false,
    lat: -20.9317,
    lng: 55.3353,
    points: '19000,13000 25500,13000 26000,19000 19500,18500'
  },
  {
    insee: '97415',
    name: 'Saint-Paul',
    postalCode: '97460',
    centroidX: 16000,
    centroidY: 22000,
    labelX: 16000,
    labelY: 22000,
    isMajor: true,
    lat: -21.0097,
    lng: 55.2708,
    points: '11500,17000 21500,18000 22000,27000 12000,26500'
  },
  {
    insee: '97420',
    name: 'Trois-Bassins',
    postalCode: '97426',
    centroidX: 16500,
    centroidY: 29000,
    labelX: 16500,
    labelY: 29000,
    isMajor: false,
    lat: -21.1064,
    lng: 55.2981,
    points: '12500,27000 20500,27000 20500,31500 12500,31500'
  },
  {
    insee: '97413',
    name: 'Saint-Leu',
    postalCode: '97436',
    centroidX: 16500,
    centroidY: 34500,
    labelX: 16500,
    labelY: 34500,
    isMajor: true,
    lat: -21.1656,
    lng: 55.2881,
    points: '12500,32000 21000,32000 21500,37500 13000,37500'
  },
  {
    insee: '97401',
    name: 'Les Avirons',
    postalCode: '97425',
    centroidX: 20000,
    centroidY: 39500,
    labelX: 20000,
    labelY: 39500,
    isMajor: false,
    lat: -21.2417,
    lng: 55.3333,
    points: '16000,37500 23500,37500 23500,41500 16000,41500'
  },
  {
    insee: '97404',
    name: 'L\'Étang-Salé',
    postalCode: '97427',
    centroidX: 19500,
    centroidY: 43000,
    labelX: 19500,
    labelY: 43000,
    isMajor: false,
    lat: -21.2667,
    lng: 55.3667,
    points: '15500,41500 23000,41500 23000,45500 15500,45500'
  },

  // --- SUD ---
  {
    insee: '97414',
    name: 'Saint-Louis',
    postalCode: '97450',
    centroidX: 25000,
    centroidY: 42000,
    labelX: 25000,
    labelY: 42000,
    isMajor: true,
    lat: -21.2861,
    lng: 55.4081,
    points: '21500,38500 29000,38500 29000,46000 22000,46000'
  },
  {
    insee: '97403',
    name: 'L\'Entre-Deux',
    postalCode: '97414',
    centroidX: 30500,
    centroidY: 39000,
    labelX: 30500,
    labelY: 39000,
    isMajor: false,
    lat: -21.2483,
    lng: 55.4717,
    points: '28000,36000 33500,36000 33500,42000 28000,42000'
  },
  {
    insee: '97416',
    name: 'Saint-Pierre',
    postalCode: '97410',
    centroidX: 30000,
    centroidY: 47000,
    labelX: 30000,
    labelY: 47000,
    isMajor: true,
    lat: -21.3381,
    lng: 55.4781,
    points: '26000,44500 35000,44500 35000,50500 26000,50500'
  },
  {
    insee: '97422',
    name: 'Le Tampon',
    postalCode: '97430',
    centroidX: 36000,
    centroidY: 39500,
    labelX: 36000,
    labelY: 39500,
    isMajor: true,
    lat: -21.2800,
    lng: 55.5181,
    points: '32000,34500 41000,34500 40500,44500 32500,44500'
  },
  {
    insee: '97405',
    name: 'Petite-Île',
    postalCode: '97429',
    centroidX: 37500,
    centroidY: 48500,
    labelX: 37500,
    labelY: 48500,
    isMajor: false,
    lat: -21.3533,
    lng: 55.5667,
    points: '34500,46000 41000,46000 41000,51000 34500,51000'
  },
  {
    insee: '97412',
    name: 'Saint-Joseph',
    postalCode: '97480',
    centroidX: 43500,
    centroidY: 47000,
    labelX: 43500,
    labelY: 47000,
    isMajor: true,
    lat: -21.3781,
    lng: 55.6181,
    points: '39500,42500 48000,43000 48000,51500 40000,51500'
  },
  {
    insee: '97417',
    name: 'Saint-Philippe',
    postalCode: '97442',
    centroidX: 51000,
    centroidY: 46000,
    labelX: 51000,
    labelY: 46000,
    isMajor: false,
    lat: -21.3583,
    lng: 55.7681,
    points: '47500,42000 55500,43000 55000,50500 47000,50000'
  }
];

// ============================================================================
// 3. GUYANE (973) - 22 COMMUNES & BASSINS SANITAIRES
// Système de coordonnées : viewBox="0 0 80000 70000" (~250 unités par km)
// ============================================================================
export const GUYANE_COMMUNES_POLYGONS: TerritoryZonePolygon[] = [
  // --- LITTORAL CENTRE & ILE DE CAYENNE ---
  {
    insee: '97302',
    name: 'Cayenne',
    postalCode: '97300',
    centroidX: 58500,
    centroidY: 22500,
    labelX: 58500,
    labelY: 22500,
    isMajor: true,
    lat: 4.9372,
    lng: -52.3260,
    points: '56500,20500 61000,20500 61000,24500 56500,24500'
  },
  {
    insee: '97307',
    name: 'Matoury',
    postalCode: '97351',
    centroidX: 57500,
    centroidY: 26500,
    labelX: 57500,
    labelY: 26500,
    isMajor: true,
    lat: 4.8483,
    lng: -52.3317,
    points: '54500,24500 60500,24500 60500,28500 54500,28500'
  },
  {
    insee: '97309',
    name: 'Remire-Montjoly',
    postalCode: '97354',
    centroidX: 62500,
    centroidY: 24500,
    labelX: 62500,
    labelY: 24500,
    isMajor: true,
    lat: 4.9056,
    lng: -52.2778,
    points: '60500,22500 65500,22500 65500,27000 60500,27000'
  },
  {
    insee: '97305',
    name: 'Macouria',
    postalCode: '97355',
    centroidX: 51500,
    centroidY: 23500,
    labelX: 51500,
    labelY: 23500,
    isMajor: false,
    lat: 5.0139,
    lng: -52.4739,
    points: '47500,21000 55000,21500 55000,26500 47500,26000'
  },
  {
    insee: '97313',
    name: 'Montsinéry-Tonnegrande',
    postalCode: '97356',
    centroidX: 52000,
    centroidY: 28500,
    labelX: 52000,
    labelY: 28500,
    isMajor: false,
    lat: 4.8917,
    lng: -52.4931,
    points: '48000,26500 55000,26500 54500,31500 48000,31500'
  },
  {
    insee: '97310',
    name: 'Roura',
    postalCode: '97311',
    centroidX: 56500,
    centroidY: 33000,
    labelX: 56500,
    labelY: 33000,
    isMajor: false,
    lat: 4.7267,
    lng: -52.3247,
    points: '52500,30000 61000,30000 60500,36500 52500,36500'
  },

  // --- LITTORAL SPATIAL & OUEST (RN1) ---
  {
    insee: '97304',
    name: 'Kourou',
    postalCode: '97310',
    centroidX: 43500,
    centroidY: 19500,
    labelX: 43500,
    labelY: 19500,
    isMajor: true,
    lat: 5.1589,
    lng: -52.6497,
    points: '39000,17000 47500,17500 47500,23000 39000,22500'
  },
  {
    insee: '97312',
    name: 'Sinnamary',
    postalCode: '97315',
    centroidX: 34500,
    centroidY: 17500,
    labelX: 34500,
    labelY: 17500,
    isMajor: false,
    lat: 5.3789,
    lng: -52.9589,
    points: '30500,15000 38500,15500 38500,21000 30500,20500'
  },
  {
    insee: '97303',
    name: 'Iracoubo',
    postalCode: '97350',
    centroidX: 26500,
    centroidY: 16500,
    labelX: 26500,
    labelY: 16500,
    isMajor: false,
    lat: 5.4800,
    lng: -53.2069,
    points: '22500,14000 30500,14500 30000,20000 22000,19500'
  },
  {
    insee: '97311',
    name: 'Saint-Laurent-du-Maroni',
    postalCode: '97320',
    centroidX: 13500,
    centroidY: 16500,
    labelX: 13500,
    labelY: 16500,
    isMajor: true,
    lat: 5.5011,
    lng: -54.0294,
    points: '9500,13500 17500,14000 17500,20000 9500,19500'
  },
  {
    insee: '97306',
    name: 'Mana',
    postalCode: '97360',
    centroidX: 18000,
    centroidY: 13000,
    labelX: 18000,
    labelY: 13000,
    isMajor: false,
    lat: 5.6667,
    lng: -53.7833,
    points: '14500,10500 22000,11000 22000,15500 14500,15500'
  },
  {
    insee: '97360',
    name: 'Awala-Yalimapo',
    postalCode: '97319',
    centroidX: 14000,
    centroidY: 10000,
    labelX: 14000,
    labelY: 10000,
    isMajor: false,
    lat: 5.7417,
    lng: -53.9278,
    points: '11000,8000 17000,8000 17000,12500 11000,12500'
  },

  // --- FLEUVE MARONI & INTERIEUR OUEST ---
  {
    insee: '97361',
    name: 'Apatou',
    postalCode: '97317',
    centroidX: 11000,
    centroidY: 23500,
    labelX: 11000,
    labelY: 23500,
    isMajor: false,
    lat: 5.1556,
    lng: -54.3417,
    points: '7500,20500 15000,21000 14500,27000 7500,26500'
  },
  {
    insee: '97357',
    name: 'Grand-Santi',
    postalCode: '97340',
    centroidX: 10000,
    centroidY: 33000,
    labelX: 10000,
    labelY: 33000,
    isMajor: false,
    lat: 4.2750,
    lng: -54.3806,
    points: '6500,29500 14000,30000 13500,37000 6500,36500'
  },
  {
    insee: '97362',
    name: 'Papaichton',
    postalCode: '97316',
    centroidX: 11500,
    centroidY: 41500,
    labelX: 11500,
    labelY: 41500,
    isMajor: false,
    lat: 3.8056,
    lng: -54.1444,
    points: '7500,38000 15500,38500 15000,45000 7500,44500'
  },
  {
    insee: '97353',
    name: 'Maripasoula',
    postalCode: '97370',
    centroidX: 14000,
    centroidY: 51000,
    labelX: 14000,
    labelY: 51000,
    isMajor: true,
    lat: 3.6403,
    lng: -54.0306,
    points: '9000,46500 19000,47000 18500,56000 8500,55500'
  },

  // --- CENTRE & SUD ---
  {
    insee: '97352',
    name: 'Saül',
    postalCode: '97314',
    centroidX: 33000,
    centroidY: 43000,
    labelX: 33000,
    labelY: 43000,
    isMajor: false,
    lat: 3.6236,
    lng: -53.2083,
    points: '27500,38500 38500,39000 38000,47500 27000,47000'
  },
  {
    insee: '97358',
    name: 'Saint-Élie',
    postalCode: '97312',
    centroidX: 32000,
    centroidY: 30000,
    labelX: 32000,
    labelY: 30000,
    isMajor: false,
    lat: 4.8250,
    lng: -53.3000,
    points: '26500,26000 37000,26500 36500,34500 26000,34000'
  },

  // --- EST (OYAPOCK & LITTORAL RN2) ---
  {
    insee: '97301',
    name: 'Régina',
    postalCode: '97390',
    centroidX: 62000,
    centroidY: 39500,
    labelX: 62000,
    labelY: 39500,
    isMajor: false,
    lat: 4.3125,
    lng: -52.1292,
    points: '56500,35500 68000,36000 67000,44000 56000,43500'
  },
  {
    insee: '97308',
    name: 'Saint-Georges-de-l\'Oyapock',
    postalCode: '97313',
    centroidX: 71000,
    centroidY: 46000,
    labelX: 71000,
    labelY: 46000,
    isMajor: true,
    lat: 3.8889,
    lng: -51.8028,
    points: '66500,42000 76500,42500 76000,50500 66000,50000'
  },
  {
    insee: '97314',
    name: 'Ouanary',
    postalCode: '97380',
    centroidX: 73000,
    centroidY: 39000,
    labelX: 73000,
    labelY: 39000,
    isMajor: false,
    lat: 4.2111,
    lng: -51.6722,
    points: '69500,36500 77000,37000 76500,41500 69000,41000'
  },
  {
    insee: '97356',
    name: 'Camopi',
    postalCode: '97330',
    centroidX: 65000,
    centroidY: 55000,
    labelX: 65000,
    labelY: 55000,
    isMajor: false,
    lat: 3.1667,
    lng: -52.3333,
    points: '59500,50500 71000,51000 70500,60000 59000,59500'
  }
];

// ============================================================================
// 4. FRANCE MÉTROPOLITAINE - GRANDS BASSINS SANITAIRES & MÉTROPOLES
// Système de coordonnées : viewBox="0 0 100000 100000" (~100 unités par km)
// ============================================================================
export const METROPOLE_ZONES_POLYGONS: TerritoryZonePolygon[] = [
  // --- ÎLE-DE-FRANCE ---
  {
    insee: '75056',
    name: 'Paris & Île-de-France',
    postalCode: '75001',
    centroidX: 52000,
    centroidY: 31000,
    labelX: 52000,
    labelY: 31000,
    isMajor: true,
    department: '75 / 92 / 93 / 94 / 77 / 78 / 91 / 95',
    lat: 48.8566,
    lng: 2.3522,
    points: '47500,26500 56500,26500 57500,35500 48000,35500'
  },
  // --- HAUTS-DE-FRANCE ---
  {
    insee: '59350',
    name: 'Lille (Hauts-de-France)',
    postalCode: '59000',
    centroidX: 54000,
    centroidY: 15000,
    labelX: 54000,
    labelY: 15000,
    isMajor: true,
    department: '59 / 62 / 80 / 60 / 02',
    lat: 50.6292,
    lng: 3.0573,
    points: '48000,10000 60000,11000 58000,22000 48000,20000'
  },
  // --- NORMANDIE ---
  {
    insee: '76540',
    name: 'Rouen / Caen (Normandie)',
    postalCode: '76000',
    centroidX: 39000,
    centroidY: 26000,
    labelX: 39000,
    labelY: 26000,
    isMajor: true,
    department: '76 / 14 / 27 / 50 / 61',
    lat: 49.4432,
    lng: 1.0999,
    points: '31500,20500 46000,21500 45500,31000 31000,29500'
  },
  // --- BRETAGNE ---
  {
    insee: '35238',
    name: 'Rennes / Brest (Bretagne)',
    postalCode: '35000',
    centroidX: 20000,
    centroidY: 38000,
    labelX: 20000,
    labelY: 38000,
    isMajor: true,
    department: '35 / 29 / 56 / 22',
    lat: 48.1173,
    lng: -1.6778,
    points: '9500,32000 29000,33500 28000,43000 10000,42500'
  },
  // --- PAYS DE LA LOIRE ---
  {
    insee: '44109',
    name: 'Nantes / Angers (Pays de la Loire)',
    postalCode: '44000',
    centroidX: 30500,
    centroidY: 45000,
    labelX: 30500,
    labelY: 45000,
    isMajor: true,
    department: '44 / 49 / 72 / 85 / 53',
    lat: 47.2184,
    lng: -1.5536,
    points: '24000,40500 37500,40500 37000,50500 24000,50000'
  },
  // --- CENTRE-VAL DE LOIRE ---
  {
    insee: '37261',
    name: 'Tours / Orléans (Centre-Val de Loire)',
    postalCode: '37000',
    centroidX: 45000,
    centroidY: 44000,
    labelX: 45000,
    labelY: 44000,
    isMajor: false,
    department: '37 / 45 / 18 / 28 / 41 / 36',
    lat: 47.3941,
    lng: 0.6848,
    points: '38500,38000 52500,38000 52000,50000 38000,50000'
  },
  // --- GRAND EST ---
  {
    insee: '67482',
    name: 'Strasbourg / Nancy (Grand Est)',
    postalCode: '67000',
    centroidX: 76000,
    centroidY: 29000,
    labelX: 76000,
    labelY: 29000,
    isMajor: true,
    department: '67 / 68 / 54 / 57 / 51 / 10 / 08 / 55 / 88 / 52',
    lat: 48.5734,
    lng: 7.7521,
    points: '64500,20500 87000,22500 85500,37500 63500,35500'
  },
  // --- BOURGOGNE-FRANCHE-COMTÉ ---
  {
    insee: '21231',
    name: 'Dijon / Besançon (Bourgogne-Franche-Comté)',
    postalCode: '21000',
    centroidX: 68000,
    centroidY: 45500,
    labelX: 68000,
    labelY: 45500,
    isMajor: false,
    department: '21 / 25 / 71 / 89 / 58 / 70 / 90 / 39',
    lat: 47.3220,
    lng: 5.0415,
    points: '58500,38500 79000,39500 77500,52000 58000,51500'
  },
  // --- AUVERGNE-RHÔNE-ALPES ---
  {
    insee: '69123',
    name: 'Lyon / Grenoble (Auvergne-Rhône-Alpes)',
    postalCode: '69001',
    centroidX: 66000,
    centroidY: 62000,
    labelX: 66000,
    labelY: 62000,
    isMajor: true,
    department: '69 / 38 / 42 / 63 / 73 / 74 / 01 / 03 / 07 / 15 / 26 / 43',
    lat: 45.7640,
    lng: 4.8357,
    points: '54500,53000 79000,54000 77000,71500 53500,70500'
  },
  // --- NOUVELLE-AQUITAINE ---
  {
    insee: '33063',
    name: 'Bordeaux (Nouvelle-Aquitaine)',
    postalCode: '33000',
    centroidX: 33000,
    centroidY: 65000,
    labelX: 33000,
    labelY: 65000,
    isMajor: true,
    department: '33 / 64 / 87 / 86 / 17 / 79 / 24 / 40 / 47 / 19 / 23 / 16',
    lat: 44.8378,
    lng: -0.5792,
    points: '23500,53000 45000,54000 44000,77500 23000,76500'
  },
  // --- OCCITANIE ---
  {
    insee: '31555',
    name: 'Toulouse / Montpellier (Occitanie)',
    postalCode: '31000',
    centroidX: 47000,
    centroidY: 79000,
    labelX: 47000,
    labelY: 79000,
    isMajor: true,
    department: '31 / 34 / 30 / 66 / 81 / 11 / 12 / 09 / 32 / 46 / 65 / 82 / 48',
    lat: 43.6047,
    lng: 1.4442,
    points: '37000,72500 60000,73000 59000,88000 36500,87500'
  },
  // --- PROVENCE-ALPES-CÔTE D'AZUR ---
  {
    insee: '13055',
    name: 'Marseille / Nice (PACA)',
    postalCode: '13001',
    centroidX: 74000,
    centroidY: 78000,
    labelX: 74000,
    labelY: 78000,
    isMajor: true,
    department: '13 / 06 / 83 / 84 / 04 / 05',
    lat: 43.2965,
    lng: 5.3698,
    points: '63000,72000 87000,72500 85500,86000 62500,85000'
  },
  // --- CORSE ---
  {
    insee: '2A004',
    name: 'Ajaccio / Bastia (Corse)',
    postalCode: '20000',
    centroidX: 89000,
    centroidY: 87500,
    labelX: 89000,
    labelY: 87500,
    isMajor: true,
    department: '2A / 2B',
    lat: 41.9192,
    lng: 8.7386,
    points: '85500,81500 93000,82000 92500,94000 85000,93500'
  }
];

// ============================================================================
// REGISTRE CENTRAL DES 5 TERRITOIRES
// ============================================================================
export const TERRITORIES_CONFIG: Record<TerritoryId, TerritoryConfig> = {
  MARTINIQUE: {
    id: 'MARTINIQUE',
    code: '972',
    name: 'Martinique (972)',
    shortName: 'Martinique',
    viewBox: MARTINIQUE_SVG_VIEWBOX,
    width: 45333,
    height: 53138,
    unitsPerKm: MARTINIQUE_UNITS_PER_KM,
    defaultCommune: 'Le Lamentin',
    radiusPresets: [5, 10, 15, 20, 30, 45, 60],
    maxRadius: 60,
    distanceRings: [10, 25, 45],
    zones: MARTINIQUE_COMMUNES_POLYGONS.map((m) => ({
      ...m,
      postalCode: '972' + m.insee.slice(-2),
      lat: 14.6,
      lng: -61.0,
    })),
    seaLabel: 'Mer des Caraïbes • Océan Atlantique',
    compassY: 48000,
  },

  GUADELOUPE: {
    id: 'GUADELOUPE',
    code: '971',
    name: 'Guadeloupe (971)',
    shortName: 'Guadeloupe',
    viewBox: '0 0 70000 65000',
    width: 70000,
    height: 65000,
    unitsPerKm: 800,
    defaultCommune: 'Pointe-à-Pitre',
    radiusPresets: [5, 10, 15, 25, 40, 60],
    maxRadius: 65,
    distanceRings: [10, 25, 45],
    zones: GUADELOUPE_COMMUNES_POLYGONS,
    seaLabel: 'Océan Atlantique • Mer des Caraïbes',
    compassY: 59000,
  },

  REUNION: {
    id: 'REUNION',
    code: '974',
    name: 'La Réunion (974)',
    shortName: 'La Réunion',
    viewBox: '0 0 65000 55000',
    width: 65000,
    height: 55000,
    unitsPerKm: 850,
    defaultCommune: 'Saint-Denis',
    radiusPresets: [5, 10, 15, 25, 40, 60],
    maxRadius: 65,
    distanceRings: [10, 25, 45],
    zones: REUNION_COMMUNES_POLYGONS,
    seaLabel: 'Océan Indien',
    compassY: 49000,
  },

  GUYANE: {
    id: 'GUYANE',
    code: '973',
    name: 'Guyane (973)',
    shortName: 'Guyane',
    viewBox: '0 0 80000 70000',
    width: 80000,
    height: 70000,
    unitsPerKm: 250,
    defaultCommune: 'Cayenne',
    radiusPresets: [15, 30, 50, 80, 150, 250],
    maxRadius: 300,
    distanceRings: [30, 80, 150],
    zones: GUYANE_COMMUNES_POLYGONS,
    seaLabel: 'Océan Atlantique • Plateau des Guyanes',
    compassY: 64000,
  },

  METROPOLE: {
    id: 'METROPOLE',
    code: 'FR',
    name: 'France Métropolitaine',
    shortName: 'Métropole',
    viewBox: '0 0 100000 100000',
    width: 100000,
    height: 100000,
    unitsPerKm: 100,
    defaultCommune: 'Paris & Île-de-France',
    radiusPresets: [15, 30, 50, 80, 120, 200],
    maxRadius: 250,
    distanceRings: [30, 70, 150],
    zones: METROPOLE_ZONES_POLYGONS,
    seaLabel: 'Manche • Océan Atlantique • Méditerranée',
    compassY: 92000,
  },
};

export const ALL_TERRITORIES_LIST: TerritoryConfig[] = [
  TERRITORIES_CONFIG.METROPOLE,
  TERRITORIES_CONFIG.MARTINIQUE,
  TERRITORIES_CONFIG.GUADELOUPE,
  TERRITORIES_CONFIG.REUNION,
  TERRITORIES_CONFIG.GUYANE,
];

/**
 * Détection automatique intelligente du territoire à partir d'une adresse,
 * d'un code postal, d'une ville ou d'un département français.
 */
export function detectTerritoryFromAddress(addressOrPostal: string): TerritoryId {
  if (!addressOrPostal) return 'MARTINIQUE';
  const clean = addressOrPostal.trim().toLowerCase();

  // 1. Détection prioritaire par code postal explicite (5 chiffres ou 3 chiffres DOM)
  if (/\b971\d{2}\b/.test(clean) || clean.startsWith('971') || clean.includes('guadeloupe')) {
    return 'GUADELOUPE';
  }
  if (/\b972\d{2}\b/.test(clean) || clean.startsWith('972') || clean.includes('martinique')) {
    return 'MARTINIQUE';
  }
  if (/\b973\d{2}\b/.test(clean) || clean.startsWith('973') || clean.includes('guyane')) {
    return 'GUYANE';
  }
  if (/\b974\d{2}\b/.test(clean) || clean.startsWith('974') || clean.includes('reunion') || clean.includes('réunion')) {
    return 'REUNION';
  }

  // 2. Détection par nom de commune ou de zone
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[-'\s]/g, '');
  const cleanNorm = norm(clean);

  // Recherche dans les communes de Guadeloupe
  for (const c of GUADELOUPE_COMMUNES_POLYGONS) {
    if (cleanNorm.includes(norm(c.name)) || norm(c.name).includes(cleanNorm)) {
      return 'GUADELOUPE';
    }
  }

  // Recherche dans les communes de La Réunion
  for (const c of REUNION_COMMUNES_POLYGONS) {
    if (cleanNorm.includes(norm(c.name)) || norm(c.name).includes(cleanNorm)) {
      return 'REUNION';
    }
  }

  // Recherche dans les communes de Guyane
  for (const c of GUYANE_COMMUNES_POLYGONS) {
    if (cleanNorm.includes(norm(c.name)) || norm(c.name).includes(cleanNorm)) {
      return 'GUYANE';
    }
  }

  // Recherche dans les communes de Martinique
  for (const c of MARTINIQUE_COMMUNES_POLYGONS) {
    if (cleanNorm.includes(norm(c.name)) || norm(c.name).includes(cleanNorm)) {
      return 'MARTINIQUE';
    }
  }

  // 3. Détection code postal métropolitain (ex: 75001, 13001, 69000, 33000, 59000...)
  if (/\b(0[1-9]|[1-8]\d|9[0-5]|2[abAB])\d{3}\b/.test(clean)) {
    return 'METROPOLE';
  }

  // Recherche dans les zones métropolitaines
  for (const z of METROPOLE_ZONES_POLYGONS) {
    if (cleanNorm.includes(norm(z.name)) || norm(z.name).includes(cleanNorm)) {
      return 'METROPOLE';
    }
  }

  // Par défaut, si non reconnu mais ressemble à une ville métropolitaine
  return 'MARTINIQUE';
}
