-- ==============================================================================
-- MIGRATION : TABLE public.subscriptions, stripe_webhook_events, invoices
-- Clinigo.fr — Abonnement Pro Transporteur (19,90 € / mois) via Stripe
-- ==============================================================================

-- 1. Ajout de stripe_customer_id sur public.transporters
ALTER TABLE public.transporters 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Index sur stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_transporters_stripe_customer_id 
ON public.transporters(stripe_customer_id);

-- 2. Table des abonnements (synchronisée depuis Stripe)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id UUID NOT NULL REFERENCES public.transporters(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_transporter_subscription UNIQUE (transporter_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_transporter_id ON public.subscriptions(transporter_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3. Table d'idempotence des webhooks Stripe
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  payload JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON public.stripe_webhook_events(event_type);

-- 4. Table des factures réelles Stripe
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id UUID NOT NULL REFERENCES public.transporters(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL, -- 'paid', 'open', 'void', 'uncollectible'
  invoice_url TEXT,
  invoice_pdf TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_transporter_id ON public.invoices(transporter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_customer_id ON public.invoices(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id);

-- 5. RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture et gestion
DROP POLICY IF EXISTS "Transporters can read own subscription" ON public.subscriptions;
CREATE POLICY "Transporters can read own subscription"
ON public.subscriptions FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions"
ON public.subscriptions FOR ALL
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Transporters can read own invoices" ON public.invoices;
CREATE POLICY "Transporters can read own invoices"
ON public.invoices FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role manages invoices" ON public.invoices;
CREATE POLICY "Service role manages invoices"
ON public.invoices FOR ALL
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role manages webhook events"
ON public.stripe_webhook_events FOR ALL
USING (true) WITH CHECK (true);
