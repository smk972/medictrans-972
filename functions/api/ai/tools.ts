/**
 * Outils et validateurs algorithmiques de Niveau 2 pour l'Assistant Médic'Trans 972
 * Permet l'audit des informations saisies (NIR, horaires/trafic, PMT) sans accès direct à la BDD.
 */

export interface NirValidationResult {
  isValid: boolean;
  rawInput: string;
  cleanedNir: string;
  gender?: 'Homme' | 'Femme';
  birthYear?: string;
  birthMonth?: string;
  department?: string;
  calculatedKey?: string;
  providedKey?: string;
  message: string;
}

/**
 * Valide un Numéro de Sécurité Sociale (NIR) et sa clé de contrôle selon la formule officielle CPAM
 * Clé = 97 - (Numéro 13 chiffres % 97)
 */
export function validateNir(nirInput: string): NirValidationResult {
  const cleaned = nirInput.replace(/[\s.-]/g, '');

  if (!/^\d{13,15}$/.test(cleaned)) {
    return {
      isValid: false,
      rawInput: nirInput,
      cleanedNir: cleaned,
      message: `Le numéro renseigné comporte ${cleaned.length} chiffres. Un NIR complet doit comporter 13 chiffres de base + 2 chiffres de clé (total 15 chiffres).`
    };
  }

  const base13 = cleaned.slice(0, 13);
  const providedKey = cleaned.length === 15 ? cleaned.slice(13, 15) : undefined;

  const genderDigit = base13.charAt(0);
  const gender = genderDigit === '1' ? 'Homme' : genderDigit === '2' ? 'Femme' : undefined;
  const birthYear = base13.slice(1, 3);
  const birthMonth = base13.slice(3, 5);
  const department = base13.slice(5, 7);

  // Calcul mathématique officiel de la clé de Luhn / CPAM
  // Note: BigInt est requis car le nombre à 13 chiffres dépasse la précision sécurisée de Number (2^53 - 1)
  const baseNum = BigInt(base13);
  const calculatedMod = 97n - (baseNum % 97n);
  const calculatedKeyStr = calculatedMod < 10n ? `0${calculatedMod}` : calculatedMod.toString();

  if (providedKey) {
    const keyMatches = calculatedKeyStr === providedKey;
    return {
      isValid: keyMatches,
      rawInput: nirInput,
      cleanedNir: cleaned,
      gender,
      birthYear: `19${birthYear} / 20${birthYear}`,
      birthMonth,
      department: department === '97' ? 'Outre-Mer (972 Martinique)' : department,
      calculatedKey: calculatedKeyStr,
      providedKey,
      message: keyMatches
        ? `✅ Numéro de Sécurité Sociale valide (Clé ${providedKey} conforme à la formule CPAM).`
        : `❌ Clé de contrôle incorrecte. Vous avez saisi ${providedKey}, mais la clé calculée pour ces 13 chiffres est ${calculatedKeyStr}. Veuillez vérifier votre carte Vitale.`
    };
  }

  return {
    isValid: true,
    rawInput: nirInput,
    cleanedNir: cleaned,
    gender,
    birthYear: `19${birthYear} / 20${birthYear}`,
    birthMonth,
    department: department === '97' ? 'Outre-Mer (972 Martinique)' : department,
    calculatedKey: calculatedKeyStr,
    message: `ℹ️ Clé de contrôle calculée : ${calculatedKeyStr}. Votre numéro complet avec clé est : ${base13} ${calculatedKeyStr}.`
  };
}

export interface RouteTimingResult {
  isSufficientMargin: boolean;
  diffMinutes: number;
  recommendedMarginMinutes: number;
  pickupTime: string;
  appointmentTime: string;
  warningMessage: string;
}

/**
 * Analyse la cohérence entre l'heure de départ et l'heure du rendez-vous
 * en intégrant les contraintes du réseau routier de Martinique (A1, Rocade, Lamentin, CHUM)
 */
export function verifyRouteTiming(
  pickupCommune: string = '',
  destFacility: string = '',
  pickupTime: string,
  appointmentTime: string
): RouteTimingResult {
  const [pickH, pickM] = pickupTime.split(':').map(Number);
  const [apptH, apptM] = appointmentTime.split(':').map(Number);

  if (isNaN(pickH) || isNaN(apptH)) {
    return {
      isSufficientMargin: true,
      diffMinutes: 60,
      recommendedMarginMinutes: 45,
      pickupTime,
      appointmentTime,
      warningMessage: "Horaires non renseignés ou incomplets."
    };
  }

  const pickTotal = pickH * 60 + pickM;
  const apptTotal = apptH * 60 + apptM;
  let diffMinutes = apptTotal - pickTotal;

  if (diffMinutes < 0) {
    diffMinutes += 24 * 60; // Traversée minuit
  }

  // Détection heure de pointe en Martinique (06h45 - 08h45 ou 16h30 - 18h15)
  const isMorningRush = pickTotal >= 6 * 60 + 45 && pickTotal <= 8 * 60 + 45;
  const isEveningRush = pickTotal >= 16 * 60 + 30 && pickTotal <= 18 * 60 + 15;

  let recommendedMargin = 45;
  const normPickup = pickupCommune.toLowerCase();
  const normDest = destFacility.toLowerCase();

  // Trajets longs Sud ou Nord vers le CHUM
  if (normPickup.includes('marin') || normPickup.includes('vauclin') || normPickup.includes('diamant') || normPickup.includes('trinité') || normPickup.includes('lorrain')) {
    recommendedMargin = isMorningRush ? 75 : 55;
  } else if (normPickup.includes('lamentin') || normPickup.includes('ducos') || normPickup.includes('robert')) {
    recommendedMargin = isMorningRush ? 50 : 35;
  } else if (isMorningRush || isEveningRush) {
    recommendedMargin = 50;
  }

  const isSufficient = diffMinutes >= recommendedMargin;

  let warningMessage = '';
  if (diffMinutes <= 0) {
    warningMessage = `🚨 Heure incohérente : L'heure de prise en charge (${pickupTime}) est après ou égale à l'heure du rendez-vous (${appointmentTime}) !`;
  } else if (!isSufficient) {
    warningMessage = `⚠️ Marge de temps trop juste (${diffMinutes} min) ! En raison du trafic routier habituel en Martinique${isMorningRush ? ' aux heures de pointe le matin' : ''}, une marge minimale de ${recommendedMargin} minutes est vivement recommandée pour arriver à l'heure à votre consultation.`;
  } else {
    warningMessage = `✅ Marge horaire sécurisée (${diffMinutes} min de battement). Vous avez suffisamment de temps pour absorber les ralentissements éventuels.`;
  }

  return {
    isSufficientMargin: isSufficient,
    diffMinutes,
    recommendedMarginMinutes: recommendedMargin,
    pickupTime,
    appointmentTime,
    warningMessage
  };
}
