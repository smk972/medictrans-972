-- ==============================================================================
-- Migration: Email Logs & User Profile Synchronization Trigger
-- Date: 2026-09-17
-- Description: 
--   1. Crée la table public.email_logs pour l'historique et l'anti-doublon (idempotence)
--   2. Ajoute le trigger automatique sur auth.users pour garantir la création de public.profiles
-- ==============================================================================

-- 1. Table d'audit et d'idempotence des emails envoyés
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    email_type TEXT NOT NULL, -- 'welcome', 'ride_confirmed', 'ride_assigned', etc.
    entity_id TEXT,           -- id utilisateur ou référence course pour idempotence
    resend_id TEXT,           -- Identifiant unique retourné par l'API Resend
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index de performance et recherche
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_entity ON public.email_logs(entity_id);

-- Index d'idempotence UNIQUE : empêche l'envoi en double d'un même email métier
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_idempotency 
ON public.email_logs(email_type, entity_id) 
WHERE status = 'sent' AND entity_id IS NOT NULL;

-- Activation RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour email_logs
-- Le service_role (Edge Functions / Backend) a un accès complet
CREATE POLICY "Service role has full access to email_logs"
    ON public.email_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Les admins peuvent consulter l'historique
CREATE POLICY "Admins can view email logs"
    ON public.email_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
            AND public.profiles.role = 'admin'
        )
    );

-- 2. Fonction et Trigger pour création automatique du profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role public.user_role := 'patient';
    v_first_name TEXT := '';
    v_last_name TEXT := '';
    v_phone TEXT := '';
BEGIN
    -- Extraction sécurisée des métadonnées envoyées lors du signUp()
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
            BEGIN
                v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
            EXCEPTION WHEN OTHERS THEN
                v_role := 'patient';
            END;
        END IF;

        v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
        v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');
    END IF;

    -- Insertion ou mise à jour du profil public
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        role,
        phone,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        v_first_name,
        v_last_name,
        v_role,
        v_phone,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = CASE WHEN profiles.first_name = '' THEN EXCLUDED.first_name ELSE profiles.first_name END,
        last_name = CASE WHEN profiles.last_name = '' THEN EXCLUDED.last_name ELSE profiles.last_name END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
