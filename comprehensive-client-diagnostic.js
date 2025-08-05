// Comprehensive READ-ONLY diagnostic for client loading issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDQ1MTMyOSwiZXhwIjoyMDM2MDI3MzI5fQ.8lZ0EBaUlwcGU5oVNq9NAfru9vGMFJcJXVHEYnftjwY";

// Create both clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function comprehensiveDiagnostic() {
  console.log('🔍 COMPREHENSIVE CLIENT DIAGNOSTIC - READ ONLY');
  console.log('================================================\n');

  try {
    // 1. DATABASE-LEVEL CHECK (Service Role - sees everything)
    console.log('1️⃣ DATABASE-LEVEL CHECK (bypassing RLS)');
    console.log('----------------------------------------');
    
    const { data: allClientsService, error: serviceError } = await supabaseService
      .from('clients')
      .select('*');

    if (serviceError) {
      console.error('❌ Service role error:', serviceError);
    } else {
      console.log(`✅ TOTAL CLIENTS IN DATABASE: ${allClientsService.length}`);
      if (allClientsService.length > 0) {
        console.log('📋 ALL CLIENTS FOUND:');
        allClientsService.forEach((client, i) => {
          console.log(`  ${i + 1}. "${client.company_name}" (ID: ${client.id})`);
          console.log(`     Contact: ${client.contact_name || 'N/A'}`);
          console.log(`     User ID: ${client.user_id || 'NO USER ID'}`);
          console.log(`     Company ID: ${client.company_id || 'NO COMPANY ID'}`);
          console.log(`     Created: ${client.created_at}`);
          console.log('');
        });
      }
    }

    // 2. SCHEMA CHECK
    console.log('2️⃣ SCHEMA ANALYSIS');
    console.log('------------------');
    
    // Check if company_id column exists
    const { data: schemaInfo, error: schemaError } = await supabaseService
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'clients')
      .eq('table_schema', 'public');

    if (schemaError) {
      console.log('ℹ️ Cannot access schema info (normal for some setups)');
    } else {
      console.log('📊 CLIENTS TABLE COLUMNS:');
      schemaInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      const hasCompanyId = schemaInfo.some(col => col.column_name === 'company_id');
      console.log(`\n${hasCompanyId ? '✅' : '❌'} company_id column exists: ${hasCompanyId}`);
    }

    // 3. USER/PROFILE CHECK
    console.log('\n3️⃣ USER & PROFILE ANALYSIS');
    console.log('---------------------------');
    
    const { data: profiles, error: profileError } = await supabaseService
      .from('profiles')
      .select('id, email, created_at');

    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log(`✅ TOTAL USERS: ${profiles.length}`);
      profiles.forEach((profile, i) => {
        console.log(`  ${i + 1}. ${profile.email} (ID: ${profile.id})`);
      });
    }

    // 4. COMPANY CHECK
    console.log('\n4️⃣ COMPANY ANALYSIS');
    console.log('-------------------');
    
    const { data: companies, error: companyError } = await supabaseService
      .from('companies')
      .select('*');

    if (companyError) {
      console.error('❌ Company error:', companyError);
    } else {
      console.log(`✅ TOTAL COMPANIES: ${companies.length}`);
      companies.forEach((company, i) => {
        console.log(`  ${i + 1}. "${company.name}" (ID: ${company.id})`);
        console.log(`     Owner: ${company.user_id}`);
      });
    }

    // 5. USER-COMPANY RELATIONSHIPS
    console.log('\n5️⃣ USER-COMPANY RELATIONSHIPS');
    console.log('-----------------------------');
    
    const { data: userCompanies, error: userCompanyError } = await supabaseService
      .from('user_companies')
      .select('*');

    if (userCompanyError) {
      console.error('❌ User-company error:', userCompanyError);
    } else {
      console.log(`✅ TOTAL USER-COMPANY LINKS: ${userCompanies.length}`);
      userCompanies.forEach((link, i) => {
        console.log(`  ${i + 1}. User ${link.user_id} → Company ${link.company_id}`);
      });
    }

    // 6. RLS POLICY CHECK (Anonymous User Perspective)
    console.log('\n6️⃣ ANONYMOUS USER TEST (what your app sees)');
    console.log('--------------------------------------------');
    
    const { data: anonClients, error: anonError } = await supabaseAnon
      .from('clients')
      .select('*');

    if (anonError) {
      console.error('❌ Anonymous access error:', anonError);
      console.log('💡 This might be why clients don\'t load - RLS blocks anonymous access');
    } else {
      console.log(`✅ Anonymous user sees: ${anonClients.length} clients`);
    }

    // 7. AUTHENTICATION TEST
    console.log('\n7️⃣ AUTHENTICATION TEST');
    console.log('----------------------');
    
    const { data: { session }, error: authError } = await supabaseAnon.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth session error:', authError);
    } else if (session?.user) {
      console.log('✅ Found authenticated session!');
      console.log(`   User: ${session.user.email}`);
      console.log(`   ID: ${session.user.id}`);
      
      // Test authenticated query
      const { data: authClients, error: authClientError } = await supabaseAnon
        .from('clients')
        .select('*');
        
      if (authClientError) {
        console.error('❌ Authenticated client query failed:', authClientError);
      } else {
        console.log(`✅ Authenticated user sees: ${authClients.length} clients`);
      }
    } else {
      console.log('⚠️ No authenticated session found');
      console.log('💡 This is expected for this diagnostic script');
    }

    // 8. SUMMARY & RECOMMENDATIONS
    console.log('\n8️⃣ DIAGNOSTIC SUMMARY');
    console.log('=====================');
    
    if (allClientsService.length === 0) {
      console.log('🔴 ISSUE: Database is completely empty - no clients exist');
      console.log('💡 SOLUTION: Need to create clients through the app interface');
    } else {
      console.log(`🟢 Database contains ${allClientsService.length} client(s)`);
      
      // Check user_id associations
      const clientsWithoutUser = allClientsService.filter(c => !c.user_id);
      if (clientsWithoutUser.length > 0) {
        console.log(`🟡 WARNING: ${clientsWithoutUser.length} clients have no user_id`);
        console.log('💡 These clients will be invisible due to RLS policies');
      }
      
      // Check company_id associations
      const clientsWithoutCompany = allClientsService.filter(c => !c.company_id);
      if (clientsWithoutCompany.length > 0) {
        console.log(`🟡 WARNING: ${clientsWithoutCompany.length} clients have no company_id`);
        console.log('💡 Multi-company filtering might not work properly');
      }
      
      if (anonError) {
        console.log('🔴 ISSUE: RLS policies prevent client loading');
        console.log('💡 Check authentication flow in your app');
      }
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }

  console.log('\n📊 Diagnostic complete - no data was modified');
}

comprehensiveDiagnostic().catch(console.error);
