-- SQL Script to delete all invoices
-- Run this in Supabase SQL Editor

-- Replace this with your actual user ID
-- You can find it in the application or from previous logs

-- Option 1: Simple delete (if no audit_logs exist)
DELETE FROM invoices 
WHERE user_id = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';

-- Option 2: If you need to check audit_logs structure first:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'audit_logs';

-- Option 3: Delete with cascade (if foreign keys are set up properly)
-- This will automatically delete related records
-- DELETE FROM invoices 
-- WHERE user_id = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c'
-- CASCADE;
