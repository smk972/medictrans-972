-- ==============================================================================
-- MIGRATION : MODULES SAAS DE GESTION PROFESSIONNELLE DU TRANSPORTEUR
-- Tables : public.transporter_drivers, public.transporter_vehicles, public.transporter_clients
-- Extension additive pour public.rides
-- ==============================================================================

-- 1. Table Chauffeurs Professionnels
CREATE TABLE IF NOT EXISTS public.transporter_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Ambulancier Diplômé d''État (ADE)',
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DISPONIBLE', -- 'DISPONIBLE' | 'EN_MISSION' | 'EN_REPOS' | 'EN_PAUSE'
  assigned_vehicle_plate TEXT,
  license_number TEXT,
  professional_card_number TEXT,
  card_expiry_date DATE,
  medical_certificate_expiry DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table Véhicules & Flotte Homologuée
CREATE TABLE IF NOT EXISTS public.transporter_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'VSL', -- 'AMBULANCE' | 'VSL' | 'TAXI_CONVENTIONNE' | 'TPMR'
  plate TEXT NOT NULL,
  driver TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'DISPONIBLE', -- 'DISPONIBLE' | 'EN_MISSION' | 'EN_PAUSE' | 'MAINTENANCE'
  technical_inspection_date DATE,
  sanitary_approval_expiry DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table Répertoire Patients / Clients de l'Entreprise
CREATE TABLE IF NOT EXISTS public.transporter_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporter_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  nir TEXT,
  pickup_address TEXT,
  pickup_city TEXT,
  dropoff_address TEXT,
  dropoff_city TEXT,
  mobility_needs TEXT, -- 'Assis' | 'Allongé' | 'Fauteuil roulant' | 'Accompagnateur'
  referring_facility TEXT,
  emergency_contact TEXT,
  notes TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enrichissement additif de la table rides pour liaisons de gestion
ALTER TABLE public.rides
ADD COLUMN IF NOT EXISTS assigned_driver_id TEXT,
ADD COLUMN IF NOT EXISTS assigned_vehicle_plate TEXT,
ADD COLUMN IF NOT EXISTS client_id TEXT,
ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;

-- 5. Index de performance multi-tenant
CREATE INDEX IF NOT EXISTS idx_transporter_drivers_transporter ON public.transporter_drivers(transporter_id);
CREATE INDEX IF NOT EXISTS idx_transporter_vehicles_transporter ON public.transporter_vehicles(transporter_id);
CREATE INDEX IF NOT EXISTS idx_transporter_clients_transporter ON public.transporter_clients(transporter_id);
CREATE INDEX IF NOT EXISTS idx_rides_transporter_exported ON public.rides(transporter_id, exported_at);

-- 6. Sécurité & RLS
ALTER TABLE public.transporter_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporter_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow transporter manage drivers" ON public.transporter_drivers;
CREATE POLICY "Allow transporter manage drivers"
ON public.transporter_drivers
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow transporter manage vehicles" ON public.transporter_vehicles;
CREATE POLICY "Allow transporter manage vehicles"
ON public.transporter_vehicles
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow transporter manage clients" ON public.transporter_clients;
CREATE POLICY "Allow transporter manage clients"
ON public.transporter_clients
FOR ALL
USING (true)
WITH CHECK (true);
