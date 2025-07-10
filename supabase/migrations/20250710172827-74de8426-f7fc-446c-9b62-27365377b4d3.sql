-- Fix user registration and bootstrap rootadmin users

-- First, let's ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bootstrap existing users with profiles and roles
-- Create profiles for existing users
INSERT INTO public.profiles (id, email, display_name)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'display_name', email) as display_name
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Assign rootadmin role to both users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'rootadmin'::app_role
FROM auth.users 
WHERE email IN ('firestar393@gmail.com', 'ofir.wienerman@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Clean up any existing user roles for these users (in case they had default user roles)
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('firestar393@gmail.com', 'ofir.wienerman@gmail.com')
) AND role != 'rootadmin';