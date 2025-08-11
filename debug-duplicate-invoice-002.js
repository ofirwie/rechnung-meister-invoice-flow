import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDuplicateInvoice() {
  console.log('🔍 דיבוג כפילות חשבונית: 2025-08-AMYL-002\n');

  try {
    // 1. בדיקה כמה פעמים החשבונית קיימת
    console.log('📋 בודק כמה פעמים החשבונית קיימת...');
    const { data: allInstances, error: allError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', '2025-08-AMYL-002');

    if (allError) {
      console.error('❌ שגיאה:', allError);
      return;
    }

    console.log(`\n✅ נמצאו ${allInstances.length} מופעים של החשבונית:`);
    
    allInstances.forEach((inv, index) => {
      console.log(`\n📄 מופע ${index + 1}:`);
      console.log(`   - ID: ${inv.id}`);
      console.log(`   - נוצר: ${new Date(inv.created_at).toLocaleString('he-IL')}`);
      console.log(`   - משתמש: ${inv.user_id}`);
      console.log(`   - חברה: ${inv.company_id || 'לא מוגדר'}`);
      console.log(`   - לקוח: ${inv.client_company}`);
      console.log(`   - סטטוס: ${inv.status}`);
      console.log(`   - נמחק: ${inv.deleted_at ? new Date(inv.deleted_at).toLocaleString('he-IL') : 'לא'}`);
    });

    // 2. בדיקת כל החשבוניות עם prefix דומה
    console.log('\n\n📊 בודק את כל החשבוניות עם prefix: 2025-08-AMYL...');
    const { data: similarInvoices, error: simError } = await supabase
      .from('invoices')
      .select('invoice_number, created_at, status, deleted_at')
      .like('invoice_number', '2025-08-AMYL-%')
      .order('invoice_number');

    if (!simError && similarInvoices) {
      console.log(`\nנמצאו ${similarInvoices.length} חשבוניות עם prefix זה:`);
      similarInvoices.forEach(inv => {
        console.log(`   - ${inv.invoice_number} (${inv.status}) ${inv.deleted_at ? '[נמחק]' : ''}`);
      });
    }

    // 3. בדיקת חשבוניות שנוצרו באותו זמן (race condition)
    if (allInstances.length > 1) {
      console.log('\n\n⏱️ בדיקת הפרשי זמן בין הכפילויות:');
      for (let i = 0; i < allInstances.length - 1; i++) {
        const time1 = new Date(allInstances[i].created_at);
        const time2 = new Date(allInstances[i + 1].created_at);
        const diffMs = Math.abs(time2 - time1);
        const diffSeconds = diffMs / 1000;
        
        console.log(`   מופע ${i + 1} למופע ${i + 2}: ${diffSeconds.toFixed(2)} שניות`);
        if (diffSeconds < 5) {
          console.log('   ⚠️  חשד ל-Race Condition! (הפרש קטן מ-5 שניות)');
        }
      }
    }

    // 4. בדיקת query שמחפש את החשבונית האחרונה
    console.log('\n\n🔎 מדמה את החיפוש של generateAutoInvoiceNumber...');
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', '2025-08-AMYL-%')
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (lastInvoice && lastInvoice.length > 0) {
      console.log(`   החשבונית האחרונה שנמצאה: ${lastInvoice[0].invoice_number}`);
    }

    // 5. בדיקת query עם סינון deleted_at
    console.log('\n🔎 עם סינון deleted_at:');
    const { data: lastActiveInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', '2025-08-AMYL-%')
      .is('deleted_at', null)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (lastActiveInvoice && lastActiveInvoice.length > 0) {
      console.log(`   החשבונית האחרונה הפעילה: ${lastActiveInvoice[0].invoice_number}`);
    }

  } catch (err) {
    console.error('❌ שגיאה בלתי צפויה:', err);
  }

  console.log('\n\n✨ הדיבוג הושלם!');
}

debugDuplicateInvoice();
