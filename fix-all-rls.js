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

async function fixAllRLS() {
  console.log('🔧 Fixing RLS for all related tables...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Check RLS status on tables
    console.log('\n📊 Checking RLS status on tables...');
    const rlsStatus = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('companies', 'company_users', 'user_roles');
    `);
    
    console.log('RLS Status:');
    rlsStatus.rows.forEach(row => {
      console.log(`  • ${row.tablename}: RLS ${row.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
    });
    
    // Fix company_users table
    console.log('\n🔧 Fixing company_users table RLS...');
    
    // Drop existing policies
    await client.query(`DROP POLICY IF EXISTS "Users can view their company assignments" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "Company owners can manage users" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "Root admins can manage all users" ON public.company_users;`);
    
    // Create simple policies for company_users
    await client.query(`
      CREATE POLICY "allow_authenticated_select_company_users" 
      ON public.company_users 
      FOR SELECT 
      TO authenticated
      USING (true);
    `);
    console.log('✅ SELECT policy created for company_users');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_insert_company_users" 
      ON public.company_users 
      FOR INSERT 
      TO authenticated
      WITH CHECK (
        (SELECT email FROM auth.users WHERE id = auth.uid()) 
        IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ INSERT policy created for company_users');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_update_company_users" 
      ON public.company_users 
      FOR UPDATE 
      TO authenticated
      USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) 
        IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ UPDATE policy created for company_users');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_delete_company_users" 
      ON public.company_users 
      FOR DELETE 
      TO authenticated
      USING (
        (SELECT email FROM auth.users WHERE id = auth.uid()) 
        IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ DELETE policy created for company_users');
    
    // Enable RLS on company_users if not already enabled
    await client.query(`ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS enabled on company_users');
    
    // Test queries
    console.log('\n🧪 Testing queries...');
    
    try {
      const companiesTest = await client.query(`SELECT COUNT(*) FROM public.companies;`);
      console.log(`✅ Companies table: ${companiesTest.rows[0].count} rows accessible`);
    } catch (e) {
      console.error('❌ Companies table test failed:', e.message);
    }
    
    try {
      const companyUsersTest = await client.query(`SELECT COUNT(*) FROM public.company_users;`);
      console.log(`✅ Company_users table: ${companyUsersTest.rows[0].count} rows accessible`);
    } catch (e) {
      console.error('❌ Company_users table test failed:', e.message);
    }
    
    // List all policies
    console.log('\n📋 Current policies:');
    const policies = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('companies', 'company_users')
      ORDER BY tablename, policyname;
    `);
    
    policies.rows.forEach(policy => {
      console.log(`\n  Table: ${policy.tablename}`);
      console.log(`  Policy: ${policy.policyname}`);
      console.log(`  Command: ${policy.cmd}`);
      console.log(`  Roles: ${policy.roles}`);
    });
    
    console.log('\n🎉 All RLS policies fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing RLS:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixAllRLS().catch(console.error);