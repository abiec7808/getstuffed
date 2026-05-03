-- Add role to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Update RLS for profiles to allow admins to see everything
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update function to handle role assignment
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

  INSERT INTO public.profiles (id, business_name, role, username, business_email)
  VALUES (new.id, 'GetStuffed Business', v_role, v_username, new.email)
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    username = EXCLUDED.username,
    business_email = EXCLUDED.business_email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
