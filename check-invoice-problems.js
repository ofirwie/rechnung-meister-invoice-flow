import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkInvoiceProblems() {
  console.log('🔍 Checking invoice problems...\n');
  
  try {
    // 1. Check all invoices for the user
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c')
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
      console.log(`  - Client ID: ${invoice.client_id || 'NULL'} ⚠️`);
      console.log(`  - Total: ${invoice.total}`);
      console.log(`  - Created: ${new Date(invoice.created_at).toLocaleString()}`);
      console.log('');
    });
    
    // 2. Check for duplicates
    const invoiceNumbers = invoices?.map(inv => inv.invoice_number) || [];
    const duplicates = invoiceNumbers.filter((item, index) => invoiceNumbers.indexOf(item) !== index);
    
    if (duplicates.length > 0) {
      console.log('⚠️ DUPLICATE INVOICE NUMBERS FOUND:', duplicates);
    }
    
    // 3. Check invoice history table
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('📜 Checking invoice_history table:\n');
    
    const { data: history, error: historyError } = await supabase
      .from('invoice_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (historyError) {
      console.error('❌ Error fetching invoice history:', historyError);
    } else {
      console.log(`Found ${history?.length || 0} history records`);
      history?.forEach(record => {
        console.log(`  - ${record.invoice_number}: ${record.status} (${new Date(record.created_at).toLocaleString()})`);
      });
    }
    
    // 4. Check if client_id column exists
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🔍 Checking invoices table structure:\n');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'invoices' });
    
    if (columnsError) {
      console.log('Using alternative method to check columns...');
      // Try direct query
      const { data: sample, error: sampleError } = await supabase
        .from('invoices')
        .select('*')
        .limit(1);
      
      if (!sampleError && sample && sample.length > 0) {
        const columnNames = Object.keys(sample[0]);
        console.log('Columns in invoices table:', columnNames);
        console.log(`client_id column exists: ${columnNames.includes('client_id') ? 'YES ✅' : 'NO ❌'}`);
      }
    } else {
      console.log('Columns:', columns);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkInvoiceProblems();
