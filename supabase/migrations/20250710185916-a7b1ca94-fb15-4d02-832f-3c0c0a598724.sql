-- Fix infinite recursion by removing get_current_user_role() from RLS policies
-- and using direct queries to user_roles table instead

-- Drop existing policies on user_roles table
DROP POLICY IF EXISTS "Users can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Role assignment restrictions" ON public.user_roles;
DROP POLICY IF EXISTS "Role update restrictions" ON public.user_roles;
DROP POLICY IF EXISTS "Role deletion restrictions" ON public.user_roles;

-- Recreate user_roles policies with direct queries (no function calls)
CREATE POLICY "Users can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Role assignment restrictions" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  CASE
    WHEN role = 'rootadmin' THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
    )
    WHEN role = 'admin' THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
    )
    WHEN role IN ('manager', 'user') THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('rootadmin', 'admin')
    )
    ELSE false
  END
);

CREATE POLICY "Role update restrictions" 
ON public.user_roles 
FOR UPDATE 
USING (
  CASE
    WHEN role = 'rootadmin' THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
    )
    WHEN role = 'admin' THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
    )
    WHEN role IN ('manager', 'user') THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('rootadmin', 'admin')
    )
    ELSE false
  END
);

CREATE POLICY "Role deletion restrictions" 
ON public.user_roles 
FOR DELETE 
USING (
  CASE
    WHEN role = 'rootadmin' THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
    )
    WHEN role = 'admin' THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
    )
    WHEN role IN ('manager', 'user') THEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('rootadmin', 'admin')
    )
    ELSE false
  END
);

-- Drop existing policies on companies table
DROP POLICY IF EXISTS "Only rootadmin can create companies" ON public.companies;
DROP POLICY IF EXISTS "Company owners and rootadmin can update companies" ON public.companies;
DROP POLICY IF EXISTS "Users can access their companies" ON public.companies;

-- Recreate companies policies with direct queries (no function calls)
CREATE POLICY "Only rootadmin can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'rootadmin'
  )
);

CREATE POLICY "Company owners and rootadmin can update companies" 
ON public.companies 
FOR UPDATE 
USING (
  (owner_id = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'rootadmin'
  )
);

CREATE POLICY "Users can access their companies" 
ON public.companies 
FOR SELECT 
USING (
  (owner_id = auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'rootadmin'
  ) OR 
  (id IN (
    SELECT company_id FROM public.company_users 
    WHERE user_id = auth.uid() AND active = true
  ))
);