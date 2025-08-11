// Debug script to check invoice display issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvwcepfpnhocatfvfqym.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2d2NlcGZwbmhvY2F0ZnZmcXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAzNTMxMDAsImV4cCI6MjAzNTkyOTEwMH0.Ru6K1ROtMFnvSlhe3KeQhO7AnKPr_w1GZbB8IvcL7N0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInvoiceDisplay() {
  console.log('Debugging invoice display issue...\n');

  try {
    // Get user session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      console.error('❌ Authentication required. Please login first.');
      return;
    }

    const userId = session.user.id;
    console.log('✅ Authenticated as:', session.user.email);
    console.log('User ID:', userId);
    console.log('\n' + '='.repeat(50) + '\n');

    // Check invoices table
    console.log('📋 CHECKING INVOICES TABLE:');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return;
    }

    console.log(`\nTotal invoices found: ${invoices?.length || 0}`);
    
    // Group by status
    const statusGroups = {};
    invoices?.forEach(inv => {
      if (!statusGroups[inv.status]) {
        statusGroups[inv.status] = [];
      }
      statusGroups[inv.status].push(inv);
    });

    console.log('\nInvoices by status:');
    Object.entries(statusGroups).forEach(([status, invs]) => {
      console.log(`  ${status}: ${invs.length} invoices`);
      invs.forEach(inv => {
        console.log(`    - ${inv.invoice_number} (${inv.client_company}) - Created: ${inv.created_at}`);
      });
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Check what should appear in pending invoices
    const pendingInvoices = invoices?.filter(inv => 
      inv.status === 'draft' || inv.status === 'pending_approval'
    ) || [];
    
    console.log(`📝 PENDING INVOICES (should show in Pending screen): ${pendingInvoices.length}`);
    pendingInvoices.forEach(inv => {
      console.log(`  - ${inv.invoice_number} (${inv.client_company}) - Status: ${inv.status}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Check what should appear in invoice history
    const approvedInvoices = invoices?.filter(inv => 
      inv.status === 'approved' || inv.status === 'issued'
    ) || [];
    
    console.log(`✅ APPROVED/ISSUED INVOICES (should show in History): ${approvedInvoices.length}`);
    approvedInvoices.forEach(inv => {
      console.log(`  - ${inv.invoice_number} (${inv.client_company}) - Status: ${inv.status}`);
    });

    console.log('\n' + '='.repeat(50) + '\n');

    // Check invoice_history table (should be empty or not used)
    console.log('📋 CHECKING INVOICE_HISTORY TABLE (should not be used anymore):');
    const { data: history, error: historyError } = await supabase
      .from('invoice_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching invoice_history:', historyError);
    } else {
      console.log(`\nEntries in invoice_history table: ${history?.length || 0}`);
      if (history?.length > 0) {
        console.log('\n⚠️  WARNING: invoice_history table still has data. This table should not be used anymore!');
        console.log('The application should only use the invoices table with status filtering.');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the debug
debugInvoiceDisplay();
