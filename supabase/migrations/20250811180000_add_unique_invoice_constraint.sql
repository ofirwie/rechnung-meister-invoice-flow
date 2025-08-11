-- Add unique constraint to prevent duplicate invoice numbers per user
-- This ensures database-level protection against duplicate invoices

-- First, let's check if there are any existing duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
    rec RECORD;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT invoice_number, user_id, COUNT(*) as cnt
        FROM invoices
        WHERE deleted_at IS NULL
        GROUP BY invoice_number, user_id
        HAVING COUNT(*) > 1
    ) as duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'Found % duplicate invoice number(s). Please fix these before running migration.', duplicate_count;
        -- List the duplicates
        FOR rec IN 
            SELECT invoice_number, user_id, COUNT(*) as cnt
            FROM invoices
            WHERE deleted_at IS NULL
            GROUP BY invoice_number, user_id
            HAVING COUNT(*) > 1
        LOOP
            RAISE NOTICE 'Duplicate: invoice_number=%, user_id=%, count=%', rec.invoice_number, rec.user_id, rec.cnt;
        END LOOP;
        
        RAISE EXCEPTION 'Cannot create unique constraint due to existing duplicates';
    END IF;
END $$;

-- Create the unique index
-- This allows different users to have the same invoice number
-- But prevents the same user from having duplicate invoice numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;

-- Add a comment to explain the constraint
COMMENT ON INDEX idx_invoice_number_user_unique IS 'Ensures each user has unique invoice numbers (excluding soft-deleted records)';
