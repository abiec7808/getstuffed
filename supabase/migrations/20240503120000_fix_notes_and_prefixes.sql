-- 1. Ensure notes column exists in invoices and estimates
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='notes') THEN
        ALTER TABLE public.invoices ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estimates' AND column_name='notes') THEN
        ALTER TABLE public.estimates ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 2. Add estimate_prefix to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS estimate_prefix TEXT DEFAULT 'EST-';

-- 3. Update existing profiles if they have null prefixes
UPDATE public.profiles SET 
  estimate_prefix = 'EST-' WHERE estimate_prefix IS NULL;
UPDATE public.profiles SET 
  invoice_prefix = 'INV-' WHERE invoice_prefix IS NULL;
