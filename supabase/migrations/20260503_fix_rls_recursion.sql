-- Fix infinite recursion in profiles table policies
-- The error was caused by the policy calling is_admin(), which in turn queries the profiles table.

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Create simplified, non-recursive policies
-- Most users only need to access their own profile.
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- 3. (Optional) If you want to allow admins to see everything, 
-- use a check that doesn't query the profiles table directly in the policy.
-- One way is to check the user's email if it's a fixed admin email.
CREATE POLICY "Admins can view everything" ON public.profiles 
FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@getstuffed.co.za');

CREATE POLICY "Admins can update everything" ON public.profiles 
FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@getstuffed.co.za');

-- 4. Update is_admin function to be safer (though not used in policies anymore)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- We can still query profiles here because it's SECURITY DEFINER,
  -- but we shouldn't call this function INSIDE a policy for the profiles table.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
