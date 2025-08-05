// Create test clients for authenticated user
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTestClients() {
  console.log('� TESTING CLIENT CREATION & LOADING');
  console.log('===================================\n');

  try {
    // 1. Check current session
    console.log('1️⃣ Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }
    
    if (!session?.user) {
      console.log('⚠️ No active session found');
      console.log('💡 Please log in through your web app first, then run this script');
      return;
    }

    console.log('✅ Found authenticated session!');
    console.log(`   User: ${session.user.email}`);
    console.log(`   User ID: ${session.user.id}`);

    // 2. Test loading existing clients (with proper filtering)
    console.log('\n2️⃣ Loading existing clients with user_id filter...');
    const { data: existingClients, error: loadError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (loadError) {
      console.error('❌ Error loading clients:', loadError);
    } else {
      console.log(`✅ Found ${existingClients.length} existing clients for your user`);
      existingClients.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.company_name} (ID: ${client.id})`);
      });
    }

    // 3. Create a test client if none exist
    if (!existingClients || existingClients.length === 0) {
      console.log('\n3️⃣ Creating test client...');
      
      const testClient = {
        company_name: 'Test Company Ltd',
        contact_name: 'John Doe',
        address: '123 Test Street',
        city: 'Tel Aviv',
        postal_code: '12345',
        country: 'Israel',
        email: 'test@example.com',
        phone: '+972-50-123-4567',
        tax_id: '123456789',
        user_id: session.user.id  // Critical for RLS
      };

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert(testClient)
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test client:', createError);
      } else {
        console.log('✅ Test client created successfully!');
        console.log(`   Company: ${newClient.company_name}`);
        console.log(`   ID: ${newClient.id}`);
      }
    }

    // 4. Test loading again after creation
    console.log('\n4️⃣ Re-loading clients after creation...');
    const { data: finalClients, error: finalLoadError } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (finalLoadError) {
      console.error('❌ Error in final load:', finalLoadError);
    } else {
      console.log(`✅ Final count: ${finalClients.length} clients`);
      console.log('\n📋 Your clients:');
      finalClients.forEach((client, i) => {
        console.log(`   ${i + 1}. ${client.company_name}`);
        console.log(`      Contact: ${client.contact_name || 'N/A'}`);
        console.log(`      City: ${client.city}`);
        console.log(`      User ID: ${client.user_id}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n📊 Test complete');
  console.log('\n💡 NEXT STEPS:');
  console.log('   1. If you see clients here, they should now appear in your web app');
  console.log('   2. If there are errors, we need to check your RLS policies');
  console.log('   3. Refresh your web app to see if clients now load properly');
}

createTestClients().catch(console.error);
