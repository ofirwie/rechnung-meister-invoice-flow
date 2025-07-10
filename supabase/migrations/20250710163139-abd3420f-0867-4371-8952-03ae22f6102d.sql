-- יצירת טבלת חברות
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255), -- שם עסקי רשמי
  tax_id VARCHAR(50) UNIQUE, -- ח.פ/ע.מ
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- הגדרות חברה
  default_currency VARCHAR(3) DEFAULT 'ILS' CHECK (default_currency IN ('ILS', 'EUR')),
  fiscal_year_start INTEGER DEFAULT 1 CHECK (fiscal_year_start BETWEEN 1 AND 12), -- חודש תחילת שנת כספים
  
  -- Google Drive settings
  drive_folder_id VARCHAR(255), -- תיקיית Google Drive של החברה
  
  -- מטא-דטה
  logo_url VARCHAR(500),
  settings JSONB DEFAULT '{}', -- הגדרות נוספות
  active BOOLEAN DEFAULT TRUE,
  
  -- audit
  owner_id UUID NOT NULL REFERENCES auth.users(id), -- הבעלים של החברה
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת משתמשי חברה (הרשאות)
CREATE TABLE company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'user', 'viewer')),
  
  -- הרשאות ספציפיות
  permissions JSONB DEFAULT '{
    "expenses": {"create": true, "read": true, "update": true, "delete": false},
    "suppliers": {"create": true, "read": true, "update": true, "delete": false},
    "categories": {"create": false, "read": true, "update": false, "delete": false},
    "reports": {"export": true, "view_all": false}
  }',
  
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(company_id, user_id)
);

-- אינדקסים לחברות
CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_companies_active ON companies(active);
CREATE UNIQUE INDEX idx_companies_tax_id ON companies(tax_id) WHERE active = TRUE;

-- אינדקסים למשתמשי חברה
CREATE INDEX idx_company_users_company ON company_users(company_id);
CREATE INDEX idx_company_users_user ON company_users(user_id);

-- הוספת company_id לטבלאות קיימות
ALTER TABLE suppliers 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE expense_categories 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE expenses 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- עדכון אינדקסים
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_categories_company ON expense_categories(company_id);
CREATE INDEX idx_expenses_company ON expenses(company_id);
CREATE INDEX idx_expenses_company_date ON expenses(company_id, expense_date DESC);
CREATE INDEX idx_expenses_company_type ON expenses(company_id, expense_type_id);

-- RLS Policies for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their companies" ON companies
  FOR ALL USING (
    owner_id = auth.uid() OR 
    id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND active = TRUE
    )
  );

-- RLS Policies for company_users
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company users" ON company_users
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() AND cu.active = TRUE
    )
  );

CREATE POLICY "Company owners and admins can manage users" ON company_users
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() AND cu.role IN ('owner', 'admin') AND cu.active = TRUE
    )
  );

-- עדכון RLS policies לטבלאות קיימות
DROP POLICY "Users can create their own suppliers" ON suppliers;
DROP POLICY "Users can delete their own suppliers" ON suppliers;
DROP POLICY "Users can update their own suppliers" ON suppliers;
DROP POLICY "Users can view their own suppliers" ON suppliers;

CREATE POLICY "Users can manage suppliers in their companies" ON suppliers
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND active = TRUE
    )
  );

-- עדכון policies להוצאות
DROP POLICY "Users can create their own expenses" ON expenses;
DROP POLICY "Users can delete their own expenses" ON expenses;
DROP POLICY "Users can update their own expenses" ON expenses;
DROP POLICY "Users can view their own expenses" ON expenses;

CREATE POLICY "Users can manage expenses in their companies" ON expenses
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND active = TRUE
    )
  );

-- עדכון policies לקטגוריות (גלובליות או של החברה)
CREATE POLICY "Users can access categories" ON expense_categories
  FOR SELECT USING (
    company_id IS NULL OR -- קטגוריות גלובליות
    company_id IN (
      SELECT company_id FROM company_users 
      WHERE user_id = auth.uid() AND active = TRUE
    )
  );

-- טריגרים לעדכון updated_at
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_companies_updated_at();