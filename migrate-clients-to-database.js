import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sample client data that might be in localStorage
const sampleLocalStorageClients = [
  {
    id: 'client-1',
    companyName: 'Sample Client Company',
    contactName: 'John Doe',
    address: '123 Main Street',
    city: 'Tel Aviv',
    postalCode: '12345',
    country: 'Israel',
    email: 'john@example.com',
    phone: '+972-50-1234567',
    taxId: '123456789',
    businessLicense: 'BL123',
    companyRegistration: 'CR456'
  }
];

async function migrateClientsToDatabase() {
  console.log('🔄 Migrating clients to database...\n');

  try {
    // First, check if we need to add sample clients for testing
    console.log('1️⃣ Checking current database state...');
    const { data: existingClients, error: fetchError } = await supabase
      .from('clients')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching existing clients:', fetchError);
      return;
    }

    console.log(`📊 Found ${existingClients.length} existing clients in database`);

    // For demonstration, let's add a sample client
    if (existingClients.length === 0) {
      console.log('\n2️⃣ Adding sample client for testing...');
      
      const sampleClient = {
        company_name: 'Sample Client Ltd',
        contact_name: 'John Doe',
        address: '123 Business Street',
        city: 'Tel Aviv',
        postal_code: '12345',
        country: 'Israel',
        email: 'john.doe@sampleclient.com',
        phone: '+972-50-1234567',
        tax_id: '123456789',
        business_license: 'BL123456',
        company_registration: 'CR789123'
      };

      const { data: insertedClient, error: insertError } = await supabase
        .from('clients')
        .insert([sampleClient])
        .select();

      if (insertError) {
        console.error('❌ Error inserting sample client:', insertError);
      } else {
        console.log('✅ Sample client added successfully:', insertedClient[0]);
      }
    }

    // Check final state
    console.log('\n3️⃣ Final database state...');
    const { data: finalClients, error: finalError } = await supabase
      .from('clients')
      .select('*');

    if (finalError) {
      console.error('❌ Error fetching final clients:', finalError);
    } else {
      console.log(`✅ Database now has ${finalClients.length} clients`);
      finalClients.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.company_name} (${client.email || 'no email'})`);
      });
    }

    // Show instructions for adding real clients
    console.log('\n📝 To add your real clients:');
    console.log('1. Open the app in your browser');
    console.log('2. Go to Client Management');
    console.log('3. Click "Add Client" button');
    console.log('4. Fill in your real client details');
    console.log('5. Save - they will be stored in the database');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }

  console.log('\n📊 Migration complete');
}

migrateClientsToDatabase().catch(console.error);