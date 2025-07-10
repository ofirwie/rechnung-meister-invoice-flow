-- שלב 1: יצירת טבלת profiles עם trigger אוטומטי
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamp with time zone
);

-- הפעלת RLS על טבלת profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- יצירת policies עבור profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- יצירת enum לתפקידים
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'user');

-- יצירת טבלת user_roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

-- הפעלת RLS על טבלת user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- יצירת פונקציה לבדיקת תפקיד (SECURITY DEFINER למניעת רקורסיה)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- יצירת פונקציה לקבלת תפקיד של המשתמש הנוכחי
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = auth.uid()
  ORDER BY 
    CASE 
      WHEN role = 'admin' THEN 1
      WHEN role = 'manager' THEN 2
      WHEN role = 'user' THEN 3
    END
  LIMIT 1
$$;

-- policies עבור user_roles
CREATE POLICY "Users can view all user roles"
ON public.user_roles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update user roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- יצירת פונקציה לטיפול במשתמש חדש
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- יצירת profile אוטומטי
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  -- הקצאת תפקיד user כברירת מחדל
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- יצירת trigger לטיפול במשתמש חדש
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- יצירת trigger לעדכון updated_at ב-profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- הוספת אדמין ראשוני (אם צריך - תוכל להסיר את זה אם לא רוצה)
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role
-- FROM auth.users
-- WHERE email = 'admin@example.com'
-- ON CONFLICT (user_id, role) DO NOTHING;