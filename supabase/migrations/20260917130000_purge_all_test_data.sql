-- =========================================================================
-- PURGE COMPLÈTE DE TOUTES LES DONNÉES DE TEST & PROTOTYPES
-- =========================================================================
-- Nettoyage complet des tables transactionnelles pour démarrer avec un état
-- 100% réel et propre pour les clients et transporteurs.

-- 1. Suppression des traces de trajets et notifications de test
TRUNCATE TABLE public.ride_events CASCADE;
TRUNCATE TABLE public.notifications CASCADE;

-- 2. Suppression de toutes les réservations de test antérieures
DELETE FROM public.rides 
WHERE reference LIKE 'MT-%' 
   OR reference LIKE 'TEST-%' 
   OR reference LIKE 'VERIF-%'
   OR reference LIKE 'PURGED-%'
   OR reference LIKE 'DEMO-%';

-- 3. Ajout de la politique de suppression RLS pour les administrateurs si besoin
DO $$
BEGIN
    DROP POLICY IF EXISTS "rides_delete_policy" ON public.rides;
    CREATE POLICY "rides_delete_policy" ON public.rides
        FOR DELETE
        TO public
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = auth.uid() AND p.role IN ('ADMIN', 'DISPATCHER')
            )
        );
END $$;
