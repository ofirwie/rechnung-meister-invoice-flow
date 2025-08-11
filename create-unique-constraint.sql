-- Add unique constraint to prevent duplicate invoice numbers
-- This will ensure database-level protection against duplicates

-- First, check for existing duplicates
SELECT invoice_number, COUNT(*) as count, array_agg(id) as ids
FROM invoices
WHERE deleted_at IS NULL
GROUP BY invoice_number
HAVING COUNT(*) > 1;

-- Add unique constraint on invoice_number + user_id (only for non-deleted records)
-- This allows different users to have the same invoice number
CREATE UNIQUE INDEX idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;

-- This will prevent any duplicate invoice numbers for the same user
-- Even if there's a race condition, the database will reject the duplicate
