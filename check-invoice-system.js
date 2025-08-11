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

async function checkInvoiceSystem() {
  console.log('🔍 בודק את מערכת החשבוניות...\n');

  try {
    // 1. בדיקת חברות
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5);

    if (!companyError && companies) {
      console.log(`✅ נמצאו ${companies.length} חברות:`);
      companies.forEach(company => {
        console.log(`   - ${company.name} (${company.id})`);
      });
    } else {
      console.log('❌ שגיאה בטעינת חברות:', companyError?.message);
    }

    // 2. בדיקת חשבוניות עם company_id
    console.log('\n📋 בודק עמודת company_id בחשבוניות...');
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('invoice_number, company_id, status')
      .limit(3);

    if (invoiceError) {
      if (invoiceError.message.includes('company_id')) {
        console.log('❌ עמודת company_id לא נמצאה!');
        console.log('   יש להריץ את המיגרציה ב-Supabase Dashboard');
      } else {
        console.log('❌ שגיאה אחרת:', invoiceError.message);
      }
    } else {
      console.log('✅ עמודת company_id קיימת!');
      if (invoices && invoices.length > 0) {
        console.log(`   נמצאו ${invoices.length} חשבוניות:`);
        invoices.forEach(inv => {
          console.log(`   - ${inv.invoice_number} (סטטוס: ${inv.status}, חברה: ${inv.company_id || 'ללא'})`);
        });
      } else {
        console.log('   אין חשבוניות במערכת');
      }
    }

    // 3. בדיקת לקוחות
    console.log('\n👥 בודק לקוחות...');
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, client_name, client_company')
      .limit(5);

    if (!clientError && clients) {
      console.log(`✅ נמצאו ${clients.length} לקוחות`);
      clients.forEach(client => {
        console.log(`   - ${client.client_name || client.client_company} (${client.id})`);
      });
    }

    // 4. בדיקת שירותים
    console.log('\n🛠️ בודק שירותים...');
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, name, price')
      .limit(5);

    if (!serviceError && services) {
      console.log(`✅ נמצאו ${services.length} שירותים`);
      services.forEach(service => {
        console.log(`   - ${service.name} (₪${service.price})`);
      });
    }

    // 5. בדיקת משתמש מחובר
    console.log('\n👤 בודק משתמש...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      console.log(`✅ משתמש מחובר: ${session.user.email}`);
    } else {
      console.log('⚠️  אין משתמש מחובר');
    }

  } catch (err) {
    console.error('❌ שגיאה בלתי צפויה:', err);
  }

  console.log('\n✨ הבדיקה הושלמה!');
}

checkInvoiceSystem();
