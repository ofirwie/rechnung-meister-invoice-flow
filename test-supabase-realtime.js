import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  // Create client with minimal config
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false
    }
  });

  // Test 1: Basic connection
  console.log('1️⃣ Testing basic connection...');
  try {
    const { data, error } = await supabase.from('companies').select('count');
    if (error) {
      console.error('❌ Basic connection failed:', error.message);
    } else {
      console.log('✅ Basic connection successful');
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }

  // Test 2: Auth status
  console.log('\n2️⃣ Testing auth status...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Auth check failed:', error.message);
    } else {
      console.log('✅ Auth status:', session ? 'Logged in' : 'Not logged in');
    }
  } catch (err) {
    console.error('❌ Auth error:', err);
  }

  // Test 3: Simple query with timeout
  console.log('\n3️⃣ Testing simple query with timeout...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('❌ Query failed:', error.message);
    } else {
      console.log('✅ Query successful:', data);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('❌ Query timed out after 5 seconds');
    } else {
      console.error('❌ Query error:', err);
    }
  }

  // Test 4: Check RLS policies
  console.log('\n4️⃣ Checking RLS policies...');
  try {
    // Try to query without auth
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️  RLS might be blocking queries:', error.message);
    } else {
      console.log('✅ RLS allows anonymous queries');
    }
  } catch (err) {
    console.error('❌ RLS check error:', err);
  }

  // Test 5: Direct HTTP request
  console.log('\n5️⃣ Testing direct HTTP request...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/companies?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct HTTP request successful:', data);
    } else {
      console.error('❌ Direct HTTP request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (err) {
    console.error('❌ Direct HTTP error:', err);
  }

  console.log('\n📊 Connection test complete');
}

testSupabaseConnection().catch(console.error);