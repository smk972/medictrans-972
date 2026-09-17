// ==============================================================================
// Clinigo - Email Service
// Manages sending transactional emails through Supabase Edge Functions & Resend
// ==============================================================================

import { supabase } from '../lib/supabase';

export interface SendWelcomeEmailParams {
  email: string;
  firstName?: string;
  lastName?: string;
  userId?: string;
  loginUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  skipped?: boolean;
  error?: string;
}

export class EmailService {
  /**
   * Triggers the Welcome Email for a newly registered or confirmed user
   */
  static async sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<SendEmailResult> {
    const { email, firstName, lastName, userId, loginUrl } = params;

    if (!email) {
      return { success: false, error: 'Email is required' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = firstName?.trim() || 'Bienvenue';
    const redirectLogin = loginUrl || `${window.location.origin}/connexion`;

    // 1. Tenter en priorité l'API backend directe (/api/email/welcome)
    try {
      console.log(`[EmailService] Envoi de l'email de bienvenue à ${cleanEmail}...`);
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          firstName: cleanFirstName,
          lastName: lastName?.trim(),
          userId,
          loginUrl: redirectLogin,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[EmailService] Email de bienvenue envoyé avec succès via API !', result);
        return {
          success: true,
          resendId: result.resendId,
        };
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn('[EmailService] Échec API locale, fallback Supabase:', errData);
      }
    } catch (apiErr) {
      console.warn('[EmailService] API directe non accessible, tentative Edge Function:', apiErr);
    }

    // 2. Si l'API directe a échoué, tenter via Supabase Edge Function si disponible
    if (supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('send-welcome-email', {
          body: {
            email: cleanEmail,
            firstName: cleanFirstName,
            lastName: lastName?.trim(),
            userId,
            loginUrl: redirectLogin,
          },
        });

        if (!error && data?.success) {
          return {
            success: true,
            resendId: data?.resendId,
            skipped: data?.skipped,
          };
        }
      } catch (sbErr) {
        console.error('[EmailService] Erreur Edge Function:', sbErr);
      }
    }

    return {
      success: false,
      error: 'Impossible d’expédier l’email via les services configurés.',
    };
  }
}
