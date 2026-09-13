/**
 * Utilitaire officiel de validation et de formatage du Numéro d'Inscription
 * au Répertoire (NIR / Numéro de Sécurité Sociale français).
 * 
 * Norme INSEE / Sécurité Sociale :
 * 1er chiffre : Sexe (1 = Homme, 2 = Femme, 7/8 = Temporaires)
 * Chiffres 2-3 : Année de naissance (00 à 99)
 * Chiffres 4-5 : Mois de naissance (01 à 12, ou 20-30 / 50-99 pour cas spécifiques)
 * Chiffres 6-7 : Département de naissance (01 à 95, 2A/2B pour la Corse, 97 pour Martinique/DOM, 98/99)
 * Chiffres 8-10 : Code commune de naissance INSEE (001 à 999)
 * Chiffres 11-13 : Numéro d'ordre d'enregistrement (001 à 999)
 * Chiffres 14-15 : Clé de contrôle (01 à 97) calculée par modulo 97 :
 *                  Clé = 97 - (NIR_13 % 97)
 */

export interface NirValidationResult {
  isValid: boolean;
  clean: string;
  formatted: string;
  isComplete: boolean;
  canAutoCalculateKey: boolean;
  expectedControlKey?: string;
  givenControlKey?: string;
  gender?: 'M' | 'F';
  birthYear?: number;
  birthMonth?: number;
  department?: string;
  errorMessage?: string;
}

/**
 * Formate un NIR brut avec les espaces conventionnels Carte Vitale :
 * X XX XX XX XXX XXX XX
 */
export function formatNir(raw: string): string {
  const clean = (raw || '')
    .replace(/[^\dA-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 15);

  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 1));
  if (clean.length > 1) parts.push(clean.slice(1, 3));
  if (clean.length > 3) parts.push(clean.slice(3, 5));
  if (clean.length > 5) parts.push(clean.slice(5, 7));
  if (clean.length > 7) parts.push(clean.slice(7, 10));
  if (clean.length > 10) parts.push(clean.slice(10, 13));
  if (clean.length > 13) parts.push(clean.slice(13, 15));

  return parts.join(' ');
}

/**
 * Calcule la clé de contrôle de sécurité sociale à 2 chiffres pour les 13 premiers caractères
 */
