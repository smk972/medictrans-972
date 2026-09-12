-- ==============================================================================
-- SCHEMA SUPABASE: MÉDIC'TRANS MARTINIQUE (Plateforme Transport Sanitaire 972)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE transport_type AS ENUM ('TAXI_CONVENTIONNE', 'VSL', 'AMBULANCE');
CREATE TYPE ride_status AS ENUM ('PENDING', 'ACCEPTED', 'EN_ROUTE', 'PICKED_UP', 'COMPLETED', 'CANCELLED');
CREATE TYPE facility_type AS ENUM ('HOSPITAL', 'CLINIC', 'DIALYSIS', 'EHPAD', 'REHAB');
CREATE TYPE user_role AS ENUM ('PATIENT', 'FACILITY', 'TRANSPORTER', 'ADMIN');

-- 3. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'PATIENT',
  nir TEXT, -- Numéro Sécurité Sociale
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE FACILITIES (Hôpitaux, Cliniques, Centres de dialyse)
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  finess TEXT UNIQUE NOT NULL,
  type facility_type NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  departments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLE TRANSPORTERS (Ambulances, VSL, Taxis conventionnés)
CREATE TABLE IF NOT EXISTS public.transporters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  siret TEXT UNIQUE NOT NULL,
  ars_license TEXT NOT NULL,
  cpam_convention_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  fleet_ambulances INT DEFAULT 0,
  fleet_vsl INT DEFAULT 0,
  fleet_taxis INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLE RIDES (Réservations et courses)
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_city TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_city TEXT NOT NULL,
  facility_name TEXT,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ,
  is_round_trip BOOLEAN DEFAULT FALSE,
  transport_type transport_type NOT NULL,
  status ride_status DEFAULT 'PENDING',
  
  -- Patient data
  patient_first_name TEXT NOT NULL,
  patient_last_name TEXT NOT NULL,
  patient_birth_date DATE NOT NULL,
  patient_nir TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT,
  patient_is_ald BOOLEAN DEFAULT FALSE,
  patient_has_pmt BOOLEAN DEFAULT TRUE,
  pmt_prescriber_doctor TEXT,
  pmt_file_url TEXT,
  
  -- Mobility & Needs
  mobility_wheelchair BOOLEAN DEFAULT FALSE,
  mobility_stretcher BOOLEAN DEFAULT FALSE,
  mobility_oxygen BOOLEAN DEFAULT FALSE,
  mobility_stairs BOOLEAN DEFAULT FALSE,
  mobility_stairs_count INT,
  mobility_needs_escort BOOLEAN DEFAULT FALSE,
  mobility_notes TEXT,
  
  -- Assignment
  transporter_id UUID REFERENCES public.transporters(id),
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_plate TEXT,
  eta_minutes INT,
  
  -- Source & Department
  source TEXT DEFAULT 'PATIENT',
  facility_department TEXT,
  bed_discharge_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour les recherches de référence (suivi anonymisé par code dossier)
CREATE POLICY "Allow public read by reference" ON public.rides 
  FOR SELECT USING (true);

-- Création de course publique
CREATE POLICY "Allow public insert rides" ON public.rides 
  FOR INSERT WITH CHECK (true);

-- Mise à jour des courses par les transporteurs ou établissements
CREATE POLICY "Allow updates on rides" ON public.rides 
  FOR UPDATE USING (true);

-- Transporters & Facilities read
CREATE POLICY "Allow read transporters" ON public.transporters 
  FOR SELECT USING (true);

CREATE POLICY "Allow insert transporters" ON public.transporters 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read facilities" ON public.facilities 
  FOR SELECT USING (true);

CREATE POLICY "Allow insert facilities" ON public.facilities 
  FOR INSERT WITH CHECK (true);

-- 8. SEED DATA (Martinique)
INSERT INTO public.facilities (name, finess, type, address, city, contact_name, contact_role, contact_phone, contact_email, departments)
VALUES 
  ('CHU de Martinique - Hôpital Pierre Zobda-Quitman', '970200021', 'HOSPITAL', 'Route de Châteauboeuf', 'Fort-de-France', 'Dr. Alix Célestine', 'Cadre Supérieur de Santé', '0596552000', 'direction@chu-martinique.fr', ARRAY['Néphrologie & Dialyse', 'Oncologie & Chimiothérapie', 'Cardiologie', 'Chirurgie Ambulatoire', 'Urgences']),
  ('Clinique Sainte-Marie', '970200088', 'CLINIC', 'Chemin des Rochers', 'Schœlcher', 'Marie-Paule Valaire', 'Responsable des Sorties', '0596614100', 'admissions@clinique-stemarie.mq', ARRAY['Chirurgie Orthopédique', 'Maternité', 'Chirurgie Ambulatoire']),
  ('Centre d''Hémodialyse de Dillon', '970200153', 'DIALYSIS', 'Avenue Salvador Allende', 'Fort-de-France', 'Julien Montrose', 'Coordinateur de Soins', '0596791234', 'dialyse.dillon@sante-972.fr', ARRAY['Hémodialyse Adulte', 'Néphrologie Consultations'])
ON CONFLICT (finess) DO NOTHING;

INSERT INTO public.transporters (company_name, siret, ars_license, cpam_convention_number, phone, email, address, city, fleet_ambulances, fleet_vsl, fleet_taxis, verified)
VALUES 
  ('Ambulances Madinina Secours', '48129402900018', '972-AMB-2021-04', '972-CPAM-881', '0596752020', 'contact@madinina-secours.mq', 'Zone Industrielle Lézarde', 'Le Lamentin', 6, 8, 4, true),
  ('Caraïbes Transports Sanitaires', '51293819200024', '972-AMB-2019-12', '972-CPAM-654', '0596634545', 'dispatch@caraibes-transports.mq', 'Route de la Folie', 'Fort-de-France', 4, 6, 2, true)
ON CONFLICT (siret) DO NOTHING;
