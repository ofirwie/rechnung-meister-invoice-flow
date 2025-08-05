// Simple authentication flow test
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthFlow() {
  console.log('🔍 AUTHENTICATION FLOW TEST');
  console.log('============================\n');

  try {
    // 1. Check current session
    console.log('1️⃣ Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else if (session?.user) {
      console.log('✅ Found existing session!');
      console.log(`   User: ${session.user.email}`);
      console.log(`   User ID: ${session.user.id}`);
      
      // Test client query with authenticated user
      console.log('\n2️⃣ Testing client query as authenticated user...');
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*');
        
      if (clientError) {
        console.error('❌ Client query failed:', clientError);
        console.log('💡 RLS policy might be blocking access');
      } else {
        console.log(`✅ Authenticated user sees: ${clients.length} clients`);
        if (clients.length > 0) {
          console.log('📋 Clients found:');
          clients.forEach((client, i) => {
            console.log(`  ${i + 1}. ${client.company_name} (User: ${client.user_id})`);
          });
        } else {
          console.log('💡 No clients found - this might be why your app shows empty client list');
        }
      }
      
      // Test company query
      console.log('\n3️⃣ Testing company access...');
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('*');
        
      if (companyError) {
        console.error('❌ Company query failed:', companyError);
      } else {
        console.log(`✅ User sees: ${companies.length} companies`);
        companies.forEach((company, i) => {
          console.log(`  ${i + 1}. ${company.name} (Owner: ${company.user_id})`);
        });
      }
      
    } else {
      console.log('⚠️ No active session found');
      console.log('💡 User needs to log in first');
      
      // Test anonymous client access (should be blocked)
      console.log('\n2️⃣ Testing anonymous client access...');
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('*');
        
      if (clientError) {
        console.log('✅ Anonymous access properly blocked by RLS');
        console.log('   Error:', clientError.message);
      } else {
        console.log(`⚠️ Anonymous user unexpectedly sees: ${clients.length} clients`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n📊 Auth flow test complete');
  console.log('\n💡 SUMMARY:');
  console.log('   - If you see "No active session", you need to log in via your website first');
  console.log('   - If you see "0 clients", that explains why your client list is empty');
  console.log('   - The routing fix should now properly redirect unauthenticated users to /auth');
}

testAuthFlow().catch(console.error);
