/**
 * Service OTP pour la vérification du numéro de téléphone par SMS Twilio
 */

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  demoCode?: string;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  error?: string;
}

/**
 * Normalise un numéro de téléphone français ou DOM en format international E.164
 */
export function normalizeToE164(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/\D/g, '');

  // Déjà au format international (ex: 336..., 596696...)
  if (rawPhone.trim().startsWith('+')) {
    return `+${digits}`;
  }

  // Numéros locaux français à 10 chiffres débutant par 0
  if (digits.length === 10 && digits.startsWith('0')) {
    const prefix = digits.slice(0, 4);
    const body = digits.slice(1);

    // Martinique : 0696, 0596
    if (prefix === '0696' || prefix === '0596') {
      return `+596${body}`;
    }
    // Guadeloupe / St-Martin / St-Barth : 0690, 0590
    if (prefix === '0690' || prefix === '0590') {
      return `+590${body}`;
    }
    // Guyane : 0694, 0594
    if (prefix === '0694' || prefix === '0594') {
      return `+594${body}`;
    }
    // La Réunion : 0692, 0262, 0693
    if (prefix === '0692' || prefix === '0262' || prefix === '0693') {
      return `+262${body}`;
    }
    // France Métropolitaine (06, 07, etc.)
    return `+33${body}`;
  }

  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Formate un numéro pour affichage convivial (ex: 0696 11 22 33)
 */
export function formatPhoneForDisplay(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
  return rawPhone;
}

export class OtpService {
  /**
   * Envoie un code de vérification SMS à un numéro de téléphone
   */
  static async sendOtp(phone: string): Promise<SendOtpResponse> {
    const e164 = normalizeToE164(phone);
    if (!e164 || e164.length < 10) {
      return { success: false, error: 'Numéro de téléphone invalide.' };
    }

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, rawPhone: phone }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data.error || 'Erreur lors de l\'envoi du code SMS.',
        };
      }

      return {
        success: true,
        message: data.message || 'Code SMS envoyé.',
        demoCode: data.demoCode,
      };
    } catch (err: any) {
      console.error('[OtpService] sendOtp error:', err);
      return {
        success: false,
        error: 'Impossible de joindre le serveur pour envoyer le SMS. Vérifiez votre connexion.',
      };
    }
  }

  /**
   * Vérifie le code de vérification à 6 chiffres saisi par l'utilisateur
   */
  static async verifyOtp(phone: string, code: string): Promise<VerifyOtpResponse> {
    const e164 = normalizeToE164(phone);
    const cleanCode = (code || '').trim().replace(/\D/g, '');

    if (cleanCode.length !== 6) {
      return { success: false, verified: false, error: 'Le code doit comporter 6 chiffres.' };
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, code: cleanCode }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.verified) {
        return {
          success: false,
          verified: false,
          error: data.error || 'Code invalide ou expiré.',
        };
      }

      return {
        success: true,
        verified: true,
      };
    } catch (err: any) {
      console.error('[OtpService] verifyOtp error:', err);
      return {
        success: false,
        verified: false,
        error: 'Erreur réseau lors de la validation du code.',
      };
    }
  }
}
