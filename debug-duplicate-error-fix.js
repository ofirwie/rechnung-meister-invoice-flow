import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bphilnfifbdofojrqrcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaGlsbmZpZmJkb2ZvanJxcmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTgwOTMzNSwiZXhwIjoyMDQxMzg1MzM1fQ._SbId0fR2dc9Hv-6s6JimxPPDmV_cfuBvFGNn8GYZ94';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugDuplicateError() {
  console.log('🔍 בודק את הבעיה עם יצירת חשבוניות חדשות...\n');

  try {
    // 1. Check specific invoice that caused the error
    console.log('📋 Step 1: בודק את החשבונית שגרמה לשגיאה...');
    const testInvoiceNumber = '2025-08-AMYL-003'; // The next number that should be generated
    
    const { data: existingInvoices, error: checkError } = await supabase
      .from('invoices')
      .select('id, invoice_number, user_id, deleted_at, status')
      .eq('invoice_number', testInvoiceNumber);

    if (checkError) {
      console.error('❌ Error checking invoice:', checkError);
    } else {
      console.log(`\n🔍 נמצאו ${existingInvoices.length} רשומות עבור ${testInvoiceNumber}:`);
      existingInvoices.forEach(inv => {
        console.log(`   - ID: ${inv.id}`);
        console.log(`     Status: ${inv.status}`);
        console.log(`     Deleted: ${inv.deleted_at ? 'YES' : 'NO'}`);
        console.log(`     User: ${inv.user_id}`);
      });
    }

    // 2. Check all unique constraints
    console.log('\n\n📋 Step 2: בודק את כל ה-unique constraints...');
    const { data: indexes, error: indexError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT 
          indexname,
          indexdef,
          schemaname,
          tablename
        FROM pg_indexes 
        WHERE tablename = 'invoices' 
        AND (
          indexname LIKE '%unique%' 
          OR indexname LIKE '%invoice_number%'
          OR indexdef LIKE '%unique%'
        )
      `
    }).catch(() => ({ data: null, error: 'RPC not available' }));

    if (indexError || !indexes) {
      console.log('❌ לא יכול לבדוק indexes (RPC not available)');
      console.log('\n⚠️ בדוק ידנית ב-Supabase Dashboard:');
      console.log('https://supabase.com/dashboard/project/bphilnfifbdofojrqrcc/database/indexes');
    } else {
      console.log(`\n🔍 נמצאו ${indexes.length} unique constraints:`);
      indexes.forEach(idx => {
        console.log(`\n   📌 ${idx.indexname}`);
        console.log(`      Definition: ${idx.indexdef}`);
      });
    }

    // 3. Test invoice number generation
    console.log('\n\n📋 Step 3: בודק יצירת מספר חשבונית חדש...');
    const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';
    const companyAbbr = 'AMYL';
    const prefix = '2025-08-AMYL';
    
    const { data: lastInvoice, error: lastError } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .like('invoice_number', `${prefix}-%`)
      .is('deleted_at', null)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (lastError) {
      console.error('❌ Error finding last invoice:', lastError);
    } else {
      console.log('\n📊 מספר חשבונית אחרון (לא מחוק):');
      if (lastInvoice && lastInvoice.length > 0) {
        console.log(`   ✅ ${lastInvoice[0].invoice_number}`);
        const match = lastInvoice[0].invoice_number.match(/^2025-08-AMYL-(\d{3})$/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          console.log(`   ➡️ המספר הבא צריך להיות: 2025-08-AMYL-${String(nextNumber).padStart(3, '0')}`);
        }
      } else {
        console.log('   ⚠️ לא נמצאו חשבוניות קודמות');
        console.log('   ➡️ המספר הבא צריך להיות: 2025-08-AMYL-001');
      }
    }

    // 4. Clean up any remaining duplicates
    console.log('\n\n📋 Step 4: מנקה כפילויות נוספות...');
    const { data: allDuplicates, error: dupError } = await supabase
      .from('invoices')
      .select('invoice_number, user_id, id, created_at, deleted_at')
      .order('invoice_number, created_at');

    if (!dupError && allDuplicates) {
      const duplicateGroups = {};
      allDuplicates.forEach(inv => {
        if (inv.deleted_at) return; // Skip already deleted
        const key = `${inv.invoice_number}|${inv.user_id}`;
        if (!duplicateGroups[key]) {
          duplicateGroups[key] = [];
        }
        duplicateGroups[key].push(inv);
      });

      const duplicates = Object.entries(duplicateGroups).filter(([_, invs]) => invs.length > 1);
      
      if (duplicates.length > 0) {
        console.log(`\n⚠️ נמצאו ${duplicates.length} קבוצות של כפילויות פעילות:`);
        
        for (const [key, invs] of duplicates) {
          const [invoiceNumber] = key.split('|');
          console.log(`\n   📌 ${invoiceNumber}: ${invs.length} כפילויות`);
          
          // Keep first, delete rest
          const toKeep = invs[0];
          const toDelete = invs.slice(1);
          
          for (const dup of toDelete) {
            console.log(`      🗑️ מוחק כפילות: ${dup.id}`);
            const { error: deleteError } = await supabase
              .from('invoices')
              .delete()
              .eq('id', dup.id);
            
            if (deleteError) {
              console.error(`      ❌ שגיאה במחיקה:`, deleteError);
            } else {
              console.log(`      ✅ נמחק בהצלחה`);
            }
          }
        }
      } else {
        console.log('✅ אין כפילויות פעילות!');
      }
    }

    // Summary
    console.log('\n\n📝 סיכום ופתרונות:');
    console.log('\n1. וודא שהפקודות הבאות רצו ב-Supabase:');
    console.log('   - מחיקת כפילויות');
    console.log('   - יצירת unique constraint עם WHERE deleted_at IS NULL');
    
    console.log('\n2. אם עדיין יש בעיות:');
    console.log('   - רענן את הדפדפן (Ctrl+F5)');
    console.log('   - נקה את ה-cache');
    console.log('   - וודא שה-deployment ב-Vercel הסתיים');
    
    console.log('\n3. SQL ליצירת constraint מחדש:');
    console.log('----------------------------------------------');
    console.log(`
-- מחק constraints ישנים
DROP INDEX IF EXISTS idx_invoice_number_user_unique;
DROP INDEX IF EXISTS invoices_invoice_number_user_id_key;

-- צור constraint חדש עם תנאי deleted_at
CREATE UNIQUE INDEX idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;
    `);
    console.log('----------------------------------------------');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugDuplicateError();
