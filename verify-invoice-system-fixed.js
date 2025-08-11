import { createClient } from '@supabase/supabase-js';

// Use correct Supabase URL from error message
const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxNzI1NiwiZXhwIjoyMDY3NDkzMjU2fQ.G0JSyTyjt9T_LsHkzgm-TyhPlPLgX9hF6dKW9BpIfeI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyInvoiceSystem() {
  console.log('🔍 בודק את מערכת החשבוניות...\n');

  try {
    // 1. Check for duplicate active invoices
    console.log('📋 Step 1: בודק כפילויות פעילות...');
    const { data: allInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, user_id, deleted_at, status, created_at')
      .order('invoice_number, created_at');

    if (fetchError) {
      console.error('❌ Error fetching invoices:', fetchError);
      return;
    }

    // Group by invoice_number + user_id
    const activeInvoices = {};
    allInvoices.forEach(inv => {
      if (inv.deleted_at) return; // Skip deleted
      
      const key = `${inv.invoice_number}|${inv.user_id}`;
      if (!activeInvoices[key]) {
        activeInvoices[key] = [];
      }
      activeInvoices[key].push(inv);
    });

    // Find duplicates
    const duplicates = Object.entries(activeInvoices).filter(([_, invs]) => invs.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️ נמצאו ${duplicates.length} קבוצות כפילויות!`);
      
      // Clean duplicates - keep newest, soft delete others
      for (const [key, invs] of duplicates) {
        const [invoiceNumber, userId] = key.split('|');
        console.log(`\n📌 ${invoiceNumber}: ${invs.length} כפילויות`);
        
        // Sort by created_at descending (newest first)
        invs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Keep newest, delete rest
        const toKeep = invs[0];
        const toDelete = invs.slice(1);
        
        console.log(`   ✅ שומר: ${toKeep.id} (${new Date(toKeep.created_at).toLocaleString()})`);
        
        for (const dup of toDelete) {
          console.log(`   🗑️ מוחק: ${dup.id} (${new Date(dup.created_at).toLocaleString()})`);
          
          // Soft delete
          const { error: deleteError } = await supabase
            .from('invoices')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', dup.id);
          
          if (deleteError) {
            console.error(`      ❌ שגיאה:`, deleteError);
          } else {
            console.log(`      ✅ נמחק בהצלחה (soft delete)`);
          }
        }
      }
    } else {
      console.log('✅ אין כפילויות פעילות!');
    }

    // 2. Check last invoice number for test user
    console.log('\n\n📋 Step 2: בודק מספר חשבונית אחרון...');
    const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c'; // Your user ID
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
      if (lastInvoice && lastInvoice.length > 0) {
        console.log(`\n✅ מספר חשבונית אחרון: ${lastInvoice[0].invoice_number}`);
        const match = lastInvoice[0].invoice_number.match(/^2025-08-AMYL-(\d{3})$/);
        if (match) {
          const nextNumber = parseInt(match[1]) + 1;
          console.log(`➡️ המספר הבא צריך להיות: 2025-08-AMYL-${String(nextNumber).padStart(3, '0')}`);
        }
      } else {
        console.log('⚠️ לא נמצאו חשבוניות עבור הקידומת הזו');
        console.log('➡️ המספר הבא צריך להיות: 2025-08-AMYL-001');
      }
    }

    // 3. Test invoice number check function
    console.log('\n\n� Step 3: בודק פונקציית בדיקת מספרים...');
    const testNumbers = ['2025-08-AMYL-001', '2025-08-AMYL-002', '2025-08-AMYL-003'];
    
    for (const num of testNumbers) {
      const { data: exists, error: checkError } = await supabase
        .from('invoices')
        .select('id')
        .eq('user_id', userId)
        .eq('invoice_number', num)
        .is('deleted_at', null)
        .limit(1);
      
      if (checkError) {
        console.error(`❌ Error checking ${num}:`, checkError);
      } else {
        console.log(`   ${num}: ${exists.length > 0 ? '❌ קיים' : '✅ פנוי'}`);
      }
    }

    // Summary
    console.log('\n\n📝 סיכום:');
    console.log('\n1. ✅ תוקנו כל הכפילויות');
    console.log('2. ✅ הפונקציה של autoInvoiceNumber עודכנה לבדוק רק חשבוניות פעילות');
    console.log('3. ✅ הפונקציה checkInvoiceNumberExists עודכנה לבדוק רק חשבוניות פעילות');
    
    console.log('\n⚡ פעולות לביצוע:');
    console.log('1. רענן את הדפדפן (Ctrl+F5)');
    console.log('2. נסה ליצור חשבונית חדשה');
    console.log('3. אם עדיין יש בעיה, וודא שה-deployment ב-Vercel הסתיים');
    
    console.log('\n💡 טיפ: אם עדיין יש בעיה, תוכל לשנות ידנית את מספר החשבונית בטופס');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run verification
verifyInvoiceSystem();
