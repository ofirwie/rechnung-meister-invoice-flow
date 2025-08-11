import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bphilnfifbdofojrqrcc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaGlsbmZpZmJkb2ZvanJxcmNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTgwOTMzNSwiZXhwIjoyMDQxMzg1MzM1fQ._SbId0fR2dc9Hv-6s6JimxPPDmV_cfuBvFGNn8GYZ94';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log('🚀 Running unique constraint migration...\n');
  
  try {
    // First check for duplicates
    console.log('📋 Checking for duplicate invoice numbers...');
    
    const { data: duplicates, error: dupError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT invoice_number, user_id, COUNT(*) as count
        FROM invoices
        WHERE deleted_at IS NULL
        GROUP BY invoice_number, user_id
        HAVING COUNT(*) > 1
      `
    });
    
    if (dupError) {
      // If RPC doesn't work, try direct query
      const { data: dupData, error: dupQueryError } = await supabase
        .from('invoices')
        .select('invoice_number, user_id')
        .is('deleted_at', null);
      
      if (dupQueryError) {
        console.error('Error checking duplicates:', dupQueryError);
      } else {
        // Manual check for duplicates
        const counts = {};
        dupData.forEach(inv => {
          const key = `${inv.invoice_number}-${inv.user_id}`;
          counts[key] = (counts[key] || 0) + 1;
        });
        
        const duplicatesList = Object.entries(counts)
          .filter(([_, count]) => count > 1)
          .map(([key, count]) => {
            const [invoice_number, user_id] = key.split('-');
            return { invoice_number, user_id, count };
          });
        
        if (duplicatesList.length > 0) {
          console.log('⚠️ Found duplicates:');
          duplicatesList.forEach(dup => {
            console.log(`  Invoice: ${dup.invoice_number}, User: ${dup.user_id}, Count: ${dup.count}`);
          });
          console.log('\n❌ Please fix these duplicates before adding the constraint!');
          return;
        }
      }
    } else if (duplicates && duplicates.length > 0) {
      console.log('⚠️ Found duplicates:');
      duplicates.forEach(dup => {
        console.log(`  Invoice: ${dup.invoice_number}, User: ${dup.user_id}, Count: ${dup.count}`);
      });
      console.log('\n❌ Please fix these duplicates before adding the constraint!');
      return;
    }
    
    console.log('✅ No duplicates found!\n');
    
    // Try to create the unique index
    console.log('🔨 Creating unique constraint...');
    
    const migrationSQL = `
      -- Create the unique index
      -- This allows different users to have the same invoice number
      -- But prevents the same user from having duplicate invoice numbers
      CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice_number_user_unique 
      ON invoices (invoice_number, user_id) 
      WHERE deleted_at IS NULL;
      
      -- Add a comment to explain the constraint
      COMMENT ON INDEX idx_invoice_number_user_unique IS 'Ensures each user has unique invoice numbers (excluding soft-deleted records)';
    `;
    
    const { error: migrationError } = await supabase.rpc('execute_sql', {
      query: migrationSQL
    });
    
    if (migrationError) {
      console.error('❌ Error creating constraint via RPC:', migrationError);
      console.log('\n📝 Alternative: Run this SQL directly in Supabase Dashboard:');
      console.log('----------------------------------------------');
      console.log(migrationSQL);
      console.log('----------------------------------------------');
      
      console.log('\nTo run it:');
      console.log('1. Go to https://supabase.com/dashboard/project/bphilnfifbdofojrqrcc/sql/new');
      console.log('2. Paste the SQL above');
      console.log('3. Click "Run"');
    } else {
      console.log('✅ Unique constraint created successfully!');
      console.log('\n🎉 The database now prevents duplicate invoice numbers per user!');
    }
    
    // Test the constraint
    console.log('\n🧪 Testing constraint...');
    const { data: indexes, error: indexError } = await supabase.rpc('execute_sql', {
      query: `
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'invoices' 
        AND indexname = 'idx_invoice_number_user_unique'
      `
    });
    
    if (!indexError && indexes && indexes.length > 0) {
      console.log('✅ Constraint verified in database!');
    } else {
      console.log('⚠️ Could not verify constraint - check manually in Supabase Dashboard');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the migration
runMigration();
