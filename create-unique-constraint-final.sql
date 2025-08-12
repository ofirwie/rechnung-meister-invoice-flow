-- מחק constraints ישנים
DROP INDEX IF EXISTS idx_invoice_number_user_unique;
DROP INDEX IF EXISTS invoices_invoice_number_user_id_key;
DROP INDEX IF EXISTS invoices_invoice_number_user_id_idx;

-- צור constraint חדש שמתעלם מחשבוניות מחוקות
CREATE UNIQUE INDEX idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;

-- בדוק שהוא נוצר בהצלחה
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'invoices' 
AND indexname LIKE '%unique%';
