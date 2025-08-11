import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bphilnfifbdofojrqrcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaGlsbmZpZmJkb2ZvanJxcmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTgwOTMzNSwiZXhwIjoyMDQxMzg1MzM1fQ._SbId0fR2dc9Hv-6s6JimxPPDmV_cfuBvFGNn8GYZ94';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkInvoiceError() {
  console.log('🔍 בודק את בעיית ה-406 וחשבוניות כפולות...\n');

  const invoiceNumber = '2025-08-AMYL-003';
  const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';

  try {
    // Check for duplicates
    console.log('📋 בודק אם יש כפילויות...');
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('id, invoice_number, user_id, status, created_at, deleted_at')
      .eq('invoice_number', invoiceNumber)
      .is('deleted_at', null);

    if (allError) {
      console.error('❌ Error fetching invoices:', allError);
    } else {
      console.log(`\n✅ נמצאו ${allInvoices.length} חשבוניות עם המספר ${invoiceNumber}:`);
      allInvoices.forEach((inv, idx) => {
        console.log(`\n חשבונית ${idx + 1}:`);
        console.log(`  ID: ${inv.id}`);
        console.log(`  User ID: ${inv.user_id}`);
        console.log(`  Status: ${inv.status}`);
        console.log(`  Created: ${inv.created_at}`);
      });
    }

    // Check if unique constraint exists
    console.log('\n\n🔍 בודק אם קיים Unique Constraint...');
    const { data: indexes, error: indexError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'invoices' 
        AND indexname = 'idx_invoice_number_user_unique'
      `
    });

    if (indexError) {
      console.log('❌ לא הצלחתי לבדוק indexes (צפוי אם אין execute_sql)');
      
      // Try direct approach
      console.log('\n🔨 מנסה ליצור Unique Constraint...');
      const { error: createError } = await supabase.rpc('execute_sql', {
        query: `
          CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_user_unique 
          ON invoices (invoice_number, user_id) 
          WHERE deleted_at IS NULL;
        `
      });
      
      if (createError) {
        console.log('❌ לא הצלחתי ליצור constraint דרך RPC');
        console.log('\n⚠️  חשוב מאוד: הרץ את ה-SQL הבא ב-Supabase Dashboard:');
        console.log('----------------------------------------------');
        console.log(`CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;`);
        console.log('----------------------------------------------');
      } else {
        console.log('✅ Unique constraint נוצר בהצלחה!');
      }
    } else if (indexes && indexes.length > 0) {
      console.log('✅ Unique constraint כבר קיים!');
    } else {
      console.log('⚠️ Unique constraint לא קיים - צריך ליצור אותו!');
    }

    // Fix duplicates if found
    if (allInvoices && allInvoices.length > 1) {
      console.log('\n\n🔧 מתקן כפילויות...');
      
      // Keep the first one, delete the rest
      const toKeep = allInvoices[0];
      const toDelete = allInvoices.slice(1);
      
      for (const inv of toDelete) {
        console.log(`\n🗑️  מוחק חשבונית כפולה: ${inv.id}`);
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .eq('id', inv.id);
        
        if (deleteError) {
          console.error('❌ Error deleting duplicate:', deleteError);
        } else {
          console.log('✅ נמחקה בהצלחה');
        }
      }
    }

    // Test the query that's failing
    console.log('\n\n🧪 בודק את השאילתה שנכשלת...');
    const testQuery = await supabase
      .from('invoices')
      .select('status, invoice_number, user_id')
      .eq('invoice_number', invoiceNumber)
      .eq('user_id', userId)
      .is('deleted_at', null);

    console.log('Query result:', testQuery);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkInvoiceError();
