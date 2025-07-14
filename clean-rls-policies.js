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

async function cleanRLSPolicies() {
  console.log('🧹 Cleaning up RLS policies...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Drop the problematic policy
    console.log('\n🗑️ Removing old complex policy...');
    await client.query(`DROP POLICY IF EXISTS "Company owners and rootadmin can manage users" ON public.company_users;`);
    console.log('✅ Old policy removed');
    
    // Also check and fix user_roles table if it exists
    console.log('\n🔧 Checking user_roles table...');
    const userRolesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_roles'
      );
    `);
    
    if (userRolesExists.rows[0].exists) {
      console.log('📋 user_roles table exists, creating simple policies...');
      
      // Drop any existing policies
      await client.query(`DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;`);
      await client.query(`DROP POLICY IF EXISTS "Only root admins can manage roles" ON public.user_roles;`);
      
      // Create simple policy
      await client.query(`
        CREATE POLICY "allow_authenticated_select_user_roles" 
        ON public.user_roles 
        FOR SELECT 
        TO authenticated
        USING (true);
      `);
      console.log('✅ Simple SELECT policy created for user_roles');
    } else {
      console.log('ℹ️ user_roles table does not exist');
    }
    
    // Final check
    console.log('\n📋 Final policy check:');
    const finalPolicies = await client.query(`
      SELECT 
        tablename,
        policyname,
        cmd
      FROM pg_policies 
      WHERE schemaname = 'public' 
      AND tablename IN ('companies', 'company_users', 'user_roles')
      ORDER BY tablename, policyname;
    `);
    
    let currentTable = '';
    finalPolicies.rows.forEach(policy => {
      if (policy.tablename !== currentTable) {
        currentTable = policy.tablename;
        console.log(`\n${policy.tablename}:`);
      }
      console.log(`  • ${policy.policyname} (${policy.cmd})`);
    });
    
    console.log('\n🎉 RLS policies cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning RLS:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

cleanRLSPolicies().catch(console.error);