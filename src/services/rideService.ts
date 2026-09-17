import { Ride, RideStatus, TransportType, Transporter, Facility, AssignedTransporter, TransporterVehicle, TransporterDriver } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EmailService } from './emailService';

const STORAGE_KEY_RIDES = 'medictrans_rides_972';
const STORAGE_KEY_TRANSPORTERS = 'medictrans_transporters_972';
const STORAGE_KEY_FACILITIES = 'medictrans_facilities_972';

// 34 Communes de la Martinique
export const MARTINIQUE_COMMUNES = [
  'Fort-de-France', 'Le Lamentin', 'Le Robert', 'Schœlcher', 'Sainte-Marie', 
  'Le François', 'Ducos', 'Saint-Joseph', 'La Trinité', 'Rivière-Pilote', 
  'Gros-Morne', 'Rivière-Salée', 'Sainte-Luce', 'Saint-Esprit', 'Le Vauclin', 
  'Le Marin', 'Le Lorrain', 'Le Diamant', 'Saint-Pierre', 'Les Trois-Îlets', 
  'Basse-Pointe', 'Le Morne-Rouge', 'Les Anses-d\'Arlet', 'Case-Pilote', 
  'Marigot', 'Le Prêcheur', 'L\'Ajoupa-Bouillon', 'Macouba', 'Bellefontaine', 
  'Carbet', 'Fonds-Saint-Denis', 'Grand\'Rivière', 'Morne-Vert', 'Sainte-Anne'
];

