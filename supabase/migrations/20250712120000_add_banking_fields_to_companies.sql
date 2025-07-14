-- Add banking information fields to companies table
-- This allows each company to have its own banking details for invoices

ALTER TABLE public.companies
ADD COLUMN bank_name TEXT,
ADD COLUMN iban TEXT,
ADD COLUMN bic TEXT,
ADD COLUMN account_number TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.companies.bank_name IS 'Name of the bank where the company has its account';
COMMENT ON COLUMN public.companies.iban IS 'International Bank Account Number (IBAN) for the company';
COMMENT ON COLUMN public.companies.bic IS 'Bank Identifier Code (BIC/SWIFT) for the company bank';
COMMENT ON COLUMN public.companies.account_number IS 'Local account number for the company';

-- Optional: Add indexes for faster lookups if needed
-- CREATE INDEX IF NOT EXISTS idx_companies_iban ON public.companies(iban) WHERE iban IS NOT NULL;

-- Insert default banking data for existing companies if needed
-- This uses the hardcoded values from businessInfo.ts as defaults
UPDATE public.companies 
SET 
  bank_name = 'Deutsche Bank',
  iban = 'DE82 7207 0024 0061 8488 00',
  bic = 'DEUTDEDB720',
  account_number = '221 0618488 00'
WHERE bank_name IS NULL;