export function calculateExpectedNirKey(nir13Raw: string): string | null {
  const clean = (nir13Raw || '')
    .replace(/[^\dA-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 13);

  if (clean.length !== 13) return null;

  let numStr = clean;
  const dept = clean.slice(5, 7);

  // Gestion spécifique de la Corse (2A / 2B) selon la règle INSEE
  if (dept === '2A') {
    numStr = clean.slice(0, 5) + '19' + clean.slice(7, 13);
  } else if (dept === '2B') {
    numStr = clean.slice(0, 5) + '18' + clean.slice(7, 13);
  }

  if (!/^\d{13}$/.test(numStr)) {
    return null;
  }

  try {
    const nirBig = BigInt(numStr);
    const remainder = nirBig % 97n;
    const key = 97n - remainder;
    return key.toString().padStart(2, '0');
  } catch {
    return null;
  }
}

/**
 * Valide un numéro de sécurité sociale selon l'ensemble de ses caractéristiques réglementaires
 */
export function validateNir(raw: string): NirValidationResult {
  const clean = (raw || '').replace(/[^\dA-Za-z]/g, '').toUpperCase();
  const formatted = formatNir(clean);

  if (!clean) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: false,
      canAutoCalculateKey: false,
      errorMessage: 'Le numéro de Sécurité Sociale (NIR) est obligatoire pour valider la demande.',
    };
  }

  // Vérification du sexe (1er chiffre)
  const firstChar = clean[0];
  if (!['1', '2', '7', '8'].includes(firstChar)) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: clean.length === 15,
      canAutoCalculateKey: false,
      errorMessage: 'Le premier chiffre du NIR doit obligatoirement être 1 (Homme) ou 2 (Femme).',
    };
  }
  const gender: 'M' | 'F' = ['1', '7'].includes(firstChar) ? 'M' : 'F';

  // Si moins de 3 caractères, encore en cours de saisie
  if (clean.length < 3) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: false,
      canAutoCalculateKey: false,
      gender,
      errorMessage: 'Numéro incomplet (15 chiffres requis avec la clé).',
    };
  }

  const birthYear = parseInt(clean.slice(1, 3), 10);

  // Vérification du mois
  let birthMonth: number | undefined;
  if (clean.length >= 5) {
    birthMonth = parseInt(clean.slice(3, 5), 10);
    const isStandardMonth = birthMonth >= 1 && birthMonth <= 12;
    const isSpecialMonth = (birthMonth >= 20 && birthMonth <= 30) || (birthMonth >= 50 && birthMonth <= 99);
    if (!isStandardMonth && !isSpecialMonth) {
      return {
        isValid: false,
        clean,
        formatted,
        isComplete: clean.length === 15,
        canAutoCalculateKey: false,
        gender,
        birthYear,
        errorMessage: 'Le mois de naissance (chiffres 4 et 5) doit être compris entre 01 et 12.',
      };
    }
  }

  // Vérification du département
  let department: string | undefined;
  if (clean.length >= 7) {
    department = clean.slice(5, 7);
    const isCorse = department === '2A' || department === '2B';
    const isStandardDept = /^\d{2}$/.test(department) && parseInt(department, 10) >= 1 && parseInt(department, 10) <= 99;
    if (!isCorse && !isStandardDept) {
      return {
        isValid: false,
        clean,
        formatted,
        isComplete: clean.length === 15,
        canAutoCalculateKey: false,
        gender,
        birthYear,
        birthMonth,
        errorMessage: 'Le département de naissance (chiffres 6 et 7) est invalide.',
      };
    }
  }

  // Vérification de la longueur minimale
  if (clean.length < 13) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: false,
      canAutoCalculateKey: false,
      gender,
      birthYear,
      birthMonth,
      department,
      errorMessage: `Saisie en cours (${clean.length}/15 chiffres) : 13 chiffres + clé de contrôle requise.`,
    };
  }

  const nir13 = clean.slice(0, 13);
  const expectedControlKey = calculateExpectedNirKey(nir13);

  if (!expectedControlKey) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: clean.length >= 15,
      canAutoCalculateKey: false,
      gender,
      birthYear,
      birthMonth,
      department,
      errorMessage: 'La structure des 13 premiers chiffres du NIR est incorrecte.',
    };
  }

  // Cas où l'utilisateur a entré exactement 13 chiffres (sans la clé)
  if (clean.length === 13) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: false,
      canAutoCalculateKey: true,
      expectedControlKey,
      gender,
      birthYear,
      birthMonth,
      department,
      errorMessage: `Clé manquante : entrez la clé à 2 chiffres ou appliquez la clé calculée (${expectedControlKey}).`,
    };
  }

  if (clean.length === 14) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: false,
      canAutoCalculateKey: false,
      expectedControlKey,
      gender,
      birthYear,
      birthMonth,
      department,
      errorMessage: 'La clé de contrôle doit comporter 2 chiffres (14/15 renseignés).',
    };
  }

  // 15 caractères : vérification stricte de la clé de contrôle
  const givenControlKey = clean.slice(13, 15);
  if (givenControlKey !== expectedControlKey) {
    return {
      isValid: false,
      clean,
      formatted,
      isComplete: true,
      canAutoCalculateKey: true,
      expectedControlKey,
      givenControlKey,
      gender,
      birthYear,
      birthMonth,
      department,
      errorMessage: `Clé de contrôle incorrecte (${givenControlKey}). La clé Sécurité Sociale valide pour ce numéro est ${expectedControlKey}.`,
    };
  }

  // NIR 100% VALIDE
  return {
    isValid: true,
    clean,
    formatted,
    isComplete: true,
    canAutoCalculateKey: false,
    expectedControlKey,
    givenControlKey,
    gender,
    birthYear,
    birthMonth,
    department,
  };
}

/**
 * Corrige automatiquement ou complète la clé d'un NIR
 */
export function autoFixNir(raw: string): string {
  const clean = (raw || '').replace(/[^\dA-Za-z]/g, '').toUpperCase();
  if (clean.length >= 13) {
    const nir13 = clean.slice(0, 13);
    const key = calculateExpectedNirKey(nir13);
    if (key) {
      return formatNir(nir13 + key);
    }
  }
  return formatNir(raw);
}
