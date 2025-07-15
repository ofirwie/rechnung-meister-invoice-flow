import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testClientCreation() {
  console.log('🧪 Testing client creation process...\n');

  try {
    // Test 1: Check if we can read clients table
    console.log('1️⃣ Testing clients table read access...');
    const { data: clients, error: readError } = await supabase
      .from('clients')
      .select('*')
      .limit(1);

    if (readError) {
      console.error('❌ Cannot read clients table:', readError);
      if (readError.code === '42501') {
        console.log('⚠️  This is an RLS policy issue - table requires authentication');
      }
    } else {
      console.log('✅ Can read clients table');
    }

    // Test 2: Check RLS policies
    console.log('\n2️⃣ Testing RLS policies...');
    const { data: policiesData, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'clients');

    if (policiesError) {
      console.log('ℹ️  Cannot read RLS policies (this is normal)');
    } else {
      console.log('📋 RLS policies found:', policiesData.length);
    }

    // Test 3: Check current user status
    console.log('\n3️⃣ Testing authentication status...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.error('❌ Auth error:', authError);
    } else if (session?.user) {
      console.log('✅ User is authenticated:', session.user.email);
      
      // Try to insert a client as authenticated user
      console.log('\n4️⃣ Testing authenticated client insertion...');
      const testClient = {
        company_name: 'Test Client Corp',
        contact_name: 'Test Contact',
        address: '123 Test Street',
        city: 'Test City',
        postal_code: '12345',
        country: 'Israel',
        email: 'test@testclient.com',
        phone: '+972-50-1234567',
        tax_id: '123456789',
        business_license: 'TEST123',
        company_registration: 'TEST456'
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('clients')
        .insert([testClient])
        .select();

      if (insertError) {
        console.error('❌ Insert failed:', insertError);
      } else {
        console.log('✅ Client inserted successfully:', insertResult[0]);
      }
    } else {
      console.log('⚠️  No authenticated user - this is why RLS is blocking');
      console.log('🔑 You need to log in through the app first');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n📊 Test complete');
}

testClientCreation().catch(console.error);