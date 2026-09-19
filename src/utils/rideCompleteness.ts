import { Ride } from '../types';

export interface RideCompletenessResult {
  isComplete: boolean;
  missingFields: string[];
  missingLabels: string[];
  summary: string;
  details: {
    hasPatientIdentity: boolean;
    hasPhone: boolean;
    hasNir: boolean;
    hasPmt: boolean;
    hasRoute: boolean;
    hasMutuelleIfRequired: boolean;
  };
}

/**
 * Vérifie si la commande d'un client est entièrement remplie.
 * Une demande de transport sanitaire ne peut pas être acceptée par un transporteur
 * ou validée par un régulateur si les pièces et champs obligatoires sont manquants.
 */
export function checkRideCompleteness(ride: Partial<Ride> | any): RideCompletenessResult {
  if (!ride) {
    return {
      isComplete: false,
      missingFields: ['ride'],
      missingLabels: ['Dossier introuvable'],
      summary: 'Dossier de transport introuvable.',
      details: {
        hasPatientIdentity: false,
        hasPhone: false,
        hasNir: false,
        hasPmt: false,
        hasRoute: false,
        hasMutuelleIfRequired: false,
      }
    };
  }

  const missingFields: string[] = [];
  const missingLabels: string[] = [];

  // 1. Identité complète du patient
  const firstName = (ride.patient?.firstName || ride.patient_first_name || '').trim();
  const lastName = (ride.patient?.lastName || ride.patient_last_name || '').trim();
  const hasPatientIdentity = firstName.length >= 2 && lastName.length >= 2;
  if (!hasPatientIdentity) {
    missingFields.push('patient_identity');
    missingLabels.push('Nom et prénom du patient');
  }

  // 2. Numéro de téléphone de contact
  const rawPhone = (ride.patient?.phone || ride.patient_phone || '').replace(/\D/g, '');
  const hasPhone = rawPhone.length >= 10;
  if (!hasPhone) {
    missingFields.push('patient_phone');
    missingLabels.push('Téléphone de contact valide (10 chiffres)');
  }

  // 3. Numéro de Sécurité Sociale (NIR)
  const rawNir = (ride.patient?.nir || ride.patient_nir || '').trim();
  const cleanNir = rawNir.replace(/[^\dA-Za-z]/g, '');
  // Le NIR français standard comporte au moins 13 chiffres (15 avec la clé)
  const hasNir = cleanNir.length >= 13;
  if (!hasNir) {
    missingFields.push('patient_nir');
    missingLabels.push('Numéro de Sécurité Sociale (NIR)');
  }

  // 4. Prescription Médicale de Transport (PMT / Cerfa S3138)
  const hasPmtDoc = Boolean(
    ride.patient?.pmtUploaded ||
    ride.patient?.pmtFileUrl ||
    ride.pmt_file_url ||
    ride.patient_has_pmt
  );
  const prescriberDoctor = (ride.patient?.pmtPrescriberDoctor || ride.pmt_prescriber_doctor || '').trim();
  const hasPmt = hasPmtDoc || prescriberDoctor.length >= 2;
  if (!hasPmt) {
    missingFields.push('pmt');
    missingLabels.push('Prescription Médicale de Transport (PMT)');
  }

  // 5. Adresses et Trajet
  const pickup = (ride.pickupAddress || ride.pickup_address || '').trim();
  const dropoff = (ride.dropoffAddress || ride.dropoff_address || ride.facilityName || ride.facility_name || '').trim();
  const hasRoute = pickup.length >= 5 && dropoff.length >= 3;
  if (!hasRoute) {
    missingFields.push('route');
    missingLabels.push('Adresses de départ et destination');
  }

  // 6. Mutuelle si le patient n'est pas en ALD (100% CPAM)
  const isAld = Boolean(ride.patient?.isAld ?? ride.patient_is_ald);
  let hasMutuelleIfRequired = true;
  if (!isAld) {
    const mutuelleNum = (ride.patient?.mutuelleNumber || '').trim();
    const mutuelleDoc = Boolean(ride.patient?.mutuelleUploaded || ride.patient?.mutuelleFileUrl);
    hasMutuelleIfRequired = mutuelleNum.length >= 3 || mutuelleDoc;
    if (!hasMutuelleIfRequired) {
      missingFields.push('mutuelle');
      missingLabels.push('Informations de mutuelle');
    }
  }

  const isComplete = missingFields.length === 0;
  const summary = isComplete
    ? 'Dossier complet et conforme'
    : `Dossier incomplet : ${missingLabels.join(', ')}`;

  return {
    isComplete,
    missingFields,
    missingLabels,
    summary,
    details: {
      hasPatientIdentity,
      hasPhone,
      hasNir,
      hasPmt,
      hasRoute,
      hasMutuelleIfRequired,
    }
  };
}
