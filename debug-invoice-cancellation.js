import { createClient } from '@supabase/supabase-js';

// Read from .env.local file manually
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local file
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInvoices() {
  const userId = 'da8073b0-bd1f-4521-a8e3-074f87f1bd1c';
  
  console.log('🔍 Checking all invoices for user');
  console.log('👤 User ID:', userId);
  console.log('=====================================\n');
  
  // Get all invoices for this user
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('invoice_number, status, deleted_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error:', error);
  } else if (!invoices || invoices.length === 0) {
    console.log('❌ No invoices found for this user!');
  } else {
    console.log('✅ Found invoices:', invoices.length);
    console.log('\nInvoice Details:');
    invoices.forEach(inv => {
      console.log('\n📄 Invoice:', inv.invoice_number);
      console.log('   Status:', inv.status);
      console.log('   Deleted:', inv.deleted_at ? 'YES' : 'NO');
      console.log('   Created:', new Date(inv.created_at).toLocaleString());
    });
    
    // Count by status
    console.log('\n📊 Status Summary:');
    const statusCounts = {};
    invoices.forEach(inv => {
      if (!inv.deleted_at) {
        statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
      }
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log('   ' + status + ':', count);
    });
    
    // Show non-deleted invoices only
    console.log('\n📊 Active Invoices (non-deleted):');
    const activeInvoices = invoices.filter(inv => !inv.deleted_at);
    console.log('Total active:', activeInvoices.length);
    
    // Show approved/issued invoices
    const approvedOrIssued = activeInvoices.filter(inv => 
      inv.status === 'approved' || inv.status === 'issued'
    );
    console.log('\n⚠️ Approved/Issued invoices (cannot be cancelled):');
    if (approvedOrIssued.length === 0) {
      console.log('   None found');
    } else {
      approvedOrIssued.forEach(inv => {
        console.log('   - ' + inv.invoice_number + ' (' + inv.status + ')');
      });
    }
  }
}

debugInvoices().catch(console.error);
