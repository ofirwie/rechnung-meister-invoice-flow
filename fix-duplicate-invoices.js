// קוד לתיקון כפילויות בחשבוניות - להריץ בקונסול של הדפדפן
// Run this code in the browser console while logged in

async function fixDuplicateInvoices() {
  console.log('🔧 Fixing duplicate invoices...\n');
  
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
    
    // 1. Get all invoices for the user
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError);
      return;
    }
    
    console.log(`📋 Found ${invoices?.length || 0} total invoices\n`);
    
    // 2. Find duplicates by invoice_number
    const invoiceMap = new Map();
    const duplicates = [];
    
    invoices?.forEach(invoice => {
      if (invoiceMap.has(invoice.invoice_number)) {
        duplicates.push(invoice);
      } else {
        invoiceMap.set(invoice.invoice_number, invoice);
      }
    });
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicate invoices found!');
      return;
    }
    
    console.log(`⚠️ Found ${duplicates.length} duplicate invoices:\n`);
    
    duplicates.forEach(dup => {
      console.log(`Duplicate: ${dup.invoice_number} (ID: ${dup.id})`);
    });
    
    // 3. Ask for confirmation before deletion
    const confirmDelete = confirm(`Found ${duplicates.length} duplicate invoices. Do you want to delete them?`);
    
    if (!confirmDelete) {
      console.log('❌ Deletion cancelled by user');
      return;
    }
    
    // 4. Delete duplicates
    console.log('\n🗑️ Deleting duplicates...\n');
    
    for (const dup of duplicates) {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', dup.id)
        .eq('user_id', userId); // Extra safety check
      
      if (error) {
        console.error(`❌ Error deleting invoice ${dup.invoice_number}:`, error);
      } else {
        console.log(`✅ Deleted duplicate: ${dup.invoice_number} (ID: ${dup.id})`);
      }
    }
    
    console.log('\n✅ Duplicate cleanup completed!');
    console.log('🔄 Please refresh the page to see the changes.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixDuplicateInvoices();
