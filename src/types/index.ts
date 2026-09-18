export type TransportType = 'TAXI_CONVENTIONNE' | 'VSL' | 'AMBULANCE';

export type RideStatus = 
  | 'PENDING'      // En attente d'attribution
  | 'ACCEPTED'     // Accepté par un transporteur
  | 'EN_ROUTE'     // Chauffeur en route vers le patient
  | 'PICKED_UP'    // Patient à bord
  | 'COMPLETED'    // Course terminée
  | 'CANCELLED';   // Annulé

export interface PatientInfo {
  firstName: string;
  lastName: string;
  birthDate: string;
  nir?: string; // Numéro de Sécurité Sociale (13 ou 15 chiffres) - Optionnel si non connecté
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  isAld: boolean; // Affection Longue Durée (100% CPAM)
  aldReason?: string;
  hasPmt: boolean; // Prescription Médicale de Transport présente
  pmtPrescriberDoctor?: string;
  pmtDate?: string;
  pmtFileUrl?: string;
  pmtUploaded?: boolean; // PMT téléversée numériquement par le patient
  pmtFileName?: string;
}

export interface MobilityNeeds {
  wheelchair: boolean; // Fauteuil roulant
  stretcher: boolean; // Brancardage nécessaire (obligatoire Ambulance)
  oxygen: boolean; // Oxygénothérapie requise
  stairsWithoutElevator: boolean; // Portage nécessaire
  floorNumber?: number;
  needsEscort: boolean; // Accompagnateur autorisé
  notes?: string; // Consignes complémentaires
}

export interface AssignedTransporter {
  companyName: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  etaMinutes: number;
  vehicleModel?: string;
}

export interface Ride {
  id: string;
  reference: string; // Ex: MT-972-8821
  createdAt: string;
  userId?: string; // ID utilisateur Supabase du demandeur (patient ou soignant)
  facilityId?: string; // ID de l'établissement de soins émetteur
  pickupAddress: string;
  pickupCity: string;
  dropoffAddress: string;
  dropoffCity: string;
  facilityName?: string;
  pickupDateTime: string; // ISO String
  returnDateTime?: string; // Pour les allers-retours
  isRoundTrip: boolean;
  transportType: TransportType;
  status: RideStatus;
  patient: PatientInfo;
  mobility: MobilityNeeds;
  assignedTransporter?: AssignedTransporter;
  source: 'PATIENT' | 'FACILITY';
  facilityDepartment?: string;
  bedDischargeNumber?: string;
  facilityFloor?: string;
  facilityStaircase?: string;
  facilityRoom?: string;
  facilityBed?: string;
  facilityContactPhone?: string;
  facilityContactName?: string;
  additionalNotes?: string;
  estimatedDistanceKm?: number;
  estimatedDurationMin?: number;
  appointmentTime?: string; // Heure du rendez-vous médical à destination (ex: '09:30')
  transporterPickupTime?: string; // Heure de prise en charge confirmée par le transporteur (ex: '08:45')
  estimatedArrivalTime?: string; // Heure d'arrivée estimée à destination calculée selon prise en charge (ex: '09:10')
  isRecurring?: boolean; // Indicateur transport récurrent (série de soins)
  recurringDates?: string[]; // Dates sélectionnées pour la récurrence
  pricing?: RidePricing;
  dropoffFloor?: string;
  dropoffElevator?: boolean;
  dropoffBuilding?: string;
  dropoffApartment?: string;
  dropoffDoorCode?: string;
  hasCompanion?: boolean;
  targetTransporterId?: string; // ID du transporteur conventionné ciblé directement par le patient
  targetTransporterName?: string; // Nom de l'entreprise ciblée (ex: "Ambulances Madinina Secours")
  isDirectRequest?: boolean; // Vrai si la course a été adressée directement à un transporteur précis
  directRequestExpiresAt?: string; // Date ISO de fin du délai de 24h00 pour répondre
  isDirectRequestExpired?: boolean; // Vrai si le délai de 24h00 est expiré
  reassignedToPublicPool?: boolean; // Vrai si la course a été rebasculée dans le pot commun
  reassignedReason?: string; // Raison du rebasculement au pot commun
}

