-- Update companies table RLS policies
DROP POLICY IF EXISTS "Users can access their companies" ON public.companies;

-- New policy: rootadmin can see all companies, others see only their companies
CREATE POLICY "Users can access their companies" ON public.companies
FOR SELECT 
USING (
  public.get_current_user_role() = 'rootadmin' OR
  (owner_id = auth.uid()) OR 
  (id IN (
    SELECT company_users.company_id
    FROM company_users
    WHERE (company_users.user_id = auth.uid()) AND (company_users.active = true)
  ))
);

-- Only rootadmin can create companies
CREATE POLICY "Only rootadmin can create companies" ON public.companies
FOR INSERT
WITH CHECK (public.get_current_user_role() = 'rootadmin');

-- Company owners and rootadmin can update companies
CREATE POLICY "Company owners and rootadmin can update companies" ON public.companies
FOR UPDATE
USING (
  public.get_current_user_role() = 'rootadmin' OR
  owner_id = auth.uid()
);

-- Update user_roles table RLS policies
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete user roles" ON public.user_roles;

-- Only rootadmin can assign admin roles, admins can assign manager/user roles
CREATE POLICY "Role assignment restrictions" ON public.user_roles
FOR INSERT
WITH CHECK (
  CASE 
    WHEN role = 'rootadmin' THEN public.get_current_user_role() = 'rootadmin'
    WHEN role = 'admin' THEN public.get_current_user_role() = 'rootadmin'
    WHEN role IN ('manager', 'user') THEN public.get_current_user_role() IN ('rootadmin', 'admin')
    ELSE false
  END
);

-- Similar restrictions for updates
CREATE POLICY "Role update restrictions" ON public.user_roles
FOR UPDATE
USING (
  CASE 
    WHEN role = 'rootadmin' THEN public.get_current_user_role() = 'rootadmin'
    WHEN role = 'admin' THEN public.get_current_user_role() = 'rootadmin'
    WHEN role IN ('manager', 'user') THEN public.get_current_user_role() IN ('rootadmin', 'admin')
    ELSE false
  END
);

-- Delete restrictions
CREATE POLICY "Role deletion restrictions" ON public.user_roles
FOR DELETE
USING (
  CASE 
    WHEN role = 'rootadmin' THEN public.get_current_user_role() = 'rootadmin'
    WHEN role = 'admin' THEN public.get_current_user_role() = 'rootadmin'
    WHEN role IN ('manager', 'user') THEN public.get_current_user_role() IN ('rootadmin', 'admin')
    ELSE false
  END
);

-- Update the get_current_user_role function to handle rootadmin priority
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE 
      WHEN role = 'rootadmin' THEN 1
      WHEN role = 'admin' THEN 2
      WHEN role = 'manager' THEN 3
      WHEN role = 'user' THEN 4
    END
  LIMIT 1
$$;