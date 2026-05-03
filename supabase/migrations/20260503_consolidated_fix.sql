-- Consolidated fix for missing columns and RLS recursion

-- 1. Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estimate_prefix TEXT DEFAULT 'EST-';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_holder TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Add notes column to invoices and estimates
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='notes') THEN
        ALTER TABLE invoices ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estimates' AND column_name='notes') THEN
        ALTER TABLE estimates ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 3. Fix RLS recursion in profiles
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view everything" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update everything" ON public.profiles;

-- Create clean policies
-- Most users only need to access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Admins can see everything based on JWT metadata or email check to avoid recursion
-- Checking by email is the most reliable way to avoid table lookup recursion
CREATE POLICY "Admins can view everything" ON public.profiles 
FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@getstuffed.co.za');

CREATE POLICY "Admins can update everything" ON public.profiles 
FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@getstuffed.co.za');

-- 4. Update is_admin function to be safer
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- We can still query profiles here because it's SECURITY DEFINER,
  -- but this function should NOT be used directly inside a POLICY for public.profiles
  -- as that would cause recursion.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'user';
  v_username TEXT;
BEGIN
  -- Get username from metadata
  v_username := COALESCE(new.raw_user_meta_data->>'username', 'User');

  -- Check if this is the target admin email
  IF (new.email = 'admin@getstuffed.co.za') THEN
    v_role := 'admin';
    v_username := 'Admin';
  END IF;

  INSERT INTO public.profiles (
    id, 
    business_name, 
    role, 
    username, 
    business_email,
    estimate_prefix
  )
  VALUES (
    new.id, 
    'My Business', 
    v_role, 
    v_username, 
    new.email,
    'EST-'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    username = EXCLUDED.username,
    business_email = EXCLUDED.business_email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
