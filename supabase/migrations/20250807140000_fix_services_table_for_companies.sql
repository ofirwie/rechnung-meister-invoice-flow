-- Fix services table to work with company-based architecture
-- Add company_id column and update RLS policies

-- Add company_id column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_company_id ON public.services(company_id);

-- Drop old RLS policies that only use user_id
DROP POLICY IF EXISTS "Users can view their own services" ON public.services;
DROP POLICY IF EXISTS "Users can create their own services" ON public.services;
DROP POLICY IF EXISTS "Users can update their own services" ON public.services;
DROP POLICY IF EXISTS "Users can delete their own services" ON public.services;

-- Create new RLS policies that work with company-based access
CREATE POLICY "Users can view company services" 
ON public.services 
FOR SELECT 
USING (
  -- User owns the company
  company_id IN (
    SELECT c.id 
    FROM companies c 
    WHERE c.owner_id = auth.uid()
  ) OR
  -- User is a member of the company
  company_id IN (
    SELECT cu.company_id 
    FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.active = true
  ) OR
  -- User is rootadmin
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
  ) OR
  -- Fallback: old records without company_id can be accessed by their creator
  (company_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can create company services" 
ON public.services 
FOR INSERT 
WITH CHECK (
  -- User owns the company
  company_id IN (
    SELECT c.id 
    FROM companies c 
    WHERE c.owner_id = auth.uid()
  ) OR
  -- User is a member of the company with appropriate role
  company_id IN (
    SELECT cu.company_id 
    FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.active = true AND cu.role IN ('owner', 'admin', 'user')
  ) OR
  -- User is rootadmin
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
  )
);

CREATE POLICY "Users can update company services" 
ON public.services 
FOR UPDATE 
USING (
  -- User owns the company
  company_id IN (
    SELECT c.id 
    FROM companies c 
    WHERE c.owner_id = auth.uid()
  ) OR
  -- User is a member of the company with appropriate role
  company_id IN (
    SELECT cu.company_id 
    FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.active = true AND cu.role IN ('owner', 'admin', 'user')
  ) OR
  -- User is rootadmin
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
  ) OR
  -- Fallback: old records without company_id can be updated by their creator
  (company_id IS NULL AND user_id = auth.uid())
);

CREATE POLICY "Users can delete company services" 
ON public.services 
FOR DELETE 
USING (
  -- User owns the company
  company_id IN (
    SELECT c.id 
    FROM companies c 
    WHERE c.owner_id = auth.uid()
  ) OR
  -- User is a member of the company with owner/admin role
  company_id IN (
    SELECT cu.company_id 
    FROM company_users cu 
    WHERE cu.user_id = auth.uid() AND cu.active = true AND cu.role IN ('owner', 'admin')
  ) OR
  -- User is rootadmin
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
  ) OR
  -- Fallback: old records without company_id can be deleted by their creator
  (company_id IS NULL AND user_id = auth.uid())
);

-- Migrate existing services to the first company owned by their user_id (if any)
UPDATE public.services 
SET company_id = (
  SELECT c.id 
  FROM companies c 
  WHERE c.owner_id = services.user_id 
  ORDER BY c.created_at ASC 
  LIMIT 1
)
WHERE company_id IS NULL AND user_id IS NOT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.services.company_id IS 'References the company this service belongs to. Required for company-based access control.';
