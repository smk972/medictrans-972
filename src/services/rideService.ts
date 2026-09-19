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

/**
 * Zéro donnée mockée en production.
 * Les transporteurs et les courses sont interrogés directement depuis Supabase.
 */
export const INITIAL_TRANSPORTERS: Transporter[] = [];
export const INITIAL_RIDES: Ride[] = [];

/**
 * Extrait le code département d'un transporteur sanitaire (ex: '31', '75', '972', '33', etc.)
 */
export function getTransporterDepartment(t: Transporter): string {
  if (t.postalCode) {
    const clean = t.postalCode.trim();
    if (clean.startsWith('97') && clean.length >= 3) return clean.slice(0, 3);
    if (clean.length >= 2) return clean.slice(0, 2);
  }
  if (t.arsLicense) {
    const match = t.arsLicense.match(/^(97[1-6]|\d{2})-/);
    if (match) return match[1];
  }
  if (t.cpamConventionNumber) {
    const match = t.cpamConventionNumber.match(/^(97[1-6]|\d{2})-/);
    if (match) return match[1];
  }

  const text = `${t.city || ''} ${t.address || ''} ${t.zone || ''} ${t.companyName || ''}`.toLowerCase();
  if (text.includes('971') || text.includes('guadeloupe')) return '971';
  if (text.includes('972') || text.includes('martinique')) return '972';
  if (text.includes('973') || text.includes('guyane')) return '973';
  if (text.includes('974') || text.includes('réunion')) return '974';
  if (text.includes('976') || text.includes('mayotte')) return '976';
  if (text.includes('31') || text.includes('toulouse')) return '31';
  if (text.includes('33') || text.includes('bordeaux')) return '33';
  if (text.includes('75') || text.includes('paris')) return '75';
  return '972';
}

/**
 * Flotte et chauffeurs déclarés par le transporteur (zéro génération artificielle de données)
 */
export function ensureTransporterFleetAndDrivers(t: Transporter): Transporter {
  return {
    ...t,
    vehicles: t.vehicles || [],
    drivers: t.drivers || []
  };
}

/**
 * Filtre strict éliminant toute course prototype, course de test ou fausse identité
 */
export const isPrototypeRide = (row: any): boolean => {
  if (!row) return true;
  const ref = (row.reference || '').toUpperCase().trim();
  if (!ref) return true;
  if (
    ref.startsWith('VERIF-') ||
    ref.startsWith('TEST-') ||
    ref.startsWith('DEMO-') ||
    ref.startsWith('MOCK-') ||
    ref.startsWith('PURGED-')
  ) {
    return true;
  }

  // Si c'est une course directe saisie par le transporteur, ne JAMAIS la filtrer
  if (row.source === 'TRANSPORTER_DIRECT') {
    return false;
  }

  const PROTOTYPE_REFS = new Set([
    'MT-972-7325', 'MT-972-7452', 'MT-972-6576', 'MT-972-4108', 'MT-972-5892',
    'MT-972-1849', 'MT-972-9825', 'MT-972-8053', 'MT-972-7447', 'MT-972-9390',
    'MT-972-5424', 'MT-972-3848', 'MT-972-3306', 'MT-972-2297', 'MT-972-3012',
    'MT-972-5359', 'MT-972-7785', 'MT-972-7045', 'MT-972-2857', 'MT-972-1316',
    'MT-972-3013', 'MT-972-6020', 'MT-972-2361', 'MT-13-9034', 'MT-974-6078'
  ]);
  if (PROTOTYPE_REFS.has(ref)) return true;

  const pFirst = (row.patient_first_name || row.patient?.firstName || '').toLowerCase().trim();
  const pLast = (row.patient_last_name || row.patient?.lastName || '').toLowerCase().trim();
  const pEmail = (row.patient_email || row.patient?.email || '').toLowerCase().trim();
  const full = `${pFirst} ${pLast}`.trim();

  const PROTOTYPE_PATIENTS = [
    'maryse brival', 'eliane bernard', 'éliane bernard', 'christian marie-luce',
    'victor marie-luce', 'jessica beuse', 'eliane moutoussamy', 'éliane moutoussamy',
    'aimé glissant', 'aime glissant', 'sophie laurent', 'sophie lefebvre',
    'marie-claude fontaine', 'bernard giraud', 'gérard théodore', 'gerard theodore',
    'marie leroy', 'jacqueline evariste', 'samuel cincinnatus', 'jean dupont',
    'emptynir', 'dimitry p25', 'élianaimé', 'bernarcesaire', 'bernarddubois'
  ];
  if (PROTOTYPE_PATIENTS.some(name => full === name || (pFirst && pLast && `${pFirst} ${pLast}` === name))) {
    return true;
  }

  const PROTOTYPE_EMAILS = [
    'maryse.brival', 'eliane.bernard', 'c.marieluce', 'sophie.laurent', 'marie.leroy',
    'jacqueline.evariste', 'samuel.cincinnatus', 'gerard.theodore', 'mc.fontaine',
    'b.giraud', 'sophie.lefebvre', 'orange.re', 'dom.re', 'guyane-sante', 'outremer.mq',
    'wanadoo.fr', 'emptynir', 'purged@test.local', 'eliane@chu-martinique.fr'
  ];
  if (PROTOTYPE_EMAILS.some(pe => pEmail.includes(pe))) {
    return true;
  }

  return false;
};

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
    ]
  }
];

