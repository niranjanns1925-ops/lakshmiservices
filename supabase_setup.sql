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
  name text NOT NULL,
  description text NOT NULL,
  fee numeric NOT NULL,
  icon text NOT NULL,
  requirements text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  "serviceId" uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  "serviceName" text NOT NULL,
  "userName" text NOT NULL,
  "userEmail" text NOT NULL,
  "userPhone" text NOT NULL,
  fee numeric NOT NULL,
  documents jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'Submitted'::text,
  "rejectionReason" text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert initial services
INSERT INTO public.services (name, description, fee, icon, requirements) VALUES 
('Community Certificate', 'Apply for your community/caste certificate.', 60, 'Users', '{"Aadhar Card", "Ration Card", "School Certificate", "Photo"}'),
('Income Certificate', 'Apply for income certificate for scholarships and subsidies.', 60, 'FileText', '{"Aadhar Card", "Ration Card", "Salary Slip / IT Return", "Photo"}'),
('Nativity Certificate', 'Apply for nativity/domicile certificate.', 60, 'Home', '{"Aadhar Card", "Ration Card", "Birth Certificate", "Photo"}'),
('First Graduate Certificate', 'Apply for First Graduate Certificate for fee concession.', 60, 'GraduationCap', '{"Aadhar Card", "Ration Card", "10th Marksheet", "12th Marksheet", "Transfer Certificate", "Parents TC"}'),
('PAN Card Apply', 'Apply for a new Permanent Account Number (PAN) card.', 150, 'CreditCard', '{"Aadhar Card", "2 Passport Photos"}'),
('PAN Card Correction', 'Update details like name, DOB, or photo on your PAN card.', 120, 'FileText', '{"Aadhar Card", "Old PAN Card Copy", "Proof of correction"}'),
('Passport Seva Registration', 'Register and book appointment for new or renewal of passport.', 300, 'Plane', '{"Aadhar Card", "Voter ID", "10th Marksheet", "Bank Passbook"}'),
('Voter ID Apply/Correction', 'Apply for a new Voter ID or make corrections to existing one.', 50, 'FileText', '{"Aadhar Card", "Passport Photo"}'),
('Aadhar Update Appointment', 'Book an appointment to update your Aadhar details.', 50, 'FileText', '{"Current Aadhar Card", "Proof of update"}');

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
-- CREATE POLICY "Users can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = "userId");
-- CREATE POLICY "Admins can view all applications" ON public.applications FOR SELECT USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'admin'));
-- CREATE POLICY "Admins can update all applications" ON public.applications FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'admin'));

