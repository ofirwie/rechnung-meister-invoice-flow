-- Fix RLS policies and add missing column

-- 1. Fix the infinite recursion in company_users RLS by improving the policies
DROP POLICY IF EXISTS "Users can view company users" ON public.company_users;
DROP POLICY IF EXISTS "Company owners and admins can manage users" ON public.company_users;

-- Create better policies that avoid recursion
CREATE POLICY "Users can view their company users" 
ON public.company_users 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  company_id IN (
    SELECT c.id 
    FROM companies c 
    WHERE c.owner_id = auth.uid() OR get_current_user_role() = 'rootadmin'
  )
);

CREATE POLICY "Company owners and rootadmin can manage users" 
ON public.company_users 
FOR ALL 
USING (
  company_id IN (
    SELECT c.id 
    FROM companies c 
    WHERE c.owner_id = auth.uid() OR get_current_user_role() = 'rootadmin'
  )
);

-- 2. Add the missing german_vat_id column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS german_vat_id CHARACTER VARYING;