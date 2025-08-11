// Script to check invoice tables structure
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvwcepfpnhocatfvfqym.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2d2NlcGZwbmhvY2F0ZnZmcXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAzNTMxMDAsImV4cCI6MjAzNTkyOTEwMH0.Ru6K1ROtMFnvSlhe3KeQhO7AnKPr_w1GZbB8IvcL7N0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoiceTables() {
  console.log('Checking invoice tables structure...\n');

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
    console.log('📋 INVOICES TABLE:');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('invoice_number, status, created_at, client_company')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
    } else {
      console.log(`Found ${invoices?.length || 0} invoices`);
      invoices?.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.client_company} (${inv.status})`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check invoice_history table
    console.log('📋 INVOICE_HISTORY TABLE:');
    const { data: history, error: historyError } = await supabase
      .from('invoice_history')
      .select('invoice_number, status, created_at, client_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (historyError) {
      console.error('Error fetching invoice_history:', historyError);
    } else {
      console.log(`Found ${history?.length || 0} history records`);
      history?.forEach(hist => {
        console.log(`  - ${hist.invoice_number}: ${hist.client_name} (${hist.status})`);
      });
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check if there's a mismatch
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: historyCount } = await supabase
      .from('invoice_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log('📊 SUMMARY:');
    console.log(`Total invoices: ${invoiceCount || 0}`);
    console.log(`Total history records: ${historyCount || 0}`);
    
    if (invoiceCount !== historyCount) {
      console.log('\n⚠️  WARNING: Invoice count doesn\'t match history count!');
      console.log('This means some invoices are not synced to the history table.');
      console.log('\nPossible solutions:');
      console.log('1. Create a database trigger to auto-sync invoices to history');
      console.log('2. Manually sync when saving invoices');
      console.log('3. Use a single table instead of two separate tables');
    } else {
      console.log('\n✅ Invoice counts match!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkInvoiceTables();
