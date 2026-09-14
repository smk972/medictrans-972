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
  nir: string; // Numéro de Sécurité Sociale (13 ou 15 chiffres)
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
  pricing?: RidePricing;
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

export interface Transporter {
  id: string;
  companyName: string;
  siret: string;
  arsLicense: string; // Agrément ARS Martinique
  cpamConventionNumber: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  fleetAmbulances: number;
  fleetVsl: number;
  fleetTaxis: number;
  verified: boolean;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  avgApproachMinutes?: number;
  complianceRate?: number;
  zone?: string;
  assignedMissionsCount?: number;
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
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  facilityId?: string;
  facilityName?: string;
  transporterId?: string;
  transporterName?: string;
  nir?: string;
  createdAt?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
