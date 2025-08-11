-- Add company_id column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Create index for performance
CREATE INDEX idx_invoices_company_id ON public.invoices(company_id);

-- Update RLS policies to include company filtering
DROP POLICY IF EXISTS "Users can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can create invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their invoices" ON public.invoices;

-- Create new policies that include company_id checks
CREATE POLICY "Users can view their invoices" 
ON public.invoices 
FOR SELECT 
USING (
  auth.uid() = user_id 
  AND (
    company_id IS NULL 
    OR company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() 
      OR id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid() AND active = true
      )
    )
  )
);

CREATE POLICY "Users can create invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    company_id IS NULL 
    OR company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() 
      OR id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid() AND active = true
      )
    )
  )
);

CREATE POLICY "Users can update their invoices" 
ON public.invoices 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  AND (
    company_id IS NULL 
    OR company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() 
      OR id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid() AND active = true
      )
    )
  )
);

CREATE POLICY "Users can delete their invoices" 
ON public.invoices 
FOR DELETE 
USING (
  auth.uid() = user_id 
  AND (
    company_id IS NULL 
    OR company_id IN (
      SELECT id FROM public.companies 
      WHERE owner_id = auth.uid() 
      OR id IN (
        SELECT company_id FROM public.company_users 
        WHERE user_id = auth.uid() AND active = true
      )
    )
  )
);

-- Update existing invoices to set company_id based on user's first company
-- This is a one-time update for existing data
UPDATE public.invoices i
SET company_id = (
  SELECT c.id 
  FROM public.companies c
  WHERE c.owner_id = i.user_id
  OR c.id IN (
    SELECT cu.company_id 
    FROM public.company_users cu 
    WHERE cu.user_id = i.user_id AND cu.active = true
  )
  ORDER BY c.created_at
  LIMIT 1
)
WHERE i.company_id IS NULL;
