// Script to check for duplicate invoices and verify unique constraints
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bvwcepfpnhocatfvfqym.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2d2NlcGZwbmhvY2F0ZnZmcXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAzNTMxMDAsImV4cCI6MjAzNTkyOTEwMH0.Ru6K1ROtMFnvSlhe3KeQhO7AnKPr_w1GZbB8IvcL7N0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicateInvoices() {
  console.log('Checking for duplicate invoices in the database...\n');

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

    // Check for duplicates in invoices table
    console.log('📋 CHECKING INVOICES TABLE FOR DUPLICATES:');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('invoice_number, created_at, client_company, status')
      .eq('user_id', userId)
      .order('invoice_number')
      .order('created_at', { ascending: false });

    if (invoicesError) {
      console.error('Error fetching invoices:', invoicesError);
      return;
    }

    // Group by invoice_number to find duplicates
    const invoiceGroups = {};
    invoices?.forEach(inv => {
      if (!invoiceGroups[inv.invoice_number]) {
        invoiceGroups[inv.invoice_number] = [];
      }
      invoiceGroups[inv.invoice_number].push(inv);
    });

    const duplicateInvoiceNumbers = Object.keys(invoiceGroups).filter(num => invoiceGroups[num].length > 1);
    
    if (duplicateInvoiceNumbers.length > 0) {
      console.log(`\n⚠️  Found ${duplicateInvoiceNumbers.length} invoice numbers with duplicates:`);
      duplicateInvoiceNumbers.forEach(num => {
        console.log(`\n  Invoice Number: ${num}`);
        invoiceGroups[num].forEach(inv => {
          console.log(`    - Created: ${inv.created_at}, Client: ${inv.client_company}, Status: ${inv.status}`);
        });
      });
    } else {
      console.log('\n✅ No duplicate invoice numbers found in invoices table');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Check for duplicates in invoice_history table
    console.log('📋 CHECKING INVOICE_HISTORY TABLE FOR DUPLICATES:');
    const { data: history, error: historyError } = await supabase
      .from('invoice_history')
      .select('invoice_number, created_at, client_name, status')
      .eq('user_id', userId)
      .order('invoice_number')
      .order('created_at', { ascending: false });

    if (historyError) {
      console.error('Error fetching invoice_history:', historyError);
      return;
    }

    // Group by invoice_number to find duplicates
    const historyGroups = {};
    history?.forEach(hist => {
      if (!historyGroups[hist.invoice_number]) {
        historyGroups[hist.invoice_number] = [];
      }
      historyGroups[hist.invoice_number].push(hist);
    });

    const duplicateHistoryNumbers = Object.keys(historyGroups).filter(num => historyGroups[num].length > 1);
    
    if (duplicateHistoryNumbers.length > 0) {
      console.log(`\n⚠️  Found ${duplicateHistoryNumbers.length} invoice numbers with duplicates in history:`);
      duplicateHistoryNumbers.forEach(num => {
        console.log(`\n  Invoice Number: ${num}`);
        historyGroups[num].forEach(hist => {
          console.log(`    - Created: ${hist.created_at}, Client: ${hist.client_name}, Status: ${hist.status}`);
        });
      });
    } else {
      console.log('\n✅ No duplicate invoice numbers found in invoice_history table');
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Clean up invoice_history table (optional - uncomment to run)
    if (duplicateHistoryNumbers.length > 0) {
      console.log('🧹 CLEANUP SUGGESTION:');
      console.log('To remove duplicates from invoice_history table, you can:');
      console.log('1. Keep only the latest entry for each invoice_number');
      console.log('2. Or completely clear the invoice_history table since we\'re now using only the invoices table');
      console.log('\nWould you like to proceed with cleanup? (This script doesn\'t do it automatically for safety)');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the check
checkDuplicateInvoices();
