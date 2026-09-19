/**
 * Service de validation et d'identification des numéros de mutuelle et codes AMC (Norme Inter-AMC / DRE)
 */

export interface MutuelleValidationResult {
  isValid: boolean;
  type?: 'AMC' | 'ADHERENT';
  providerName?: string;
  errorMessage?: string;
  formattedValue: string;
}

/**
 * Répertoire des codes AMC / Télétransmission les plus courants en France & Outre-Mer
 * (Norme 8 chiffres Inter-AMC)
 */
export const KNOWN_AMC_CODES: Record<string, string> = {
  '00004011': 'Harmonie Mutuelle',
  '00018501': 'MGEN (Mutuelle Générale de l\'Éducation Nationale)',
  '10002011': 'Malakoff Humanis',
  '00014013': 'La Mutuelle Générale (LMG)',
  '00002011': 'AG2R La Mondiale',
  '00019010': 'MAIF Santé',
  '00017011': 'MACIF Santé',
  '00022010': 'Matmut Santé',
  '00020010': 'Alan Assurances',
  '00012011': 'Aésio Mutuelle',
  '00007011': 'Axa Santé & Prévoyance',
  '00005011': 'Allianz Santé',
  '00016010': 'Groupama / Gan Santé',
  '00015011': 'Swiss Life Santé',
  '00011011': 'Pro BTP (BTP Santé)',
  '00021010': 'April Santé',
  '00008011': 'Generali Santé',
  '00025010': 'GMF Santé',
  '97200001': 'Mutuelle de la Martinique (MEMA)',
  '97100001': 'Mutuelle Guadeloupéenne',
  '97400001': 'Mutuelle de la Réunion',
  '00030010': 'KLESIA Mutuelle',
  '00026010': 'Intériale Mutuelle',
  '00028010': 'Unéo (Forces Armées)',
  '00029010': 'CNP Assurances Santé',
};

/**
 * Nettoie la saisie : supprime les espaces, tirets, points, et passe en majuscules
 */
export function formatMutuelleInput(raw: string): string {
  if (!raw) return '';
  return raw.replace(/[\s\.\-_/\\,;:!?'"()]/g, '').toUpperCase();
}

/**
 * Valide et identifie le format d'un numéro de mutuelle
 */
export function validateMutuelle(input: string): MutuelleValidationResult {
  const formatted = formatMutuelleInput(input);

  if (!formatted) {
    return {
      isValid: false,
      formattedValue: '',
      errorMessage: 'Numéro de mutuelle ou code télétransmission requis.',
    };
  }

  // Vérification de caractères non autorisés (uniquement chiffres et lettres autorisés)
  if (!/^[A-Z0-9]+$/.test(formatted)) {
    return {
      isValid: false,
      formattedValue: formatted,
      errorMessage: 'Le numéro ne doit comporter que des chiffres et des lettres.',
    };
  }

  // 1. Détection Code Télétransmission / AMC (exactement 8 chiffres)
  if (/^\d{8}$/.test(formatted)) {
    const providerName = KNOWN_AMC_CODES[formatted];
    return {
      isValid: true,
      type: 'AMC',
      providerName,
      formattedValue: formatted,
    };
  }

  // 2. Détection Numéro d'Adhérent / N° de Contrat (6 à 15 caractères alphanumériques)
  if (formatted.length >= 6 && formatted.length <= 15) {
    return {
      isValid: true,
      type: 'ADHERENT',
      formattedValue: formatted,
    };
  }

  // Trop court
  if (formatted.length < 6) {
    return {
      isValid: false,
      formattedValue: formatted,
      errorMessage: `Numéro incomplet (${formatted.length}/6 caractères minimum requis).`,
    };
  }

  // Trop long
  return {
    isValid: false,
    formattedValue: formatted,
    errorMessage: 'Numéro trop long (maximum 15 caractères). Vérifiez votre saisie.',
  };
}
