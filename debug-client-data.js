import { createClient } from '@supabase/supabase-js';

// Configure Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ixqkkzbsbebidaxfbepi.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWtremJzYmViaWRheGZiZXBpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDU0MTY1NCwiZXhwIjoyMDM2MTE3NjU0fQ.FNWuy8ufh6y94Bl8v00c1iLW8GgJnIGwUqfBhvXJJ2w';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugClientData() {
  console.log('🔍 Checking SHALAM client data in database...');
  
  try {
    // Get all clients with SHALAM in name
    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('company_name', '%SHALAM%');
    
    if (error) {
      console.error('❌ Error fetching clients:', error);
      return;
    }
    
    console.log(`\n📊 Found ${clients.length} SHALAM clients:`);
    
    clients.forEach((client, index) => {
      console.log(`\n--- Client ${index + 1} ---`);
      console.log('ID:', client.id);
      console.log('Company Name:', client.company_name);
      console.log('Contact Name:', client.contact_name);
      console.log('Address:', client.address || 'MISSING ❌');
      console.log('City:', client.city || 'MISSING ❌');
      console.log('Postal Code:', client.postal_code || 'MISSING ❌');
      console.log('Country:', client.country || 'MISSING ❌');
      console.log('Email:', client.email || 'MISSING ❌');
      console.log('Phone:', client.phone || 'MISSING ❌');
      console.log('Tax ID:', client.tax_id || 'MISSING ❌');
      console.log('Business License:', client.business_license || 'MISSING ❌');
      console.log('Company Registration:', client.company_registration || 'MISSING ❌');
      console.log('User ID:', client.user_id);
      console.log('Created At:', client.created_at);
    });

    // If we found SHALAM clients but they're missing data, let's update them
    if (clients.length > 0) {
      const shalامClient = clients[0];
      
      if (!shalامClient.address || !shalامClient.email) {
        console.log('\n🔧 SHALAM client found but missing data. Updating with sample data...');
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({
            address: 'Industrial Zone, Building 5',
            city: 'Tel Aviv',
            postal_code: '12345',
            country: 'Israel',
            email: 'dvira@shalam-packaging.co.il',
            phone: '+972-3-1234567',
            tax_id: '123456789',
            business_license: 'BL987654321',
            company_registration: 'CR123456789'
          })
          .eq('id', shalامClient.id);
        
        if (updateError) {
          console.error('❌ Error updating client:', updateError);
        } else {
          console.log('✅ SHALAM client updated successfully!');
          
          // Verify the update
          const { data: updatedClient } = await supabase
            .from('clients')
            .select('*')
            .eq('id', shalامClient.id)
            .single();
            
          console.log('\n📋 Updated client data:');
          console.log('Address:', updatedClient.address);
          console.log('Email:', updatedClient.email);
          console.log('City:', updatedClient.city);
          console.log('Phone:', updatedClient.phone);
        }
      }
    } else {
      console.log('\n⚠️ No SHALAM clients found. Let me create one...');
      
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          company_name: 'SHALAM PACKAGING SOLUTIONS LTD.',
          contact_name: 'Dvira Shalam',
          address: 'Industrial Zone, Building 5',
          city: 'Tel Aviv',
          postal_code: '12345',
          country: 'Israel',
          email: 'dvira@shalam-packaging.co.il',
          phone: '+972-3-1234567',
          tax_id: '123456789',
          business_license: 'BL987654321',
          company_registration: 'CR123456789',
          user_id: 'default-user' // You'll need to update this with actual user ID
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ Error creating client:', insertError);
      } else {
        console.log('✅ SHALAM client created successfully!');
        console.log('New client ID:', newClient.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugClientData();
