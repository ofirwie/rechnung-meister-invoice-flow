// קוד לבדיקת בעיות בחשבוניות - להריץ בקונסול של הדפדפן
// Run this code in the browser console while logged in

async function checkInvoiceProblems() {
  console.log('🔍 Checking invoice problems...\n');
  
  try {
    const supabase = window.supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you are on the application page.');
      return;
    }
    
    // Get current session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      console.error('❌ Not authenticated. Please login first.');
      return;
    }
    
    const userId = session.user.id;
    console.log('✅ Authenticated as:', session.user.email);
    console.log('👤 User ID:', userId);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 1. Check all invoices for the user
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError);
      return;
    }
    
    console.log(`📋 Found ${invoices?.length || 0} invoices:\n`);
    
    invoices?.forEach((invoice, index) => {
      console.log(`Invoice ${index + 1}:`);
      console.log(`  - ID: ${invoice.id}`);
      console.log(`  - Number: ${invoice.invoice_number}`);
      console.log(`  - Status: ${invoice.status}`);
      console.log(`  - Client: ${invoice.client_company} (Name)`);
      console.log(`  - Client ID: ${invoice.client_id || 'NULL'} ${invoice.client_id ? '✅' : '❌ MISSING!'}`);
      console.log(`  - Total: ${invoice.total}`);
      console.log(`  - Created: ${new Date(invoice.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // 2. Check for duplicates
    const invoiceNumbers = invoices?.map(inv => inv.invoice_number) || [];
    const duplicates = invoiceNumbers.filter((item, index) => invoiceNumbers.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('⚠️ DUPLICATE INVOICE NUMBERS FOUND:', duplicates);
      console.log('');
    }
    
    // 3. Group by invoice number to see duplicates
    if (invoices && invoices.length > 0) {
      const grouped = {};
      invoices.forEach(inv => {
        if (!grouped[inv.invoice_number]) {
          grouped[inv.invoice_number] = [];
        }
        grouped[inv.invoice_number].push(inv);
      });
      
      Object.entries(grouped).forEach(([number, invs]) => {
        if (invs.length > 1) {
          console.log(`\n⚠️ Invoice ${number} has ${invs.length} entries:`);
          invs.forEach(inv => {
            console.log(`  - ID: ${inv.id}, Status: ${inv.status}, Created: ${new Date(inv.created_at).toLocaleString()}`);
          });
        }
      });
    }
    
    // 4. Check if client_id column exists
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🔍 Checking invoices table structure:\n');
    
    if (invoices && invoices.length > 0) {
      const columnNames = Object.keys(invoices[0]);
      console.log('Columns in invoices table:', columnNames.join(', '));
      console.log(`\nclient_id column exists: ${columnNames.includes('client_id') ? 'YES ✅' : 'NO ❌'}`);
    }
    
    // 5. Check selected client in localStorage
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('📦 Checking localStorage:\n');
    
    const selectedClient = localStorage.getItem('selectedClient');
    if (selectedClient) {
      try {
        const client = JSON.parse(selectedClient);
        console.log('Selected client:', client);
        console.log(`Client ID: ${client.id || 'NO ID!'}`);
      } catch (e) {
        console.log('Selected client (raw):', selectedClient);
      }
    } else {
      console.log('No selected client in localStorage');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkInvoiceProblems();
