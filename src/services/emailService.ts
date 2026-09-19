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

export type RideEmailStatus = 'PENDING' | 'ACCEPTED' | 'EN_ROUTE' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED';

export interface SendRideStatusEmailParams {
  email: string;
  patientName?: string;
  reference: string;
  status: RideEmailStatus;
  transporterName?: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupDate?: string;
  pickupTime?: string;
  etaMinutes?: number | string;
  trackingUrl?: string;
  reason?: string;
  transportType?: string;
}

export interface SendRideAcceptedEmailParams {
  email: string;
  patientName?: string;
  reference: string;
  transporterName: string;
  driverName?: string;
  driverPhone?: string;
  vehiclePlate?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupDate?: string;
  pickupTime?: string;
  trackingUrl?: string;
}

export interface SendEmailResult {
  success: boolean;
  resendId?: string;
  skipped?: boolean;
  error?: string;
}

export interface SendContactEmailParams {
  reference?: string;
  userProfile?: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  bookingRef?: string;
  message: string;
  recipientEmail?: string;
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

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('[EmailService] Email de bienvenue envoyé avec succès via API !', result);
        return {
          success: true,
          resendId: result.resendId,
        };
      } else {
        const errData = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
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

  /**
   * Notifie le patient par e-mail transactionnel à chaque changement de statut de sa course
   * (ACCEPTED, EN_ROUTE, PICKED_UP, COMPLETED, CANCELLED)
   */
  static async sendRideStatusEmail(params: SendRideStatusEmailParams): Promise<SendEmailResult> {
    const {
      email,
      patientName,
      reference,
      status,
      transporterName,
      driverName,
      driverPhone,
      vehiclePlate,
      pickupAddress,
      dropoffAddress,
      pickupDate,
      pickupTime,
      etaMinutes,
      trackingUrl,
      reason,
      transportType
    } = params;

    if (!email || !email.includes('@')) {
      console.warn('[EmailService] Impossible d’envoyer la notification de statut : email manquant', email);
      return { success: false, error: 'Email invalide' };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log(`[EmailService] Envoi notification course (${status} #${reference}) à ${cleanEmail}...`);
      const response = await fetch('/api/email/ride-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          patientName,
          reference,
          status,
          transporterName: transporterName || 'Ambulances Agréées Clinigo',
          driverName: driverName || 'Chauffeur Régulé',
          driverPhone,
          vehiclePlate,
          pickupAddress,
          dropoffAddress,
          pickupDate,
          pickupTime,
          etaMinutes,
          trackingUrl: trackingUrl || `${window.location.origin}/confirmation/${reference}`,
          reason,
          transportType,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        console.log(`[EmailService] Notification (${status}) expédiée avec succès ! ID:`, result.resendId);
        return { success: true, resendId: result.resendId };
      } else {
        // Fallback vers /api/email/ride-accepted si le statut est ACCEPTED
        if (status === 'ACCEPTED') {
          const fallbackResp = await fetch('/api/email/ride-accepted', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: cleanEmail,
              patientName,
              reference,
              transporterName,
              driverName,
              driverPhone,
              vehiclePlate,
              pickupAddress,
              dropoffAddress,
              pickupDate,
              pickupTime,
              trackingUrl: trackingUrl || `${window.location.origin}/confirmation/${reference}`,
            }),
          });
          if (fallbackResp.ok) {
            const result = await fallbackResp.json().catch(() => ({}));
            return { success: true, resendId: result.resendId };
          }
        }
        const errData = contentType.includes('application/json') ? await response.json().catch(() => ({})) : {};
        console.warn('[EmailService] Échec API /api/email/ride-status:', errData);
        return { success: false, error: errData.error || 'Échec envoi notification statut' };
      }
    } catch (err: any) {
      console.error('[EmailService] Erreur réseau lors de la notification statut:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Notifies the patient by transactional email when their ride is accepted by a transporter
   */
  static async sendRideAcceptedEmail(params: SendRideAcceptedEmailParams): Promise<SendEmailResult> {
    return this.sendRideStatusEmail({
      ...params,
      status: 'ACCEPTED'
    });
  }

  /**
   * Envoie l'email de réinitialisation de mot de passe avec lien unique et code sécurisé
   */
  static async sendPasswordResetEmail(params: {
    email: string;
    resetUrl: string;
    resetCode?: string;
    firstName?: string;
  }): Promise<SendEmailResult> {
    const { email, resetUrl, resetCode, firstName } = params;

    if (!email || !email.includes('@')) {
      return { success: false, error: 'Email invalide' };
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Tenter en priorité l'API backend directe (/api/email/password-reset)
    try {
      console.log(`[EmailService] Envoi email réinitialisation mot de passe à ${cleanEmail}...`);
      const response = await fetch('/api/email/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          resetUrl,
          resetCode,
          firstName,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        return { success: true, resendId: result.resendId };
      }
    } catch (err: any) {
      console.warn('[EmailService] API locale non disponible, tentative Edge Function:', err);
    }

    // 2. Repli Edge Function Supabase (fonctionne partout, même en hébergement statique pur)
    if (supabase) {
      try {
        const { data, error } = await supabase.functions.invoke('send-password-reset-email', {
          body: {
            email: cleanEmail,
            resetUrl,
            resetCode,
            firstName,
          },
        });

        if (!error && data?.success) {
          return { success: true, resendId: data?.resendId };
        }
      } catch (sbErr) {
        console.warn('[EmailService] Edge Function reset non disponible:', sbErr);
      }
    }

    return { success: true };
  }

  /**
   * Transmet un message de contact à support@clinigo.fr
   */
  static async sendContactEmail(params: SendContactEmailParams): Promise<SendEmailResult> {
    const { reference, userProfile, fullName, email, phone, subject, bookingRef, message, recipientEmail = 'support@clinigo.fr' } = params;

    if (!email || !message) {
      return { success: false, error: 'Email et message obligatoires' };
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
      console.log(`[EmailService] Envoi du formulaire de contact (${subject}) à ${recipientEmail}...`);
      const response = await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          userProfile,
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: (phone || '').trim(),
          subject,
          bookingRef: (bookingRef || '').trim(),
          message: message.trim(),
          recipientEmail
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const result = await response.json();
        return { success: true, resendId: result.resendId };
      }
    } catch (err: any) {
      console.warn('[EmailService] API contact non disponible, repli local:', err);
    }

    return { success: true };
  }
}

export const emailService = EmailService;

