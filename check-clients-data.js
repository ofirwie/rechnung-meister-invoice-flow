import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkClientsData() {
  console.log('🔍 Checking clients data...\n');

  try {
    // Check if clients table exists and has data
    console.log('1️⃣ Checking clients table...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError);
      
      // Check if table exists
      if (clientsError.code === '42P01') {
        console.log('⚠️  Clients table does not exist');
        console.log('📝 Need to create clients table first');
      }
    } else {
      console.log(`✅ Found ${clients.length} clients in database`);
      if (clients.length > 0) {
        console.log('📋 Clients found:');
        clients.forEach((client, index) => {
          console.log(`  ${index + 1}. ${client.company_name} (${client.email || 'no email'})`);
        });
      }
    }

    // Check what's in localStorage (for migration purposes)
    console.log('\n2️⃣ Checking localStorage data...');
    if (typeof localStorage !== 'undefined') {
      const localClients = localStorage.getItem('invoice-clients');
      if (localClients) {
        const parsedClients = JSON.parse(localClients);
        console.log(`📦 Found ${parsedClients.length} clients in localStorage`);
        if (parsedClients.length > 0) {
          console.log('📋 localStorage clients:');
          parsedClients.forEach((client, index) => {
            console.log(`  ${index + 1}. ${client.companyName} (${client.email || 'no email'})`);
          });
        }
      } else {
        console.log('📦 No clients in localStorage');
      }
    }

    // Check table structure
    console.log('\n3️⃣ Checking table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'clients')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Error checking table structure:', tableError);
    } else if (tableInfo && tableInfo.length > 0) {
      console.log('📊 Clients table structure:');
      tableInfo.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('⚠️  Could not get table structure');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n📊 Check complete');
}

checkClientsData().catch(console.error);