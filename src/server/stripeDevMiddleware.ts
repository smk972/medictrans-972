/**
 * Middleware Vite de Développement — Intégration Stripe Clinigo.fr
 * Abonnement Professionnel Transporteur (19,90 € HT / mois)
 * 
 * Endpoints :
 * - POST /api/stripe/create-checkout-session
 * - POST /api/stripe/create-portal-session
 * - POST /api/stripe/webhook
 * - GET  /api/stripe/subscription
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

declare const process: any;
declare const Buffer: any;
type Buffer = any;

// Configuration Supabase Server (Lazy Proxy pour éviter les erreurs lors du build Vite)
let _supabaseClient: any = null;
function getSupabaseClient() {
  if (!_supabaseClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://nrfxqgudknmiydmauirx.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'dummy_anon_key_for_build';
    _supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _supabaseClient;
}

const supabase: any = new Proxy({}, {
  get: (_target, prop) => {
    const client = getSupabaseClient();
    return client[prop];
  }
});

// Initialisation Stripe
function getStripeInstance(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });
}

// Récupération sécurisée du corps de la requête sous forme de Buffer brut (nécessaire pour la signature Webhook)
function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: any) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', (err: any) => reject(err));
  });
}

/**
 * 1. Création de session Stripe Checkout
 * POST /api/stripe/create-checkout-session
 */
export async function handleStripeCheckoutSessionMiddleware(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const rawBody = await getRawBody(req);
    const body = rawBody.length ? JSON.parse(rawBody.toString('utf-8')) : {};
    const { transporterId, email, companyName, siret } = body;

    if (!transporterId) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'Identifiant du transporteur (transporterId) requis.' }));
      return;
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      res.writeHead(503);
      res.end(JSON.stringify({
        success: false,
        error: 'Stripe n\'est pas encore configuré sur le serveur (STRIPE_SECRET_KEY absente).'
      }));
      return;
    }

    // 1. Récupération des informations transporteur depuis Supabase
    let transporter: any = null;
    try {
      const { data, error } = await supabase
        .from('transporters')
        .select('*')
        .eq('id', transporterId)
        .maybeSingle();

      if (!error && data) {
        transporter = data;
      }
    } catch (e) {
      console.warn('[Stripe] Lecture transporteur Supabase impossible :', e);
    }

    const customerEmail = transporter?.email || email;
    const customerName = transporter?.company_name || companyName || 'Transporteur Clinigo';
    const customerSiret = transporter?.siret || siret || '';

    // 2. Gestion ou création du Customer Stripe
    let stripeCustomerId = transporter?.stripe_customer_id;

    if (!stripeCustomerId) {
      // Recherche éventuelle par email dans Stripe
      if (customerEmail) {
        const existingCustomers = await stripe.customers.list({
          email: customerEmail,
          limit: 1
        });
        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
        }
      }

      // Si toujours introuvable, création du Customer
      if (!stripeCustomerId) {
        const newCustomer = await stripe.customers.create({
          email: customerEmail || undefined,
          name: customerName,
          metadata: {
            transporter_id: transporterId,
            siret: customerSiret
          }
        });
        stripeCustomerId = newCustomer.id;
      }

      // Sauvegarde du stripe_customer_id dans Supabase
      if (stripeCustomerId) {
        try {
          await supabase
            .from('transporters')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', transporterId);
        } catch (err) {
          console.warn('[Stripe] Mise à jour stripe_customer_id sur transporters ignorée :', err);
        }
      }
    }

    // 3. Détermination de l'URL de base (origin)
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${protocol}://${host}`;

    // 4. Définition du line_item pour l'Abonnement Clinigo Pro (19,90 € HT / mois)
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Clinigo Pro — Abonnement Transporteur Sanitaire',
              description: 'Accès complet au réseau hospitalier, dispatching temps réel, courses illimitées et régulation prioritaire.',
            },
            unit_amount: 1990, // 19,90 €
            recurring: {
              interval: 'month'
            }
          },
          quantity: 1
        };

    // 5. Création de la Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      success_url: `${origin}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/abonnement/annule`,
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      metadata: {
        transporter_id: transporterId,
        source: 'clinigo_pro_subscription'
      },
      subscription_data: {
        metadata: {
          transporter_id: transporterId
        }
      }
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      url: session.url,
      sessionId: session.id
    }));
  } catch (error: any) {
    console.error('[Stripe Checkout Error]', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Erreur lors de la création de la session de paiement.'
    }));
  }
}

/**
 * 2. Création de session Stripe Customer Portal
 * POST /api/stripe/create-portal-session
 */
