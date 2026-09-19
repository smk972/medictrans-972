/**
 * Utilitaires pour le formatage des dates et heures des courses.
 * Garantit l'affichage exact de la date et de l'heure saisies par l'utilisateur
 * sans distorsion ni altération par les fuseaux horaires du navigateur (UTC/CEST/AST).
 */

/**
 * Extrait l'heure (HH:MM) depuis une chaîne ISO, un timestamp ou un texte brut
 * sans décalage de fuseau horaire.
 * Ex: "2026-10-24T08:30:00+00:00" -> "08:30"
 * Ex: "2026-10-24 11:00:00" -> "11:00"
 * Ex: "11:00" -> "11:00"
 */
export function extractTime(datetimeStr?: string | null, fallback: string = '08:30'): string {
  if (!datetimeStr) return fallback;
  const str = String(datetimeStr).trim();
  
  // Format direct "HH:MM"
  if (/^\d{1,2}:\d{2}$/.test(str)) {
    return str.padStart(5, '0');
  }
  
  // Recherche après T ou espace dans une chaîne ISO/SQL
  const match = str.match(/[T\s](\d{1,2}:\d{2})/);
  if (match) {
    return match[1].padStart(5, '0');
  }
  
  return fallback;
}

/**
 * Formate une date en français ("samedi 24 octobre 2026") sans décalage de jour
 * lié au fuseau horaire.
 * Ex: "2026-10-24" -> "samedi 24 octobre 2026"
 * Ex: "2026-10-24T08:30:00+00:00" -> "samedi 24 octobre 2026"
 */
export function formatRideDate(dateStr?: string | null, fallback: string = 'Date à confirmer'): string {
  if (!dateStr) return fallback;
  const str = String(dateStr).trim();
  
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    const year = parseInt(y, 10);
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    // Midi local pour neutraliser tout décalage minuit/fuseau horaire
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);
    return dateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  } catch {}
  
  return str || fallback;
}

/**
 * Formate une date courte en français ("24/10/2026")
 */
export function formatRideDateShort(dateStr?: string | null, fallback: string = '--/--/----'): string {
  if (!dateStr) return fallback;
  const str = String(dateStr).trim();
  
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  
  return fallback;
}

/**
 * Formate le label du type de transport
 */
export function formatTransportLabel(type?: string | null): string {
  if (!type) return 'Véhicule Sanitaire';
  const up = type.toUpperCase();
  if (up.includes('TAXI')) return 'Taxi Conventionné CPAM';
  if (up.includes('AMBULANCE')) return 'Ambulance Conventionnée';
  if (up.includes('VSL')) return 'Véhicule Sanitaire Léger (VSL)';
  return type;
}
