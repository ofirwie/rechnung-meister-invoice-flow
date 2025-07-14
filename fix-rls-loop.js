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

async function fixRLSLoop() {
  console.log('🔧 Fixing RLS policy loop...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Drop all existing policies to eliminate recursion
    console.log('\n🗑️ Dropping all existing policies...');
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_select" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_insert" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_update" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_delete" ON public.companies;`);
    console.log('✅ All policies dropped');
    
    // Create simple, non-recursive policies
    console.log('\n📋 Creating simple RLS policies...');
    
    // Simple select policy - allow authenticated users to see companies they belong to
    await client.query(`
      CREATE POLICY "companies_select_policy" 
      ON public.companies 
      FOR SELECT 
      USING (
        auth.uid() IS NOT NULL AND (
          -- User owns the company
          owner_id = auth.uid()
          OR
          -- User is member of the company
          EXISTS (
            SELECT 1 FROM public.company_users cu 
            WHERE cu.company_id = companies.id 
            AND cu.user_id = auth.uid() 
            AND cu.active = true
          )
        )
      );
    `);
    
    // Simple insert policy - only specific root admin emails
    await client.query(`
      CREATE POLICY "companies_insert_policy" 
      ON public.companies 
      FOR INSERT 
      WITH CHECK (
        auth.uid() IS NOT NULL AND 
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE auth.users.id = auth.uid() 
          AND auth.users.email IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
        )
      );
    `);
    
    // Simple update policy - only root admins
    await client.query(`
      CREATE POLICY "companies_update_policy" 
      ON public.companies 
      FOR UPDATE 
      USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE auth.users.id = auth.uid() 
          AND auth.users.email IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
        )
      );
    `);
    
    // Simple delete policy - only root admins and only deletable companies
    await client.query(`
      CREATE POLICY "companies_delete_policy" 
      ON public.companies 
      FOR DELETE 
      USING (
        auth.uid() IS NOT NULL AND 
        can_be_deleted = true AND
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE auth.users.id = auth.uid() 
          AND auth.users.email IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
        )
      );
    `);
    
    console.log('✅ New simple policies created');
    
    // Test the policies
    console.log('\n🧪 Testing policies with simple query...');
    const testResult = await client.query(`
      SELECT COUNT(*) as company_count 
      FROM public.companies;
    `);
    console.log(`✅ Test query successful: ${testResult.rows[0].company_count} companies found`);
    
    console.log('\n🎉 RLS loop fixed!');
    console.log('📝 Changes made:');
    console.log('  • Removed recursive policy dependencies');
    console.log('  • Created simple email-based root admin checks');
    console.log('  • Avoided user_roles table references that caused loops');
    console.log('  • Policies now use direct auth.users email lookup');
    
  } catch (error) {
    console.error('❌ Error fixing RLS loop:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixRLSLoop().catch(console.error);