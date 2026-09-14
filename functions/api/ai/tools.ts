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

export interface ExtractedBookingFields {
  transportType?: 'taxi' | 'vsl' | 'ambulance';
  pickupAddress?: string;
  destinationFacility?: string;
  transportDate?: string;
  transportTime?: string;
  patientNir?: string;
  mobility?: 'assis' | 'marche' | 'fauteuil' | 'allonge';
  oxygen?: boolean;
  hasCompanion?: boolean;
  isAld?: boolean;
}

/**
 * Analyse un message utilisateur et extrait en direct les entités de réservation
 * (Communes 972, Hôpitaux/Cliniques, Date, Heure, NIR, Mobilité, Oxygène, Accompagnateur)
 */
export function extractBookingFieldsFromConversation(text: string, currentDraft: Partial<ExtractedBookingFields> = {}): {
  fields: ExtractedBookingFields;
  hasUpdates: boolean;
  updatedFieldsList: string[];
} {
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const fields: ExtractedBookingFields = { ...currentDraft };
  const updatedFieldsList: string[] = [];

  // 1. Mode de transport & mobilité
  if (/\b(ambulance|brancard|allonge|alite)\b/.test(norm)) {
    fields.transportType = 'ambulance';
    fields.mobility = 'allonge';
    updatedFieldsList.push('Mode : Ambulance (Allongé)');
  } else if (/\b(vsl|sanitaire leger|fauteuil|aide a la marche)\b/.test(norm)) {
    fields.transportType = 'vsl';
    fields.mobility = norm.includes('fauteuil') ? 'fauteuil' : 'marche';
    updatedFieldsList.push('Mode : VSL (Sanitaire Léger)');
  } else if (/\b(taxi|taxi conventionne|assis autonome)\b/.test(norm)) {
    fields.transportType = 'taxi';
    fields.mobility = 'assis';
    updatedFieldsList.push('Mode : Taxi conventionné CPAM');
  }

  // Oxygène
  if (/\b(oxygene|o2|respirateur)\b/.test(norm)) {
    fields.oxygen = true;
    fields.transportType = 'ambulance';
    updatedFieldsList.push('Équipement : Oxygénothérapie');
  }

  // Accompagnateur
  if (/\b(avec mon fils|avec ma fille|avec mon mari|avec ma femme|avec accompagnateur|accompagne|accompagnee|avec mon aidant)\b/.test(norm)) {
    fields.hasCompanion = true;
    updatedFieldsList.push('Accompagnateur : Oui (Présent)');
  }

  // ALD 100%
  if (/\b(ald|100%|exoner|affection longue duree)\b/.test(norm)) {
    fields.isAld = true;
    updatedFieldsList.push('Régime : Prise en charge 100% ALD');
  }

  // 2. Communes et quartiers de Martinique
  const MARTINIQUE_COMMUNES = [
    { name: 'Fort-de-France', aliases: ['fort de france', 'fdf', 'cluny', 'didier', 'chateauboeuf', 'tivoli'] },
    { name: 'Le Lamentin', aliases: ['lamentin', 'place d\'armes', 'lezarde', 'aeroport', 'acajou'] },
    { name: 'Schoelcher', aliases: ['schoelcher', 'bateliere', 'anse madame', 'campus'] },
    { name: 'Sainte-Luce', aliases: ['sainte luce', 'ste luce', 'gros raisin'] },
    { name: 'Le Marin', aliases: ['marin', 'le marin'] },
    { name: 'Ducos', aliases: ['ducos', 'champigny'] },
    { name: 'Rivière-Salée', aliases: ['riviere salee', 'riviere-salee'] },
    { name: 'Le Robert', aliases: ['robert', 'le robert'] },
    { name: 'La Trinité', aliases: ['trinite', 'la trinite', 'tartane'] },
    { name: 'Le François', aliases: ['francois', 'le francois'] },
    { name: 'Saint-Joseph', aliases: ['saint joseph', 'st joseph'] },
    { name: 'Gros-Morne', aliases: ['gros morne', 'gros-morne'] },
    { name: 'Sainte-Marie', aliases: ['sainte marie', 'ste marie'] },
    { name: 'Saint-Esprit', aliases: ['saint esprit', 'st esprit'] },
    { name: 'Les Trois-Îlets', aliases: ['trois ilets', 'trois-ilets', 'pointe du bout', 'anse mitan'] },
    { name: 'Le Diamant', aliases: ['diamant', 'le diamant'] },
    { name: 'Les Anses-d\'Arlet', aliases: ['anses d\'arlet', 'anse d\'arlet'] },
    { name: 'Sainte-Anne', aliases: ['sainte anne', 'ste anne'] },
    { name: 'Le Vauclin', aliases: ['vauclin', 'le vauclin'] },
    { name: 'Saint-Pierre', aliases: ['saint pierre', 'st pierre'] },
    { name: 'Le Carbet', aliases: ['carbet', 'le carbet'] },
    { name: 'Case-Pilote', aliases: ['case pilote', 'case-pilote'] },
    { name: 'Bellefontaine', aliases: ['bellefontaine'] },
    { name: 'Le Lorrain', aliases: ['lorrain', 'le lorrain'] },
    { name: 'Le Marigot', aliases: ['marigot', 'le marigot'] },
    { name: 'Basse-Pointe', aliases: ['basse pointe', 'basse-pointe'] },
    { name: 'Grand\'Rivière', aliases: ['grand riviere', 'grand-riviere'] },
    { name: 'L\'Ajoupa-Bouillon', aliases: ['ajoupa bouillon', 'ajoupa-bouillon'] },
    { name: 'Macouba', aliases: ['macouba'] },
    { name: 'Le Prêcheur', aliases: ['precheur', 'le precheur'] },
    { name: 'Rivière-Pilote', aliases: ['riviere pilote', 'riviere-pilote'] }
  ];

  // Détection du lieu de départ : recherche des communes de Martinique
  let foundDepartureCommune: any = null;
  const departurePrefixMatch = text.match(/(?:partir de|départ de|depart de|depuis|prise en charge à|prise en charge a|habite à|habite a)\s+([a-zA-Zàâäéèêëîïôöùûüç\s'-]{3,35})/i);
  if (departurePrefixMatch) {
    const rawDep = departurePrefixMatch[1].trim();
    foundDepartureCommune = MARTINIQUE_COMMUNES.find(c => c.aliases.some(a => rawDep.toLowerCase().includes(a)));
    if (foundDepartureCommune) {
      fields.pickupAddress = `${foundDepartureCommune.name}, Martinique`;
      updatedFieldsList.push(`Lieu de départ : ${fields.pickupAddress}`);
    }
  }

  if (!foundDepartureCommune) {
    for (const c of MARTINIQUE_COMMUNES) {
      if (c.aliases.some(a => new RegExp(`\\b${a}\\b`, 'i').test(norm))) {
        if (!fields.destinationFacility?.toLowerCase().includes(c.name.toLowerCase())) {
          fields.pickupAddress = `${c.name}, Martinique`;
          updatedFieldsList.push(`Lieu de départ : ${fields.pickupAddress}`);
          break;
        }
      }
    }
  }

  // 3. Destination (Établissement de soins)
  const FACILITIES = [
    { regex: /\b(zobda|pierre zobda|chum|chu|chum zobda)\b/, name: 'CHU Pierre Zobda-Quitman - Pôle Oncologie, Fort-de-France' },
    { regex: /\b(mfme|maternite|femme mere enfant)\b/, name: 'Maison de la Femme, de la Mère et de l\'Enfant (MFME), Fort-de-France' },
    { regex: /\b(clarac|albert clarac|oncologie clarac)\b/, name: 'Hôpital Albert Clarac (Cancérologie), Fort-de-France' },
    { regex: /\b(mangot-vulcin|mangot vulcin|vulcin)\b/, name: 'Hôpital Mangot-Vulcin (Urgences & Soins Médicaux), Le Lamentin' },
    { regex: /\b(sainte-marie|ste-marie|clinique sainte marie)\b/, name: 'Clinique Sainte-Marie (Chirurgie & MCO), Schoelcher' },
    { regex: /\b(hopital de trinite|trinite|louis domergue)\b/, name: 'Hôpital Louis Domergue, La Trinité' },
    { regex: /\b(dialyse|calypso|nephrocare)\b/, name: 'Centre de Dialyse Calypso, Fort-de-France' },
    { regex: /\b(emma ventura)\b/, name: 'Centre Gérontologique Emma Ventura, Fort-de-France' }
  ];

  for (const fac of FACILITIES) {
    if (fac.regex.test(norm)) {
      fields.destinationFacility = fac.name;
      updatedFieldsList.push(`Destination : ${fac.name}`);
      break;
    }
  }

  // 4. Date
  const isoDate = text.match(/\b(202\d-\d{2}-\d{2})\b/);
  if (isoDate) {
    fields.transportDate = isoDate[1];
    updatedFieldsList.push(`Date : ${fields.transportDate}`);
  } else {
    const frenchDate = text.match(/\b(\d{1,2})\s+(janvier|fevrier|février|mars|avril|mai|juin|juillet|aout|août|septembre|octobre|novembre|decembre|décembre)(?:\s+(202\d))?\b/i);
    if (frenchDate) {
      const day = parseInt(frenchDate[1], 10);
      const monthNames = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
      const normMonth = frenchDate[2].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const monthIdx = monthNames.indexOf(normMonth);
      const year = frenchDate[3] ? parseInt(frenchDate[3], 10) : 2026;
      if (monthIdx !== -1) {
        const mm = String(monthIdx + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        fields.transportDate = `${year}-${mm}-${dd}`;
        updatedFieldsList.push(`Date : ${fields.transportDate}`);
      }
    } else if (norm.includes('demain')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      fields.transportDate = d.toISOString().slice(0, 10);
      updatedFieldsList.push(`Date : ${fields.transportDate} (Demain)`);
    }
  }

  // 5. Heure
  const timeMatch = text.match(/\b(\d{1,2})[h:](\d{2})?\b/i);
  if (timeMatch) {
    const h = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
    const m = timeMatch[2] ? String(parseInt(timeMatch[2], 10)).padStart(2, '0') : '00';
    fields.transportTime = `${h}:${m}`;
    updatedFieldsList.push(`Heure : ${fields.transportTime}`);
  }

  // 6. NIR
  const nirMatch = text.match(/\b([12]\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{3}\s*\d{3}(\s*\d{2})?)\b/);
  if (nirMatch) {
    const cleaned = nirMatch[0].replace(/\s+/g, '');
    if (cleaned.length >= 13) {
      const base13 = cleaned.slice(0, 13);
      const baseNum = BigInt(base13);
      const calculatedMod = 97n - (baseNum % 97n);
      const calcKey = calculatedMod < 10n ? `0${calculatedMod}` : calculatedMod.toString();
      const finalKey = cleaned.length === 15 ? cleaned.slice(13, 15) : calcKey;
      const formattedNir = `${base13.slice(0, 1)} ${base13.slice(1, 3)} ${base13.slice(3, 5)} ${base13.slice(5, 7)} ${base13.slice(7, 10)} ${base13.slice(10, 13)} ${finalKey}`;
      fields.patientNir = formattedNir;
      updatedFieldsList.push(`NIR : ${formattedNir}`);
    }
  }

  return {
    fields,
    hasUpdates: updatedFieldsList.length > 0,
    updatedFieldsList
  };
}
