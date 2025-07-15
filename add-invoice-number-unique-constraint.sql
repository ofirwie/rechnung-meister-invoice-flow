-- Add unique constraint to prevent duplicate invoice numbers per user
-- This ensures no two invoices can have the same number for the same user

-- First, let's check if there are any existing duplicates
SELECT 
    invoice_number, 
    user_id, 
    COUNT(*) as count
FROM invoices 
WHERE deleted_at IS NULL
GROUP BY invoice_number, user_id
HAVING COUNT(*) > 1;

-- If there are duplicates, you'll need to fix them manually first
-- Then add the unique constraint:

ALTER TABLE invoices 
ADD CONSTRAINT unique_invoice_number_per_user 
UNIQUE (invoice_number, user_id);

-- Also add an index for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_number_user 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;

-- Optional: Add a check constraint for invoice number format
ALTER TABLE invoices 
ADD CONSTRAINT check_invoice_number_format 
CHECK (invoice_number ~ '^\d{4}-\d{4}$');

-- Note: The regex pattern '^\d{4}-\d{4}$' ensures format like 2024-0001