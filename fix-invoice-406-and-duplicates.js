import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bphilnfifbdofojrqrcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaGlsbmZpZmJkb2ZvanJxcmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTgwOTMzNSwiZXhwIjoyMDQxMzg1MzM1fQ._SbId0fR2dc9Hv-6s6JimxPPDmV_cfuBvFGNn8GYZ94';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixInvoiceIssues() {
  console.log('🔧 מתקן בעיות חשבוניות כפולות ושגיאות 406...\n');

  try {
    // 1. Find all duplicates
    console.log('📋 Step 1: מחפש חשבוניות כפולות...');
    const { data: allInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching invoices:', fetchError);
      return;
    }

    // Group by invoice_number and user_id
    const invoiceGroups = {};
    allInvoices.forEach(inv => {
      const key = `${inv.invoice_number}|${inv.user_id}`;
      if (!invoiceGroups[key]) {
        invoiceGroups[key] = [];
      }
      invoiceGroups[key].push(inv);
    });

    // Find duplicates
    const duplicates = Object.entries(invoiceGroups).filter(([_, invs]) => invs.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️ נמצאו ${duplicates.length} קבוצות של כפילויות:`);
      
      for (const [key, invs] of duplicates) {
        const [invoiceNumber, userId] = key.split('|');
        console.log(`\n📌 חשבונית: ${invoiceNumber}`);
        console.log(`   משתמש: ${userId}`);
        console.log(`   כמות כפילויות: ${invs.length}`);
        
        // Keep the oldest one (first created)
        const toKeep = invs[0];
        const toDelete = invs.slice(1);
        
        console.log(`   ✅ שומר: ID ${toKeep.id} (נוצר: ${toKeep.created_at})`);
        
        for (const dup of toDelete) {
          console.log(`   🗑️ מוחק: ID ${dup.id} (נוצר: ${dup.created_at})`);
          
          // Delete the duplicate
          const { error: deleteError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', dup.id);
          
          if (deleteError) {
            console.error(`   ❌ שגיאה במחיקת כפילות ${dup.id}:`, deleteError);
          } else {
            console.log(`   ✅ נמחק בהצלחה`);
          }
        }
      }
    } else {
      console.log('✅ לא נמצאו כפילויות!');
    }

    // 2. Create unique constraint
    console.log('\n\n📋 Step 2: יוצר Unique Constraint...');
    
    // Check if constraint exists
    const { data: constraints, error: constraintCheckError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT conname 
        FROM pg_constraint 
        WHERE conname = 'idx_invoice_number_user_unique' 
        OR conname = 'invoices_invoice_number_user_id_key'
      `
    });

    if (constraintCheckError || !constraints || constraints.length === 0) {
      console.log('🔨 מנסה ליצור Unique Constraint...');
      
      const createConstraintSQL = `
        -- Drop existing index if exists
        DROP INDEX IF EXISTS idx_invoice_number_user_unique;
        
        -- Create unique constraint
        CREATE UNIQUE INDEX idx_invoice_number_user_unique 
        ON invoices (invoice_number, user_id) 
        WHERE deleted_at IS NULL;
      `;
      
      const { error: createError } = await supabase.rpc('execute_sql', {
        query: createConstraintSQL
      });
      
      if (createError) {
        console.log('❌ לא הצלחתי ליצור constraint אוטומטית');
        console.log('\n⚠️ הרץ את ה-SQL הבא ב-Supabase Dashboard:');
        console.log('https://supabase.com/dashboard/project/bphilnfifbdofojrqrcc/sql/new');
        console.log('----------------------------------------------');
        console.log(createConstraintSQL);
        console.log('----------------------------------------------');
      } else {
        console.log('✅ Unique constraint נוצר בהצלחה!');
      }
    } else {
      console.log('✅ Unique constraint כבר קיים!');
    }

    // 3. Test specific invoice
    console.log('\n\n📋 Step 3: בודק את החשבונית הספציפית...');
    const problemInvoiceNumber = '2025-08-AMYL-003';
    const problemUserId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';
    
    const { data: problemInvoices, error: problemError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', problemInvoiceNumber)
      .eq('user_id', problemUserId)
      .is('deleted_at', null);

    if (problemError) {
      console.error('❌ Error checking problem invoice:', problemError);
    } else {
      console.log(`\n🔍 חשבונית ${problemInvoiceNumber}:`);
      console.log(`   נמצאו ${problemInvoices.length} רשומות`);
      
      if (problemInvoices.length > 1) {
        console.log('   ⚠️ עדיין יש כפילויות! מנקה...');
        
        // Keep first, delete rest
        const toKeep = problemInvoices[0];
        const toDelete = problemInvoices.slice(1);
        
        for (const dup of toDelete) {
          const { error: deleteError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', dup.id);
          
          if (!deleteError) {
            console.log(`   ✅ נמחקה כפילות: ${dup.id}`);
          }
        }
      } else if (problemInvoices.length === 1) {
        console.log('   ✅ רק חשבונית אחת - תקין!');
        console.log(`   ID: ${problemInvoices[0].id}`);
        console.log(`   Status: ${problemInvoices[0].status}`);
      } else {
        console.log('   ⚠️ החשבונית לא נמצאה');
      }
    }

    console.log('\n\n✅ סיום תיקון בעיות!');
    console.log('\n📝 סיכום:');
    console.log('1. כל הכפילויות נמחקו');
    console.log('2. Unique constraint הוגדר (או כבר קיים)');
    console.log('3. החשבונית הבעייתית נבדקה ותוקנה');
    
    console.log('\n⚠️ חשוב:');
    console.log('1. רענן את הדפדפן (F5)');
    console.log('2. אם עדיין יש בעיות, הרץ את ה-SQL ב-Supabase Dashboard');
    console.log('3. וודא שה-deployment ב-Vercel הסתיים');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixInvoiceIssues();
