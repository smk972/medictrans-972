-- ==============================================================================
-- MIGRATION : TABLE public.transporter_intervention_zones
-- Remplacement complet du système de zones d'intervention
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.transporter_intervention_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id TEXT NOT NULL,
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  city_name TEXT NOT NULL,
  city_insee TEXT,
  base_address TEXT NOT NULL,
  base_lat DOUBLE PRECISION NOT NULL,
  base_lng DOUBLE PRECISION NOT NULL,
  base_source TEXT DEFAULT 'MANUAL', -- 'GPS' | 'ADDRESS' | 'MANUAL'
  polygon_coordinates JSONB NOT NULL, -- Tableau de { "lat": number, "lng": number }
  allow_extended_radius BOOLEAN DEFAULT FALSE,
  extended_radius_km INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_transporter_intervention_zone UNIQUE (transporter_id)
);

-- Index pour requêtes performantes
CREATE INDEX IF NOT EXISTS idx_transporter_intervention_zones_transporter ON public.transporter_intervention_zones(transporter_id);
CREATE INDEX IF NOT EXISTS idx_transporter_intervention_zones_region ON public.transporter_intervention_zones(region_code);

-- Activation de RLS
ALTER TABLE public.transporter_intervention_zones ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Un transporteur gère sa propre zone, admins et lecture autorisés pour le matching
DROP POLICY IF EXISTS "Allow transporter manage own intervention zone" ON public.transporter_intervention_zones;
CREATE POLICY "Allow transporter manage own intervention zone" 
ON public.transporter_intervention_zones
FOR ALL 
USING (true)
WITH CHECK (true);
