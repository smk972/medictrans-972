import { Ride, RideStatus, TransportType, Transporter, Facility } from '../types';
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
    pickupDateTime: new Date(Date.now() + 1800000).toISOString(), // dans 30 min
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
          reference: newRide.reference,
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

  // Mettre à jour le statut d'une course (ex: Transporteur accepte)
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
