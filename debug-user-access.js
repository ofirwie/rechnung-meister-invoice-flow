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

async function debugUserAccess() {
  console.log('🔍 Debugging user access for ofir.wienerman@gmail.com...\n');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully\n');
    
    // 1. Check user exists
    console.log('1️⃣ CHECKING USER IN AUTH.USERS:');
    const authUser = await client.query(`
      SELECT id, email, email_confirmed_at, created_at 
      FROM auth.users 
      WHERE email = 'ofir.wienerman@gmail.com';
    `);
    
    if (authUser.rows.length === 0) {
      console.log('❌ User not found in auth.users!');
      return;
    }
    
    const userId = authUser.rows[0].id;
    console.log(`✅ User found: ${authUser.rows[0].email}`);
    console.log(`   ID: ${userId}`);
    console.log(`   Confirmed: ${authUser.rows[0].email_confirmed_at ? 'Yes' : 'No'}\n`);
    
    // 2. Check companies exist
    console.log('2️⃣ CHECKING COMPANIES:');
    const companies = await client.query(`
      SELECT id, name, active, owner_id, is_main_company 
      FROM public.companies 
      ORDER BY created_at;
    `);
    
    console.log(`Found ${companies.rows.length} companies:`);
    companies.rows.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} (Active: ${c.active}, Main: ${c.is_main_company})`);
      console.log(`      ID: ${c.id}`);
      console.log(`      Owner: ${c.owner_id === userId ? 'YOU' : c.owner_id}`);
    });
    console.log();
    
    // 3. Check company_users assignments
    console.log('3️⃣ CHECKING COMPANY_USERS ASSIGNMENTS:');
    const assignments = await client.query(`
      SELECT cu.*, c.name as company_name 
      FROM public.company_users cu
      LEFT JOIN public.companies c ON c.id = cu.company_id
      WHERE cu.user_id = $1;
    `, [userId]);
    
    console.log(`Found ${assignments.rows.length} assignments for user:`);
    assignments.rows.forEach((a, i) => {
      console.log(`   ${i+1}. ${a.company_name || 'Unknown Company'}`);
      console.log(`      Role: ${a.role}`);
      console.log(`      Active: ${a.active}`);
      console.log(`      Company ID: ${a.company_id}`);
    });
    console.log();
    
    // 4. Test RLS policies
    console.log('4️⃣ TESTING RLS POLICIES:');
    console.log('Testing what companies the user SHOULD see based on policies...\n');
    
    // Test SELECT policy
    const selectTest = await client.query(`
      SELECT policyname, cmd, qual 
      FROM pg_policies 
      WHERE tablename = 'companies' 
      AND cmd = 'SELECT';
    `);
    
    console.log('SELECT policies on companies:');
    selectTest.rows.forEach(p => {
      console.log(`   • ${p.policyname}`);
    });
    console.log();
    
    // 5. Simulate what the app sees
    console.log('5️⃣ SIMULATING APP QUERY:');
    console.log('What the app would see for this user...\n');
    
    // Test direct query
    try {
      const directTest = await client.query(`
        SELECT * FROM public.companies WHERE active = true;
      `);
      console.log(`Direct query (no user context): ${directTest.rows.length} companies visible`);
    } catch (e) {
      console.log('Direct query failed:', e.message);
    }
    
    // Check if user should see all (root admin)
    const isRootAdmin = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'].includes(authUser.rows[0].email);
    console.log(`\nUser is root admin: ${isRootAdmin ? 'YES' : 'NO'}`);
    
    if (isRootAdmin) {
      console.log('As root admin, user should see ALL companies');
    } else {
      console.log('As regular user, should see only assigned companies');
    }
    
    // 6. Architecture recommendations
    console.log('\n\n📋 ARCHITECTURE ANALYSIS:\n');
    console.log('CURRENT FLOW:');
    console.log('1. User registers (auth.users)');
    console.log('2. Profile created (profiles)');
    console.log('3. Company created (companies)');
    console.log('4. User assigned to company (company_users)');
    console.log('\nISSUES FOUND:');
    
    if (companies.rows.length > 0 && assignments.rows.length === 0) {
      console.log('❌ Companies exist but user has no assignments!');
      console.log('   This is likely why you see no companies.');
    }
    
    if (assignments.rows.length > 0) {
      const inactiveAssignments = assignments.rows.filter(a => !a.active);
      if (inactiveAssignments.length > 0) {
        console.log('❌ User has inactive company assignments');
      }
    }
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Ensure user is in company_users table');
    console.log('2. Check RLS policies allow user to see their companies');
    console.log('3. Consider simpler architecture for debugging');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

debugUserAccess().catch(console.error);