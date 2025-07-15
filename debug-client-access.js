import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugClientAccess() {
  console.log('🔍 Debugging client access...\n');

  try {
    // Test 1: Check clients table without any filters
    console.log('1️⃣ Checking ALL clients (no filters)...');
    const { data: allClients, error: allError, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact' });

    if (allError) {
      console.error('❌ Error fetching all clients:', allError);
    } else {
      console.log(`✅ Total clients in table: ${count || allClients.length}`);
      if (allClients && allClients.length > 0) {
        console.log('📋 Clients found:');
        allClients.forEach((client, i) => {
          console.log(`  ${i + 1}. ${client.company_name} (ID: ${client.id})`);
          console.log(`     User ID: ${client.user_id || 'NO USER ID'}`);
          console.log(`     Created: ${client.created_at}`);
        });
      }
    }

    // Test 2: Check with RLS bypass (if possible)
    console.log('\n2️⃣ Testing direct SQL query...');
    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', { query: 'SELECT COUNT(*) as count FROM clients' })
      .single();

    if (sqlError) {
      console.log('ℹ️  Cannot execute direct SQL (normal for security)');
    } else {
      console.log('📊 Direct SQL count:', sqlResult?.count);
    }

    // Test 3: Check current user context
    console.log('\n3️⃣ Checking authentication context...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('❌ Auth error:', authError);
    } else if (session?.user) {
      console.log('✅ Authenticated as:', session.user.email);
      console.log('   User ID:', session.user.id);
      
      // Try to fetch clients for this specific user
      console.log('\n4️⃣ Fetching clients for current user...');
      const { data: userClients, error: userError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id);

      if (userError) {
        console.error('❌ Error fetching user clients:', userError);
      } else {
        console.log(`✅ Clients for user ${session.user.email}: ${userClients.length}`);
      }
    } else {
      console.log('⚠️  No authenticated user');
      console.log('💡 This might be why you see no clients - RLS requires authentication');
    }

    // Test 4: Check if clients table has user_id column
    console.log('\n5️⃣ Checking for orphaned clients (no user_id)...');
    const { data: orphanedClients, error: orphanError } = await supabase
      .from('clients')
      .select('*')
      .is('user_id', null);

    if (orphanError) {
      console.log('ℹ️  Cannot check for orphaned clients');
    } else if (orphanedClients && orphanedClients.length > 0) {
      console.log(`⚠️  Found ${orphanedClients.length} clients without user_id!`);
      console.log('These clients might be invisible due to RLS policies');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }

  console.log('\n📊 Debug complete');
  console.log('\n💡 SOLUTION: If you had clients before, they might not have user_id set.');
  console.log('   RLS policies require user_id to match the logged-in user.');
  console.log('   You may need to add new clients through the app interface.');
}

debugClientAccess().catch(console.error);