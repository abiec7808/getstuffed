-- Migration: Global Access for Authenticated Users
-- This migration drops the restrictive "own-user-only" RLS policies and replaces them 
-- with policies that allow all authenticated users to view and manage all data.

-- 1. Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Authenticated users can access all profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. Customers
DROP POLICY IF EXISTS "Users can access own customers" ON public.customers;
CREATE POLICY "Authenticated users can access all customers" ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Estimates
DROP POLICY IF EXISTS "Users can access own estimates" ON public.estimates;
CREATE POLICY "Authenticated users can access all estimates" ON public.estimates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Estimate Items
DROP POLICY IF EXISTS "Users can access own estimate items" ON public.estimate_items;
CREATE POLICY "Authenticated users can access all estimate items" ON public.estimate_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Invoices
DROP POLICY IF EXISTS "Users can access own invoices" ON public.invoices;
CREATE POLICY "Authenticated users can access all invoices" ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Invoice Items
DROP POLICY IF EXISTS "Users can access own invoice items" ON public.invoice_items;
CREATE POLICY "Authenticated users can access all invoice items" ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Payments
DROP POLICY IF EXISTS "Users can access own payments" ON public.payments;
CREATE POLICY "Authenticated users can access all payments" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
