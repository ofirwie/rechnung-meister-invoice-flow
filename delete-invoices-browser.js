// קוד למחיקת חשבוניות - להריץ בקונסול של הדפדפן
// Run this code in the browser console while logged in

async function deleteAllInvoices() {
  console.log('🗑️ Starting invoice cleanup...\n');
  
  try {
    // Get the Supabase client from the window object
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
    
    console.log('✅ Authenticated as:', session.user.email);
    console.log('👤 User ID:', session.user.id);
    console.log('\n' + '='.repeat(50) + '\n');
    
    // First, get all invoices for this user
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, status, client_company')
      .eq('user_id', session.user.id);
    
    if (fetchError) {
      console.error('❌ Error fetching invoices:', fetchError);
      return;
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('✅ No invoices found to delete.');
      return;
    }
    
    console.log(`📋 Found ${invoices.length} invoices to delete:`);
    invoices.forEach(inv => {
      console.log(`  - ${inv.invoice_number}: ${inv.client_company} (${inv.status})`);
    });
    
    console.log('\n🔄 Deleting invoices...');
    
    // Delete all invoices for this user
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('user_id', session.user.id);
    
    if (deleteError) {
      console.error('❌ Error deleting invoices:', deleteError);
      return;
    }
    
    console.log('\n✅ All invoices deleted successfully!');
    console.log('🔄 Please refresh the page to see the changes.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
deleteAllInvoices();
