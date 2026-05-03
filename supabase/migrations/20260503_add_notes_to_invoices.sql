-- Add notes column to invoices and estimates if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='notes') THEN
        ALTER TABLE invoices ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='estimates' AND column_name='notes') THEN
        ALTER TABLE estimates ADD COLUMN notes TEXT;
    END IF;
END $$;

