import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugInvoiceSystem() {
  console.log('🔍 Debugging Invoice History and Cancellation System\n');

  try {
    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }

    const userId = session.user.id;
    console.log('✅ Authenticated as:', session.user.email);
    console.log('👤 User ID:', userId);

    // 1. Check all invoices for the user
    console.log('\n📋 Fetching all invoices for user...');
    const { data: allInvoices, error: allError } = await supabase
      .from('invoices')
      .select('invoice_number, status, client_company, created_at, deleted_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching invoices:', allError);
      return;
    }

    console.log(`\n📊 Found ${allInvoices.length} invoices total:`);
    allInvoices.forEach(inv => {
      console.log(`  - ${inv.invoice_number}: ${inv.status} | ${inv.client_company} | Deleted: ${inv.deleted_at ? 'YES' : 'NO'}`);
    });

    // 2. Check non-deleted invoices (what should appear in history)
    console.log('\n📋 Non-deleted invoices (should appear in history):');
    const nonDeleted = allInvoices.filter(inv => !inv.deleted_at);
    console.log(`Found ${nonDeleted.length} non-deleted invoices`);
    
    // Group by status
    const statusGroups = {};
    nonDeleted.forEach(inv => {
      statusGroups[inv.status] = (statusGroups[inv.status] || 0) + 1;
    });
    
    console.log('\nStatus breakdown:');
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} invoices`);
    });

    // 3. Check cancelled invoices specifically
    const cancelledInvoices = nonDeleted.filter(inv => inv.status === 'cancelled');
    console.log(`\n🚫 Cancelled invoices: ${cancelledInvoices.length}`);
    if (cancelledInvoices.length > 0) {
      console.log('Cancelled invoice details:');
      cancelledInvoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.client_company}`);
      });
    }

    // 4. Check for invoices that can be cancelled
    console.log('\n✅ Invoices that CAN be cancelled (draft or pending_approval):');
    const cancellableInvoices = nonDeleted.filter(inv => 
      inv.status === 'draft' || inv.status === 'pending_approval'
    );
    
    if (cancellableInvoices.length > 0) {
      cancellableInvoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.status} | ${inv.client_company}`);
      });
    } else {
      console.log('  No cancellable invoices found');
    }

    // 5. Check for invoices that CANNOT be cancelled
    console.log('\n❌ Invoices that CANNOT be cancelled (approved or issued):');
    const nonCancellableInvoices = nonDeleted.filter(inv => 
      inv.status === 'approved' || inv.status === 'issued'
    );
    
    if (nonCancellableInvoices.length > 0) {
      nonCancellableInvoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.status} | ${inv.client_company}`);
      });
    } else {
      console.log('  No non-cancellable invoices found');
    }

    // 6. Test cancellation of a specific invoice
    const testInvoiceNumber = process.argv[2];
    if (testInvoiceNumber) {
      console.log(`\n🧪 Testing cancellation of invoice: ${testInvoiceNumber}`);
      
      // First check current status
      const { data: testInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('status, invoice_number')
        .eq('invoice_number', testInvoiceNumber)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .limit(1);

      if (fetchError || !testInvoice || testInvoice.length === 0) {
        console.error('❌ Invoice not found or error:', fetchError?.message);
      } else {
        const invoice = testInvoice[0];
        console.log(`Current status: ${invoice.status}`);
        
        if (invoice.status === 'approved' || invoice.status === 'issued') {
          console.log('❌ Cannot cancel this invoice - it is already approved/issued!');
        } else if (invoice.status === 'cancelled') {
          console.log('⚠️ Invoice is already cancelled');
        } else {
          console.log('✅ This invoice can be cancelled');
          
          // Try to cancel it
          const { error: updateError } = await supabase
            .from('invoices')
            .update({ status: 'cancelled' })
            .eq('invoice_number', testInvoiceNumber)
            .eq('user_id', userId);

          if (updateError) {
            console.error('❌ Error cancelling invoice:', updateError);
          } else {
            console.log('✅ Invoice cancelled successfully!');
          }
        }
      }
    } else {
      console.log('\n💡 Tip: Run with an invoice number to test cancellation:');
      console.log('   node debug-invoice-history-and-cancellation.js INV-2024-001');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugInvoiceSystem();
