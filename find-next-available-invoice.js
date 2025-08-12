import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxNzI1NiwiZXhwIjoyMDY3NDkzMjU2fQ.G0JSyTyjt9T_LsHkzgm-TyhPlPLgX9hF6dKW9BpIfeI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function findNextAvailableInvoice() {
  console.log('🔍 מחפש מספר חשבונית פנוי...\n');

  try {
    const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';
    
    // Get all active invoices for the current month
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', userId)
      .like('invoice_number', '2025-08-AMYL-%')
      .is('deleted_at', null)
      .order('invoice_number', { ascending: true });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('📋 חשבוניות פעילות שנמצאו:');
    invoices.forEach(inv => {
      console.log(`   - ${inv.invoice_number}`);
    });

    // Find the next available number
    let nextNumber = 1;
    for (const inv of invoices) {
      const match = inv.invoice_number.match(/2025-08-AMYL-(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num >= nextNumber) {
          nextNumber = num + 1;
        }
      }
    }

    const nextInvoiceNumber = `2025-08-AMYL-${String(nextNumber).padStart(3, '0')}`;
    
    console.log('\n✅ המספר הבא הפנוי:');
    console.log(`   ${nextInvoiceNumber}`);

    console.log('\n\n📝 פתרונות מיידיים:');
    console.log('\n1. 🔧 פתרון זמני מיידי:');
    console.log(`   - שנה ידנית את מספר החשבונית ל: ${nextInvoiceNumber}`);
    console.log('   - או השתמש בכל מספר אחר שלא קיים');
    
    console.log('\n2. ⏳ המתן ל-deployment:');
    console.log('   - הקוד החדש כבר נדחף ל-GitHub');
    console.log('   - Vercel אמור לסיים את ה-deployment תוך כמה דקות');
    console.log('   - לאחר מכן הבעיה תיפתר אוטומטית');
    
    console.log('\n3. 🔍 לבדיקת סטטוס deployment:');
    console.log('   - https://vercel.com/ofirwie/rechnung-meister-invoice-flow');
    
    console.log('\n4. 🌐 אחרי שה-deployment מסתיים:');
    console.log('   - רענן את הדפדפן עם Ctrl+F5');
    console.log('   - נקה את ה-cache');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run check
findNextAvailableInvoice();
