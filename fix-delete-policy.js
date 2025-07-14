import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'aws-0-eu-central-2.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.lzhgyyihnsqwcbsdsdxs',
  password: '3f6HdRehLtpySkc7',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixDeletePolicy() {
  console.log('🔧 Fixing company deletion to prevent hard deletes...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Drop all DELETE policies on companies table
    console.log('\n🗑️ Removing DELETE policies from companies table...');
    await client.query(`DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete_companies" ON public.companies;`);
    console.log('✅ All DELETE policies removed');
    
    // Create a trigger to prevent hard deletes
    console.log('\n🛡️ Creating trigger to prevent hard deletes...');
    
    // First drop if exists
    await client.query(`DROP TRIGGER IF EXISTS prevent_company_hard_delete ON public.companies;`);
    await client.query(`DROP FUNCTION IF EXISTS prevent_company_hard_delete_fn();`);
    
    // Create function
    await client.query(`
      CREATE OR REPLACE FUNCTION prevent_company_hard_delete_fn()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Instead of deleting, set active to false
        UPDATE public.companies 
        SET active = false, 
            updated_at = NOW() 
        WHERE id = OLD.id;
        
        -- Return NULL to prevent the actual DELETE
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Create trigger
    await client.query(`
      CREATE TRIGGER prevent_company_hard_delete
      BEFORE DELETE ON public.companies
      FOR EACH ROW
      EXECUTE FUNCTION prevent_company_hard_delete_fn();
    `);
    
    console.log('✅ Trigger created to convert DELETE to soft delete');
    
    // Update the can_be_deleted flag logic
    console.log('\n📋 Updating can_be_deleted logic...');
    
    // Check for companies linked to invoices (when invoice table exists)
    const invoiceTableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'invoices'
      );
    `);
    
    if (invoiceTableExists.rows[0].exists) {
      console.log('Checking companies linked to invoices...');
      await client.query(`
        UPDATE public.companies c
        SET can_be_deleted = false
        WHERE EXISTS (
          SELECT 1 FROM public.invoices i 
          WHERE i.company_id = c.id
        );
      `);
      console.log('✅ Updated can_be_deleted flag for companies with invoices');
    }
    
    // List final policies
    console.log('\n📋 Final policies on companies table:');
    const finalPolicies = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' 
      AND tablename = 'companies'
      ORDER BY cmd, policyname;
    `);
    
    finalPolicies.rows.forEach(policy => {
      console.log(`  • ${policy.policyname} (${policy.cmd})`);
    });
    
    console.log('\n🎉 Company deletion protection complete!');
    console.log('📝 Summary:');
    console.log('  • DELETE policies removed from companies table');
    console.log('  • Trigger created to convert DELETE to soft delete (active = false)');
    console.log('  • Companies can never be hard deleted from database');
    console.log('  • DELETE operations will now set active = false instead');
    
  } catch (error) {
    console.error('❌ Error fixing delete policy:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixDeletePolicy().catch(console.error);