export async function handleStripePortalSessionMiddleware(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const rawBody = await getRawBody(req);
    const body = rawBody.length ? JSON.parse(rawBody.toString('utf-8')) : {};
    const { transporterId } = body;

    if (!transporterId) {
      res.writeHead(400);
      res.end(JSON.stringify({ success: false, error: 'Identifiant du transporteur (transporterId) requis.' }));
      return;
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      res.writeHead(503);
      res.end(JSON.stringify({
        success: false,
        error: 'Stripe n\'est pas encore configuré sur le serveur (STRIPE_SECRET_KEY absente).'
      }));
      return;
    }

    // Recherche du customer ID dans transporters ou subscriptions
    let stripeCustomerId: string | null = null;
    try {
      const { data: transporter } = await supabase
        .from('transporters')
        .select('stripe_customer_id')
        .eq('id', transporterId)
        .maybeSingle();

      if (transporter?.stripe_customer_id) {
        stripeCustomerId = transporter.stripe_customer_id;
      } else {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('stripe_customer_id')
          .eq('transporter_id', transporterId)
          .maybeSingle();

        if (sub?.stripe_customer_id) {
          stripeCustomerId = sub.stripe_customer_id;
        }
      }
    } catch (e) {
      console.warn('[Stripe Portal] Erreur recherche customer :', e);
    }

    if (!stripeCustomerId) {
      res.writeHead(404);
      res.end(JSON.stringify({
        success: false,
        error: 'Aucun compte Stripe associé trouvé pour ce transporteur. Veuillez d\'abord souscrire un abonnement.'
      }));
      return;
    }

    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
    const origin = `${protocol}://${host}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${origin}/portal-transporteur`
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      url: portalSession.url
    }));
  } catch (error: any) {
    console.error('[Stripe Portal Error]', error);
    res.writeHead(500);
    res.end(JSON.stringify({
      success: false,
      error: error.message || 'Erreur lors de l\'accès au portail de facturation.'
    }));
  }
}

/**
 * 3. Réception et traitement sécurisé des Webhooks Stripe
 * POST /api/stripe/webhook
 */
