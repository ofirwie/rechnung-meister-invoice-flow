-- Fix get_current_user_role function to handle NULL cases better
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role
     FROM public.user_roles
     WHERE user_id = auth.uid()
     ORDER BY 
       CASE 
         WHEN role = 'rootadmin' THEN 1
         WHEN role = 'admin' THEN 2
         WHEN role = 'manager' THEN 3
         WHEN role = 'user' THEN 4
       END
     LIMIT 1),
    'user'::app_role
  )
$$;

-- Update companies RLS policy to also check for rootadmin directly from user_roles
DROP POLICY IF EXISTS "Only rootadmin can create companies" ON public.companies;
CREATE POLICY "Only rootadmin can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'rootadmin'
  )
);