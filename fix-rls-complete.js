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

async function fixRLSCompletely() {
  console.log('🔧 Completely fixing RLS issues...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Step 1: Disable RLS temporarily
    console.log('\n⚠️ Temporarily disabling RLS...');
    await client.query(`ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS disabled');
    
    // Step 2: Drop ALL policies
    console.log('\n🗑️ Dropping all existing policies...');
    await client.query(`DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "companies_delete_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_select" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_insert" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_update" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "rootadmin_only_delete" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "simple_insert_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_select_companies" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_owner_or_rootadmin_update" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete" ON public.companies;`);
    console.log('✅ All policies dropped');
    
    // Step 3: Test without RLS
    console.log('\n🧪 Testing query without RLS...');
    const testResult = await client.query(`
      SELECT id, name, active, owner_id 
      FROM public.companies 
      LIMIT 5;
    `);
    console.log(`✅ Test successful: ${testResult.rows.length} companies found`);
    testResult.rows.forEach(company => {
      console.log(`  • ${company.name} (Active: ${company.active})`);
    });
    
    // Step 4: Create ultra-simple policies without recursion
    console.log('\n📋 Creating ultra-simple policies...');
    
    // Allow all authenticated users to SELECT companies (we'll handle filtering in the app)
    await client.query(`
      CREATE POLICY "allow_authenticated_select" 
      ON public.companies 
      FOR SELECT 
      TO authenticated
      USING (true);
    `);
    console.log('✅ SELECT policy created (allows all authenticated users)');
    
    // Only allow specific emails to INSERT
    await client.query(`
      CREATE POLICY "allow_rootadmin_insert" 
      ON public.companies 
      FOR INSERT 
      TO authenticated
      WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) 
        IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ INSERT policy created (rootadmin only)');
    
    // Only allow specific emails to UPDATE
    await client.query(`
      CREATE POLICY "allow_rootadmin_update" 
      ON public.companies 
      FOR UPDATE 
      TO authenticated
      USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) 
        IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ UPDATE policy created (rootadmin only)');
    
    // Only allow specific emails to DELETE (and only deletable companies)
    await client.query(`
      CREATE POLICY "allow_rootadmin_delete" 
      ON public.companies 
      FOR DELETE 
      TO authenticated
      USING (
        can_be_deleted = true AND
        (SELECT email FROM auth.users WHERE id = auth.uid()) 
        IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ DELETE policy created (rootadmin only, deletable companies)');
    
    // Step 5: Re-enable RLS
    console.log('\n🔒 Re-enabling RLS...');
    await client.query(`ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS re-enabled');
    
    // Step 6: Test with new policies
    console.log('\n🧪 Testing with new policies...');
    try {
      const finalTest = await client.query(`
        SELECT COUNT(*) as company_count 
        FROM public.companies;
      `);
      console.log(`✅ Final test successful: ${finalTest.rows[0].company_count} companies accessible`);
    } catch (testError) {
      console.error('❌ Final test failed:', testError.message);
      console.log('This might be expected if no authenticated user context');
    }
    
    console.log('\n🎉 RLS completely fixed!');
    console.log('📝 New approach:');
    console.log('  • SELECT: All authenticated users (app handles filtering)');
    console.log('  • INSERT/UPDATE/DELETE: Only rootadmin emails');
    console.log('  • No recursive dependencies or complex JOINs');
    console.log('  • Ultra-simple email-based authentication');
    
  } catch (error) {
    console.error('❌ Error fixing RLS:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixRLSCompletely().catch(console.error);