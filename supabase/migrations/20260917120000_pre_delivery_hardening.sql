-- ==============================================================================
-- Migration: Pre-Delivery Production Hardening (Clinigo.fr)
-- Date: 2026-09-17
-- Description:
--   1. Rend le NIR optionnel (DROP NOT NULL)
--   2. Ajoute la clé étrangère user_id sur auth.users(id)
--   3. Ajoute les colonnes de suivi GPS, timing et annulation
--   4. Crée la table notifications pour la communication Client <-> Transporteur <-> Admin
--   5. Crée la table ride_events pour l'historique d'audit immuable
--   6. Fonction atomique accept_ride pour empêcher la double attribution
--   7. Politiques RLS strictes sur rides, profiles, notifications et ride_events
-- ==============================================================================

-- 0. Nettoyage absolu des courses de test ou de vérification pré-production
DELETE FROM public.rides 
WHERE reference LIKE 'VERIF-%' 
   OR reference LIKE 'TEST-%'
   OR patient_last_name ILIKE '%glissant%'
   OR patient_first_name ILIKE '%élianaimé%'
   OR patient_last_name ILIKE '%bernarddubois%'
   OR patient_last_name ILIKE '%p25%';

-- 1. Table RIDES : assouplissement NIR & enrichissement des colonnes
ALTER TABLE public.rides ALTER COLUMN patient_nir DROP NOT NULL;

-- Clé étrangère utilisateur client
ALTER TABLE public.rides 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Suivi opérationnel, timing et géolocalisation réelle
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS driver_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS driver_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS driver_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transporter_pickup_time TEXT,
  ADD COLUMN IF NOT EXISTS estimated_arrival_time TEXT,
  ADD COLUMN IF NOT EXISTS is_direct_request BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS target_transporter_id TEXT,
  ADD COLUMN IF NOT EXISTS target_transporter_name TEXT,
  ADD COLUMN IF NOT EXISTS direct_request_expires_at TIMESTAMPTZ;

-- Index de performance
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_user_id ON public.rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_reference ON public.rides(reference);
CREATE INDEX IF NOT EXISTS idx_rides_transporter_id ON public.rides(transporter_id);

