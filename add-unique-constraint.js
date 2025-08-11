import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bphilnfifbdofojrqrcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaGlsbmZpZmJkb2ZvanJxcmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTgwOTMzNSwiZXhwIjoyMDQxMzg1MzM1fQ._SbId0fR2dc9Hv-6s6JimxPPDmV_cfuBvFGNn8GYZ94';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addUniqueConstraint() {
  try {
    console.log('🔍 Checking for duplicate invoices first...');
    
    // Check for duplicates
    const { data: duplicates, error: dupError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT invoice_number, COUNT(*) as count, array_agg(id) as ids
        FROM invoices
        WHERE deleted_at IS NULL
        GROUP BY invoice_number
        HAVING COUNT(*) > 1
      `
    });
    
    if (dupError) {
      console.error('Error checking duplicates:', dupError);
    } else if (duplicates && duplicates.length > 0) {
      console.log('⚠️ Found duplicates:', duplicates);
      console.log('Please fix these duplicates before adding the constraint!');
      return;
    }
    
    console.log('✅ No duplicates found, adding unique constraint...');
    
    // Add unique constraint
    const { error } = await supabase.rpc('execute_sql', {
      query: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_user_unique 
        ON invoices (invoice_number, user_id) 
        WHERE deleted_at IS NULL
      `
    });
    
    if (error) {
      console.error('❌ Error adding constraint:', error);
      
      // If RPC doesn't work, try direct SQL through migrations
      console.log('\n🔧 Alternative: Create a migration file instead');
      console.log('Run this SQL in Supabase dashboard:');
      console.log(`
CREATE UNIQUE INDEX idx_invoice_number_user_unique 
ON invoices (invoice_number, user_id) 
WHERE deleted_at IS NULL;
      `);
    } else {
      console.log('✅ Unique constraint added successfully!');
      console.log('Now duplicate invoice numbers are impossible at the database level.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// First, let's check current indexes
async function checkIndexes() {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: `
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'invoices'
      `
    });
    
    if (error) {
      console.error('Error checking indexes:', error);
    } else {
      console.log('Current indexes on invoices table:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run checks
checkIndexes().then(() => addUniqueConstraint());
