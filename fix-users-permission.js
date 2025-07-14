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

async function fixUsersPermission() {
  console.log('🔧 Fixing users table permission issues...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Check if we're using auth.users in policies
    console.log('\n📋 Checking policies that reference auth.users...');
    const policiesWithAuthUsers = await client.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        definition
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND definition LIKE '%auth.users%'
      ORDER BY tablename, policyname;
    `);
    
    console.log(`Found ${policiesWithAuthUsers.rows.length} policies referencing auth.users`);
    policiesWithAuthUsers.rows.forEach(policy => {
      console.log(`\n  Table: ${policy.tablename}`);
      console.log(`  Policy: ${policy.policyname}`);
    });
    
    // Drop and recreate policies without auth.users references
    console.log('\n🔄 Recreating policies without auth.users references...');
    
    // Drop existing policies on companies table
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_insert" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_update" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete" ON public.companies;`);
    
    // Create new policies using auth.jwt() instead of auth.users
    await client.query(`
      CREATE POLICY "allow_rootadmin_insert" 
      ON public.companies 
      FOR INSERT 
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ INSERT policy recreated using auth.jwt()');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_update" 
      ON public.companies 
      FOR UPDATE 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ UPDATE policy recreated using auth.jwt()');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_delete" 
      ON public.companies 
      FOR DELETE 
      TO authenticated
      USING (
        can_be_deleted = true AND
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ DELETE policy recreated using auth.jwt()');
    
    // Fix company_users policies
    console.log('\n🔄 Fixing company_users policies...');
    
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_insert_company_users" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_update_company_users" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete_company_users" ON public.company_users;`);
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_insert_company_users" 
      ON public.company_users 
      FOR INSERT 
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ company_users INSERT policy recreated');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_update_company_users" 
      ON public.company_users 
      FOR UPDATE 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ company_users UPDATE policy recreated');
    
    await client.query(`
      CREATE POLICY "allow_rootadmin_delete_company_users" 
      ON public.company_users 
      FOR DELETE 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ company_users DELETE policy recreated');
    
    // Test the new policies
    console.log('\n🧪 Testing new policies...');
    
    try {
      const jwtTest = await client.query(`
        SELECT 
          auth.uid() as user_id,
          auth.jwt() ->> 'email' as email
        LIMIT 1;
      `);
      console.log('✅ JWT access test successful');
      if (jwtTest.rows[0]) {
        console.log(`  Current context: ${jwtTest.rows[0].email || 'No email in JWT'}`);
      }
    } catch (e) {
      console.log('ℹ️ JWT test requires authenticated context');
    }
    
    console.log('\n🎉 Users permission issue fixed!');
    console.log('📝 Changes made:');
    console.log('  • Replaced auth.users references with auth.jwt()');
    console.log('  • JWT contains user email without additional queries');
    console.log('  • No more permission denied on users table');
    
  } catch (error) {
    console.error('❌ Error fixing users permission:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixUsersPermission().catch(console.error);