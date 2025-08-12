import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// You need to get your session token from the browser
// Open developer tools, go to Application > Local Storage > Your URL
// Find the key that contains "auth-token" and copy the access_token value
const ACCESS_TOKEN = process.argv[2];

if (!ACCESS_TOKEN) {
  console.log('❌ Please provide your access token as an argument');
  console.log('Usage: node simple-auth-debug-invoice.js YOUR_ACCESS_TOKEN');
  console.log('\nTo get your token:');
  console.log('1. Open the app in browser and log in');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Application > Local Storage');
  console.log('4. Find the auth-token key and copy the access_token value');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`
    }
  }
});

async function debugInvoiceSystem() {
  console.log('🔍 Debugging Invoice System with provided token\n');

  try {
    // Test if token works
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.error('❌ Invalid token or authentication error:', userError?.message);
      return;
    }

    const userId = userData.user.id;
    console.log('✅ Authenticated as:', userData.user.email);
    console.log('👤 User ID:', userId);

    // Check all invoices
    console.log('\n📋 Fetching all invoices...');
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching invoices:', error);
      return;
    }

    console.log(`\n📊 Found ${invoices.length} active invoices:`);
    
    // Group by status
    const statusGroups = {};
    invoices.forEach(inv => {
      statusGroups[inv.status] = (statusGroups[inv.status] || 0) + 1;
      console.log(`  - ${inv.invoice_number}: ${inv.status} | ${inv.client_company}`);
    });
    
    console.log('\nStatus breakdown:');
    Object.entries(statusGroups).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count} invoices`);
    });

    // Check what appears in history (non-draft)
    const historyInvoices = invoices.filter(inv => inv.status !== 'draft');
    console.log(`\n📚 Invoices in history (non-draft): ${historyInvoices.length}`);

    // Check cancelled invoices
    const cancelledInvoices = invoices.filter(inv => inv.status === 'cancelled');
    console.log(`\n🚫 Cancelled invoices: ${cancelledInvoices.length}`);
    if (cancelledInvoices.length > 0) {
      cancelledInvoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.client_company}`);
      });
    }

    // Check pending invoices (can be cancelled)
    const pendingInvoices = invoices.filter(inv => 
      inv.status === 'draft' || inv.status === 'pending_approval'
    );
    console.log(`\n⏳ Pending invoices (can be cancelled): ${pendingInvoices.length}`);
    if (pendingInvoices.length > 0) {
      pendingInvoices.forEach(inv => {
        console.log(`  - ${inv.invoice_number}: ${inv.status} | ${inv.client_company}`);
      });
    }

    // Test specific invoice if provided
    const testInvoiceNumber = process.argv[3];
    if (testInvoiceNumber) {
      console.log(`\n🧪 Testing invoice: ${testInvoiceNumber}`);
      
      const invoice = invoices.find(inv => inv.invoice_number === testInvoiceNumber);
      if (!invoice) {
        console.error('❌ Invoice not found');
      } else {
        console.log(`Current status: ${invoice.status}`);
        console.log(`Can be cancelled: ${invoice.status === 'draft' || invoice.status === 'pending_approval' ? 'YES' : 'NO'}`);
        console.log(`Created: ${new Date(invoice.created_at).toLocaleString()}`);
        if (invoice.approved_at) {
          console.log(`Approved: ${new Date(invoice.approved_at).toLocaleString()}`);
        }
        if (invoice.issued_at) {
          console.log(`Issued: ${new Date(invoice.issued_at).toLocaleString()}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugInvoiceSystem();