export const MAJOR_FACILITIES: { name: string; city: string; address: string }[] = [
  { name: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman', city: 'Fort-de-France', address: 'Route de Châteauboeuf' },
  { name: 'CHU Hôpital de La Meynard', city: 'Fort-de-France', address: 'Route de Châteauboeuf' },
  { name: 'Hôpital Louis Domergue', city: 'La Trinité', address: 'Route de Tartane' },
  { name: 'Clinique Sainte-Marie', city: 'Schœlcher', address: 'Chemin des Rochers' },
  { name: 'Centre d\'Hémodialyse de Dillon', city: 'Fort-de-France', address: 'Avenue Salvador Allende' },
  { name: 'Hôpital du Marin', city: 'Le Marin', address: 'Morne Calebasse' },
  { name: 'Hôpital de Saint-Pierre', city: 'Saint-Pierre', address: 'Rue Victor Hugo' },
  { name: 'Polyclinique Saint-Paul', city: 'Fort-de-France', address: 'Clairière' },
];

export const INITIAL_TRANSPORTERS: Transporter[] = [
  {
    id: 'transporter-1',
    companyName: 'Ambulances Madinina Secours',
    siret: '48129402900018',
    arsLicense: '972-AMB-2021-04',
    cpamConventionNumber: '972-CPAM-881',
    phone: '0596 75 20 20',
    email: 'dispatch@madinina-secours.mq',
    address: 'Zone Industrielle Lézarde',
    city: 'Le Lamentin',
    fleetAmbulances: 6,
    fleetVsl: 8,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 14,
    complianceRate: 98.4,
    zone: 'Centre & Agglomération (Lamentin, FDF, Schœlcher, Ducos)',
    assignedMissionsCount: 18
  },
  {
    id: 'transporter-2',
    companyName: 'Caraïbes Transports Sanitaires',
    siret: '51293819200024',
    arsLicense: '972-AMB-2019-12',
    cpamConventionNumber: '972-CPAM-654',
    phone: '0596 63 45 45',
    email: 'dispatch@caraibes-transports.mq',
    address: 'Route de la Folie',
    city: 'Fort-de-France',
    fleetAmbulances: 4,
    fleetVsl: 6,
    fleetTaxis: 2,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 12,
    complianceRate: 99.1,
    zone: 'Centre & Nord Caraïbe (FDF, Case-Pilote, St-Pierre)',
    assignedMissionsCount: 14
  },
  {
    id: 'transporter-3',
    companyName: 'Ambulances Trinité Express',
    siret: '62918401200031',
    arsLicense: '972-AMB-2022-09',
    cpamConventionNumber: '972-CPAM-412',
    phone: '0596 58 11 22',
    email: 'contact@trinite-express.mq',
    address: 'Rue de la Gare Maritime',
    city: 'La Trinité',
    fleetAmbulances: 5,
    fleetVsl: 4,
    fleetTaxis: 3,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 18,
    complianceRate: 96.8,
    zone: 'Nord Atlantique (Trinité, Ste-Marie, Robert, Gros-Morne)',
    assignedMissionsCount: 11
  },
  {
    id: 'transporter-4',
    companyName: 'Taxis Médicaux Sud Caraïbes',
    siret: '71829340100015',
    arsLicense: '972-TAXI-2020-03',
    cpamConventionNumber: '972-CPAM-903',
    phone: '0596 74 33 00',
    email: 'coordination@taxismed-sud.mq',
    address: 'Avenue des Cocotiers',
    city: 'Le Marin',
    fleetAmbulances: 2,
    fleetVsl: 5,
    fleetTaxis: 8,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 16,
    complianceRate: 97.5,
    zone: 'Sud Martinique (Marin, Ste-Luce, Rivière-Salée, Diamant)',
    assignedMissionsCount: 12
  },
  {
    id: 'transporter-5',
    companyName: 'Ambulances Alizés 972',
    siret: '81239402900042',
    arsLicense: '972-AMB-2023-01',
    cpamConventionNumber: '972-CPAM-731',
    phone: '0596 61 90 90',
    email: 'alizes972@gmail.com',
    address: 'Chemin Enclos',
    city: 'Schœlcher',
    fleetAmbulances: 3,
    fleetVsl: 4,
    fleetTaxis: 2,
    verified: false,
    status: 'PENDING',
    avgApproachMinutes: 15,
    complianceRate: 94.0,
    zone: 'Centre & Schœlcher',
    assignedMissionsCount: 3
  },
  // --- GUADELOUPE (971) ---
  {
    id: 'transporter-gp-1',
    companyName: 'Ambulances Karukera Assistance',
    siret: '52194830200019',
    arsLicense: '971-AMB-2022-11',
    cpamConventionNumber: '971-CPAM-420',
    phone: '0590 82 10 10',
    email: 'contact@karukera-secours.gp',
    address: 'ZAC de Dothémare',
    city: 'Les Abymes',
    fleetAmbulances: 6,
    fleetVsl: 7,
    fleetTaxis: 3,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 14,
    complianceRate: 98.7,
    zone: 'Grande-Terre & Centre Hospitalier Ricou (Abymes, Pointe-à-Pitre, Gosier)',
    assignedMissionsCount: 16
  },
  {
    id: 'transporter-gp-2',
    companyName: 'Taxis Médicaux Basse-Terre Santé',
    siret: '61492039100028',
    arsLicense: '971-TAXI-2020-05',
    cpamConventionNumber: '971-CPAM-890',
    phone: '0590 81 33 44',
    email: 'dispatch@taxismed-bt.gp',
    address: 'Boulevard du Gouverneur',
    city: 'Basse-Terre',
    fleetAmbulances: 2,
    fleetVsl: 5,
    fleetTaxis: 6,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 15,
    complianceRate: 97.2,
    zone: 'Basse-Terre & Côte-sous-le-vent (Basse-Terre, Baie-Mahault, Bouillante)',
    assignedMissionsCount: 12
  },
  // --- GUYANE (973) ---
  {
    id: 'transporter-gy-1',
    companyName: 'Ambulances Cayenne Secours',
    siret: '72481930200035',
    arsLicense: '973-AMB-2021-02',
    cpamConventionNumber: '973-CPAM-310',
    phone: '0594 30 15 15',
    email: 'urgences@ambulances-cayenne.gf',
    address: 'Route de Baduel',
    city: 'Cayenne',
    fleetAmbulances: 5,
    fleetVsl: 4,
    fleetTaxis: 2,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 13,
    complianceRate: 99.0,
    zone: 'Centre Littoral & CACL (Cayenne, Matoury, Remire-Montjoly)',
    assignedMissionsCount: 14
  },
  {
    id: 'transporter-gy-2',
    companyName: 'Transports Médicaux Kourou Spatial',
    siret: '81920394800041',
    arsLicense: '973-VSL-2023-08',
    cpamConventionNumber: '973-CPAM-772',
    phone: '0594 32 40 40',
    email: 'kourou.sante@gmail.com',
    address: 'Avenue des Roches',
    city: 'Kourou',
    fleetAmbulances: 3,
    fleetVsl: 6,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 16,
    complianceRate: 96.5,
    zone: 'Bassin Savanes & Spatial (Kourou, Sinnamary, Iracoubo)',
    assignedMissionsCount: 9
  },
  // --- LA RÉUNION (974) ---
  {
    id: 'transporter-re-1',
    companyName: 'Ambulances Bourbon Assistance',
    siret: '49281930400017',
    arsLicense: '974-AMB-2020-04',
    cpamConventionNumber: '974-CPAM-651',
    phone: '0262 90 20 20',
    email: 'bourbon.assistance@sante-reunion.re',
    address: 'Boulevard Sud',
    city: 'Saint-Denis',
    fleetAmbulances: 7,
    fleetVsl: 8,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 12,
    complianceRate: 99.2,
    zone: 'Micro-Région Nord & Ouest (Saint-Denis, Sainte-Marie, Saint-Paul)',
    assignedMissionsCount: 22
  },
  {
    id: 'transporter-re-2',
    companyName: 'Taxis Sanitaires Sud Réunion',
    siret: '58192049300052',
    arsLicense: '974-TAXI-2022-15',
    cpamConventionNumber: '974-CPAM-908',
    phone: '0262 35 11 22',
    email: 'sud.transports@reunion-sante.re',
    address: 'Rue Luc Lorion',
    city: 'Saint-Pierre',
    fleetAmbulances: 3,
    fleetVsl: 6,
    fleetTaxis: 7,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 14,
    complianceRate: 98.1,
    zone: 'Micro-Région Sud (Saint-Pierre, Le Tampon, Saint-Louis)',
    assignedMissionsCount: 15
  },
  // --- FRANCE MÉTROPOLITAINE (HEXAGONE) ---
  {
    id: 'transporter-fr-1',
    companyName: 'Ambulances Paris Île-de-France',
    siret: '78492019300063',
    arsLicense: '75-AMB-2019-33',
    cpamConventionNumber: '75-CPAM-512',
    phone: '01 45 67 89 00',
    email: 'regulation@paris-ambulances.fr',
    address: 'Rue de Vaugirard',
    city: 'Paris',
    fleetAmbulances: 12,
    fleetVsl: 14,
    fleetTaxis: 8,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 11,
    complianceRate: 99.4,
    zone: 'Paris (75) & Première Couronne (92, 93, 94)',
    assignedMissionsCount: 34
  },
  {
    id: 'transporter-fr-2',
    companyName: 'Lyon Médical Mobilité',
    siret: '69281940200021',
    arsLicense: '69-AMB-2021-12',
    cpamConventionNumber: '69-CPAM-843',
    phone: '04 72 10 20 30',
    email: 'contact@lyon-medical-transport.fr',
    address: 'Avenue Jean Jaurès',
    city: 'Lyon',
    fleetAmbulances: 8,
    fleetVsl: 10,
    fleetTaxis: 5,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 13,
    complianceRate: 98.5,
    zone: 'Métropole de Lyon & Rhône (69)',
    assignedMissionsCount: 20
  },
  {
    id: 'transporter-fr-3',
    companyName: 'Transports Sanitaires Azur Marseille',
    siret: '51382940100084',
    arsLicense: '13-AMB-2020-08',
    cpamConventionNumber: '13-CPAM-764',
    phone: '04 91 22 33 44',
    email: 'direction@azur-transports.fr',
    address: 'Boulevard Baille',
    city: 'Marseille',
    fleetAmbulances: 9,
    fleetVsl: 11,
    fleetTaxis: 6,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 14,
    complianceRate: 97.9,
    zone: 'Marseille (13) & Métropole Aix-Marseille-Provence',
    assignedMissionsCount: 25
  },
  // --- OCCITANIE / HAUTE-GARONNE (31) ---
  {
    id: 'transporter-31-1',
    companyName: 'Ambulances Occitanes Toulouse',
    siret: '81294029100034',
    arsLicense: '31-AMB-2020-14',
    cpamConventionNumber: '31-CPAM-310',
    phone: '05 61 20 30 40',
    email: 'contact@ambulances-occitanes31.fr',
    address: 'Boulevard de Suisse',
    city: 'Toulouse',
    postalCode: '31200',
    fleetAmbulances: 8,
    fleetVsl: 10,
    fleetTaxis: 5,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 11,
    complianceRate: 99.1,
    zone: 'Toulouse (31) & Agglomération (Purpan, Rangueil, Oncopole)',
    assignedMissionsCount: 28
  },
  {
    id: 'transporter-31-2',
    companyName: 'Ambulances Capitole Assistance',
    siret: '72918402900018',
    arsLicense: '31-AMB-2021-22',
    cpamConventionNumber: '31-CPAM-422',
    phone: '05 61 40 50 60',
    email: 'regulation@capitole-secours.fr',
    address: 'Avenue de Grande-Bretagne',
    city: 'Toulouse',
    postalCode: '31300',
    fleetAmbulances: 6,
    fleetVsl: 8,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 12,
    complianceRate: 98.7,
    zone: 'Toulouse Ouest & Secteur Hospitalier Purpan / Saint-Cyprien',
    assignedMissionsCount: 24
  },
  {
    id: 'transporter-31-3',
    companyName: 'Taxis & VSL Conventionnés Haute-Garonne Santé',
    siret: '61928401900055',
    arsLicense: '31-TAXI-2019-08',
    cpamConventionNumber: '31-CPAM-789',
    phone: '05 61 71 80 90',
    email: 'dispatch@taxismed31.fr',
    address: 'Rue de Dieudonné Costes',
    city: 'Blagnac',
    postalCode: '31700',
    fleetAmbulances: 2,
    fleetVsl: 7,
    fleetTaxis: 8,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 13,
    complianceRate: 97.8,
    zone: 'Blagnac, Colomiers, Tournefeuille & Pôle Médical Purpan',
    assignedMissionsCount: 19
  },
  // --- NOUVELLE-AQUITAINE / GIRONDE (33) ---
  {
    id: 'transporter-33-1',
    companyName: 'Ambulances Aquitaine Pellegrin',
    siret: '51928401900042',
    arsLicense: '33-AMB-2020-19',
    cpamConventionNumber: '33-CPAM-654',
    phone: '05 56 30 40 50',
    email: 'contact@ambulances-aquitaine.fr',
    address: 'Rue de la Pelouse de Douet',
    city: 'Bordeaux',
    postalCode: '33000',
    fleetAmbulances: 7,
    fleetVsl: 9,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 12,
    complianceRate: 98.9,
    zone: 'Bordeaux Métropole (33) & CHU Pellegrin',
    assignedMissionsCount: 22
  },
  // --- OCCITANIE / HÉRAULT (34) ---
  {
    id: 'transporter-34-1',
    companyName: 'Ambulances Hérault Occitanie',
    siret: '61829402800073',
    arsLicense: '34-AMB-2021-05',
    cpamConventionNumber: '34-CPAM-812',
    phone: '04 67 20 30 40',
    email: 'dispatch@herault-ambulances.fr',
    address: 'Avenue du Doyen Gaston Giraud',
    city: 'Montpellier',
    postalCode: '34090',
    fleetAmbulances: 6,
    fleetVsl: 7,
    fleetTaxis: 3,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 13,
    complianceRate: 98.2,
    zone: 'Montpellier Métropole (34) & CHU Lapeyronie',
    assignedMissionsCount: 17
  },
  // --- HAUTS-DE-FRANCE / NORD (59) ---
  {
    id: 'transporter-59-1',
    companyName: 'Ambulances Flandres Cité Hospitalière',
    siret: '48291039200051',
    arsLicense: '59-AMB-2019-27',
    cpamConventionNumber: '59-CPAM-901',
    phone: '03 20 50 60 70',
    email: 'contact@flandres-ambulances.fr',
    address: 'Avenue Eugène Avinée',
    city: 'Lille',
    postalCode: '59000',
    fleetAmbulances: 8,
    fleetVsl: 9,
    fleetTaxis: 5,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 12,
    complianceRate: 98.6,
    zone: 'Lille Métropole (59) & CHU Claude Huriez',
    assignedMissionsCount: 21
  },
  // --- PAYS DE LA LOIRE / LOIRE-ATLANTIQUE (44) ---
  {
    id: 'transporter-44-1',
    companyName: 'Ambulances Nantaises Atlantique',
    siret: '71928401900062',
    arsLicense: '44-AMB-2020-31',
    cpamConventionNumber: '44-CPAM-441',
    phone: '02 40 30 40 50',
    email: 'contact@nantaises-ambulances.fr',
    address: 'Quai de la Fosse',
    city: 'Nantes',
    postalCode: '44000',
    fleetAmbulances: 7,
    fleetVsl: 8,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 13,
    complianceRate: 98.4,
    zone: 'Nantes Métropole (44) & CHU Hôtel-Dieu',
    assignedMissionsCount: 18
  },
  // --- GRAND EST / BAS-RHIN (67) ---
  {
    id: 'transporter-67-1',
    companyName: 'Ambulances Alsace Secours',
    siret: '58291029100084',
    arsLicense: '67-AMB-2021-18',
    cpamConventionNumber: '67-CPAM-672',
    phone: '03 88 40 50 60',
    email: 'contact@alsace-secours.fr',
    address: 'Route de Schirmeck',
    city: 'Strasbourg',
    postalCode: '67000',
    fleetAmbulances: 7,
    fleetVsl: 8,
    fleetTaxis: 3,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 13,
    complianceRate: 98.5,
    zone: 'Eurométropole de Strasbourg (67) & CHU Hautepierre',
    assignedMissionsCount: 20
  },
  // --- BRETAGNE / ILLE-ET-VILAINE (35) ---
  {
    id: 'transporter-35-1',
    companyName: 'Ambulances Armorique Rennes',
    siret: '61928402900091',
    arsLicense: '35-AMB-2020-12',
    cpamConventionNumber: '35-CPAM-351',
    phone: '02 99 30 40 50',
    email: 'contact@armorique-ambulances.fr',
    address: 'Rue de Fougères',
    city: 'Rennes',
    postalCode: '35000',
    fleetAmbulances: 6,
    fleetVsl: 7,
    fleetTaxis: 4,
    verified: true,
    status: 'ACTIVE',
    avgApproachMinutes: 14,
    complianceRate: 98.1,
    zone: 'Rennes Métropole (35) & CHU Pontchaillou',
    assignedMissionsCount: 16
  }
];

/**
 * Extrait le code département d'un transporteur sanitaire (ex: '31', '75', '972', '33', etc.)
 */
export function getTransporterDepartment(t: Transporter): string {
  // 1. Depuis postalCode explicite
  if (t.postalCode) {
    const clean = t.postalCode.trim();
    if (clean.startsWith('97') && clean.length >= 3) {
      return clean.slice(0, 3);
    }
    if (clean.length >= 2) {
      return clean.slice(0, 2);
    }
  }

  // 2. Depuis l'agrément ARS (ex: '31-AMB-2020-14' ou '972-AMB-2021-04')
  if (t.arsLicense) {
    const match = t.arsLicense.match(/^(97[1-6]|\d{2})-/);
    if (match) return match[1];
  }

  // 3. Depuis le conventionnement CPAM (ex: '31-CPAM-310' ou '972-CPAM-881')
  if (t.cpamConventionNumber) {
    const match = t.cpamConventionNumber.match(/^(97[1-6]|\d{2})-/);
    if (match) return match[1];
  }

  // 4. Depuis la ville / adresse / zone / nom
  const text = `${t.city || ''} ${t.address || ''} ${t.zone || ''} ${t.companyName || ''}`.toLowerCase();
  
  // DROMs
  if (text.includes('971') || text.includes('guadeloupe') || text.includes('pointe-à-pitre') || text.includes('abymes')) return '971';
  if (text.includes('972') || text.includes('martinique') || text.includes('fort-de-france') || text.includes('lamentin') || text.includes('schoelcher') || text.includes('madinina')) return '972';
  if (text.includes('973') || text.includes('guyane') || text.includes('cayenne') || text.includes('kourou')) return '973';
  if (text.includes('974') || text.includes('réunion') || text.includes('reunion') || text.includes('saint-denis')) return '974';
  if (text.includes('976') || text.includes('mayotte') || text.includes('mamoudzou')) return '976';

  // Métropole
  if (text.includes('31') || text.includes('toulouse') || text.includes('blagnac') || text.includes('colomiers') || text.includes('haute-garonne')) return '31';
  if (text.includes('33') || text.includes('bordeaux') || text.includes('mérignac') || text.includes('merignac') || text.includes('gironde')) return '33';
  if (text.includes('34') || text.includes('montpellier') || text.includes('hérault') || text.includes('herault')) return '34';
  if (text.includes('75') || text.includes('paris') || text.includes('île-de-france') || text.includes('ile-de-france')) return '75';
  if (text.includes('13') || text.includes('marseille') || text.includes('bouches-du-rhône')) return '13';
  if (text.includes('69') || text.includes('lyon') || text.includes('rhône')) return '69';
  if (text.includes('59') || text.includes('lille') || text.includes('nord')) return '59';
  if (text.includes('44') || text.includes('nantes') || text.includes('loire-atlantique')) return '44';
  if (text.includes('67') || text.includes('strasbourg') || text.includes('bas-rhin')) return '67';
  if (text.includes('35') || text.includes('rennes') || text.includes('ille-et-vilaine')) return '35';

  return '972';
}

/**
 * Génère une flotte de véhicules et une équipe de chauffeurs réalistes pour un transporteur
 */
export function generateDefaultFleetAndDrivers(t: Transporter): { vehicles: TransporterVehicle[]; drivers: TransporterDriver[] } {
  // Transporteur 1 historique (Martinique)
  if (t.id === 'transporter-1' || t.id === 'madinina-secours') {
    return {
      drivers: [
        {
          id: `${t.id}-dr-1`,
          firstName: 'Patrick',
          lastName: 'Césaire',
          role: 'Ambulancier DEA (Cadre)',
          phone: '0696 75 20 20',
          email: 'p.cesaire@madinina-secours.mq',
          status: 'DISPONIBLE',
          assignedVehiclePlate: 'GH-972-MQ'
        },
        {
          id: `${t.id}-dr-2`,
          firstName: 'Loïc',
          lastName: 'Marie-Rose',
          role: 'Ambulancier DEA',
          phone: '0696 34 56 78',
          email: 'l.marierose@madinina-secours.mq',
          status: 'DISPONIBLE',
          assignedVehiclePlate: 'AA-972-FX'
        },
        {
          id: `${t.id}-dr-3`,
          firstName: 'Marcelle',
          lastName: 'Eustache',
          role: 'Chauffeur Taxi Conventionné',
          phone: '0696 90 12 34',
          email: 'm.eustache@madinina-secours.mq',
          status: 'DISPONIBLE',
          assignedVehiclePlate: 'BC-972-MQ'
        },
        {
          id: `${t.id}-dr-4`,
          firstName: 'Aurélie',
          lastName: 'Sainte-Rose',
          role: 'Ambulancière Auxiliaire',
          phone: '0696 45 11 22',
          email: 'a.sainterose@madinina-secours.mq',
          status: 'DISPONIBLE'
        }
      ],
      vehicles: [
        {
          id: `${t.id}-vh-1`,
          name: 'Ambulance ASSU 01',
          type: 'AMBULANCE',
          plate: 'GH-972-MQ',
          driver: 'Patrick Césaire (Ambulancier DEA)',
          phone: '0696 75 20 20',
          status: 'DISPONIBLE'
        },
        {
          id: `${t.id}-vh-2`,
          name: 'VSL Médical 02',
          type: 'VSL',
          plate: 'AA-972-FX',
          driver: 'Loïc Marie-Rose (Ambulancier DEA)',
          phone: '0696 34 56 78',
          status: 'DISPONIBLE'
        },
        {
          id: `${t.id}-vh-3`,
          name: 'Taxi Conventionné 03',
          type: 'TAXI_CONVENTIONNE',
          plate: 'BC-972-MQ',
          driver: 'Marcelle Eustache (Chauffeur Taxi)',
          phone: '0696 90 12 34',
          status: 'DISPONIBLE'
        }
      ]
    };
  }

  // Pour les autres transporteurs (Occitanie/31, Paris/75, etc.)
  const dept = getTransporterDepartment(t);
  const vehicles: TransporterVehicle[] = [];
  const drivers: TransporterDriver[] = [];

  const countAmb = Math.max(1, Math.min(t.fleetAmbulances || 2, 4));
  const countVsl = Math.max(1, Math.min(t.fleetVsl || 2, 4));
  const countTaxi = Math.max(1, Math.min(t.fleetTaxis || 1, 3));

  let vIndex = 1;
  let dIndex = 1;

  for (let i = 1; i <= countAmb; i++) {
    const plate = `AB-${dept.padStart(2, '0')}${i}-FR`;
    const driverName = `Ambulancier DEA ${i}`;
    vehicles.push({
      id: `${t.id}-vh-${vIndex++}`,
      name: `Ambulance ASSU #${i}`,
      type: 'AMBULANCE',
      plate,
      driver: `${driverName} (${t.city || 'Secteur'})`,
      phone: t.phone || '06 00 00 00 00',
      status: i === 1 ? 'DISPONIBLE' : 'DISPONIBLE'
    });
    drivers.push({
      id: `${t.id}-dr-${dIndex++}`,
      firstName: `Équipe`,
      lastName: `Ambulance ${i}`,
      role: 'Ambulancier DEA Diplômé',
      phone: t.phone || '06 00 00 00 00',
      status: 'DISPONIBLE',
      assignedVehiclePlate: plate
    });
  }

  for (let i = 1; i <= countVsl; i++) {
    const plate = `VS-${dept.padStart(2, '0')}${i}-FR`;
    const driverName = `Chauffeur VSL ${i}`;
    vehicles.push({
      id: `${t.id}-vh-${vIndex++}`,
      name: `VSL Sanitaire #${i}`,
      type: 'VSL',
      plate,
      driver: `${driverName} (${t.city || 'Secteur'})`,
      phone: t.phone || '06 00 00 00 00',
      status: 'DISPONIBLE'
    });
    drivers.push({
      id: `${t.id}-dr-${dIndex++}`,
      firstName: `Conducteur`,
      lastName: `VSL ${i}`,
      role: 'Ambulancier Auxiliaire',
      phone: t.phone || '06 00 00 00 00',
      status: 'DISPONIBLE',
      assignedVehiclePlate: plate
    });
  }

  for (let i = 1; i <= countTaxi; i++) {
    const plate = `TX-${dept.padStart(2, '0')}${i}-FR`;
    vehicles.push({
      id: `${t.id}-vh-${vIndex++}`,
      name: `Taxi Conventionné #${i}`,
      type: 'TAXI_CONVENTIONNE',
      plate,
      driver: `Chauffeur Taxi #${i}`,
      phone: t.phone || '06 00 00 00 00',
      status: 'DISPONIBLE'
    });
    drivers.push({
      id: `${t.id}-dr-${dIndex++}`,
      firstName: `Chauffeur`,
      lastName: `Taxi ${i}`,
      role: 'Chauffeur Taxi Conventionné CPAM',
      phone: t.phone || '06 00 00 00 00',
      status: 'DISPONIBLE',
      assignedVehiclePlate: plate
    });
  }

  return { vehicles, drivers };
}

/**
 * Assure qu'un transporteur a toujours sa flotte et ses chauffeurs attachés
 */
export function ensureTransporterFleetAndDrivers(t: Transporter): Transporter {
  if (t.vehicles && t.vehicles.length > 0 && t.drivers && t.drivers.length > 0) {
    return t;
  }
  const generated = generateDefaultFleetAndDrivers(t);
  return {
    ...t,
    vehicles: t.vehicles && t.vehicles.length > 0 ? t.vehicles : generated.vehicles,
    drivers: t.drivers && t.drivers.length > 0 ? t.drivers : generated.drivers
  };
}

export const INITIAL_FACILITIES: Facility[] = [
  {
    id: 'fac-1',
    name: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    finess: '970200021',
    type: 'HOSPITAL',
    address: 'Route de Châteauboeuf, CS 90632',
    city: 'Fort-de-France',
    contactName: 'Dr. Alix Célestine',
    contactRole: 'Cadre Supérieur de Santé - Régulation Sorties',
    contactPhone: '0596 55 20 00',
    contactEmail: 'direction@chu-martinique.fr',
    departments: ['Néphrologie & Dialyse', 'Oncologie & Chimiothérapie', 'Cardiologie', 'Chirurgie Ambulatoire', 'Urgences Adultes', 'Maternité'],
    dropoffPoints: [
      { name: 'Quai Ambulances Niveau 0', type: 'BRANCARDAGE', notes: 'Sas Urgences & Réanimation' },
      { name: 'Dépose Minute Entrée Sud', type: 'VSL_TAXI', notes: 'Consultations externes & Dialyse' },
      { name: 'Rampe Bâtiment Mère-Enfant', type: 'MIXTE', notes: 'Niveau R+1 Maternité' }
    ],
    activeDischargesCount: 84,
    authorizedStaffCount: 42,
    rating: 4.9
  },
  {
    id: 'fac-2',
    name: 'Clinique Sainte-Marie',
    finess: '970200088',
    type: 'CLINIC',
    address: 'Chemin des Rochers',
    city: 'Schœlcher',
    contactName: 'Marie-Paule Valaire',
    contactRole: 'Responsable Régulation des Sorties de Lit',
    contactPhone: '0596 61 41 00',
    contactEmail: 'admissions@clinique-stemarie.mq',
    departments: ['Chirurgie Orthopédique', 'Maternité & Obstétrique', 'Chirurgie Ambulatoire', 'Endoscopie'],
    dropoffPoints: [
      { name: 'Porche Principal Ambulances', type: 'BRANCARDAGE', notes: 'Accès direct ascenseur brancard' },
      { name: 'Dépose Visiteurs & Taxis', type: 'VSL_TAXI', notes: 'Parking P1 devant hall d\'accueil' }
    ],
    activeDischargesCount: 32,
    authorizedStaffCount: 18,
    rating: 4.8
  },
  {
    id: 'fac-3',
    name: 'Centre d\'Hémodialyse de Dillon',
    finess: '970200153',
    type: 'DIALYSIS',
    address: 'Avenue Salvador Allende',
    city: 'Fort-de-France',
    contactName: 'Julien Montrose',
    contactRole: 'Coordinateur des Soins & Planification Transport',
    contactPhone: '0596 79 12 34',
    contactEmail: 'dialyse.dillon@sante-972.fr',
    departments: ['Hémodialyse Adulte', 'Néphrologie Consultations', 'Éducation Thérapeutique'],
    dropoffPoints: [
      { name: 'Sas Dépose Fauteuils Roulants', type: 'MIXTE', notes: 'Entrée de plain-pied sans marche' }
    ],
    activeDischargesCount: 48,
    authorizedStaffCount: 12,
    rating: 4.9
  },
  {
    id: 'fac-4',
    name: 'Hôpital Louis Domergue',
    finess: '970200047',
    type: 'HOSPITAL',
    address: 'Route de Tartane',
    city: 'La Trinité',
    contactName: 'Sylvie Brival',
    contactRole: 'Cadre de Santé Urgences & Médecine',
    contactPhone: '0596 66 46 00',
    contactEmail: 'admissions@hopital-trinite.fr',
    departments: ['Urgences Nord Atlantique', 'Médecine Polyvalente', 'Soins de Suite & Réadaptation'],
    dropoffPoints: [
      { name: 'Quai Ambulances Urgences', type: 'BRANCARDAGE', notes: 'Accès prioritaire 24/7' }
    ],
    activeDischargesCount: 26,
    authorizedStaffCount: 16,
    rating: 4.7
  },
  {
    id: 'fac-5',
    name: 'Hôpital du Marin',
    finess: '970200062',
    type: 'HOSPITAL',
    address: 'Morne Calebasse',
    city: 'Le Marin',
    contactName: 'Serge Gauthier',
    contactRole: 'Responsable des Soins Sud',
    contactPhone: '0596 74 92 05',
    contactEmail: 'soins@hopital-marin.fr',
    departments: ['Urgences & Déchoquage', 'Médecine Gériatrique', 'SSR Sud'],
    dropoffPoints: [
      { name: 'Cour Intérieure Médicale', type: 'MIXTE', notes: 'Dépose ambulances et VSL' }
    ],
    activeDischargesCount: 19,
    authorizedStaffCount: 10,
    rating: 4.6
  }
];

// Helper pour générer des dates futures précises pour le planning prévisionnel
const getFutureIso = (daysAhead: number, hours: number, minutes: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const INITIAL_RIDES: Ride[] = [
  {
    id: 'ride-demo-1',
    reference: 'MT-972-7325',
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    pickupAddress: 'Quartier Cap Est, Morne Calebasse',
    pickupCity: 'Le Marin',
    dropoffAddress: 'Hôpital Louis Domergue, Route de Tartane',
    dropoffCity: 'La Trinité',
    facilityName: 'Hôpital Louis Domergue',
    pickupDateTime: new Date(Date.now() - 26 * 3600000).toISOString(),
    returnDateTime: new Date(Date.now() - 22 * 3600000).toISOString(),
    isRoundTrip: true,
    transportType: 'TAXI_CONVENTIONNE',
    status: 'COMPLETED',
    source: 'PATIENT',
    patient: {
      firstName: 'Christian',
      lastName: 'Marie-Luce',
      birthDate: '1954-11-03',
      nir: '1 54 11 97 208 771 72',
      phone: '0696 55 44 33',
      email: 'c.marieluce@orange.fr',
      address: 'Quartier Cap Est, Morne Calebasse',
      city: 'Le Marin',
      postalCode: '97290',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Sylvie Brival - Hôpital Trinité',
      pmtUploaded: true,
      pmtFileName: 'Prescription_Cardiologie_Trinite.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: true,
      floorNumber: 2,
      needsEscort: true,
      notes: 'Consultation cardiologie de contrôle - Transport effectué avec succès'
    },
    appointmentTime: '08:30',
    transporterPickupTime: '07:35',
    estimatedArrivalTime: '08:15',
    assignedTransporter: {
      companyName: 'Taxis Médicaux Sud Caraïbes',
      driverName: 'Jean-Luc Euphrasie',
      driverPhone: '0696 74 33 00',
      vehiclePlate: 'EF-972-MQ',
      etaMinutes: 10
    }
  },
  {
    id: 'ride-demo-1-active',
    reference: 'MT-972-8821',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    pickupAddress: 'Quartier Cap Est, Morne Calebasse',
    pickupCity: 'Le Marin',
    dropoffAddress: 'CHU Pierre Zobda-Quitman, Route de Châteauboeuf',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() + 35 * 60000).toISOString(),
    returnDateTime: new Date(Date.now() + 240 * 60000).toISOString(),
    isRoundTrip: true,
    transportType: 'VSL',
    status: 'ACCEPTED',
    source: 'PATIENT',
    appointmentTime: '10:00',
    transporterPickupTime: '09:05',
    estimatedArrivalTime: '09:40',
    patient: {
      firstName: 'Christian',
      lastName: 'Marie-Luce',
      birthDate: '1954-11-03',
      nir: '1 54 11 97 208 771 72',
      phone: '0696 55 44 33',
      email: 'c.marieluce@orange.fr',
      address: 'Quartier Cap Est, Morne Calebasse',
      city: 'Le Marin',
      postalCode: '97290',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Joseph Rénier - CHU Zobda-Quitman',
      pmtUploaded: true,
      pmtFileName: 'Prescription_Cardiologie_Zobda.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Consultation cardiologie - Équipage en approche'
    },
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Patrick Marie-Rose',
      driverPhone: '0696 33 22 11',
      vehiclePlate: 'AB-972-MQ',
      etaMinutes: 12
    }
  },
  {
    id: 'ride-demo-2',
    reference: 'MT-972-1849',
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    pickupAddress: 'Quartier Morne Pavillon, Route des Religieuses',
    pickupCity: 'Fort-de-France',
    dropoffAddress: 'CHU Pierre Zobda-Quitman, Route de Châteauboeuf',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() - 24 * 3600000).toISOString(),
    returnDateTime: new Date(Date.now() - 20 * 3600000).toISOString(),
    isRoundTrip: true,
    transportType: 'AMBULANCE',
    status: 'CANCELLED',
    source: 'PATIENT',
    patient: {
      firstName: 'Maryse',
      lastName: 'Brival',
      birthDate: '1968-09-12',
      nir: '2 68 09 97 205 119 46',
      phone: '0696 44 88 99',
      email: 'maryse.brival@gmail.com',
      address: 'Quartier Morne Pavillon, Route des Religieuses',
      city: 'Fort-de-France',
      postalCode: '97200',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Joseph Rénier - Cardiologue CHU FDF',
      pmtUploaded: true,
      pmtFileName: 'PMT_Ambulance_CHU_FDF.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: '[Annulé le 13/09 à 16:45: Rendez-vous médical reporté par le CHU - PMT Cerfa S3138 conservée]'
    },
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Patrick Marie-Rose',
      driverPhone: '0696 33 22 11',
      vehiclePlate: 'AB-972-MQ',
      etaMinutes: 15
    }
  },
  {
    id: 'ride-demo-3',
    reference: 'MT-972-4108',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    pickupAddress: '14 Rue Victor Hugo, Place Clémenceau',
    pickupCity: 'Le Lamentin',
    dropoffAddress: 'CHU Pierre Zobda-Quitman, Route de Châteauboeuf',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() + 45 * 60000).toISOString(),
    returnDateTime: new Date(Date.now() + 240 * 60000).toISOString(),
    isRoundTrip: true,
    transportType: 'VSL',
    status: 'ACCEPTED',
    source: 'FACILITY',
    facilityDepartment: 'Néphrologie & Dialyse',
    facilityFloor: '1er étage',
    facilityStaircase: 'Escalier A',
    facilityRoom: 'Chambre 104',
    facilityBed: 'Lit B',
    bedDischargeNumber: 'Ch. 104 - Lit B (1er ét., Esc. A)',
    facilityContactPhone: '05 96 55 21 34',
    facilityContactName: 'Mme Marie-Paule Valaire (Cadre)',
    additionalNotes: 'Sortie d\'hémodialyse programmée. Surveillance tensionnelle et aide au transfert fauteuil-véhicule.',
    patient: {
      firstName: 'Éliane',
      lastName: 'Moutoussamy',
      birthDate: '1961-04-18',
      nir: '2 61 04 97 215 098 30',
      phone: '0696 22 88 11',
      email: 'eliane.moutoussamy@sante-972.fr',
      address: '14 Rue Victor Hugo, Place Clémenceau',
      city: 'Le Lamentin',
      postalCode: '97232',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Alix Célestine - CHU Martinique',
      pmtUploaded: true,
      pmtFileName: 'PMT_Dialyse_CHU_Moutoussamy.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Séance de dialyse programmée à 14h30 - Patient autonome'
    },
    appointmentTime: '14:30',
    transporterPickupTime: '13:45',
    estimatedArrivalTime: '14:15',
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Sébastien Larcher',
      driverPhone: '0696 75 20 20',
      vehiclePlate: 'GH-972-MQ',
      etaMinutes: 12
    }
  },
  {
    id: 'ride-demo-4',
    reference: 'MT-972-5892',
    createdAt: new Date().toISOString(),
    pickupAddress: 'Cluny, Route de Schoelcher',
    pickupCity: 'Fort-de-France',
    dropoffAddress: 'Clinique Sainte-Marie, Chemin des Rochers',
    dropoffCity: 'Schœlcher',
    facilityName: 'Clinique Sainte-Marie',
    pickupDateTime: new Date(Date.now() + 90 * 60000).toISOString(),
    isRoundTrip: false,
    transportType: 'VSL',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '11:00',
    patient: {
      firstName: 'Dimitri',
      lastName: 'Kanor',
      birthDate: '1987-03-24',
      nir: '1 87 03 97 212 345 88',
      phone: '0696 90 90 90',
      email: 'dimitri.kanor@gmail.com',
      address: 'Cluny, Route de Schoelcher',
      city: 'Fort-de-France',
      postalCode: '97200',
      isAld: true,
      hasPmt: false,
      pmtPrescriberDoctor: 'Dr. Jean-Marc Vilar',
      pmtUploaded: false
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Consultation ambulatoire orthopédie'
    }
  },
  // =========================================================================
  // COURSES PLANIFIÉES À L'AVANCE (PLANNING & PROGRAMMATION DES TRANSPORTEURS)
  // =========================================================================
  {
    id: 'ride-plan-1',
    reference: 'MT-972-6214',
    createdAt: new Date().toISOString(),
    pickupAddress: '25 Rue des Hibiscus',
    pickupCity: 'Ducos',
    dropoffAddress: 'CHU Pierre Zobda-Quitman, Route de Châteauboeuf',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: getFutureIso(1, 8, 30),
    returnDateTime: getFutureIso(1, 12, 30),
    isRoundTrip: true,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '09:30',
    isDirectRequest: true,
    targetTransporterId: 'transporter-1',
    targetTransporterName: 'Ambulances Madinina Secours',
    directRequestExpiresAt: new Date(Date.now() + 20 * 3600000).toISOString(),
    isDirectRequestExpired: false,
    reassignedToPublicPool: false,
    patient: {
      firstName: 'Marcel',
      lastName: 'Ventura',
      birthDate: '1958-06-14',
      nir: '1 58 06 97 210 443 64',
      phone: '0696 31 82 40',
      email: 'm.ventura@gmail.com',
      address: '25 Rue des Hibiscus',
      city: 'Ducos',
      postalCode: '97224',
      isAld: true,
      aldReason: 'ALD 30 - Tumeur maligne (Oncologie)',
      hasPmt: true,
      pmtUploaded: true,
      pmtFileName: 'PMT_Oncologie_Ventura_S3138.pdf',
      pmtPrescriberDoctor: 'Dr. Cécile Darnal - Oncologue CHU'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: 'Séance de chimiothérapie ambulatoire HDJ - Transport allongé ou demi-assis requis. Course disponible à réserver en avance.'
    }
  },
  {
    id: 'ride-plan-2',
    reference: 'MT-972-9032',
    createdAt: new Date().toISOString(),
    pickupAddress: '8 Avenue des Alizés',
    pickupCity: 'Schœlcher',
    dropoffAddress: 'Clinique Sainte-Marie, Chemin des Rochers',
    dropoffCity: 'Schœlcher',
    facilityName: 'Clinique Sainte-Marie',
    pickupDateTime: getFutureIso(1, 14, 15),
    isRoundTrip: false,
    transportType: 'VSL',
    status: 'ACCEPTED',
    source: 'FACILITY',
    appointmentTime: '15:15',
    transporterPickupTime: '14:20',
    estimatedArrivalTime: '14:50',
    facilityDepartment: 'Chirurgie Orthopédique',
    facilityFloor: '2ème étage',
    facilityStaircase: 'Escalier B',
    facilityRoom: 'Chambre 214',
    facilityBed: 'Lit 1',
    bedDischargeNumber: 'Ch. 214 - Lit 1 (2e ét., Esc. B)',
    facilityContactPhone: '05 96 55 20 40',
    facilityContactName: 'IDE Coordination Orthopédie',
    additionalNotes: 'Sortie post-opératoire prothèse de genou. Béquilles à prévoir, aide à la marche pour le trajet.',
    patient: {
      firstName: 'Josiane',
      lastName: 'Rose-Helène',
      birthDate: '1965-11-20',
      nir: '2 65 11 97 218 554 79',
      phone: '0696 14 25 36',
      email: 'josiane.rh@orange.fr',
      address: '8 Avenue des Alizés',
      city: 'Schœlcher',
      postalCode: '97233',
      isAld: true,
      hasPmt: true,
      pmtUploaded: true,
      pmtFileName: 'PMT_Clinique_SteMarie_Ortho.pdf',
      pmtPrescriberDoctor: 'Dr. Jean-Marc Vilar'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Sortie post-opératoire prothèse de genou - Station assise autorisée'
    },
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Patrick Marie-Rose',
      driverPhone: '0696 33 22 11',
      vehiclePlate: 'AB-972-MQ',
      etaMinutes: 15
    }
  },
  {
    id: 'ride-plan-3',
    reference: 'MT-972-8419',
    createdAt: new Date().toISOString(),
    pickupAddress: 'Résidence Bois d\'Inde',
    pickupCity: 'Case-Pilote',
    dropoffAddress: 'Centre d\'Hémodialyse de Dillon, Avenue Salvador Allende',
    dropoffCity: 'Fort-de-France',
    facilityName: 'Centre d\'Hémodialyse de Dillon',
    pickupDateTime: getFutureIso(2, 9, 0),
    returnDateTime: getFutureIso(2, 13, 30),
    isRoundTrip: true,
    transportType: 'TAXI_CONVENTIONNE',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '09:45',
    isRecurring: true,
    recurringDates: [getFutureIso(2, 9, 0).slice(0, 10), getFutureIso(4, 9, 0).slice(0, 10), getFutureIso(7, 9, 0).slice(0, 10)],
    patient: {
      firstName: 'Gérard',
      lastName: 'Théodore',
      birthDate: '1952-02-17',
      nir: '1 52 02 97 205 889 95',
      phone: '0696 78 90 12',
      email: 'g.theodore@sante-972.fr',
      address: 'Résidence Bois d\'Inde',
      city: 'Case-Pilote',
      postalCode: '97222',
      isAld: true,
      aldReason: 'ALD 19 - Néphropathie chronique grave',
      hasPmt: true,
      pmtUploaded: false,
      pmtPrescriberDoctor: 'Dr. Julien Montrose - Néphrologue'
    },
    mobility: {
      wheelchair: true,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Séance d\'hémodialyse récurrente - Fauteuil roulant pliant (TPMR ou Taxi avec coffre adapté). Récupérer PMT papier Cerfa S3138.'
    }
  },
  {
    id: 'ride-plan-4',
    reference: 'MT-972-3510',
    createdAt: new Date().toISOString(),
    pickupAddress: 'Quartier Morne Poirier',
    pickupCity: 'Rivière-Pilote',
    dropoffAddress: 'Hôpital Louis Domergue, Route de Tartane',
    dropoffCity: 'La Trinité',
    facilityName: 'Hôpital Louis Domergue',
    pickupDateTime: getFutureIso(3, 11, 0),
    isRoundTrip: false,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    source: 'PATIENT',
    isDirectRequest: true,
    targetTransporterId: 'transporter-2',
    targetTransporterName: 'Caraïbes Transports Sanitaires',
    directRequestExpiresAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    isDirectRequestExpired: true,
    reassignedToPublicPool: true,
    patient: {
      firstName: 'Agnès',
      lastName: 'Saint-Aimé',
      birthDate: '1947-08-05',
      nir: '2 47 08 97 214 776 35',
      phone: '0696 45 67 89',
      email: 'agnes.st.aime@dom.mq',
      address: 'Quartier Morne Poirier',
      city: 'Rivière-Pilote',
      postalCode: '97211',
      isAld: true,
      aldReason: 'ALD 14 - Insuffisance respiratoire chronique grave',
      hasPmt: true,
      pmtUploaded: true,
      pmtFileName: 'PMT_Pneumo_Trinite_SaintAime.pdf',
      pmtPrescriberDoctor: 'Dr. Sylvie Brival'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: true,
      stairsWithoutElevator: true,
      floorNumber: 1,
      needsEscort: true,
      notes: 'Oxygénothérapie continue 2L/min - Bouteille O2 médicale requise. Brancardage complet avec portage au 1er étage.'
    }
  },
  {
    id: 'ride-plan-5',
    reference: 'MT-972-4721',
    createdAt: new Date().toISOString(),
    pickupAddress: 'CHU Pierre Zobda-Quitman, Route de Châteauboeuf',
    pickupCity: 'Fort-de-France',
    dropoffAddress: 'Quartier Morne Balai',
    dropoffCity: 'Sainte-Luce',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: getFutureIso(5, 8, 0),
    isRoundTrip: false,
    transportType: 'VSL',
    status: 'ACCEPTED',
    source: 'FACILITY',
    facilityDepartment: 'Cardiologie Interventionnelle',
    bedDischargeNumber: 'LIT-CAR-12',
    patient: {
      firstName: 'Lucien',
      lastName: 'Moutamalle',
      birthDate: '1963-12-28',
      nir: '1 63 12 97 217 662 68',
      phone: '0696 99 88 77',
      email: 'lucien.m@wanadoo.fr',
      address: 'Quartier Morne Balai',
      city: 'Sainte-Luce',
      postalCode: '97228',
      isAld: true,
      hasPmt: true,
      pmtUploaded: true,
      pmtFileName: 'PMT_Cardio_CHU_Moutamalle.pdf',
      pmtPrescriberDoctor: 'Dr. Joseph Rénier'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Sortie programmée de cardiologie - Patient marchant, accompagnement jusqu\'au domicile'
    },
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Loïc Marie-Rose',
      driverPhone: '0696 75 20 20',
      vehiclePlate: 'CD-972-MQ',
      etaMinutes: 20
    }
  },

  // =========================================================================
  // COURSES NATIONALES & DOM (GUADELOUPE 971, GUYANE 973, RÉUNION 974, MÉTROPOLE)
  // =========================================================================

  // --- GUADELOUPE (971) ---
  {
    id: 'ride-demo-gp-1',
    reference: 'MT-971-1042',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    pickupAddress: 'Résidence Caraïbes, Grand-Camp',
    pickupCity: 'Les Abymes',
    dropoffAddress: 'CHU de Guadeloupe (Site Ricou), Boulevard de l\'Hôpital',
    dropoffCity: 'Pointe-à-Pitre',
    facilityName: 'CHU de Guadeloupe - Pôle Ricou',
    pickupDateTime: new Date(Date.now() + 45 * 60000).toISOString(),
    returnDateTime: new Date(Date.now() + 210 * 60000).toISOString(),
    isRoundTrip: true,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '11:15',
    patient: {
      firstName: 'Thierry',
      lastName: 'Gerville-Réache',
      birthDate: '1959-05-18',
      nir: '1 59 05 97 101 442 81',
      phone: '0690 41 22 33',
      email: 't.gerville@orange.gp',
      address: 'Résidence Caraïbes, Grand-Camp',
      city: 'Les Abymes',
      postalCode: '97139',
      isAld: true,
      aldReason: 'ALD 19 - Néphropathie sévère (Hémodialyse)',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Éric Manicom - Néphrologue CHU Ricou',
      pmtUploaded: true,
      pmtFileName: 'PMT_Dialyse_Ricou_Gerville.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: false,
      stairsWithoutElevator: true,
      floorNumber: 2,
      needsEscort: false,
      notes: 'Séance d\'hémodialyse programmée. Brancardage avec portage 2ème étage sans ascenseur.'
    }
  },
  {
    id: 'ride-demo-gp-2',
    reference: 'MT-971-2089',
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    pickupAddress: 'Rue de la République',
    pickupCity: 'Basse-Terre',
    dropoffAddress: 'Centre Hospitalier Maurice Selbonne, Pigeon',
    dropoffCity: 'Bouillante',
    facilityName: 'CH Maurice Selbonne - Rééducation & SSR',
    pickupDateTime: new Date(Date.now() + 90 * 60000).toISOString(),
    isRoundTrip: false,
    transportType: 'VSL',
    status: 'ACCEPTED',
    source: 'PATIENT',
    appointmentTime: '14:00',
    transporterPickupTime: '13:00',
    estimatedArrivalTime: '13:45',
    patient: {
      firstName: 'Chantal',
      lastName: 'Cinna',
      birthDate: '1967-08-11',
      nir: '2 67 08 97 104 332 50',
      phone: '0690 55 66 77',
      email: 'chantal.cinna@gmail.com',
      address: 'Rue de la République',
      city: 'Basse-Terre',
      postalCode: '97100',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Valérie Lurel',
      pmtUploaded: true,
      pmtFileName: 'PMT_Reeducation_Selbonne.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Rééducation post-AVC - Patient marchant avec canne anglaise.'
    },
    assignedTransporter: {
      companyName: 'Ambulances Karukera Assistance',
      driverName: 'Mathieu Songeons',
      driverPhone: '0690 82 10 10',
      vehiclePlate: 'AB-971-GP',
      etaMinutes: 15
    }
  },

  // --- GUYANE (973) ---
  {
    id: 'ride-demo-gy-1',
    reference: 'MT-973-3014',
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    pickupAddress: 'Avenue de France',
    pickupCity: 'Kourou',
    dropoffAddress: 'Centre Hospitalier Andrée Rosemon, Rue des Flamboyants',
    dropoffCity: 'Cayenne',
    facilityName: 'Centre Hospitalier de Cayenne (CHAR)',
    pickupDateTime: new Date(Date.now() + 60 * 60000).toISOString(),
    isRoundTrip: true,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '10:30',
    patient: {
      firstName: 'Jean-Baptiste',
      lastName: 'Apatou',
      birthDate: '1955-10-02',
      nir: '1 55 10 97 302 119 24',
      phone: '0694 44 55 66',
      email: 'jb.apatou@guyane-sante.gf',
      address: 'Avenue de France',
      city: 'Kourou',
      postalCode: '97310',
      isAld: true,
      aldReason: 'ALD 14 - Insuffisance respiratoire sous O2',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Christian Taubira - CHAR Cayenne',
      pmtUploaded: true,
      pmtFileName: 'PMT_Ambulance_CHAR_Kourou.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: true,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: 'Oxygénothérapie continue 2.5L/min. Trajet RN1 Kourou-Cayenne sous surveillance ambulancière.'
    }
  },
  {
    id: 'ride-demo-gy-2',
    reference: 'MT-973-4022',
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
    pickupAddress: 'Concorde, Route Nationale 2',
    pickupCity: 'Matoury',
    dropoffAddress: 'Clinique Véronique, Route de Montabo',
    dropoffCity: 'Cayenne',
    facilityName: 'Clinique Véronique',
    pickupDateTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    isRoundTrip: false,
    transportType: 'TAXI_CONVENTIONNE',
    status: 'COMPLETED',
    source: 'PATIENT',
    appointmentTime: '08:00',
    transporterPickupTime: '07:20',
    estimatedArrivalTime: '07:45',
    patient: {
      firstName: 'Esther',
      lastName: 'Castor',
      birthDate: '1972-03-29',
      nir: '2 72 03 97 307 882 19',
      phone: '0694 22 33 44',
      email: 'esther.castor@gmail.com',
      address: 'Concorde, Route Nationale 2',
      city: 'Matoury',
      postalCode: '97351',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Denis Karam',
      pmtUploaded: true,
      pmtFileName: 'PMT_Ophtalmo_Matoury.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Chirurgie ambulatoire de la cataracte. Course terminée avec succès.'
    },
    assignedTransporter: {
      companyName: 'Ambulances Cayenne Secours',
      driverName: 'Henri Polony',
      driverPhone: '0694 30 15 15',
      vehiclePlate: 'EF-973-GF',
      etaMinutes: 10
    }
  },

  // --- LA RÉUNION (974) ---
  {
    id: 'ride-demo-re-1',
    reference: 'MT-974-5061',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    pickupAddress: 'Chaussée Royale',
    pickupCity: 'Saint-Paul',
    dropoffAddress: 'CHU Félix Guyon, Allée des Topazes',
    dropoffCity: 'Saint-Denis',
    facilityName: 'CHU de La Réunion - Hôpital Félix Guyon (Bellepierre)',
    pickupDateTime: new Date(Date.now() + 50 * 60000).toISOString(),
    isRoundTrip: true,
    transportType: 'VSL',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '11:00',
    patient: {
      firstName: 'Dany',
      lastName: 'Hoarau',
      birthDate: '1961-07-22',
      nir: '1 61 07 97 415 889 31',
      phone: '0692 78 99 00',
      email: 'dany.hoarau@orange.re',
      address: 'Chaussée Royale',
      city: 'Saint-Paul',
      postalCode: '97460',
      isAld: true,
      aldReason: 'ALD 30 - Suivi oncologique chimiothérapie',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Patrick Payet - Oncologue Félix Guyon',
      pmtUploaded: true,
      pmtFileName: 'PMT_Onco_FelixGuyon.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: 'Consultation hôpital de jour oncologie. Patient fatigué, assistance à la marche.'
    }
  },
  {
    id: 'ride-demo-re-2',
    reference: 'MT-974-6078',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    pickupAddress: 'Rue des Bons Enfants',
    pickupCity: 'Saint-Pierre',
    dropoffAddress: 'CHU Sud Réunion, Avenue François Mitterrand',
    dropoffCity: 'Saint-Pierre',
    facilityName: 'CHU Sud Réunion (Terre Sainte)',
    pickupDateTime: new Date(Date.now() + 30 * 60000).toISOString(),
    isRoundTrip: false,
    transportType: 'AMBULANCE',
    status: 'ACCEPTED',
    source: 'FACILITY',
    appointmentTime: '09:30',
    transporterPickupTime: '09:00',
    estimatedArrivalTime: '09:15',
    patient: {
      firstName: 'Marie-Claude',
      lastName: 'Fontaine',
      birthDate: '1948-12-04',
      nir: '2 48 12 97 416 023 77',
      phone: '0692 35 44 11',
      email: 'mc.fontaine@dom.re',
      address: 'Rue des Bons Enfants',
      city: 'Saint-Pierre',
      postalCode: '97410',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Nassimah Dindar - Cardiologue',
      pmtUploaded: true,
      pmtFileName: 'PMT_Cardio_SudReunion.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Transfert brancardage pour exploration coronarographique CHU Terre Sainte.'
    },
    assignedTransporter: {
      companyName: 'Ambulances Bourbon Assistance',
      driverName: 'Cédric Grondin',
      driverPhone: '0262 90 20 20',
      vehiclePlate: 'CD-974-RE',
      etaMinutes: 12
    }
  },

  // --- FRANCE MÉTROPOLITAINE (HEXAGONE) ---
  {
    id: 'ride-demo-fr-1',
    reference: 'MT-75-7092',
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    pickupAddress: '42 Rue Lecourbe',
    pickupCity: 'Paris',
    dropoffAddress: 'Hôpital Européen Georges-Pompidou, 20 Rue Leblanc',
    dropoffCity: 'Paris',
    facilityName: 'Hôpital Européen Georges-Pompidou (AP-HP)',
    pickupDateTime: new Date(Date.now() + 40 * 60000).toISOString(),
    returnDateTime: new Date(Date.now() + 200 * 60000).toISOString(),
    isRoundTrip: true,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    source: 'PATIENT',
    appointmentTime: '10:15',
    patient: {
      firstName: 'Alexandre',
      lastName: 'Dupont',
      birthDate: '1960-04-12',
      nir: '1 60 04 75 115 892 45',
      phone: '06 12 34 56 78',
      email: 'alexandre.dupont@paris.fr',
      address: '42 Rue Lecourbe',
      city: 'Paris',
      postalCode: '75015',
      isAld: true,
      aldReason: 'ALD 5 - Insuffisance cardiaque grave',
      hasPmt: true,
      pmtPrescriberDoctor: 'Professeur Philippe Menasché - HEGP',
      pmtUploaded: true,
      pmtFileName: 'PMT_Ambulance_HEGP_Dupont.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: 'Bilan rythmologie cardiaque à l\'HEGP. Brancardage avec surveillance paramédicale.'
    }
  },
  {
    id: 'ride-demo-fr-2',
    reference: 'MT-69-8015',
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    pickupAddress: '15 Cours Émile Zola',
    pickupCity: 'Villeurbanne',
    dropoffAddress: 'Hôpital Édouard Herriot, 5 Place d\'Arsonval',
    dropoffCity: 'Lyon',
    facilityName: 'Hôpital Édouard Herriot (Hospices Civils de Lyon)',
    pickupDateTime: new Date(Date.now() + 75 * 60000).toISOString(),
    isRoundTrip: false,
    transportType: 'VSL',
    status: 'ACCEPTED',
    source: 'PATIENT',
    appointmentTime: '14:30',
    transporterPickupTime: '13:50',
    estimatedArrivalTime: '14:15',
    patient: {
      firstName: 'Sophie',
      lastName: 'Lefebvre',
      birthDate: '1974-09-17',
      nir: '2 74 09 69 385 412 88',
      phone: '06 98 76 54 32',
      email: 'sophie.lefebvre@lyon.fr',
      address: '15 Cours Émile Zola',
      city: 'Villeurbanne',
      postalCode: '69100',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Laurent Guérin - HCL',
      pmtUploaded: true,
      pmtFileName: 'PMT_Consultation_HCL_Herriot.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Consultation médecine interne pavillon R. Patient autonome en position assise.'
    },
    assignedTransporter: {
      companyName: 'Lyon Médical Mobilité',
      driverName: 'Julien Blanc',
      driverPhone: '04 72 10 20 30',
      vehiclePlate: 'GH-690-LY',
      etaMinutes: 14
    }
  },
  {
    id: 'ride-demo-fr-3',
    reference: 'MT-13-9034',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    pickupAddress: 'Avenue Robert Schuman',
    pickupCity: 'Aix-en-Provence',
    dropoffAddress: 'Hôpital de la Timone, 264 Rue Saint-Pierre',
    dropoffCity: 'Marseille',
    facilityName: 'AP-HM Hôpital de la Timone (Marseille 5e)',
    pickupDateTime: new Date(Date.now() - 15 * 60000).toISOString(),
    isRoundTrip: false,
    transportType: 'TAXI_CONVENTIONNE',
    status: 'EN_ROUTE',
    source: 'PATIENT',
    appointmentTime: '09:00',
    transporterPickupTime: '08:05',
    estimatedArrivalTime: '08:50',
    patient: {
      firstName: 'Bernard',
      lastName: 'Giraud',
      birthDate: '1952-11-30',
      nir: '1 52 11 13 055 781 12',
      phone: '06 77 88 99 00',
      email: 'b.giraud@orange.fr',
      address: 'Avenue Robert Schuman',
      city: 'Aix-en-Provence',
      postalCode: '13100',
      isAld: true,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Marc Rossi - Neurochirurgie Timone',
      pmtUploaded: true,
      pmtFileName: 'PMT_Timone_Giraud.pdf'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Consultation neurochirurgie. Chauffeur en approche autoroute A51.'
    },
    assignedTransporter: {
      companyName: 'Transports Sanitaires Azur Marseille',
      driverName: 'Samir Benali',
      driverPhone: '04 91 22 33 44',
      vehiclePlate: 'JK-130-MA',
      etaMinutes: 8
    }
  }
];