export async function handleStripeWebhookMiddleware(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');

  const stripe = getStripeInstance();
  if (!stripe) {
    res.writeHead(503);
    res.end(JSON.stringify({ error: 'Stripe non configuré.' }));
    return;
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers['stripe-signature'];

  let rawBody: Buffer;
  try {
    rawBody = await getRawBody(req);
  } catch (e: any) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: 'Lecture du corps de requête impossible' }));
    return;
  }

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // En mode développement si le secret n'est pas encore renseigné
      event = JSON.parse(rawBody.toString('utf-8'));
      console.warn('[Stripe Webhook] AVERTISSEMENT : Signature non vérifiée (STRIPE_WEBHOOK_SECRET non configuré en local).');
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Error] ${err.message}`);
    res.writeHead(400);
    res.end(JSON.stringify({ error: `Webhook Error: ${err.message}` }));
    return;
  }

  console.log(`[Stripe Webhook Received] Type: ${event.type} | ID: ${event.id}`);

  // Idempotence : Vérification si cet événement a déjà été traité
  try {
    const { data: existingEvent } = await supabase
      .from('stripe_webhook_events')
      .select('id, processed')
      .eq('stripe_event_id', event.id)
      .maybeSingle();

    if (existingEvent && existingEvent.processed) {
      console.log(`[Stripe Webhook] Événement déjà traité (Idempotence) : ${event.id}`);
      res.writeHead(200);
      res.end(JSON.stringify({ received: true, duplicate: true }));
      return;
    }

    if (!existingEvent) {
      await supabase
        .from('stripe_webhook_events')
        .insert({
          stripe_event_id: event.id,
          event_type: event.type,
          processed: false,
          payload: event
        });
    }
  } catch (err) {
    console.warn('[Stripe Webhook] Log idempotence ignoré (table peut-être absente en local) :', err);
  }

  try {
    switch (event.type) {
      // =========================================================================
      // 1. Session Checkout terminée
      // =========================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const transporterId = session.metadata?.transporter_id || session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (transporterId && subscriptionId) {
          // Récupération des détails de l'abonnement auprès de Stripe
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id || '';

          const periodStart = (sub as any).current_period_start ? new Date((sub as any).current_period_start * 1000).toISOString() : new Date().toISOString();
          const periodEnd = (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 86400000).toISOString();

          await supabase
            .from('subscriptions')
            .upsert({
              transporter_id: transporterId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              stripe_price_id: priceId,
              status: sub.status, // 'active', 'trialing', etc.
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: sub.cancel_at_period_end,
              updated_at: new Date().toISOString()
            }, { onConflict: 'transporter_id' });

          // Mise à jour de stripe_customer_id sur transporters
          await supabase
            .from('transporters')
            .update({ stripe_customer_id: customerId })
            .eq('id', transporterId);
        }
        break;
      }

      // =========================================================================
      // 2. Abonnement créé ou mis à jour
      // =========================================================================
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        let transporterId = sub.metadata?.transporter_id;

        // Si le transporterId n'est pas dans les métadonnées, recherche via le customer ID
        if (!transporterId) {
          const { data: transporter } = await supabase
            .from('transporters')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .maybeSingle();

          if (transporter) {
            transporterId = transporter.id;
          }
        }

        if (transporterId) {
          const priceId = sub.items.data[0]?.price?.id || '';
          const periodStart = (sub as any).current_period_start ? new Date((sub as any).current_period_start * 1000).toISOString() : null;
          const periodEnd = (sub as any).current_period_end ? new Date((sub as any).current_period_end * 1000).toISOString() : null;

          await supabase
            .from('subscriptions')
            .upsert({
              transporter_id: transporterId,
              stripe_customer_id: customerId,
              stripe_subscription_id: sub.id,
              stripe_price_id: priceId,
              status: sub.status,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: sub.cancel_at_period_end,
              canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'transporter_id' });
        }
        break;
      }

      // =========================================================================
      // 3. Abonnement résilié ou supprimé
      // =========================================================================
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // =========================================================================
      // 4. Facture payée (invoice.paid)
      // =========================================================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Trouver le transporter lié
        const { data: transporter } = await supabase
          .from('transporters')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (transporter) {
          const amount = (invoice.amount_paid || 0) / 100;
          const paidAt = invoice.status_transitions?.paid_at 
            ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
            : new Date().toISOString();

          await supabase
            .from('invoices')
            .upsert({
              transporter_id: transporter.id,
              stripe_customer_id: customerId,
              stripe_invoice_id: invoice.id,
              amount: amount,
              currency: invoice.currency || 'eur',
              status: 'paid',
              invoice_url: invoice.hosted_invoice_url || null,
              invoice_pdf: invoice.invoice_pdf || null,
              paid_at: paidAt,
              updated_at: new Date().toISOString()
            }, { onConflict: 'stripe_invoice_id' });

          // Si l'abonnement était en retard de paiement (past_due), il redevient actif
          await supabase
            .from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('transporter_id', transporter.id);
        }
        break;
      }

      // =========================================================================
      // 5. Échec de paiement de facture (invoice.payment_failed)
      // =========================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: transporter } = await supabase
          .from('transporters')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (transporter) {
          const amount = (invoice.amount_due || 0) / 100;

          await supabase
            .from('invoices')
            .upsert({
              transporter_id: transporter.id,
              stripe_customer_id: customerId,
              stripe_invoice_id: invoice.id,
              amount: amount,
              currency: invoice.currency || 'eur',
              status: 'open',
              invoice_url: invoice.hosted_invoice_url || null,
              invoice_pdf: invoice.invoice_pdf || null,
              updated_at: new Date().toISOString()
            }, { onConflict: 'stripe_invoice_id' });

          // Mise à jour du statut d'abonnement en impayé
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('transporter_id', transporter.id);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Événement non pris en charge spécifiquement : ${event.type}`);
    }

    // Marquer l'événement comme traité
    await supabase
      .from('stripe_webhook_events')
      .update({
        processed: true,
        processed_at: new Date().toISOString()
      })
      .eq('stripe_event_id', event.id);

    res.writeHead(200);
    res.end(JSON.stringify({ received: true }));
  } catch (err: any) {
    console.error('[Stripe Webhook Processing Error]', err);

    await supabase
      .from('stripe_webhook_events')
      .update({
        error_message: err.message || 'Erreur inconnue',
        processed: false
      })
      .eq('stripe_event_id', event.id);

    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Erreur lors du traitement de l\'événement.' }));
  }
}

/**
 * 4. Consultation de l'état de l'abonnement et des factures
 * GET /api/stripe/subscription?transporterId=...
 */
export async function handleStripeSubscriptionStatusMiddleware(req: any, res: any, parsedUrl: URL) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const transporterId = parsedUrl.searchParams.get('transporterId');
  if (!transporterId) {
    res.writeHead(400);
    res.end(JSON.stringify({ success: false, error: 'transporterId requis.' }));
    return;
  }

  try {
    // 1. Récupération de l'abonnement
    const { data: subscription, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('transporter_id', transporterId)
      .maybeSingle();

    if (subErr) {
      console.warn('[Stripe Status] Erreur table subscriptions :', subErr);
    }

    // 2. Récupération des factures
    const { data: invoices, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('transporter_id', transporterId)
      .order('created_at', { ascending: false });

    if (invErr) {
      console.warn('[Stripe Status] Erreur table invoices :', invErr);
    }

    // Détermination de l'état actif
    const isActuallyActive = subscription 
      ? (subscription.status === 'active' || subscription.status === 'trialing') 
      : false;

    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      hasActiveSubscription: isActuallyActive,
      subscription: subscription || null,
      invoices: invoices || []
    }));
  } catch (err: any) {
    console.error('[Stripe Status Error]', err);
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: err.message || 'Erreur serveur.' }));
  }
}
