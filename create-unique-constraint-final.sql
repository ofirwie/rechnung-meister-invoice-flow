-- יצירת Unique Constraint למניעת כפילויות בעתיד
-- מבטיח שלא יהיו שתי חשבוניות עם אותו מספר עבור אותו משתמש

-- מחק index ישן אם קיים
DROP INDEX IF EXISTS idx_invoice_number_user_unique;

-- צור unique constraint חדש
CREATE UNIQUE INDEX idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;

-- הודעת הצלחה
SELECT 'Unique constraint created successfully!' as message;
