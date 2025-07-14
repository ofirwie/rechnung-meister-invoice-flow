import { createClient } from '@supabase/supabase-js';

// Use the same credentials as the app
const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2OTQ1MzMsImV4cCI6MjAyODI3MDUzM30.3n9Ag8w0Kj1t5dQ_uavvccwRjcMqJLzKMkF1qokhRlM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🧪 Testing Supabase connection from client side...\n');
  
  try {
    // 1. Test auth
    console.log('1️⃣ TESTING AUTH:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      console.log('\nTry logging in first with:');
      console.log(`email: ofir.wienerman@gmail.com`);
      return;
    }
    
    if (!user) {
      console.log('❌ No user logged in');
      console.log('\nPlease log in to test');
      return;
    }
    
    console.log('✅ Logged in as:', user.email);
    console.log('   User ID:', user.id);
    console.log();
    
    // 2. Test companies query
    console.log('2️⃣ TESTING COMPANIES QUERY:');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('active', true);
      
    if (companiesError) {
      console.error('❌ Companies query error:', companiesError);
      console.log('   Code:', companiesError.code);
      console.log('   Message:', companiesError.message);
      console.log('   Details:', companiesError.details);
      console.log('   Hint:', companiesError.hint);
    } else {
      console.log(`✅ Companies query success: ${companies?.length || 0} companies found`);
      companies?.forEach((c, i) => {
        console.log(`   ${i+1}. ${c.name} (ID: ${c.id})`);
      });
    }
    console.log();
    
    // 3. Test company_users query
    console.log('3️⃣ TESTING COMPANY_USERS QUERY:');
    const { data: memberships, error: membershipsError } = await supabase
      .from('company_users')
      .select('*')
      .eq('user_id', user.id);
      
    if (membershipsError) {
      console.error('❌ Company_users query error:', membershipsError);
    } else {
      console.log(`✅ Memberships query success: ${memberships?.length || 0} memberships found`);
      memberships?.forEach((m, i) => {
        console.log(`   ${i+1}. Company ID: ${m.company_id}, Role: ${m.role}, Active: ${m.active}`);
      });
    }
    console.log();
    
    // 4. Test the exact query from useCompanies hook
    console.log('4️⃣ TESTING EXACT HOOK QUERY:');
    
    // Check if root admin
    const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
    const isRootAdmin = rootAdminEmails.includes(user.email || '');
    console.log(`Is root admin: ${isRootAdmin}`);
    
    // Simulate the hook query
    let companiesQuery = supabase.from('companies').select('*');
    if (!isRootAdmin) {
      companiesQuery = companiesQuery.eq('active', true);
    }
    
    const { data: hookData, error: hookError } = await companiesQuery;
    
    if (hookError) {
      console.error('❌ Hook query error:', hookError);
    } else {
      console.log(`✅ Hook query success: ${hookData?.length || 0} companies`);
      
      if (isRootAdmin) {
        console.log('As root admin, you see all companies');
      } else {
        // Filter by membership
        const { data: userMemberships } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('active', true);
          
        const userCompanyIds = userMemberships?.map(m => m.company_id) || [];
        const filteredCompanies = (hookData || []).filter(c => 
          userCompanyIds.includes(c.id)
        );
        
        console.log(`After filtering by membership: ${filteredCompanies.length} companies`);
      }
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('If you see companies in the queries above but not in the app,');
    console.log('the issue might be:');
    console.log('1. State management in React');
    console.log('2. Component re-rendering issues');
    console.log('3. CompanyContext not updating');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testConnection().catch(console.error);