// Machine à états officielle de Clinigo
const VALID_TRANSITIONS: Record<RideStatus, RideStatus[]> = {
  'PENDING': ['ACCEPTED', 'CANCELLED'],
  'ACCEPTED': ['EN_ROUTE', 'CANCELLED', 'PENDING'],
  'EN_ROUTE': ['PICKED_UP', 'COMPLETED', 'CANCELLED'],
  'PICKED_UP': ['COMPLETED', 'CANCELLED'],
  'COMPLETED': [], // Terminal
  'CANCELLED': []  // Terminal
};

export const rideService = {
  // Récupérer toutes les courses (depuis Supabase exclusivement)
  async getAllRides(): Promise<Ride[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          const fetchedRides = data
            .filter((row: any) => !isPrototypeRide(row))
            .map(this.mapSupabaseToRide);

          // Nettoyer également le localStorage de toute course prototype résiduelle
          try {
            const rawStored = localStorage.getItem(STORAGE_KEY_RIDES);
            if (rawStored) {
              const p = JSON.parse(rawStored);
              if (Array.isArray(p)) {
                localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(p.filter(r => !isPrototypeRide(r))));
              }
            }
          } catch {}

          return this.processDirectRequestsLifecycle(fetchedRides);
        }
        if (error) {
          console.warn('[rideService] Erreur Supabase getAllRides:', error.message);
        }
      } catch (err) {
        console.warn('[rideService] Supabase fetch failed:', err);
      }
    }

    const stored = localStorage.getItem(STORAGE_KEY_RIDES);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((r: Ride) => !isPrototypeRide(r));
          localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(cleaned));
          return this.processDirectRequestsLifecycle(cleaned);
        }
      } catch {}
    }
    return [];
  },

  // Récupérer les courses initiées par un établissement de santé spécifique
  async getRidesByFacility(facilityFilter?: { facilityName?: string; userId?: string; facilityId?: string }): Promise<Ride[]> {
    const all = await this.getAllRides();
    // EXCLUSION STRICTE : Ne retenir QUE les demandes créées par un établissement de santé (source === 'FACILITY')
    // Les demandes créées par les clients particuliers (source === 'PATIENT') ne doivent JAMAIS apparaître dans le tableau des établissements.
    const facilityRides = all.filter(r => r.source === 'FACILITY');

    if (!facilityFilter || (!facilityFilter.facilityName && !facilityFilter.userId && !facilityFilter.facilityId)) {
      return facilityRides;
    }

    const normName = facilityFilter.facilityName?.trim().toLowerCase();

    return facilityRides.filter(r => {
      // Correspondance par ID utilisateur (le soignant/cadre qui a créé la demande)
      if (facilityFilter.userId && r.userId && r.userId === facilityFilter.userId) {
        return true;
      }
      // Correspondance par ID d'établissement
      if (facilityFilter.facilityId && r.facilityId && r.facilityId === facilityFilter.facilityId) {
        return true;
      }
      // Correspondance par nom d'établissement (insensible à la casse / inclusions)
      if (normName && r.facilityName) {
        const rNorm = r.facilityName.trim().toLowerCase();
        if (rNorm === normName || rNorm.includes(normName) || normName.includes(rNorm)) {
          return true;
        }
      }
      return false;
    });
  },

  // Cycle de vie des demandes directes : expiration automatique après 24h00 et rebasculement au pot commun
  processDirectRequestsLifecycle(rides: Ride[]): Ride[] {
    const now = Date.now();
    return rides.map((r) => {
      if (r.status === 'PENDING' && r.isDirectRequest && !r.isDirectRequestExpired && r.directRequestExpiresAt) {
        const expiresAt = new Date(r.directRequestExpiresAt).getTime();
        if (now > expiresAt) {
          return {
            ...r,
            isDirectRequestExpired: true,
            reassignedToPublicPool: true
          };
        }
      }
      return r;
    });
  },

  // Libération manuelle d'une demande directe vers le pot commun par le transporteur sollicité
  async releaseDirectRequestToPublicPool(reference: string, reason?: string): Promise<Ride | null> {
    const cleanRef = reference.trim().toUpperCase();
    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('rides')
        .update({
          is_direct_request: false,
          target_transporter_id: null,
          target_transporter_name: null,
          updated_at: new Date().toISOString()
        })
        .eq('reference', cleanRef);
    }
    return this.getRideByReference(cleanRef);
  },

  // Récupérer une course par sa référence (ex: MT-972-8821)
  async getRideByReference(reference: string): Promise<Ride | null> {
    const cleanRef = reference.trim().toUpperCase();
    if (isPrototypeRide({ reference: cleanRef })) {
      return null;
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('reference', cleanRef)
          .single();
        if (!error && data) {
          if (isPrototypeRide(data)) return null;
          return this.mapSupabaseToRide(data);
        }
      } catch (err) {
        console.warn('[rideService] Erreur récupération course par référence:', err);
      }
    }

    const all = await this.getAllRides();
    return all.find(r => r.reference.toUpperCase() === cleanRef) || null;
  },

  /**
   * Recherche le ou les transporteurs ayant déjà pris en charge ce patient dans l'historique Clinigo
   * Permet d'assurer la continuité des soins en adressant la commande en priorité 24h
   */
  async getPatientPreferredTransporters(patientInfo: {
    userId?: string;
    email?: string;
    phone?: string;
    nir?: string;
  }): Promise<{
    transporterName: string;
    transporterId?: string;
    lastRideDate: string;
    totalCompletedRides: number;
  }[]> {
    if (!patientInfo) return [];

    const cleanNir = (patientInfo.nir || '').replace(/\s+/g, '');
    const rawPhone = (patientInfo.phone || '').replace(/\s+/g, '').replace(/^(?:\+33|\+596|\+590|\+594|\+262|0033|00596)/, '0');
    const cleanEmail = (patientInfo.email || '').trim().toLowerCase();
    const userId = patientInfo.userId?.trim();

    if (!cleanNir && !rawPhone && !cleanEmail && !userId) {
      return [];
    }

    const allRides = await this.getAllRides();

    // Filtrer les courses passées du patient qui ont été prises en charge
    const matchingRides = allRides.filter((r) => {
      // 1. Concordance patient
      let isSamePatient = false;
      if (userId && r.userId && r.userId === userId) {
        isSamePatient = true;
      }
      if (!isSamePatient && cleanNir && cleanNir.length >= 10 && r.patient?.nir) {
        const rNir = r.patient.nir.replace(/\s+/g, '');
        if (rNir === cleanNir) isSamePatient = true;
      }
      if (!isSamePatient && rawPhone && rawPhone.length >= 9 && r.patient?.phone) {
        const rPhone = r.patient.phone.replace(/\s+/g, '').replace(/^(?:\+33|\+596|\+590|\+594|\+262|0033|00596)/, '0');
        if (rPhone === rawPhone || (rPhone.length >= 9 && rawPhone.endsWith(rPhone.slice(-9)))) {
          isSamePatient = true;
        }
      }
      if (!isSamePatient && cleanEmail && cleanEmail.includes('@') && r.patient?.email) {
        if (r.patient.email.trim().toLowerCase() === cleanEmail) {
          isSamePatient = true;
        }
      }

      if (!isSamePatient) return false;

      // 2. Vérifier qu'un transporteur a effectivement pris en charge cette course
      const hasAssigned = !!(r.assignedTransporter?.companyName || (r.targetTransporterName && (r.status === 'COMPLETED' || r.status === 'ACCEPTED')));
      const validStatus = r.status === 'COMPLETED' || r.status === 'ACCEPTED' || r.status === 'EN_ROUTE' || r.status === 'PICKED_UP';

      return hasAssigned && validStatus;
    });

    if (matchingRides.length === 0) {
      return [];
    }

    // Regrouper par société de transport
    const map = new Map<string, {
      transporterName: string;
      transporterId?: string;
      lastRideDate: string;
      totalCompletedRides: number;
    }>();

    for (const r of matchingRides) {
      const name = (r.assignedTransporter?.companyName || r.targetTransporterName || '').trim();
      if (!name) continue;

      const rideDate = r.pickupDateTime || r.createdAt || '';
      const existing = map.get(name);
      if (!existing) {
        map.set(name, {
          transporterName: name,
          transporterId: r.targetTransporterId,
          lastRideDate: rideDate,
          totalCompletedRides: 1,
        });
      } else {
        existing.totalCompletedRides += 1;
        if (rideDate && (!existing.lastRideDate || new Date(rideDate).getTime() > new Date(existing.lastRideDate).getTime())) {
          existing.lastRideDate = rideDate;
        }
        if (!existing.transporterId && r.targetTransporterId) {
          existing.transporterId = r.targetTransporterId;
        }
      }
    }

    const list = Array.from(map.values());
    // Trier par date de dernière course la plus récente, puis par nombre de courses
    list.sort((a, b) => {
      const timeA = a.lastRideDate ? new Date(a.lastRideDate).getTime() : 0;
      const timeB = b.lastRideDate ? new Date(b.lastRideDate).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return b.totalCompletedRides - a.totalCompletedRides;
    });

    return list;
  },

  // Créer une nouvelle demande de transport
  async createRide(rideData: Partial<Ride>): Promise<Ride> {
    const reference = rideData.reference || `MT-972-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const newRide: Ride = {
      id: rideData.id || `ride-${Date.now()}`,
      reference,
      createdAt: rideData.createdAt || now,
      pickupAddress: rideData.pickupAddress || '',
      userId: rideData.userId,
      facilityId: rideData.facilityId,
      pickupCity: rideData.pickupCity || '',
      dropoffAddress: rideData.dropoffAddress || '',
      dropoffCity: rideData.dropoffCity || '',
      facilityName: rideData.facilityName,
      pickupDateTime: rideData.pickupDateTime || now,
      returnDateTime: rideData.returnDateTime,
      isRoundTrip: rideData.isRoundTrip || false,
      transportType: rideData.transportType || 'VSL',
      status: (rideData.status as RideStatus) || 'PENDING',
      patient: {
        firstName: rideData.patient?.firstName || '',
        lastName: rideData.patient?.lastName || '',
        birthDate: rideData.patient?.birthDate || '1980-01-01',
        nir: (rideData.patient?.nir || '').trim(),
        phone: rideData.patient?.phone || '',
        email: (rideData.patient?.email || '').trim(),
        address: rideData.patient?.address || rideData.pickupAddress || '',
        city: rideData.patient?.city || rideData.pickupCity || '',
        postalCode: rideData.patient?.postalCode || '97200',
        isAld: rideData.patient?.isAld || false,
        hasMutuelle: rideData.patient?.hasMutuelle,
        mutuelleName: rideData.patient?.mutuelleName,
        mutuelleNumber: rideData.patient?.mutuelleNumber,
        mutuelleUploaded: rideData.patient?.mutuelleUploaded || Boolean(rideData.patient?.mutuelleFileUrl),
        mutuelleFileName: rideData.patient?.mutuelleFileName,
        mutuelleFileUrl: rideData.patient?.mutuelleFileUrl,
        hasPmt: rideData.patient?.hasPmt || false,
        pmtPrescriberDoctor: rideData.patient?.pmtPrescriberDoctor,
        pmtUploaded: rideData.patient?.pmtUploaded || false,
        pmtFileName: rideData.patient?.pmtFileName,
        pmtFileUrl: rideData.patient?.pmtFileUrl,
      },
      mobility: {
        wheelchair: rideData.mobility?.wheelchair || false,
        stretcher: rideData.mobility?.stretcher || false,
        oxygen: rideData.mobility?.oxygen || false,
        stairsWithoutElevator: rideData.mobility?.stairsWithoutElevator || false,
        floorNumber: rideData.mobility?.floorNumber || 0,
        needsEscort: rideData.mobility?.needsEscort || false,
        notes: rideData.mobility?.notes,
      },
      source: rideData.source || 'PATIENT',
      appointmentTime: rideData.appointmentTime,
      isRecurring: rideData.isRecurring || false,
      recurringDates: rideData.recurringDates,
      pricing: rideData.pricing,
      isDirectRequest: rideData.isDirectRequest || false,
      targetTransporterId: rideData.targetTransporterId,
      targetTransporterName: rideData.targetTransporterName,
      directRequestExpiresAt: rideData.directRequestExpiresAt,
      facilityDepartment: rideData.facilityDepartment,
      bedDischargeNumber: rideData.bedDischargeNumber,
      assignedTransporter: rideData.assignedTransporter,
      estimatedDistanceKm: rideData.estimatedDistanceKm,
      estimatedDurationMin: rideData.estimatedDurationMin,
    };

    if (isSupabaseConfigured() && supabase) {
      // Récupérer l'ID utilisateur authentifié si présent
      let authUserId: string | null = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authUserId = sessionData?.session?.user?.id || null;
      } catch {}

      const mutuellePayload = (newRide.patient.hasMutuelle !== undefined)
        ? `\n[MUTUELLE_DATA]:${JSON.stringify({
            hasMutuelle: newRide.patient.hasMutuelle,
            mutuelleName: newRide.patient.mutuelleName || '',
            mutuelleNumber: newRide.patient.mutuelleNumber || '',
            mutuelleFileUrl: newRide.patient.mutuelleFileUrl || '',
            mutuelleFileName: newRide.patient.mutuelleFileName || '',
            mutuelleUploaded: newRide.patient.mutuelleUploaded || false
          })}`
        : '';
      const encodedMobilityNotes = ((newRide.mobility.notes || '') + mutuellePayload).trim();

      const { data, error } = await supabase.from('rides').insert({
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
        patient_nir: (newRide.patient.nir || '').trim(), // Chaîne vide au lieu de null pour satisfaire la contrainte DB
        patient_phone: newRide.patient.phone,
        patient_email: newRide.patient.email,
        patient_is_ald: newRide.patient.isAld,
        patient_has_pmt: newRide.patient.hasPmt,
        pmt_prescriber_doctor: newRide.patient.pmtPrescriberDoctor,
        pmt_file_url: newRide.patient.pmtFileUrl || null,
        mobility_wheelchair: newRide.mobility.wheelchair,
        mobility_stretcher: newRide.mobility.stretcher,
        mobility_oxygen: newRide.mobility.oxygen,
        mobility_stairs: newRide.mobility.stairsWithoutElevator,
        mobility_stairs_count: newRide.mobility.floorNumber,
        mobility_needs_escort: newRide.mobility.needsEscort,
        mobility_notes: encodedMobilityNotes || null,
        source: newRide.source,
        facility_department: newRide.facilityDepartment,
        bed_discharge_number: newRide.bedDischargeNumber,
        user_id: authUserId,
        is_direct_request: newRide.isDirectRequest || false,
        target_transporter_id: newRide.targetTransporterId || null,
        target_transporter_name: newRide.targetTransporterName || null,
        direct_request_expires_at: newRide.directRequestExpiresAt || null,
        transporter_name: newRide.assignedTransporter?.companyName || null,
        driver_name: newRide.assignedTransporter?.driverName || null,
        driver_phone: newRide.assignedTransporter?.driverPhone || null,
        vehicle_plate: newRide.assignedTransporter?.vehiclePlate || null,
        eta_minutes: newRide.assignedTransporter?.etaMinutes || 15,
        created_at: newRide.createdAt,
        updated_at: newRide.createdAt
      }).select();

      if (error) {
        console.error('[rideService] Échec insertion Supabase:', error);
        throw new Error(`Échec d'enregistrement en base de données : ${error.message}`);
      }
      if (data && data[0]?.id) {
        newRide.id = data[0].id;
      }
    }

    // Mise à jour du cache local
    try {
      const current = await this.getAllRides();
      const updated = [newRide, ...current.filter(r => r.reference !== newRide.reference)];
      localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(updated));
    } catch {}

    return newRide;
  },

  // Mettre à jour le statut d'une course avec vérification atomique de concurrence
  async updateRideStatus(
    reference: string, 
    status: RideStatus, 
    assigned?: Ride['assignedTransporter'],
    timingUpdates?: { transporterPickupTime?: string; estimatedArrivalTime?: string }
  ): Promise<Ride | null> {
    const cleanRef = reference.trim().toUpperCase();

    // 1. Récupération et contrôle de la machine à états
    const currentRide = await this.getRideByReference(cleanRef);
    if (!currentRide) {
      throw new Error(`Course introuvable : ${cleanRef}`);
    }

    const allowedNext = VALID_TRANSITIONS[currentRide.status] || [];
    if (!allowedNext.includes(status)) {
      throw new Error(`Transition d'état invalide : impossible de passer de "${currentRide.status}" à "${status}".`);
    }

    // 2. Traitement en base Supabase
    if (isSupabaseConfigured() && supabase) {
      if (status === 'ACCEPTED') {
        // ACCEPTATION ATOMIQUE : WHERE reference = cleanRef AND status = 'PENDING'
        const { data: updatedRows, error: updateError } = await supabase
          .from('rides')
          .update({
            status: 'ACCEPTED',
            transporter_name: assigned?.companyName || null,
            driver_name: assigned?.driverName || null,
            driver_phone: assigned?.driverPhone || null,
            vehicle_plate: assigned?.vehiclePlate || null,
            eta_minutes: assigned?.etaMinutes || 15,
            transporter_pickup_time: timingUpdates?.transporterPickupTime || null,
            estimated_arrival_time: timingUpdates?.estimatedArrivalTime || null,
            updated_at: new Date().toISOString()
          })
          .eq('reference', cleanRef)
          .eq('status', 'PENDING')
          .select();

        if (updateError) {
          throw new Error(`Erreur lors de l'acceptation de la course: ${updateError.message}`);
        }
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error('Cette course a déjà été attribuée à un autre transporteur ou son statut a changé.');
        }
      } else {
        const updatePayload: any = {
          status,
          updated_at: new Date().toISOString()
        };
        if (assigned) {
          updatePayload.transporter_name = assigned.companyName || null;
          updatePayload.driver_name = assigned.driverName || null;
          updatePayload.driver_phone = assigned.driverPhone || null;
          updatePayload.vehicle_plate = assigned.vehiclePlate || null;
          updatePayload.eta_minutes = assigned.etaMinutes || null;
        } else if (status === 'PENDING') {
          updatePayload.transporter_name = null;
          updatePayload.driver_name = null;
          updatePayload.driver_phone = null;
          updatePayload.vehicle_plate = null;
          updatePayload.eta_minutes = null;
        }

        if (timingUpdates?.transporterPickupTime) {
          updatePayload.transporter_pickup_time = timingUpdates.transporterPickupTime;
        }
        if (timingUpdates?.estimatedArrivalTime) {
          updatePayload.estimated_arrival_time = timingUpdates.estimatedArrivalTime;
        }

        const { error: updateError } = await supabase
          .from('rides')
          .update(updatePayload)
          .eq('reference', cleanRef);

        if (updateError) {
          throw new Error(`Erreur lors de la mise à jour du statut: ${updateError.message}`);
        }
      }
    }

    currentRide.status = status;
    if (assigned) currentRide.assignedTransporter = assigned;
    else if (status === 'PENDING') delete currentRide.assignedTransporter;

    if (timingUpdates?.transporterPickupTime) currentRide.transporterPickupTime = timingUpdates.transporterPickupTime;
    if (timingUpdates?.estimatedArrivalTime) currentRide.estimatedArrivalTime = timingUpdates.estimatedArrivalTime;

    // Mise à jour cache local
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RIDES);
      if (raw) {
        const list: Ride[] = JSON.parse(raw);
        const idx = list.findIndex(r => r.reference.toUpperCase() === cleanRef);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...currentRide };
          localStorage.setItem(STORAGE_KEY_RIDES, JSON.stringify(list));
        }
      }
    } catch {}

    // Envoi de notification email réelle si la course est acceptée
    if (status === 'ACCEPTED' && assigned) {
      const patientEmail = currentRide.patient?.email;
      if (patientEmail && patientEmail.includes('@')) {
        const patientName = `${currentRide.patient?.firstName || ''} ${currentRide.patient?.lastName || ''}`.trim() || 'Patient';
        const pickupDate = currentRide.pickupDateTime ? new Date(currentRide.pickupDateTime).toLocaleDateString('fr-FR') : 'Aujourd’hui';
        const pickupTime = timingUpdates?.transporterPickupTime || currentRide.transporterPickupTime || currentRide.appointmentTime || '08:30';

        EmailService.sendRideAcceptedEmail({
          email: patientEmail,
          patientName,
          reference: currentRide.reference,
          transporterName: assigned.companyName || 'Transporteur Sanitaire Agréé',
          driverName: assigned.driverName,
          driverPhone: assigned.driverPhone,
          vehiclePlate: assigned.vehiclePlate,
          pickupAddress: currentRide.pickupAddress,
          dropoffAddress: currentRide.facilityName || currentRide.dropoffAddress,
          pickupDate,
          pickupTime,
        }).catch(err => console.warn('[rideService] Notification email acceptation échouée:', err));
      }

      try {
        window.dispatchEvent(new CustomEvent('clinigo_ride_status_updated', {
          detail: { reference: currentRide.reference, status: 'ACCEPTED', ride: currentRide }
        }));
      } catch {}
    }

    return currentRide;
  },

  // Décliner une course
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

  getDeclinedRideRefs(): string[] {
    try {
      const stored = localStorage.getItem('medictrans_declined_missions_972');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  resetDeclinedRides(): void {
    try {
      localStorage.removeItem('medictrans_declined_missions_972');
    } catch {}
  },

  async reassignRide(
    reference: string, 
    assignment: AssignedTransporter, 
    newStatus?: RideStatus
  ): Promise<Ride | null> {
    const current = await this.getRideByReference(reference);
    if (!current) return null;
    const targetStatus = newStatus || current.status || 'ACCEPTED';
    return this.updateRideStatus(reference, targetStatus, assignment);
  },

  async releaseAndRepublishRide(
    reference: string, 
    transporterName: string, 
    reason?: string
  ): Promise<Ride | null> {
    const cleanRef = reference.trim().toUpperCase();
    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('rides')
        .update({
          status: 'PENDING',
          transporter_name: null,
          driver_name: null,
          driver_phone: null,
          vehicle_plate: null,
          eta_minutes: null,
          updated_at: new Date().toISOString()
        })
        .eq('reference', cleanRef);
    }
    return this.getRideByReference(cleanRef);
  },

  async cancelRide(reference: string, reason?: string): Promise<Ride | null> {
    const cleanRef = reference.trim().toUpperCase();
    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('rides')
        .update({
          status: 'CANCELLED',
          updated_at: new Date().toISOString()
        })
        .eq('reference', cleanRef);
    }
    return this.getRideByReference(cleanRef);
  },

  // Récupérer les transporteurs réels depuis Supabase
  async getAllTransporters(): Promise<Transporter[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('transporters').select('*');
        if (!error && data && data.length > 0) {
          return data.map(t => ensureTransporterFleetAndDrivers(this.mapSupabaseToTransporter(t)));
        }
      } catch (err) {
        console.warn('Supabase fetch transporters failed:', err);
      }
    }
    const stored = localStorage.getItem(STORAGE_KEY_TRANSPORTERS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(ensureTransporterFleetAndDrivers);
        }
      } catch {}
    }
    return [];
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

  async getAllFacilities(): Promise<Facility[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('facilities').select('*');
        if (!error && data && data.length > 0) {
          return data.map((f: any) => ({
            id: f.id,
            name: f.name,
            finess: f.finess,
            type: f.type,
            address: f.address,
            city: f.city,
            contactName: f.contact_name,
            contactRole: f.contact_role,
            contactPhone: f.contact_phone,
            contactEmail: f.contact_email,
            departments: f.departments || [],
            dropoffPoints: []
          }));
        }
      } catch {}
    }
    return INITIAL_FACILITIES;
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

  // Statistiques calculées dynamiquement sur la base réelle (aucun chiffre mocké)
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
      avgAttributionMinutes: null,
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

  // Mapper Supabase DB Record vers Ride (sans données injectées artificiellement)
  mapSupabaseToRide(row: any): Ride {
    let hasMutuelle: boolean | undefined = undefined;
    let mutuelleName: string | undefined = undefined;
    let mutuelleNumber: string | undefined = undefined;
    let mutuelleFileUrl: string | undefined = undefined;
    let mutuelleFileName: string | undefined = undefined;
    let mutuelleUploaded: boolean | undefined = undefined;
    let cleanMobilityNotes = row.mobility_notes || undefined;

    if (row.mobility_notes && row.mobility_notes.includes('[MUTUELLE_DATA]:')) {
      try {
        const parts = row.mobility_notes.split('[MUTUELLE_DATA]:');
        cleanMobilityNotes = parts[0].trim() || undefined;
        const parsed = JSON.parse(parts[1].trim());
        hasMutuelle = parsed.hasMutuelle;
        mutuelleName = parsed.mutuelleName || undefined;
        mutuelleNumber = parsed.mutuelleNumber || undefined;
        mutuelleFileUrl = parsed.mutuelleFileUrl || undefined;
        mutuelleFileName = parsed.mutuelleFileName || undefined;
        mutuelleUploaded = parsed.mutuelleUploaded;
      } catch {
        // ignore parse error
      }
    }

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
      isRoundTrip: Boolean(row.is_round_trip),
      transportType: row.transport_type,
      status: row.status,
      patient: {
        firstName: row.patient_first_name || '',
        lastName: row.patient_last_name || '',
        birthDate: row.patient_birth_date || '',
        nir: row.patient_nir || '',
        phone: row.patient_phone || '',
        email: row.patient_email || '',
        address: row.pickup_address || '',
        city: row.pickup_city || '',
        postalCode: '97200',
        isAld: Boolean(row.patient_is_ald),
        hasMutuelle,
        mutuelleName,
        mutuelleNumber,
        mutuelleFileUrl,
        mutuelleFileName,
        mutuelleUploaded: mutuelleUploaded || Boolean(mutuelleFileUrl),
        hasPmt: Boolean(row.patient_has_pmt),
        pmtPrescriberDoctor: row.pmt_prescriber_doctor || undefined,
        pmtUploaded: Boolean(row.pmt_file_url),
        pmtFileName: row.pmt_file_name || undefined,
        pmtFileUrl: row.pmt_file_url || undefined
      },
      mobility: {
        wheelchair: Boolean(row.mobility_wheelchair),
        stretcher: Boolean(row.mobility_stretcher),
        oxygen: Boolean(row.mobility_oxygen),
        stairsWithoutElevator: Boolean(row.mobility_stairs),
        floorNumber: row.mobility_stairs_count || 0,
        needsEscort: Boolean(row.mobility_needs_escort),
        notes: cleanMobilityNotes
      },
      assignedTransporter: row.transporter_name ? {
        companyName: row.transporter_name,
        driverName: row.driver_name || undefined,
        driverPhone: row.driver_phone || undefined,
        vehiclePlate: row.vehicle_plate || undefined,
        etaMinutes: row.eta_minutes || undefined
      } : undefined,
      appointmentTime: row.appointment_time || undefined,
      transporterPickupTime: row.transporter_pickup_time || undefined,
      estimatedArrivalTime: row.estimated_arrival_time || undefined,
      isRecurring: Boolean(row.is_recurring),
      recurringDates: row.recurring_dates || undefined,
      source: row.source || 'PATIENT',
      userId: row.user_id || undefined,
      facilityId: row.facility_id || undefined,
      facilityDepartment: row.facility_department || undefined,
      bedDischargeNumber: row.bed_discharge_number || undefined,
      isDirectRequest: Boolean(row.is_direct_request),
      targetTransporterId: row.target_transporter_id || undefined,
      targetTransporterName: row.target_transporter_name || undefined,
      directRequestExpiresAt: row.direct_request_expires_at || undefined,
      isDirectRequestExpired: Boolean(row.is_direct_request_expired),
      reassignedToPublicPool: Boolean(row.reassigned_to_public_pool),
      reassignedReason: row.reassigned_reason || undefined
    };
  },

  // Mapper Supabase DB Record vers Transporter
  mapSupabaseToTransporter(row: any): Transporter {
    return {
      id: row.id,
      companyName: row.company_name,
      siret: row.siret,
      arsLicense: row.ars_license,
      cpamConventionNumber: row.cpam_convention_number,
      phone: row.phone,
      email: row.email,
      address: row.address,
      city: row.city,
      fleetAmbulances: row.fleet_ambulances || 0,
      fleetVsl: row.fleet_vsl || 0,
      fleetTaxis: row.fleet_taxis || 0,
      verified: Boolean(row.verified),
      status: row.verified ? 'ACTIVE' : 'SUSPENDED',
      avgApproachMinutes: 15,
      complianceRate: 100,
      zone: row.city || 'Secteur conventionné',
      assignedMissionsCount: 0
    };
  }
};
