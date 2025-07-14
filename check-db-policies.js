// Check current RLS policies and table status
import { createClient } from '@supabase/supabase-js';

// You'll need to add your Supabase URL and service key here
const supabaseUrl = 'https://rwsomqabrlkdgmcqgwji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3c29tcWFicmxrZGdtY3Fnd2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjc5MTQzOCwiZXhwIjoyMDUyMzY3NDM4fQ.5QIzQNqnr3dvQ-AQwNWbBfWbnAo-DkFdJBKLKN7wDL8'; // Service role key

const supabase = createClient(supabaseUrl, serviceKey);

async function checkDatabase() {
  console.log('🔍 Checking companies table and policies...');
  
  try {
    // Check if RLS is enabled
    const { data: rlsInfo, error: rlsError } = await supabase
      .rpc('check_rls_status');
    
    if (rlsError) {
      console.log('❌ Could not check RLS status:', rlsError.message);
    } else {
      console.log('📋 RLS Status:', rlsInfo);
    }
    
    // Try to query companies table directly with service key
    console.log('🏢 Querying companies table with service key...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*');
      
    if (companiesError) {
      console.log('❌ Companies query failed:', companiesError);
    } else {
      console.log('✅ Companies found:', companies?.length || 0);
      companies?.forEach(company => {
        console.log(`  - ${company.name} (ID: ${company.id}, Active: ${company.active})`);
      });
    }
    
    // Check company_users table
    console.log('👥 Querying company_users table...');
    const { data: memberships, error: membershipsError } = await supabase
      .from('company_users')
      .select('*');
      
    if (membershipsError) {
      console.log('❌ Company users query failed:', membershipsError);
    } else {
      console.log('✅ Company memberships found:', memberships?.length || 0);
      memberships?.forEach(membership => {
        console.log(`  - User ${membership.user_id} in company ${membership.company_id} (Role: ${membership.role}, Active: ${membership.active})`);
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkDatabase().then(() => {
  console.log('✅ Database check complete');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});