export const rideService = {
  // Récupérer toutes les courses
  async getAllRides(): Promise<Ride[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const fetchedRides = data.map(this.mapSupabaseToRide);
          // Fusionner avec les courses de démonstration et les courses locales éventuelles
          const existingRefs = new Set(fetchedRides.map(r => r.reference.toUpperCase()));
          let localRides: Ride[] = [];
          try {
            const rawStored = localStorage.getItem(STORAGE_KEY_RIDES);
            if (rawStored) localRides = JSON.parse(rawStored);
          } catch {}
          const missingLocals = localRides.filter(l => !existingRefs.has(l.reference.toUpperCase()));
          const missingDemos = INITIAL_RIDES.filter(d => !existingRefs.has(d.reference.toUpperCase()) && !missingLocals.some(m => m.reference.toUpperCase() === d.reference.toUpperCase()));
          const merged = [...fetchedRides, ...missingLocals, ...missingDemos];
          const processed = this.processDirectRequestsLifecycle(merged);
          return processed;
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local store:', err);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY_RIDES);
    if (!stored) {
      const initial = this.processDirectRequestsLifecycle(INITIAL_RIDES);
      localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(initial));
      return initial;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingRefs = new Set(parsed.map((r: Ride) => r.reference.toUpperCase()));
        const missing = INITIAL_RIDES.filter(d => !existingRefs.has(d.reference.toUpperCase()));
        const merged = missing.length > 0 ? [...parsed, ...missing] : parsed;
        const processed = this.processDirectRequestsLifecycle(merged);
        localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(processed));
        return processed;
      }
      const initial = this.processDirectRequestsLifecycle(INITIAL_RIDES);
      localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(initial));
      return initial;
    } catch {
      return INITIAL_RIDES;
    }
  },

  // Cycle de vie des demandes directes : expiration automatique après 24h00 et rebasculement au pot commun
  processDirectRequestsLifecycle(rides: Ride[]): Ride[] {
    const now = Date.now();
    let hasChanges = false;
    const updated = rides.map((r) => {
      if (r.status === 'PENDING' && r.isDirectRequest && !r.isDirectRequestExpired && r.directRequestExpiresAt) {
        const expiresAt = new Date(r.directRequestExpiresAt).getTime();
        if (now > expiresAt) {
          hasChanges = true;
          return {
            ...r,
            isDirectRequestExpired: true,
            reassignedToPublicPool: true
          };
        }
      }
      return r;
    });

    if (hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(updated));
      } catch (e) {}
    }
    return updated;
  },

  // Libération manuelle d'une demande directe vers le pot commun par le transporteur sollicité
  async releaseDirectRequestToPublicPool(reference: string, reason?: string): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const index = rides.findIndex(r => r.reference.toUpperCase() === reference.trim().toUpperCase());
    if (index === -1) return null;

    rides[index].isDirectRequestExpired = true;
    rides[index].reassignedToPublicPool = true;
    if (reason) {
      rides[index].mobility.notes = rides[index].mobility.notes 
        ? `${rides[index].mobility.notes} | Renvoyée au pot commun : ${reason}`
        : `Renvoyée au pot commun : ${reason}`;
    }
    localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(rides));
    return rides[index];
  },

  // Récupérer une course par sa référence (ex: MT-972-8821)
  async getRideByReference(reference: string): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const cleanRef = reference.trim().toUpperCase();
    return rides.find(r => r.reference.toUpperCase() === cleanRef) || null;
  },

  // Créer une nouvelle course
  async createRide(rideData: Omit<Ride, 'id' | 'reference' | 'createdAt' | 'status'>): Promise<Ride> {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `MT-972-${randomSuffix}`;

    const isDirect = !!rideData.isDirectRequest && !!rideData.targetTransporterName;
    const directRequestExpiresAt = isDirect
      ? (rideData.directRequestExpiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
      : undefined;

    const newRide: Ride = {
      ...rideData,
      id: `ride-${Date.now()}`,
      reference,
      createdAt: new Date().toISOString(),
      status: 'PENDING',
      isDirectRequest: isDirect,
      targetTransporterId: isDirect ? rideData.targetTransporterId : undefined,
      targetTransporterName: isDirect ? rideData.targetTransporterName : undefined,
      directRequestExpiresAt,
      isDirectRequestExpired: false,
      reassignedToPublicPool: false
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('rides').insert({
          reference,
          pickup_address: newRide.pickupAddress,
          pickup_city: newRide.pickupCity,
          dropoff_address: newRide.dropoffAddress,
          dropoff_city: newRide.dropoffCity,
          facility_name: newRide.facilityName,
          pickup_datetime: newRide.pickupDateTime,
          return_datetime: newRide.returnDateTime,
          is_round_trip: newRide.isRoundTrip,
          transport_type: newRide.transportType,
          status: newRide.status,
          patient_first_name: newRide.patient.firstName,
          patient_last_name: newRide.patient.lastName,
          patient_birth_date: newRide.patient.birthDate,
          patient_nir: newRide.patient.nir,
          patient_phone: newRide.patient.phone,
          patient_email: newRide.patient.email,
          patient_is_ald: newRide.patient.isAld,
          patient_has_pmt: newRide.patient.hasPmt,
          pmt_prescriber_doctor: newRide.patient.pmtPrescriberDoctor,
          mobility_wheelchair: newRide.mobility.wheelchair,
          mobility_stretcher: newRide.mobility.stretcher,
          mobility_oxygen: newRide.mobility.oxygen,
          mobility_stairs: newRide.mobility.stairsWithoutElevator,
          mobility_stairs_count: newRide.mobility.floorNumber,
          mobility_needs_escort: newRide.mobility.needsEscort,
          mobility_notes: newRide.mobility.notes,
          source: newRide.source,
          facility_department: newRide.facilityDepartment,
          bed_discharge_number: newRide.bedDischargeNumber
        });
      } catch (e) {
        console.warn('Supabase insert failed, saved to local store:', e);
      }
    }

    const current = await this.getAllRides();
    const updated = [newRide, ...current];
    localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(updated));

    // Synchronisation immédiate avec l'annuaire des fiches clients de l'administration
    try {
      if (newRide.patient && (newRide.patient.firstName || newRide.patient.lastName || newRide.patient.email || newRide.patient.phone)) {
        const rawC = localStorage.getItem('medictrans_admin_clients_972');
        let cList: any[] = rawC ? JSON.parse(rawC) : [];
        const p = newRide.patient;
        const pEmail = (p.email || '').trim().toLowerCase();
        const pNir = (p.nir || '').replace(/\s/g, '');
        const pFirst = (p.firstName || '').trim().toLowerCase();
        const pLast = (p.lastName || '').trim().toLowerCase();

        // Ne pas enregistrer de fiche pour le dummy "Aimé GLISSANT"
        if (!(pFirst === 'aimé' && pLast === 'glissant')) {
          let postal = p.postalCode;
          if (!postal) {
            const m = ((newRide.pickupAddress || '') + ' ' + (p.address || '')).match(/\b(97[1-8]|2[ABab]|0[1-9]|[1-8]\d|9[0-5])\d{3}\b/);
            postal = m ? m[0] : (p.phone?.startsWith('0696') || p.phone?.startsWith('0596') ? '97200' : '75000');
          }
          const city = p.city || newRide.pickupCity || (postal.startsWith('972') ? 'Fort-de-France' : 'Paris');

          const existIdx = cList.findIndex((c: any) => {
            if (pEmail && c.email && c.email.toLowerCase() === pEmail) return true;
            if (pNir && c.nir && c.nir.replace(/\s/g, '') === pNir && !pNir.includes('000000')) return true;
            if (pFirst && pLast && c.firstName?.toLowerCase() === pFirst && c.lastName?.toLowerCase() === pLast) return true;
            return false;
          });

          const clientRec = {
            id: existIdx >= 0 ? cList[existIdx].id : `client-ride-${newRide.id || Date.now()}`,
            firstName: p.firstName || 'Client',
            lastName: p.lastName || '',
            birthDate: p.birthDate || '1975-01-01',
            nir: p.nir || '1 75 00 00 000 000 00',
            phone: p.phone || '06 00 00 00 00',
            email: p.email || `${pFirst || 'client'}.${pLast || 'nouveau'}@clinigo.fr`,
            address: p.address || newRide.pickupAddress || 'Adresse déclarée',
            city,
            postalCode: postal,
            isAld: p.isAld ?? true,
            aldReason: p.aldReason || (p.isAld ? 'Prise en charge ALD 100%' : undefined),
            hasPmt: p.hasPmt ?? true,
            pmtPrescriberDoctor: p.pmtPrescriberDoctor || 'Médecin prescripteur',
            pmtFileUrl: p.pmtFileUrl,
            pmtFileName: p.pmtFileName,
            mobility: newRide.mobility || {
              wheelchair: false,
              stretcher: false,
              oxygen: false,
              stairsWithoutElevator: false,
              needsEscort: false,
            },
            status: 'ACTIVE',
            createdAt: newRide.createdAt || new Date().toISOString(),
            notes: `Patient issu de la réservation ${newRide.reference} (${newRide.transportType || 'VSL'})`
          };

          if (existIdx >= 0) {
            cList[existIdx] = { ...cList[existIdx], ...clientRec };
          } else {
            cList.unshift(clientRec);
          }
          localStorage.setItem('medictrans_admin_clients_972', JSON.stringify(cList));

          fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientRec)
          }).catch(() => {});

          try {
            window.dispatchEvent(new CustomEvent('clinigo_clients_updated'));
          } catch {}
        }
      }
    } catch (errSync) {
      console.warn('Sync client dans createRide non-bloquante:', errSync);
    }

    return newRide;
  },

  // Mettre à jour le statut d'une course
  async updateRideStatus(
    reference: string, 
    status: RideStatus, 
    assigned?: Ride['assignedTransporter'],
    timingUpdates?: { transporterPickupTime?: string; estimatedArrivalTime?: string }
  ): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const index = rides.findIndex(r => r.reference.toUpperCase() === reference.trim().toUpperCase());
    if (index === -1) return null;

    rides[index].status = status;
    if (assigned) {
      rides[index].assignedTransporter = assigned;
    } else if (status === 'PENDING') {
      delete rides[index].assignedTransporter;
    }

    if (timingUpdates?.transporterPickupTime) {
      rides[index].transporterPickupTime = timingUpdates.transporterPickupTime;
    }
    if (timingUpdates?.estimatedArrivalTime) {
      rides[index].estimatedArrivalTime = timingUpdates.estimatedArrivalTime;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('rides')
          .update({
            status,
            ...(assigned ? {
              transporter_name: assigned.companyName || 'Ambulances Madinina Secours',
              driver_name: assigned.driverName,
              driver_phone: assigned.driverPhone,
              vehicle_plate: assigned.vehiclePlate,
              eta_minutes: assigned.etaMinutes
            } : status === 'PENDING' ? {
              transporter_name: null,
              driver_name: null,
              driver_phone: null,
              vehicle_plate: null,
              eta_minutes: null
            } : {})
          })
          .eq('reference', reference);
      } catch (e) {
        console.warn('Supabase update failed:', e);
      }
    }

    localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(rides));

    // Si la course est acceptée par un transporteur, avertir immédiatement le client/patient par email
    if (status === 'ACCEPTED' && assigned) {
      const targetRide = rides[index];
      const patientEmail = targetRide.patient?.email;
      const patientName = `${targetRide.patient?.firstName || ''} ${targetRide.patient?.lastName || ''}`.trim() || 'Patient';
      const pickupDate = targetRide.pickupDateTime ? new Date(targetRide.pickupDateTime).toLocaleDateString('fr-FR') : 'Aujourd’hui';
      const pickupTime = timingUpdates?.transporterPickupTime || targetRide.transporterPickupTime || targetRide.appointmentTime || '08:30';

      if (patientEmail && patientEmail.includes('@')) {
        EmailService.sendRideAcceptedEmail({
          email: patientEmail,
          patientName,
          reference: targetRide.reference,
          transporterName: assigned.companyName || 'Ambulances Agréées Clinigo',
          driverName: assigned.driverName,
          driverPhone: assigned.driverPhone,
          vehiclePlate: assigned.vehiclePlate,
          pickupAddress: targetRide.pickupAddress,
          dropoffAddress: targetRide.facilityName || targetRide.dropoffAddress,
          pickupDate,
          pickupTime,
        }).catch(err => console.warn('[rideService] Notification email acceptation échouée:', err));
      }

      try {
        window.dispatchEvent(new CustomEvent('clinigo_ride_status_updated', {
          detail: { reference: targetRide.reference, status: 'ACCEPTED', ride: targetRide }
        }));
      } catch {
        // ignore in SSR / environments without window
      }
    }

    return rides[index];
  },

  // Décliner une course (masquée pour le transporteur actif)
  async declineRide(reference: string, transporterName?: string, reason?: string): Promise<boolean> {
    const STORAGE_KEY_DECLINED = 'medictrans_declined_missions_972';
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DECLINED);
      const declined: string[] = stored ? JSON.parse(stored) : [];
      const cleanRef = reference.trim().toUpperCase();
      if (!declined.includes(cleanRef)) {
        declined.push(cleanRef);
        localStorage.setItem(STORAGE_KEY_DECLINED, JSON.stringify(declined));
      }
    } catch (e) {
      console.warn('Erreur stockage refus:', e);
    }
    return true;
  },

  // Récupérer la liste des références de courses déclinées
  getDeclinedRideRefs(): string[] {
    try {
      const stored = localStorage.getItem('medictrans_declined_missions_972');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  // Réinitialiser les refus (démo & tests)
  resetDeclinedRides(): void {
    try {
      localStorage.removeItem('medictrans_declined_missions_972');
    } catch (e) {
      console.warn('Erreur reset refus:', e);
    }
  },

  // Réassigner une course (changer chauffeur / véhicule après validation)
  async reassignRide(
    reference: string, 
    assignment: AssignedTransporter, 
    newStatus?: RideStatus
  ): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const index = rides.findIndex(r => r.reference.toUpperCase() === reference.trim().toUpperCase());
    if (index === -1) return null;

    const targetStatus = newStatus || rides[index].status || 'ACCEPTED';
    return this.updateRideStatus(reference, targetStatus, assignment);
  },

  // Annuler et republier la course côté transporteur (remise en bourse disponible)
  async releaseAndRepublishRide(
    reference: string, 
    transporterName: string, 
    reason?: string
  ): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const index = rides.findIndex(r => r.reference.toUpperCase() === reference.trim().toUpperCase());
    if (index === -1) return null;

    const ride = rides[index];
    ride.status = 'PENDING';
    delete ride.assignedTransporter;

    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const releaseLog = `[Republiée le ${timeStr} suite au désistement de ${transporterName || 'un transporteur'}${reason ? ` - Motif: ${reason}` : ''}]`;
    ride.mobility.notes = ride.mobility.notes ? `${ride.mobility.notes} | ${releaseLog}` : releaseLog;

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('rides')
          .update({
            status: 'PENDING',
            transporter_name: null,
            driver_name: null,
            driver_phone: null,
            vehicle_plate: null,
            eta_minutes: null,
            mobility_notes: ride.mobility.notes
          })
          .eq('reference', reference);
      } catch (e) {
        console.warn('Supabase release update failed:', e);
      }
    }

    localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(rides));
    return ride;
  },

  // Annuler définitivement une course (côté demandeur, hôpital ou régulation)
  async cancelRide(reference: string, reason?: string): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const index = rides.findIndex(r => r.reference.toUpperCase() === reference.trim().toUpperCase());
    if (index === -1) return null;

    rides[index].status = 'CANCELLED';
    if (reason) {
      const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      rides[index].mobility.notes = `${rides[index].mobility.notes || ''} [Annulé le ${timeStr}: ${reason}]`;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('rides')
          .update({
            status: 'CANCELLED',
            mobility_notes: rides[index].mobility.notes
          })
          .eq('reference', reference);
      } catch (e) {
        console.warn('Supabase cancel update failed:', e);
      }
    }

    localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(rides));
    return rides[index];
  },

  // ==========================================
  // GESTION TRANSPORTEURS (Back-Office)
  // ==========================================
  async getAllTransporters(): Promise<Transporter[]> {
    const stored = localStorage.getItem(STORAGE_KEY_TRANSPORTERS);
    const initialHydrated = INITIAL_TRANSPORTERS.map(ensureTransporterFleetAndDrivers);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_TRANSPORTERS, JSON.stringify(initialHydrated));
      return initialHydrated;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((t: Transporter) => t.id));
        const missing = INITIAL_TRANSPORTERS.filter(t => !existingIds.has(t.id));
        const combined = missing.length > 0 ? [...parsed, ...missing] : parsed;
        const fullyHydrated = combined.map(ensureTransporterFleetAndDrivers);
        return fullyHydrated;
      }
      localStorage.setItem(STORAGE_KEY_TRANSPORTERS, JSON.stringify(initialHydrated));
      return initialHydrated;
    } catch {
      return initialHydrated;
    }
  },

  async getTransporterById(id: string): Promise<Transporter | null> {
    const list = await this.getAllTransporters();
    return list.find(t => t.id === id) || null;
  },

  async updateTransporter(id: string, updates: Partial<Transporter>): Promise<Transporter | null> {
    const list = await this.getAllTransporters();
    const index = list.findIndex(t => t.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates };
    localStorage.setItem(STORAGE_KEY_TRANSPORTERS, JSON.stringify(list));
    return list[index];
  },

  async updateTransporterVerification(id: string, verified: boolean): Promise<Transporter | null> {
    return this.updateTransporter(id, { 
      verified, 
      status: verified ? 'ACTIVE' : 'SUSPENDED' 
    });
  },

  // ==========================================
  // GESTION ÉTABLISSEMENTS (Back-Office)
  // ==========================================
  async getAllFacilities(): Promise<Facility[]> {
    const stored = localStorage.getItem(STORAGE_KEY_FACILITIES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(INITIAL_FACILITIES));
      return INITIAL_FACILITIES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_FACILITIES;
    }
  },

  async getFacilityById(id: string): Promise<Facility | null> {
    const list = await this.getAllFacilities();
    return list.find(f => f.id === id) || null;
  },

  async updateFacility(id: string, updates: Partial<Facility>): Promise<Facility | null> {
    const list = await this.getAllFacilities();
    const index = list.findIndex(f => f.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates };
    localStorage.setItem(STORAGE_KEY_FACILITIES, JSON.stringify(list));
    return list[index];
  },

  // ==========================================
  // STATISTIQUES TOUR DE CONTRÔLE (Régulation)
  // ==========================================
  async getDashboardStats() {
    const rides = await this.getAllRides();
    const transporters = await this.getAllTransporters();

    const pending = rides.filter(r => r.status === 'PENDING');
    const enRoute = rides.filter(r => r.status === 'EN_ROUTE' || r.status === 'ACCEPTED' || r.status === 'PICKED_UP');
    const completed = rides.filter(r => r.status === 'COMPLETED');
    const urgentAlerts = rides.filter(r => r.status === 'PENDING' && (r.mobility.stretcher || r.mobility.oxygen || r.transportType === 'AMBULANCE'));

    const totalAmbulances = transporters.reduce((acc, t) => acc + (t.fleetAmbulances || 0), 0);
    const totalVsl = transporters.reduce((acc, t) => acc + (t.fleetVsl || 0), 0);
    const totalTaxis = transporters.reduce((acc, t) => acc + (t.fleetTaxis || 0), 0);

    return {
      totalActiveRides: pending.length + enRoute.length,
      pendingCount: pending.length,
      enRouteCount: enRoute.length,
      completedTodayCount: completed.length,
      urgentAlertsCount: urgentAlerts.length,
      avgAttributionMinutes: 4.25,
      totalFleetsCount: totalAmbulances + totalVsl + totalTaxis,
      fleetBreakdown: {
        ambulances: totalAmbulances,
        vsl: totalVsl,
        taxis: totalTaxis
      },
      transportersCount: transporters.length,
      verifiedTransportersCount: transporters.filter(t => t.verified).length
    };
  },

  // Mapper Supabase DB Record vers Ride
  mapSupabaseToRide(row: any): Ride {
    return {
      id: row.id,
      reference: row.reference,
      createdAt: row.created_at,
      pickupAddress: row.pickup_address,
      pickupCity: row.pickup_city,
      dropoffAddress: row.dropoff_address,
      dropoffCity: row.dropoff_city,
      facilityName: row.facility_name,
      pickupDateTime: row.pickup_datetime,
      returnDateTime: row.return_datetime,
      isRoundTrip: row.is_round_trip,
      transportType: row.transport_type,
      status: row.status,
      patient: {
        firstName: row.patient_first_name,
        lastName: row.patient_last_name,
        birthDate: row.patient_birth_date,
        nir: row.patient_nir,
        phone: row.patient_phone,
        email: row.patient_email,
        address: row.pickup_address,
        city: row.pickup_city,
        postalCode: '97200',
        isAld: row.patient_is_ald,
        hasPmt: row.patient_has_pmt,
        pmtPrescriberDoctor: row.pmt_prescriber_doctor,
        pmtUploaded: row.patient_has_pmt || !!row.pmt_file_url,
        pmtFileName: row.pmt_file_name || (row.patient_has_pmt ? 'Prescription_Medicale_S3138.pdf' : undefined),
        pmtFileUrl: row.pmt_file_url || (row.patient_has_pmt ? '/assets/medictrans_hero_discover.jpg' : undefined)
      },
      mobility: {
        wheelchair: row.mobility_wheelchair,
        stretcher: row.mobility_stretcher,
        oxygen: row.mobility_oxygen,
        stairsWithoutElevator: row.mobility_stairs,
        floorNumber: row.mobility_stairs_count,
        needsEscort: row.mobility_needs_escort,
        notes: row.mobility_notes
      },
      assignedTransporter: (row.driver_name || row.transporter_name) ? {
        companyName: row.transporter_name || 'Ambulances Madinina Secours',
        driverName: row.driver_name || 'Équipage 972',
        driverPhone: row.driver_phone || '0596 75 20 20',
        vehiclePlate: row.vehicle_plate || 'GH-972-MQ',
        etaMinutes: row.eta_minutes || 15
      } : undefined,
      appointmentTime: row.appointment_time || undefined,
      transporterPickupTime: row.transporter_pickup_time || undefined,
      estimatedArrivalTime: row.estimated_arrival_time || undefined,
      isRecurring: row.is_recurring || false,
      recurringDates: row.recurring_dates || undefined,
      source: row.source || 'PATIENT',
      facilityDepartment: row.facility_department,
      bedDischargeNumber: row.bed_discharge_number
    };
  }
};
