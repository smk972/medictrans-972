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

const INITIAL_RIDES: Ride[] = [
  {
    id: 'ride-1',
    reference: 'MT-972-8821',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    pickupAddress: '14 Allée des Cocotiers, Résidence Les Almadies, Bât B',
    pickupCity: 'Schœlcher',
    dropoffAddress: 'Avenue Salvador Allende',
    dropoffCity: 'Fort-de-France',
    facilityName: 'Centre d\'Hémodialyse de Dillon',
    pickupDateTime: new Date(Date.now() + 1800000).toISOString(),
    isRoundTrip: true,
    returnDateTime: new Date(Date.now() + 16200000).toISOString(),
    transportType: 'VSL',
    status: 'EN_ROUTE',
    patient: {
      firstName: 'Édouard',
      lastName: 'Châtenay',
      birthDate: '1958-04-12',
      nir: '1 58 04 97 214 058 12',
      phone: '0696 45 12 78',
      email: 'edouard.chatenay@orange.fr',
      address: '14 Allée des Cocotiers, Résidence Les Almadies',
      city: 'Schœlcher',
      postalCode: '97233',
      isAld: true,
      aldReason: 'ALD 19 - Néphropathie chronique grave',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Alix Célestine',
      pmtDate: '2026-09-01'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: true,
      floorNumber: 2,
      needsEscort: false,
      notes: 'Difficulté à la marche, besoin d\'un bras d\'appui pour la descente d\'escalier.'
    },
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Jean-Luc Bernabé',
      driverPhone: '0696 88 44 22',
      vehiclePlate: 'GH-972-LM',
      etaMinutes: 12,
      vehicleModel: 'Peugeot Partner Tepee Sanitaire'
    },
    source: 'PATIENT'
  },
  {
    id: 'ride-2',
    reference: 'MT-972-4912',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    pickupAddress: 'Service Néphrologie & Dialyse, 3ème étage, Chambre 314',
    pickupCity: 'Fort-de-France',
    dropoffAddress: 'Quartier Morne-Acajou',
    dropoffCity: 'Le François',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() + 5400000).toISOString(),
    isRoundTrip: false,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    patient: {
      firstName: 'Christiane',
      lastName: 'Telga',
      birthDate: '1947-11-23',
      nir: '2 47 11 97 228 012 45',
      phone: '0696 33 90 14',
      email: 'famille.telga@gmail.com',
      address: 'Quartier Morne-Acajou',
      city: 'Le François',
      postalCode: '97240',
      isAld: true,
      aldReason: 'ALD 30 - Sortie Hospitalisation lourde',
      hasPmt: true,
      pmtPrescriberDoctor: 'Pr. Raymond Sainte-Rose',
      pmtDate: '2026-09-12'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: true,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: 'Position allongée stricte requise, perfusion en cours de surveillance.'
    },
    source: 'FACILITY',
    facilityDepartment: 'Néphrologie & Dialyse',
    bedDischargeNumber: 'SL-2026-972-04'
  },
  {
    id: 'ride-3',
    reference: 'MT-972-3309',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    pickupAddress: '8 Rue Victor Hugo',
    pickupCity: 'Saint-Pierre',
    dropoffAddress: 'Route de Châteauboeuf',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() + 10800000).toISOString(),
    isRoundTrip: true,
    transportType: 'TAXI_CONVENTIONNE',
    status: 'ACCEPTED',
    patient: {
      firstName: 'Maxime',
      lastName: 'Gaudin',
      birthDate: '1972-08-04',
      nir: '1 72 08 97 202 044 19',
      phone: '0696 71 82 93',
      email: 'm.gaudin972@yahoo.fr',
      address: '8 Rue Victor Hugo',
      city: 'Saint-Pierre',
      postalCode: '97250',
      isAld: true,
      aldReason: 'ALD 30 - Consultation Oncologie',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Valérie Monplaisir',
      pmtDate: '2026-09-10'
    },
    mobility: {
      wheelchair: false,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Patient autonome, consultation de contrôle post-traitement.'
    },
    assignedTransporter: {
      companyName: 'Caraïbes Transports Sanitaires',
      driverName: 'Marcelle Dantin',
      driverPhone: '0696 55 77 99',
      vehiclePlate: 'AB-972-CD',
      etaMinutes: 45,
      vehicleModel: 'Toyota Prius Hybride Conventionnée'
    },
    source: 'PATIENT'
  },
  {
    id: 'ride-4',
    reference: 'MT-972-8904',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    pickupAddress: 'Service Cardiologie Interventionnelle, 2ème étage',
    pickupCity: 'Fort-de-France',
    dropoffAddress: 'Quartier Balata, Route de la Trace',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() + 1200000).toISOString(),
    isRoundTrip: false,
    transportType: 'AMBULANCE',
    status: 'PENDING',
    patient: {
      firstName: 'Gaston',
      lastName: 'Mavounzy',
      birthDate: '1952-09-14',
      nir: '1 52 09 97 201 033 18',
      phone: '0696 92 14 55',
      email: 'famille.mavounzy@wanadoo.fr',
      address: 'Route de la Trace',
      city: 'Fort-de-France',
      postalCode: '97200',
      isAld: true,
      aldReason: 'ALD 13 - Insuffisance cardiaque grave',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Thierry Négrier',
      pmtDate: '2026-09-12'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: true,
      stairsWithoutElevator: true,
      floorNumber: 1,
      needsEscort: true,
      notes: 'ALERTE PRIORITAIRE: Transfert post-coronarographie sous oxygène 3L/min.'
    },
    source: 'FACILITY',
    facilityDepartment: 'Cardiologie & USIC',
    bedDischargeNumber: 'CARD-2026-89'
  },
  {
    id: 'ride-5',
    reference: 'MT-972-8712',
    createdAt: new Date(Date.now() - 21600000).toISOString(),
    pickupAddress: '18 Rue Jean Jaurès',
    pickupCity: 'Le Lamentin',
    dropoffAddress: 'Chemin des Rochers',
    dropoffCity: 'Schœlcher',
    facilityName: 'Clinique Sainte-Marie',
    pickupDateTime: new Date(Date.now() - 1800000).toISOString(),
    isRoundTrip: true,
    returnDateTime: new Date(Date.now() + 7200000).toISOString(),
    transportType: 'VSL',
    status: 'PICKED_UP',
    patient: {
      firstName: 'Rosalie',
      lastName: 'Lémery',
      birthDate: '1965-02-18',
      nir: '2 65 02 97 210 074 29',
      phone: '0696 14 28 99',
      email: 'r.lemery@gmail.com',
      address: '18 Rue Jean Jaurès',
      city: 'Le Lamentin',
      postalCode: '97232',
      isAld: false,
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Claudie Bellemare',
      pmtDate: '2026-09-08'
    },
    mobility: {
      wheelchair: true,
      stretcher: false,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: false,
      notes: 'Fauteuil roulant pliant dans le coffre, assistance installation à bord.'
    },
    assignedTransporter: {
      companyName: 'Ambulances Madinina Secours',
      driverName: 'Sébastien Almont',
      driverPhone: '0696 33 11 00',
      vehiclePlate: 'EF-972-GH',
      etaMinutes: 5,
      vehicleModel: 'Citroën Berlingo TPMR'
    },
    source: 'PATIENT'
  },
  {
    id: 'ride-6',
    reference: 'MT-972-8930',
    createdAt: new Date(Date.now() - 28800000).toISOString(),
    pickupAddress: 'Quartier Tartane',
    pickupCity: 'La Trinité',
    dropoffAddress: 'Route de Châteauboeuf',
    dropoffCity: 'Fort-de-France',
    facilityName: 'CHU de Martinique - Hôpital Pierre Zobda-Quitman',
    pickupDateTime: new Date(Date.now() - 7200000).toISOString(),
    isRoundTrip: false,
    transportType: 'AMBULANCE',
    status: 'COMPLETED',
    patient: {
      firstName: 'Henri',
      lastName: 'Duchamp',
      birthDate: '1940-06-30',
      nir: '1 40 06 97 215 012 33',
      phone: '0696 87 23 11',
      email: 'famille.duchamp@orange.fr',
      address: 'Quartier Tartane',
      city: 'La Trinité',
      postalCode: '97220',
      isAld: true,
      aldReason: 'ALD 30 - Fractures multiples',
      hasPmt: true,
      pmtPrescriberDoctor: 'Dr. Patrice Rémilien',
      pmtDate: '2026-09-05'
    },
    mobility: {
      wheelchair: false,
      stretcher: true,
      oxygen: false,
      stairsWithoutElevator: false,
      needsEscort: true,
      notes: 'Course effectuée ce matin, patient transféré en chambre.'
    },
    assignedTransporter: {
      companyName: 'Ambulances Trinité Express',
      driverName: 'David Marceau',
      driverPhone: '0696 22 88 44',
      vehiclePlate: 'CD-972-EF',
      etaMinutes: 0,
      vehicleModel: 'Renault Master Sanitaire Type B'
    },
    source: 'FACILITY',
    facilityDepartment: 'Traumatologie & Orthopédie',
    bedDischargeNumber: 'TRIN-2026-12'
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
          return data.map(this.mapSupabaseToRide);
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
      return JSON.parse(stored);
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
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('rides')
          .update({
            status,
            ...(assigned ? {
              driver_name: assigned.driverName,
              driver_phone: assigned.driverPhone,
              vehicle_plate: assigned.vehiclePlate,
              eta_minutes: assigned.etaMinutes
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

  // Réassigner une course (Back-Office / Régulation)
  async reassignRide(
    reference: string, 
    assignment: AssignedTransporter, 
    newStatus: RideStatus = 'ACCEPTED'
  ): Promise<Ride | null> {
    return this.updateRideStatus(reference, newStatus, assignment);
  },

  // Annuler une course
  async cancelRide(reference: string, reason?: string): Promise<Ride | null> {
    const rides = await this.getAllRides();
    const index = rides.findIndex(r => r.reference.toUpperCase() === reference.trim().toUpperCase());
    if (index === -1) return null;

    rides[index].status = 'CANCELLED';
    if (reason) {
      rides[index].mobility.notes = `${rides[index].mobility.notes || ''} [Annulé: ${reason}]`;
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
        pmtPrescriberDoctor: row.pmt_prescriber_doctor
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
      assignedTransporter: row.driver_name ? {
        companyName: 'Transporteur Conventionné',
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        vehiclePlate: row.vehicle_plate,
        etaMinutes: row.eta_minutes || 15
      } : undefined,
      source: row.source || 'PATIENT',
      facilityDepartment: row.facility_department,
      bedDischargeNumber: row.bed_discharge_number
    };
  }
};
