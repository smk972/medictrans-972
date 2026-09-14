import { Ride, RideStatus, TransportType, Transporter, Facility, AssignedTransporter } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  }
];

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
      nir: '1 54 11 97 208 771 19',
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
    patient: {
      firstName: 'Christian',
      lastName: 'Marie-Luce',
      birthDate: '1954-11-03',
      nir: '1 54 11 97 208 771 19',
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
      nir: '2 68 09 97 205 119 55',
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
    bedDischargeNumber: 'BOX-D04',
    patient: {
      firstName: 'Éliane',
      lastName: 'Moutoussamy',
      birthDate: '1961-04-18',
      nir: '2 61 04 97 215 098 44',
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
    patient: {
      firstName: 'Marcel',
      lastName: 'Ventura',
      birthDate: '1958-06-14',
      nir: '1 58 06 97 210 443 21',
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
    facilityDepartment: 'Chirurgie Orthopédique',
    bedDischargeNumber: 'CH-214',
    patient: {
      firstName: 'Josiane',
      lastName: 'Rose-Helène',
      birthDate: '1965-11-20',
      nir: '2 65 11 97 218 554 67',
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
    patient: {
      firstName: 'Gérard',
      lastName: 'Théodore',
      birthDate: '1952-02-17',
      nir: '1 52 02 97 205 889 12',
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
    patient: {
      firstName: 'Agnès',
      lastName: 'Saint-Aimé',
      birthDate: '1947-08-05',
      nir: '2 47 08 97 214 776 33',
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
      nir: '1 63 12 97 217 662 90',
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
          // Fusionner avec les courses de démonstration du planning qui ne seraient pas encore dans Supabase
          const existingRefs = new Set(fetchedRides.map(r => r.reference.toUpperCase()));
          const missingDemos = INITIAL_RIDES.filter(d => !existingRefs.has(d.reference.toUpperCase()));
          return [...fetchedRides, ...missingDemos];
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local store:', err);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY_RIDES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(INITIAL_RIDES));
      return INITIAL_RIDES;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingRefs = new Set(parsed.map((r: Ride) => r.reference.toUpperCase()));
        const missing = INITIAL_RIDES.filter(d => !existingRefs.has(d.reference.toUpperCase()));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
      localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(INITIAL_RIDES));
      return INITIAL_RIDES;
    } catch {
      return INITIAL_RIDES;
    }
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
    const newRide: Ride = {
      ...rideData,
      id: `ride-${Date.now()}`,
      reference,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
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
    return newRide;
  },

  // Mettre à jour le statut d'une course
  async updateRideStatus(
    reference: string, 
    status: RideStatus, 
    assigned?: Ride['assignedTransporter']
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
    if (!stored) {
      localStorage.setItem(STORAGE_KEY_TRANSPORTERS, JSON.stringify(INITIAL_TRANSPORTERS));
      return INITIAL_TRANSPORTERS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_TRANSPORTERS;
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
        pmtFileUrl: row.pmt_file_url || (row.patient_has_pmt ? 'https://medictrans-972.pages.dev/assets/medictrans_hero_discover.jpg' : undefined)
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
      source: row.source || 'PATIENT',
      facilityDepartment: row.facility_department,
      bedDischargeNumber: row.bed_discharge_number
    };
  }
};
