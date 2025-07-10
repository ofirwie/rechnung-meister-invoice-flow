-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  tax_id VARCHAR(50),
  address TEXT,
  contact_person VARCHAR(255),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense types table
CREATE TABLE public.expense_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_type_id UUID REFERENCES expense_types(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_type_id, name)
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_type_id UUID REFERENCES expense_types(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'ILS' CHECK (currency IN ('ILS', 'EUR')),
  expense_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_period VARCHAR(20) CHECK (recurring_period IN ('monthly', 'yearly', 'quarterly', 'weekly')),
  recurring_start_date DATE,
  recurring_next_date DATE,
  recurring_end_date DATE,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50) DEFAULT 'credit_card',
  invoice_number VARCHAR(100),
  receipt_file_url VARCHAR(500),
  receipt_file_name VARCHAR(255),
  receipt_drive_id VARCHAR(255),
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Users can view their own suppliers" ON public.suppliers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own suppliers" ON public.suppliers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own suppliers" ON public.suppliers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own suppliers" ON public.suppliers
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for expense types (read-only for all authenticated users)
CREATE POLICY "Users can read expense types" ON public.expense_types
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for expense categories (read-only for all authenticated users)
CREATE POLICY "Users can read expense categories" ON public.expense_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Insert default expense types
INSERT INTO public.expense_types (name, description, color) VALUES
('business', 'Business expenses for tax purposes', '#3B82F6'),
('personal', 'Personal and family expenses', '#10B981');

-- Insert default business categories
INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'מנויים דיגיטליים', 'תוכנות, SaaS, שירותי ענן', '#3B82F6', 1
FROM expense_types et WHERE et.name = 'business';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'תקשורת', 'אינטרנט, טלפון, סלולר', '#10B981', 2
FROM expense_types et WHERE et.name = 'business';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'משרד וציוד', 'ציוד משרדי, מחשבים, ריהוט', '#F59E0B', 3
FROM expense_types et WHERE et.name = 'business';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'שיווק ופרסום', 'קידום, פרסום, עיצוב', '#EF4444', 4
FROM expense_types et WHERE et.name = 'business';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'חשמל ומים', 'חשבונות חשמל, מים, ארנונה', '#8B5CF6', 5
FROM expense_types et WHERE et.name = 'business';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'תחבורה', 'דלק, חניה, תחבורה ציבורית', '#F97316', 6
FROM expense_types et WHERE et.name = 'business';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'אחר', 'הוצאות עסקיות שונות', '#6B7280', 99
FROM expense_types et WHERE et.name = 'business';

-- Insert default personal categories
INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'מזון וקניות', 'סופרמרקט, מסעדות, קניות יום יום', '#22C55E', 1
FROM expense_types et WHERE et.name = 'personal';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'בריאות', 'רופאים, תרופות, ביטוח בריאות', '#EF4444', 2
FROM expense_types et WHERE et.name = 'personal';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'חינוך', 'גן, בית ספר, שכר לימוד, ספרים', '#3B82F6', 3
FROM expense_types et WHERE et.name = 'personal';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'בילויים ונופש', 'קולנוע, מסעדות, חופשות', '#F59E0B', 4
FROM expense_types et WHERE et.name = 'personal';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'בית ותחזוקה', 'שיפוצים, כלי בית, ניקיון', '#8B5CF6', 5
FROM expense_types et WHERE et.name = 'personal';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'רכב ותחבורה', 'דלק, ביטוח, טיפולים, תחבורה ציבורית', '#F97316', 6
FROM expense_types et WHERE et.name = 'personal';

INSERT INTO public.expense_categories (expense_type_id, name, description, color, sort_order) 
SELECT et.id, 'אחר', 'הוצאות אישיות שונות', '#6B7280', 99
FROM expense_types et WHERE et.name = 'personal';

-- Create indexes for performance
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_active ON suppliers(active);

CREATE INDEX idx_expense_categories_type ON expense_categories(expense_type_id);
CREATE INDEX idx_expense_categories_active ON expense_categories(active);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_type ON expenses(expense_type_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_supplier ON expenses(supplier_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_recurring ON expenses(is_recurring);
CREATE INDEX idx_expenses_active ON expenses(active);
CREATE INDEX idx_expenses_next_date ON expenses(recurring_next_date) WHERE is_recurring = TRUE;
CREATE INDEX idx_expenses_currency ON expenses(currency);

-- Create triggers for automatic updated_at
CREATE TRIGGER update_suppliers_updated_at 
  BEFORE UPDATE ON suppliers 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at 
  BEFORE UPDATE ON expenses 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();