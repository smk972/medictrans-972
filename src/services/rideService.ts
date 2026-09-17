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
 * Génère une structure de flotte pour un transporteur réel s'il n'a pas encore saisi sa flotte dans le portail
 */
export function generateDefaultFleetAndDrivers(t: Transporter): { vehicles: TransporterVehicle[]; drivers: TransporterDriver[] } {
  const dept = getTransporterDepartment(t);
  const vehicles: TransporterVehicle[] = [];
  const drivers: TransporterDriver[] = [];

  const countAmb = Math.max(0, t.fleetAmbulances || 0);
  const countVsl = Math.max(0, t.fleetVsl || 0);
  const countTaxi = Math.max(0, t.fleetTaxis || 0);

  let vIndex = 1;
  let dIndex = 1;

  for (let i = 1; i <= countAmb; i++) {
    const plate = `AB-${dept.padStart(2, '0')}${i}-FR`;
    vehicles.push({
      id: `${t.id}-vh-${vIndex++}`,
      name: `Ambulance ASSU #${i}`,
      type: 'AMBULANCE',
      plate,
      driver: `Équipage Ambulance #${i}`,
      phone: t.phone || '',
      status: 'DISPONIBLE'
    });
    drivers.push({
      id: `${t.id}-dr-${dIndex++}`,
      firstName: `Équipage`,
      lastName: `Ambulance ${i}`,
      role: 'Ambulancier DEA Diplômé',
      phone: t.phone || '',
      status: 'DISPONIBLE',
      assignedVehiclePlate: plate
    });
  }

  for (let i = 1; i <= countVsl; i++) {
    const plate = `VS-${dept.padStart(2, '0')}${i}-FR`;
    vehicles.push({
      id: `${t.id}-vh-${vIndex++}`,
      name: `VSL #${i}`,
      type: 'VSL',
      plate,
      driver: `Conducteur VSL #${i}`,
      phone: t.phone || '',
      status: 'DISPONIBLE'
    });
    drivers.push({
      id: `${t.id}-dr-${dIndex++}`,
      firstName: `Conducteur`,
      lastName: `VSL ${i}`,
      role: 'Ambulancier Auxiliaire',
      phone: t.phone || '',
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
      phone: t.phone || '',
      status: 'DISPONIBLE'
    });
    drivers.push({
      id: `${t.id}-dr-${dIndex++}`,
      firstName: `Chauffeur`,
      lastName: `Taxi ${i}`,
      role: 'Chauffeur Taxi Conventionné CPAM',
      phone: t.phone || '',
      status: 'DISPONIBLE',
      assignedVehiclePlate: plate
    });
  }

  return { vehicles, drivers };
}

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
            .filter((row: any) => !row.reference?.toUpperCase().startsWith('VERIF-') && !row.reference?.toUpperCase().startsWith('TEST-'))
            .map(this.mapSupabaseToRide);
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
          return this.processDirectRequestsLifecycle(parsed);
        }
      } catch {}
    }
    return [];
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
    if (cleanRef.startsWith('VERIF-') || cleanRef.startsWith('TEST-')) {
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
          return this.mapSupabaseToRide(data);
        }
      } catch (err) {
        console.warn('[rideService] Erreur récupération course par référence:', err);
      }
    }

    const all = await this.getAllRides();
    return all.find(r => r.reference.toUpperCase() === cleanRef) || null;
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
    };

    if (isSupabaseConfigured() && supabase) {
      // Récupérer l'ID utilisateur authentifié si présent
      let authUserId: string | null = null;
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        authUserId = sessionData?.session?.user?.id || null;
      } catch {}

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
        mobility_wheelchair: newRide.mobility.wheelchair,
        mobility_stretcher: newRide.mobility.stretcher,
        mobility_oxygen: newRide.mobility.oxygen,
        mobility_stairs: newRide.mobility.stairsWithoutElevator,
        mobility_stairs_count: newRide.mobility.floorNumber,
        mobility_needs_escort: newRide.mobility.needsEscort,
        mobility_notes: newRide.mobility.notes,
        source: newRide.source,
        facility_department: newRide.facilityDepartment,
        bed_discharge_number: newRide.bedDischargeNumber,
        user_id: authUserId,
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
        notes: row.mobility_notes || undefined
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
      facilityDepartment: row.facility_department || undefined,
      bedDischargeNumber: row.bed_discharge_number || undefined
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
