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

async function emergencyFixLoop() {
  console.log('🚨 EMERGENCY: Stopping RLS loops...');
  
  try {
    await client.connect();
    console.log('✅ Database connected');
    
    // COMPLETELY DISABLE RLS on companies table
    console.log('\n⚠️ DISABLING ALL RLS on companies...');
    await client.query(`ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS disabled on companies');
    
    // COMPLETELY DISABLE RLS on company_users table  
    console.log('\n⚠️ DISABLING ALL RLS on company_users...');
    await client.query(`ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;`);
    console.log('✅ RLS disabled on company_users');
    
    // Drop ALL policies to prevent any recursion
    console.log('\n🗑️ DROPPING ALL POLICIES...');
    
    const allPolicies = await client.query(`
      SELECT policyname, tablename
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('companies', 'company_users');
    `);
    
    for (const policy of allPolicies.rows) {
      await client.query(`DROP POLICY IF EXISTS "${policy.policyname}" ON public.${policy.tablename};`);
      console.log(`✅ Dropped ${policy.policyname} from ${policy.tablename}`);
    }
    
    // Test immediate access
    console.log('\n🧪 TESTING ACCESS WITHOUT RLS...');
    
    const companiesTest = await client.query(`SELECT COUNT(*) FROM public.companies;`);
    console.log(`✅ Companies accessible: ${companiesTest.rows[0].count} rows`);
    
    const usersTest = await client.query(`SELECT COUNT(*) FROM public.company_users;`);
    console.log(`✅ Company_users accessible: ${usersTest.rows[0].count} rows`);
    
    console.log('\n🎉 EMERGENCY FIX COMPLETE!');
    console.log('📝 Current state:');
    console.log('  • RLS completely disabled on companies and company_users');
    console.log('  • All policies removed');
    console.log('  • Tables are now fully accessible');
    console.log('  • No more infinite loops');
    console.log('\n⚠️ SECURITY NOTE:');
    console.log('  • Tables are now public (no row-level security)');
    console.log('  • This is temporary for debugging');
    console.log('  • We\'ll add simple access control in the app layer');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

emergencyFixLoop().catch(console.error);