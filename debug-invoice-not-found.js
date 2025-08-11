require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInvoiceNotFound() {
  const invoiceNumber = '2025-08-AMYL-004';
  const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';
  
  console.log('🔍 Debugging invoice not found issue');
  console.log('📄 Invoice Number:', invoiceNumber);
  console.log('👤 User ID:', userId);
  console.log('=====================================\n');

  try {
    // 1. Check if invoice exists at all (without any filters)
    console.log('1️⃣ Checking if invoice exists in database...');
    const { data: allInvoices, error: error1 } = await supabase
      .from('invoices')
      .select('invoice_number, user_id, company_id, status, deleted_at, created_at')
      .eq('invoice_number', invoiceNumber);
    
    if (error1) {
      console.error('❌ Error querying invoice:', error1);
    } else if (!allInvoices || allInvoices.length === 0) {
      console.log('❌ Invoice does not exist in database at all!');
    } else {
      console.log('✅ Found invoice(s):', allInvoices.length);
      allInvoices.forEach((inv, index) => {
        console.log(`\n   Invoice ${index + 1}:`);
        console.log('   - User ID:', inv.user_id);
        console.log('   - Company ID:', inv.company_id);
        console.log('   - Status:', inv.status);
        console.log('   - Deleted at:', inv.deleted_at || 'Not deleted');
        console.log('   - Created at:', inv.created_at);
        console.log('   - Matches requested user?', inv.user_id === userId ? '✅ YES' : '❌ NO');
      });
    }

    // 2. Check with user filter
    console.log('\n2️⃣ Checking with user filter...');
    const { data: userInvoices, error: error2 } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .eq('user_id', userId);
    
    if (error2) {
      console.error('❌ Error with user filter:', error2);
    } else {
      console.log(`Found ${userInvoices?.length || 0} invoice(s) for this user`);
    }

    // 3. Check with user filter and deleted_at
    console.log('\n3️⃣ Checking with user filter and deleted_at null...');
    const { data: activeInvoices, error: error3 } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', invoiceNumber)
      .eq('user_id', userId)
      .is('deleted_at', null);
    
    if (error3) {
      console.error('❌ Error with deleted_at filter:', error3);
    } else {
      console.log(`Found ${activeInvoices?.length || 0} active invoice(s) for this user`);
    }

    // 4. Check user's companies
    console.log('\n4️⃣ Checking user\'s companies...');
    const { data: userCompanies, error: error4 } = await supabase
      .from('company_users')
      .select('company_id, role, companies(name)')
      .eq('user_id', userId);
    
    if (error4) {
      console.error('❌ Error fetching user companies:', error4);
    } else {
      console.log(`User belongs to ${userCompanies?.length || 0} companies:`);
      userCompanies?.forEach(cu => {
        console.log(`   - Company ID: ${cu.company_id} (${cu.companies?.name || 'Unknown'}) - Role: ${cu.role}`);
      });
    }

    // 5. Check all invoices for this user
    console.log('\n5️⃣ Listing all invoices for this user...');
    const { data: allUserInvoices, error: error5 } = await supabase
      .from('invoices')
      .select('invoice_number, company_id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error5) {
      console.error('❌ Error listing user invoices:', error5);
    } else {
      console.log(`Found ${allUserInvoices?.length || 0} recent invoices for this user:`);
      allUserInvoices?.forEach(inv => {
        console.log(`   - ${inv.invoice_number} (Company: ${inv.company_id || 'NULL'}, Status: ${inv.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugInvoiceNotFound();
