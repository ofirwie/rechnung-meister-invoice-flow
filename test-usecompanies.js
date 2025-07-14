// Let's test the exact same logic as useCompanies hook
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzhgyyihnsqwcbsdsdxs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2OTQ1MzMsImV4cCI6MjAyODI3MDUzM30.3n9Ag8w0Kj1t5dQ_uavvccwRjcMqJLzKMkF1qokhRlM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUseCompaniesLogic() {
  console.log('🧪 Testing exact useCompanies logic...\n');

  try {
    // Step 1: Get user (same as useCompanies)
    console.log('1. Getting user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('❌ Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ No user');
      return;
    }
    
    console.log('✅ User:', user.email);

    // Step 2: Check root admin (same logic as useCompanies)
    console.log('\n2. Checking root admin...');
    const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
    const isRootAdmin = rootAdminEmails.includes(user.email || '');
    console.log('✅ Root admin:', isRootAdmin);

    // Step 3: Query companies (same as useCompanies)
    console.log('\n3. Querying companies...');
    let companiesQuery = supabase.from('companies').select('*');
    
    if (!isRootAdmin) {
      companiesQuery = companiesQuery.eq('active', true);
      console.log('   Added active filter');
    } else {
      console.log('   No filter - root admin sees all');
    }
    
    const { data: allCompanies, error: companiesError } = await companiesQuery;
    
    if (companiesError) {
      console.log('❌ Companies error:', companiesError);
      return;
    }
    
    console.log('✅ Companies from query:', allCompanies?.length || 0);
    allCompanies?.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} (ID: ${c.id}, Active: ${c.active})`);
    });

    // Step 4: Filter logic (same as useCompanies)
    console.log('\n4. Applying filter logic...');
    let activeCompanies = [];
    
    if (isRootAdmin) {
      activeCompanies = allCompanies || [];
      console.log('✅ Root admin - showing all companies:', activeCompanies.length);
    } else {
      console.log('   Getting user memberships...');
      const { data: userMemberships, error: membershipsError } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('active', true);

      if (membershipsError) {
        console.log('❌ Memberships error:', membershipsError);
        return;
      }

      console.log('   Memberships:', userMemberships?.length || 0);
      const userCompanyIds = userMemberships?.map(m => m.company_id) || [];
      console.log('   User company IDs:', userCompanyIds);
      
      activeCompanies = (allCompanies || []).filter(company => 
        userCompanyIds.includes(company.id)
      );
      console.log('✅ Filtered companies:', activeCompanies.length);
    }

    // Step 5: Final result
    console.log('\n🎯 FINAL RESULT:');
    console.log('Companies that should be shown to user:', activeCompanies.length);
    activeCompanies.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} (ID: ${c.id})`);
    });

    if (activeCompanies.length === 0) {
      console.log('\n❌ PROBLEM: No companies in final result!');
      console.log('This explains why the UI shows "No companies found"');
    } else {
      console.log('\n✅ SUCCESS: Companies should be visible in UI');
      console.log('If they\'re not showing, the issue is in React state/rendering');
    }

  } catch (error) {
    console.log('💥 Error:', error);
  }
}

testUseCompaniesLogic().catch(console.error);