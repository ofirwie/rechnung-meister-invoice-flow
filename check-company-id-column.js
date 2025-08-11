import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanyIdColumn() {
  console.log('🔍 Checking if company_id column exists in invoices table...\n');

  try {
    // Try to query invoices table with company_id column
    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number, company_id')
      .limit(1);

    if (error) {
      if (error.message.includes('company_id')) {
        console.log('❌ company_id column does NOT exist in invoices table');
        console.log('\n📋 To fix this, you need to run the migration:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Paste the content from: supabase/migrations/20250811160000_add_company_id_to_invoices.sql');
        console.log('3. Click "Run" to execute the migration');
        console.log('\n⚠️  Error details:', error.message);
      } else {
        console.log('❌ Other error:', error.message);
      }
    } else {
      console.log('✅ company_id column EXISTS in invoices table!');
      
      // Check table structure
      const { data: columns, error: schemaError } = await supabase.rpc('get_table_columns', {
        table_name: 'invoices'
      }).catch(() => ({ data: null, error: 'RPC not available' }));

      if (!schemaError && columns) {
        console.log('\n📊 Invoices table columns:');
        columns.forEach(col => {
          if (col.column_name === 'company_id') {
            console.log(`  - ${col.column_name} (${col.data_type}) ✅`);
          } else {
            console.log(`  - ${col.column_name} (${col.data_type})`);
          }
        });
      }
    }

    // Check if there are any companies
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5);

    if (!companyError && companies) {
      console.log(`\n🏢 Found ${companies.length} companies in the database`);
      companies.forEach(company => {
        console.log(`  - ${company.name} (${company.id})`);
      });
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

// Helper function to get table columns (if RPC doesn't exist)
async function getTableInfo() {
  console.log('\n📋 Alternative check using information_schema...');
  
  const query = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'invoices'
    ORDER BY ordinal_position;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query }).catch(() => ({ 
    data: null, 
    error: 'Cannot access information_schema directly' 
  }));

  if (data) {
    console.log('Invoices table structure:');
    data.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
  } else {
    console.log('ℹ️  Cannot query table structure directly. Please check in Supabase Dashboard.');
  }
}

checkCompanyIdColumn().then(() => {
  console.log('\n✨ Check complete!');
});
