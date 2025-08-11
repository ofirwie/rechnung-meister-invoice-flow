import { createClient } from '@supabase/supabase-js';

// Using the same credentials as the app
const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2OTQ1MzMsImV4cCI6MjAyODI3MDUzM30.3n9Ag8w0Kj1t5dQ_uavvccwRjcMqJLzKMkF1qokhRlM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanInvoicesTable() {
  console.log('🔍 Starting invoice cleanup process...');
  
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
  
  // First check what invoices exist for this user
  console.log('📋 Checking user invoices...');
  const { data: userInvoices, error: checkError } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_company, status, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (checkError) {
    console.error('❌ Error checking invoices:', checkError);
    return;
  }
  
  console.log(`📊 Found ${userInvoices?.length || 0} invoices for your user`);
  
  if (!userInvoices || userInvoices.length === 0) {
    console.log('✅ No invoices to delete!');
    return;
  }
  
  // Show invoices that will be deleted
  console.log('\n📋 Invoices to be deleted:');
  userInvoices.forEach((inv, i) => {
    console.log(`   ${i+1}. ${inv.invoice_number} - ${inv.client_company} (${inv.status})`);
  });
  
  // Delete user's invoices
  console.log('\n🗑️ Deleting your invoices...');
  
  const { error: deleteError } = await supabase
    .from('invoices')
    .delete()
    .eq('user_id', userId);
    
  if (deleteError) {
    console.error('❌ Error deleting invoices:', deleteError);
    console.log('Error details:', {
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint
    });
    return;
  }
  
  console.log('✅ All your invoices deleted successfully!');
  
  // Verify deletion
  const { count: newCount, error: newCountError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
    
  if (newCountError) {
    console.error('❌ Error verifying deletion:', newCountError);
    return;
  }
  
  console.log(`✅ Verification: ${newCount} invoices remaining for your user (should be 0)`);
}

// Run the cleanup
cleanInvoicesTable().catch(console.error);
