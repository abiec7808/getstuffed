-- TABLES SETUP

-- Profiles table for business info
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  business_name TEXT,
  business_address TEXT,
  business_email TEXT,
  business_phone TEXT,
  logo_url TEXT,
  default_tax_rate DECIMAL(5,2) DEFAULT 15.00,
  invoice_prefix TEXT DEFAULT 'INV-',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

-- Customers table
CREATE TABLE public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Estimates table
CREATE TABLE public.estimates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_id UUID REFERENCES public.customers NOT NULL,
  estimate_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'converted')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Estimate items
CREATE TABLE public.estimate_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID REFERENCES public.estimates ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Invoices table
CREATE TABLE public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_id UUID REFERENCES public.customers NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- Invoice items
CREATE TABLE public.invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Payments table
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT CHECK (method IN ('cash', 'bank_transfer', 'card', 'other')),
  payment_date DATE DEFAULT CURRENT_DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now()) NOT NULL
);

-- RLS POLICIES

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see and update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Customers: Users can only access their own customers
CREATE POLICY "Users can access own customers" ON public.customers FOR ALL USING (auth.uid() = user_id);

-- Estimates: Users can only access their own estimates
CREATE POLICY "Users can access own estimates" ON public.estimates FOR ALL USING (auth.uid() = user_id);

-- Estimate items: Access through estimate ownership
CREATE POLICY "Users can access own estimate items" ON public.estimate_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.estimates WHERE id = estimate_items.estimate_id AND user_id = auth.uid())
);

-- Invoices: Users can only access their own invoices
CREATE POLICY "Users can access own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- Invoice items: Access through invoice ownership
CREATE POLICY "Users can access own invoice items" ON public.invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_items.invoice_id AND user_id = auth.uid())
);

-- Payments: Access through invoice ownership
CREATE POLICY "Users can access own payments" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE id = payments.invoice_id AND user_id = auth.uid())
);

-- FUNCTIONS & TRIGGERS

-- Automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, business_name)
  VALUES (new.id, 'My Business');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