export interface RidePricing {
  distanceKm: number;
  durationMinutes: number;
  baseForfait: number;
  distanceTarifKm: number;
  distanceAmount: number;
  surcharges: { label: string; amount: number }[];
  totalPrestation: number;
  cpamCoveragePercent: number; // 100% (ALD) ou 65% (Régime Général)
  cpamAmount: number;
  mutuelleAmount: number;
  patientRemainder: number;
  isAld: boolean;
  tariffRegime: string; // Ex: 'CPAM Martinique 972 - Barème Officiel'
}

export interface TransporterInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  description: string;
  status: 'PAID' | 'TRIAL_FREE';
  periodStart?: string;
  periodEnd?: string;
}

export interface TransporterSubscription {
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'NONE';
  trialDaysTotal: number;
  trialDaysRemaining: number;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  isTrialUnlocked: boolean;
  whatsappVerified?: boolean;
  whatsappPhone?: string;
  planName: string;
  monthlyPrice: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  invoices?: TransporterInvoice[];
}

export interface TransporterDriver {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email?: string;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_REPOS';
  assignedVehiclePlate?: string;
}

export interface TransporterVehicle {
  id: string;
  name: string;
  type: TransportType;
  plate: string;
  driver?: string;
  phone?: string;
  status: 'DISPONIBLE' | 'EN_MISSION' | 'EN_PAUSE' | 'MAINTENANCE';
}

export interface Transporter {
  id: string;
  companyName: string;
  siret: string;
  arsLicense: string; // Agrément ARS
  cpamConventionNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode?: string;
  fleetAmbulances: number;
  fleetVsl: number;
  fleetTaxis: number;
  vehicles?: TransporterVehicle[];
  drivers?: TransporterDriver[];
  verified: boolean;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  avgApproachMinutes?: number;
  complianceRate?: number;
  zone?: string;
  assignedMissionsCount?: number;
  subscription?: TransporterSubscription;
}

export interface Facility {
  id: string;
  name: string;
  finess: string; // Numéro FINESS 9 chiffres
  type: 'HOSPITAL' | 'CLINIC' | 'DIALYSIS' | 'EHPAD' | 'REHAB';
  address: string;
  city: string;
  contactName: string;
  contactRole: string;
  contactPhone: string;
  contactEmail: string;
  departments: string[];
  dropoffPoints?: { name: string; type: string; notes: string }[];
  activeDischargesCount?: number;
  authorizedStaffCount?: number;
  rating?: number;
}

export type UserRole = 'PATIENT' | 'FACILITY' | 'TRANSPORTER' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  facilityId?: string;
  facilityName?: string;
  facilityFiness?: string;
  facilityAccessStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  facilityAccessRequestedAt?: string;
  facilityAccessApprovedAt?: string;
  transporterId?: string;
  transporterName?: string;
  transporterLicense?: string;
  siret?: string;
  cpamConventionNumber?: string;
  subscription?: TransporterSubscription;
  nir?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  isAld?: boolean;
  aldReason?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  facilityDepartment?: string;
  password?: string;
  createdAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ClientRecord {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  nir: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  isAld: boolean;
  aldReason?: string;
  hasPmt: boolean;
  pmtPrescriberDoctor?: string;
  pmtFileUrl?: string;
  pmtFileName?: string;
  mobility: MobilityNeeds;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  password?: string;
  temporaryPassword?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  action: string;
  targetType: 'CLIENT' | 'FACILITY' | 'TRANSPORTER' | 'USER' | 'RIDE' | 'SETTINGS';
  targetId?: string;
  details: string;
}

export interface SystemSettings {
  bannerActive: boolean;
  bannerLevel: 'INFO' | 'WARNING' | 'CRITICAL';
  bannerText: string;
  cancellationThresholdHours: number;
  defaultDispatchRadiusKm: number;
  cpamBaseForfaitAmbulance: number;
  cpamBaseForfaitVsl: number;
  cpamRatePerKm: number;
  cpamNightSundaySurchargePercent: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

