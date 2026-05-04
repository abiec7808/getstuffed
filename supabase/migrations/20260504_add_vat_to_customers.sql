-- Add vat_number to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS vat_number TEXT;
