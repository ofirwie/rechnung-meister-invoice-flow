import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTkxNzI1NiwiZXhwIjoyMDY3NDkzMjU2fQ.G0JSyTyjt9T_LsHkzgm-TyhPlPLgX9hF6dKW9BpIfeI';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDeploymentStatus() {
  console.log('🔍 בודק סטטוס deployment...\n');

  try {
    // Check the latest Git commit
    console.log('📋 Commit אחרון שנדחף:');
    console.log('   fbf854b - FIX: Prevent duplicate invoice error');
    console.log('   נדחף ב: 8/11/2025, 10:11 PM\n');

    // Check current time
    const now = new Date();
    console.log(`⏰ השעה כעת: ${now.toLocaleString()}\n`);

    // Check if we can create invoice 004
    console.log('🔍 בודק אם אפשר ליצור חשבונית 004...');
    const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';
    
    const { data: exists, error } = await supabase
      .from('invoices')
      .select('id, invoice_number, deleted_at')
      .eq('user_id', userId)
      .eq('invoice_number', '2025-08-AMYL-004')
      .is('deleted_at', null);

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log(`\n📊 חשבונית 2025-08-AMYL-004:`);
      if (exists && exists.length > 0) {
        console.log('   ❌ כבר קיימת!');
      } else {
        console.log('   ✅ פנויה - אפשר ליצור');
      }
    }

    // Instructions
    console.log('\n\n📝 הוראות:');
    console.log('\n1. ⏳ המתן עוד כמה דקות ל-Vercel deployment');
    console.log('   - בדרך כלל לוקח 2-5 דקות');
    console.log('   - בדוק ב: https://vercel.com/ofirwie/rechnung-meister-invoice-flow');
    
    console.log('\n2. 🌐 ברגע שה-deployment מסתיים:');
    console.log('   - רענן את הדפדפן עם Ctrl+F5');
    console.log('   - נקה את ה-cache של הדפדפן');
    
    console.log('\n3. 🛠️ אם עדיין יש בעיה:');
    console.log('   - בדוק שה-SQL רץ ב-Supabase');
    console.log('   - וודא שאין שגיאות ב-deployment');
    
    console.log('\n4. 💡 פתרון זמני:');
    console.log('   - תוכל לשנות ידנית את מספר החשבונית ל-2025-08-AMYL-004');
    console.log('   - או כל מספר אחר שלא קיים');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run check
checkDeploymentStatus();
