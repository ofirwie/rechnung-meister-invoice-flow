import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2OTQ1MzMsImV4cCI6MjAyODI3MDUzM30.3n9Ag8w0Kj1t5dQ_uavvccwRjcMqJLzKMkF1qokhRlM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCancelledInvoices() {
  console.log('🔍 Debugging cancelled invoices issue...\n');

  try {
    // Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      console.error('❌ Authentication required. Please login first.');
      return;
    }

    const userId = session.user.id;
    console.log('✅ Authenticated as:', session.user.email);
    console.log('👤 User ID:', userId);
    console.log('\n' + '='.repeat(50) + '\n');

    // Check all invoices for this user
    console.log('📋 ALL INVOICES:');
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('invoice_number, status, client_company, user_id, company_id, deleted_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all invoices:', allError);
    } else {
      console.log(`Found ${allInvoices?.length || 0} total invoices`);
      allInvoices?.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.client_company} (${inv.status}) [deleted: ${inv.deleted_at ? 'YES' : 'NO'}]`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check cancelled invoices specifically
    console.log('📋 CANCELLED INVOICES:');
    const { data: cancelledInvoices, error: cancelledError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'cancelled')
      .is('deleted_at', null);

    if (cancelledError) {
      console.error('Error fetching cancelled invoices:', cancelledError);
    } else {
      console.log(`Found ${cancelledInvoices?.length || 0} cancelled invoices`);
      cancelledInvoices?.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.client_company}`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check approved invoices that should show in history
    console.log('📋 INVOICES FOR HISTORY (approved/issued/cancelled):');
    const { data: historyInvoices, error: historyError } = await supabase
      .from('invoices')
      .select('invoice_number, status, client_company, created_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('status', ['approved', 'issued', 'cancelled'])
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching history invoices:', historyError);
    } else {
      console.log(`Found ${historyInvoices?.length || 0} invoices for history`);
      historyInvoices?.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.client_company} (${inv.status})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug
debugCancelledInvoices();