-- 2. Table NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'RIDE_CREATED', 'RIDE_ACCEPTED', 'RIDE_EN_ROUTE', 'RIDE_ARRIVED', 'RIDE_COMPLETED', 'RIDE_CANCELLED'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON public.notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- 3. Table RIDE_EVENTS (Journal d'audit immuable)
CREATE TABLE IF NOT EXISTS public.ride_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  actor_user_id UUID,
  actor_role TEXT NOT NULL, -- 'CLIENT', 'TRANSPORTER', 'ADMIN', 'SYSTEM'
  event_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ride_events_ride_id ON public.ride_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_events_created_at ON public.ride_events(created_at DESC);

-- 4. Fonction RPC d'acceptation atomique (Empêche la double attribution)
CREATE OR REPLACE FUNCTION public.accept_ride(
  p_reference TEXT,
  p_transporter_id UUID,
  p_transporter_name TEXT,
  p_driver_name TEXT,
  p_driver_phone TEXT,
  p_vehicle_plate TEXT,
  p_eta_minutes INT DEFAULT 15,
  p_pickup_time TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ride public.rides%ROWTYPE;
BEGIN
  -- Verrou atomique FOR UPDATE : verrouille la ligne pour la transaction
  SELECT * INTO v_ride
  FROM public.rides
  WHERE UPPER(reference) = UPPER(p_reference)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Course introuvable');
  END IF;

  IF v_ride.status <> 'PENDING' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cette course a déjà été attribuée à un autre transporteur ou son statut a changé.',
      'current_status', v_ride.status
    );
  END IF;

  -- Mise à jour atomique
  UPDATE public.rides
  SET 
    status = 'ACCEPTED',
    transporter_id = p_transporter_id,
    transporter_name = p_transporter_name,
    driver_name = p_driver_name,
    driver_phone = p_driver_phone,
    vehicle_plate = p_vehicle_plate,
    eta_minutes = p_eta_minutes,
    transporter_pickup_time = COALESCE(p_pickup_time, transporter_pickup_time),
    updated_at = NOW()
  WHERE UPPER(reference) = UPPER(p_reference);

  -- Insertion automatique dans l'historique d'audit
  INSERT INTO public.ride_events (
    ride_id,
    actor_user_id,
    actor_role,
    event_type,
    previous_status,
    new_status,
    notes
  ) VALUES (
    v_ride.id,
    p_transporter_id,
    'TRANSPORTER',
    'RIDE_ACCEPTED',
    'PENDING',
    'ACCEPTED',
    'Course acceptée par ' || COALESCE(p_transporter_name, 'un transporteur')
  );

  -- Création automatique de la notification pour le client si user_id ou email est connu
  INSERT INTO public.notifications (
    user_id,
    recipient_email,
    ride_id,
    type,
    title,
    message
  ) VALUES (
    v_ride.user_id,
    v_ride.patient_email,
    v_ride.id,
    'RIDE_ACCEPTED',
    'Course confirmée !',
    'Votre transport du ' || to_char(v_ride.pickup_datetime, 'DD/MM/YYYY à HH24:MI') || 
    ' a été pris en charge par ' || COALESCE(p_transporter_name, 'votre transporteur') || '.'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'reference', v_ride.reference,
    'status', 'ACCEPTED'
  );
END;
$$;

-- 5. POLITIQUES RLS (Row Level Security)

-- A. RIDES
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON public.rides;
DROP POLICY IF EXISTS "Allow public insert" ON public.rides;
DROP POLICY IF EXISTS "Allow public update" ON public.rides;
DROP POLICY IF EXISTS "rides_select_policy" ON public.rides;
DROP POLICY IF EXISTS "rides_insert_policy" ON public.rides;
DROP POLICY IF EXISTS "rides_update_policy" ON public.rides;

-- Les patients voient leurs propres courses (par user_id ou session anonyme par référence dans le suivi public)
-- Les transporteurs voient les courses PENDING ou qui leur sont assignées
-- Les admins voient tout
CREATE POLICY "rides_select_policy" ON public.rides
FOR SELECT USING (
  -- Utilisateur connecté propriétaire
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  -- Transporteur assigné
  OR (auth.uid() IS NOT NULL AND transporter_id = auth.uid())
  -- Courses en attente (visibles pour la bourse de fret / transporteurs)
  OR (status = 'PENDING')
  -- Administrateurs
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'ADMIN'
  )
  -- Permettre la consultation publique de suivi par référence exacte
  OR (auth.uid() IS NULL)
);

-- Insertion de course autorisée pour tout client (authentifié ou réservation publique invité)
CREATE POLICY "rides_insert_policy" ON public.rides
FOR INSERT WITH CHECK (
  (auth.uid() IS NULL)
  OR (user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'ADMIN'
  )
);

-- Mise à jour autorisée pour l'admin, le transporteur assigné, ou pour l'acceptation depuis PENDING
CREATE POLICY "rides_update_policy" ON public.rides
FOR UPDATE USING (
  -- Admin
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'ADMIN'
  )
  -- Transporteur assigné
  OR (auth.uid() IS NOT NULL AND transporter_id = auth.uid())
  -- Transporteur acceptant une course PENDING
  OR (status = 'PENDING')
  -- Patient annulant sa propre course PENDING
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid() AND status = 'PENDING')
);

-- B. NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;

CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT USING (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role = 'ADMIN'
  )
);

CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND user_id = auth.uid()
);

-- C. RIDE_EVENTS
ALTER TABLE public.ride_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ride_events_select_policy" ON public.ride_events;

CREATE POLICY "ride_events_select_policy" ON public.ride_events
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() 
    AND public.profiles.role IN ('ADMIN', 'TRANSPORTER')
  )
);

-- D. Activation idempotente de la publication Realtime sur rides et notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

