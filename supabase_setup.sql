-- Supabase Setup Script for Lakshmi E-Sevai Maiyam

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uid uuid NOT NULL UNIQUE,
  email text NOT NULL,
  name text,
  phone text,
  role text DEFAULT 'user'::text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category text DEFAULT 'General',
  "requiredDocuments" text[] DEFAULT '{}'::text[],
  "customFields" jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If the services table already exists from an older script, you can drop it or alter it.
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.services ADD COLUMN title text;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.services ADD COLUMN price numeric DEFAULT 0;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.services ADD COLUMN "requiredDocuments" text[] DEFAULT '{}'::text[];
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.services ADD COLUMN active boolean DEFAULT true;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE public.services ADD COLUMN category text DEFAULT 'General';
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.services ADD COLUMN "customFields" jsonb DEFAULT '[]'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    
    -- Sync up data if migrating from old columns
    BEGIN
        UPDATE public.services SET title = name WHERE title IS NULL AND name IS NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    
    BEGIN
        UPDATE public.services SET price = fee WHERE price = 0 AND fee IS NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
    
    BEGIN
        UPDATE public.services SET "requiredDocuments" = requirements WHERE "requiredDocuments" = '{}'::text[] AND requirements IS NOT NULL;
    EXCEPTION WHEN undefined_column THEN END;
END $$;

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  "serviceId" uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  "serviceName" text NOT NULL,
  "userEmail" text NOT NULL,
  "applicantDetails" jsonb DEFAULT '{}'::jsonb,
  fee numeric NOT NULL,
  documents jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Submitted'::text,
  "paymentStatus" text,
  "transactionId" text,
  "rejectionReason" text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If the applications table already exists from an older script, you can drop it or alter it.
-- We are just going to try adding the missing columns gracefully in case it exists:
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.applications ADD COLUMN "applicantDetails" jsonb DEFAULT '{}'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.applications ADD COLUMN "paymentStatus" text;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE public.applications ADD COLUMN "transactionId" text;
    EXCEPTION WHEN duplicate_column THEN END;
    
    -- Drop old columns that are no longer strictly needed by ApplyService but were in old script
    BEGIN
        ALTER TABLE public.applications DROP COLUMN "userName";
    EXCEPTION WHEN undefined_column THEN END;
    
    BEGIN
        ALTER TABLE public.applications DROP COLUMN "userPhone";
    EXCEPTION WHEN undefined_column THEN END;
END $$;

-- Insert initial services (only if table is empty to avoid errors, or just ignore since we use mock in frontend if empty)
-- We'll comment out the static inserts to prevent duplicate key/constraint issues, 
-- or you can use them:
INSERT INTO public.services (title, description, price, category, "requiredDocuments", active) VALUES 
('Community Certificate', 'Apply for your community/caste certificate.', 60, 'Certificate', '{"Aadhar Card", "Ration Card", "School Certificate", "Photo"}', true),
('Income Certificate', 'Apply for income certificate for scholarships and subsidies.', 60, 'Certificate', '{"Aadhar Card", "Ration Card", "Salary Slip / IT Return", "Photo"}', true),
('Nativity Certificate', 'Apply for nativity/domicile certificate.', 60, 'Certificate', '{"Aadhar Card", "Ration Card", "Birth Certificate", "Photo"}', true),
('First Graduate Certificate', 'Apply for First Graduate Certificate for fee concession.', 60, 'Certificate', '{"Aadhar Card", "Ration Card", "10th Marksheet", "12th Marksheet", "Transfer Certificate", "Parents TC"}', true),
('PAN Card Apply', 'Apply for a new Permanent Account Number (PAN) card.', 150, 'Identity', '{"Aadhar Card", "2 Passport Photos"}', true),
('PAN Card Correction', 'Update details like name, DOB, or photo on your PAN card.', 120, 'Identity', '{"Aadhar Card", "Old PAN Card Copy", "Proof of correction"}', true),
('Passport Seva Registration', 'Register and book appointment for new or renewal of passport.', 300, 'Travel', '{"Aadhar Card", "Voter ID", "10th Marksheet", "Bank Passbook"}', true),
('Voter ID Apply/Correction', 'Apply for a new Voter ID or make corrections to existing one.', 50, 'Identity', '{"Aadhar Card", "Passport Photo"}', true),
('Aadhar Update Appointment', 'Book an appointment to update your Aadhar details.', 50, 'Identity', '{"Current Aadhar Card", "Proof of update"}', true);

-- Set up Row Level Security (RLS)

-- Disable RLS temporarily to allow easy bootstrapping, or set up permissive policies
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;

-- If you prefer RLS enabled, run these later:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = uid);
-- CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = uid);
-- CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'admin'));
-- CREATE POLICY "Admins can update all users" ON public.users FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'admin'));

-- CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);
-- CREATE POLICY "Admins can manage services" ON public.services FOR ALL USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'admin'));

-- CREATE POLICY "Users can view their own applications" ON public.applications FOR SELECT USING (auth.uid() = "userId");
-- Set up Storage for Applications
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to uploaded applications
CREATE POLICY "Public Read Access on Applications Bucket" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'applications');

-- Let authenticated users upload
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'applications' AND auth.role() = 'authenticated');


