/**
 * Clinigo.fr — Service Stripe pour l'Abonnement Professionnel Transporteur (19,90 € / mois)
 * 
 * Centralise :
 * - Création de sessions Stripe Checkout
 * - Accès au Stripe Customer Portal
 * - Vérification de l'état d'abonnement et synchronisation
 * - Règles de calcul de validité de l'accès
 */

import { StripeSubscriptionRecord, StripeInvoiceRecord, TransporterSubscription } from '../types';

export interface CheckoutSessionResponse {
  success: boolean;
  url?: string;
  sessionId?: string;
  error?: string;
}

export interface PortalSessionResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface SubscriptionStatusResponse {
  success: boolean;
  hasActiveSubscription: boolean;
  subscription: StripeSubscriptionRecord | null;
  invoices: StripeInvoiceRecord[];
  error?: string;
}

export class StripeSubscriptionService {
  /**
   * Crée une session Stripe Checkout pour la souscription à 19,90 € / mois
   */
  static async createCheckoutSession(params: {
    transporterId: string;
    email?: string;
    companyName?: string;
    siret?: string;
  }): Promise<CheckoutSessionResponse> {
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[StripeService] Erreur appel createCheckoutSession :', err);
      return {
        success: false,
        error: err.message || 'Impossible de contacter le serveur de paiement.'
      };
    }
  }

  /**
   * Crée une session pour le portail client Stripe (Stripe Customer Portal)
   * Permet au transporteur de mettre à jour sa carte, voir ses factures ou résilier
   */
  static async createCustomerPortalSession(transporterId: string): Promise<PortalSessionResponse> {
    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transporterId })
      });

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[StripeService] Erreur appel createCustomerPortalSession :', err);
      return {
        success: false,
        error: err.message || 'Impossible d\'accéder au portail de facturation.'
      };
    }
  }

  /**
   * Récupère l'état d'abonnement en temps réel depuis le serveur
   */
  static async getSubscriptionStatus(transporterId: string): Promise<SubscriptionStatusResponse> {
    try {
      const response = await fetch(`/api/stripe/subscription?transporterId=${encodeURIComponent(transporterId)}`);
      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('[StripeService] Erreur appel getSubscriptionStatus :', err);
      return {
        success: false,
        hasActiveSubscription: false,
        subscription: null,
        invoices: [],
        error: err.message || 'Impossible de récupérer l\'état de l\'abonnement.'
      };
    }
  }

  /**
   * Vérifie si le transporteur dispose d'un abonnement actif et valide
   * Règle stricte :
   * - 'active' / 'ACTIVE' -> Actif
   * - 'trialing' / 'TRIAL' -> Actif tant que la période d'essai n'est pas expirée
   * - 'cancel_at_period_end' -> Reste actif jusqu'à current_period_end
   * - 'past_due' / 'unpaid' / 'canceled' / 'EXPIRED' / 'NONE' -> Inactif
   */
  static hasActiveSubscription(
    sub: StripeSubscriptionRecord | TransporterSubscription | null | undefined
  ): boolean {
    if (!sub) return false;

    // Statuts d'activation directs
    if (sub.status === 'active' || sub.status === 'ACTIVE') {
      return true;
    }

    // Essai gratuit actif
    if (sub.status === 'trialing') {
      return true;
    }

    if (sub.status === 'TRIAL') {
      const legacySub = sub as TransporterSubscription;
      if (legacySub.trialExpiresAt) {
        return new Date(legacySub.trialExpiresAt).getTime() > Date.now();
      }
      return (legacySub.trialDaysRemaining ?? 0) > 0;
    }

    // En cas de demande de résiliation à échéance, accès conservé jusqu'à la date de fin
    const cancelAtPeriodEnd = (sub as any).cancel_at_period_end || (sub as any).cancelAtPeriodEnd;
    const periodEnd = (sub as any).current_period_end || (sub as any).currentPeriodEnd;

    if (cancelAtPeriodEnd && periodEnd) {
      return new Date(periodEnd).getTime() > Date.now();
    }

    return false;
  }

  /**
   * Formate un montant en euros
   */
  static formatAmount(amount: number, currency: string = 'eur'): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }
}
