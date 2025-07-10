-- Step 1: Create subscriptions table for recurring expense definitions
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  expense_type_id UUID REFERENCES public.expense_types(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  category_id UUID REFERENCES public.expense_categories(id),
  name VARCHAR NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'ILS',
  recurring_period VARCHAR NOT NULL CHECK (recurring_period IN ('monthly', 'yearly', 'quarterly', 'weekly')),
  start_date DATE NOT NULL,
  next_charge_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  payment_method VARCHAR DEFAULT 'credit_card',
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Create expense_charges table for actual charges (both one-time and subscription charges)
CREATE TABLE public.expense_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  expense_type_id UUID REFERENCES public.expense_types(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  category_id UUID REFERENCES public.expense_categories(id),
  description VARCHAR NOT NULL,
  amount NUMERIC NOT NULL,
  currency VARCHAR DEFAULT 'ILS',
  charge_date DATE NOT NULL,
  payment_method VARCHAR DEFAULT 'credit_card',
  invoice_number VARCHAR,
  receipt_file_url VARCHAR,
  receipt_file_name VARCHAR,
  receipt_drive_id VARCHAR,
  notes TEXT,
  is_subscription_charge BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: Enable RLS on new tables
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_charges ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" 
ON public.subscriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 5: Create RLS policies for expense_charges
CREATE POLICY "Users can view their own expense charges" 
ON public.expense_charges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expense charges" 
ON public.expense_charges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expense charges" 
ON public.expense_charges 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expense charges" 
ON public.expense_charges 
FOR DELETE 
USING (auth.uid() = user_id);

-- Step 6: Migrate existing one-time expenses to expense_charges
INSERT INTO public.expense_charges (
  user_id,
  expense_type_id,
  supplier_id,
  category_id,
  description,
  amount,
  currency,
  charge_date,
  payment_method,
  invoice_number,
  receipt_file_url,
  receipt_file_name,
  receipt_drive_id,
  notes,
  is_subscription_charge,
  active,
  created_at,
  updated_at
)
SELECT 
  user_id,
  expense_type_id,
  supplier_id,
  category_id,
  description,
  amount,
  currency,
  expense_date,
  payment_method,
  invoice_number,
  receipt_file_url,
  receipt_file_name,
  receipt_drive_id,
  notes,
  false,
  active,
  created_at,
  updated_at
FROM public.expenses 
WHERE is_recurring = false OR is_recurring IS NULL;

-- Step 7: Migrate existing recurring expenses to subscriptions
INSERT INTO public.subscriptions (
  user_id,
  expense_type_id,
  supplier_id,
  category_id,
  name,
  description,
  amount,
  currency,
  recurring_period,
  start_date,
  next_charge_date,
  end_date,
  auto_renew,
  payment_method,
  notes,
  is_active,
  created_at,
  updated_at
)
SELECT 
  user_id,
  expense_type_id,
  supplier_id,
  category_id,
  description AS name,
  description,
  amount,
  currency,
  recurring_period,
  COALESCE(recurring_start_date, expense_date),
  COALESCE(recurring_next_date, expense_date),
  recurring_end_date,
  auto_renew,
  payment_method,
  notes,
  active,
  created_at,
  updated_at
FROM public.expenses 
WHERE is_recurring = true;

-- Step 8: Create first charge for each subscription based on existing recurring expenses
INSERT INTO public.expense_charges (
  user_id,
  subscription_id,
  expense_type_id,
  supplier_id,
  category_id,
  description,
  amount,
  currency,
  charge_date,
  payment_method,
  invoice_number,
  receipt_file_url,
  receipt_file_name,
  receipt_drive_id,
  notes,
  is_subscription_charge,
  active,
  created_at,
  updated_at
)
SELECT 
  e.user_id,
  s.id,
  e.expense_type_id,
  e.supplier_id,
  e.category_id,
  e.description,
  e.amount,
  e.currency,
  e.expense_date,
  e.payment_method,
  e.invoice_number,
  e.receipt_file_url,
  e.receipt_file_name,
  e.receipt_drive_id,
  e.notes,
  true,
  e.active,
  e.created_at,
  e.updated_at
FROM public.expenses e
JOIN public.subscriptions s ON (
  e.user_id = s.user_id AND
  e.description = s.name AND
  e.amount = s.amount AND
  e.currency = s.currency
)
WHERE e.is_recurring = true;

-- Step 9: Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_next_charge_date ON public.subscriptions(next_charge_date) WHERE is_active = true;
CREATE INDEX idx_expense_charges_user_id ON public.expense_charges(user_id);
CREATE INDEX idx_expense_charges_subscription_id ON public.expense_charges(subscription_id);
CREATE INDEX idx_expense_charges_charge_date ON public.expense_charges(charge_date);

-- Step 10: Create triggers for updating timestamps
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_charges_updated_at
BEFORE UPDATE ON public.expense_charges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 11: Drop the old expenses table (commented out for safety - uncomment after verification)
-- DROP TABLE public.expenses;