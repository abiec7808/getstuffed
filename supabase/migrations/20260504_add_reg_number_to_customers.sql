-- Add registration_number to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS registration_number TEXT;
