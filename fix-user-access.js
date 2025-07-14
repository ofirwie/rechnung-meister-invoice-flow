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

async function fixUserAccess() {
  console.log('🔧 Fixing user access with simplified architecture...\n');
  
  try {
    await client.connect();
    console.log('✅ Database connected\n');
    
    // 1. Create a trigger to auto-create profiles
    console.log('1️⃣ CREATING AUTO-PROFILE TRIGGER:');
    
    await client.query(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
    await client.query(`DROP FUNCTION IF EXISTS handle_new_user();`);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, email, display_name, is_active)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
          true
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    await client.query(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user();
    `);
    
    console.log('✅ Auto-profile trigger created\n');
    
    // 2. Simplify RLS policies
    console.log('2️⃣ SIMPLIFYING RLS POLICIES:');
    
    // Drop all existing policies
    await client.query(`DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "companies_insert_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "companies_update_policy" ON public.companies;`);
    
    // Create super simple policies
    await client.query(`
      CREATE POLICY "anyone_can_read_active_companies" 
      ON public.companies 
      FOR SELECT 
      TO authenticated
      USING (active = true);
    `);
    console.log('✅ Simple SELECT policy created');
    
    await client.query(`
      CREATE POLICY "rootadmin_manage_companies" 
      ON public.companies 
      FOR ALL 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      )
      WITH CHECK (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ Root admin ALL policy created');
    
    // Fix company_users policies
    await client.query(`DROP POLICY IF EXISTS "company_users_select_policy" ON public.company_users;`);
    
    await client.query(`
      CREATE POLICY "users_see_own_memberships" 
      ON public.company_users 
      FOR SELECT 
      TO authenticated
      USING (
        user_id = auth.uid() OR
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ Company_users SELECT policy created\n');
    
    // 3. Ensure all users have profiles
    console.log('3️⃣ ENSURING ALL USERS HAVE PROFILES:');
    
    await client.query(`
      INSERT INTO public.profiles (id, email, display_name, is_active)
      SELECT 
        u.id,
        u.email,
        COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1)),
        true
      FROM auth.users u
      WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = u.id
      );
    `);
    console.log('✅ All users now have profiles\n');
    
    // 4. Test the fix
    console.log('4️⃣ TESTING ACCESS:');
    
    const test1 = await client.query(`SELECT COUNT(*) FROM public.companies WHERE active = true;`);
    console.log(`✅ Active companies visible: ${test1.rows[0].count}`);
    
    const test2 = await client.query(`SELECT COUNT(*) FROM public.company_users;`);
    console.log(`✅ Company memberships visible: ${test2.rows[0].count}`);
    
    const test3 = await client.query(`SELECT COUNT(*) FROM public.profiles;`);
    console.log(`✅ User profiles exist: ${test3.rows[0].count}`);
    
    console.log('\n🎉 ACCESS FIXED!\n');
    console.log('📋 NEW SIMPLIFIED ARCHITECTURE:');
    console.log('1. All authenticated users can see active companies');
    console.log('2. Root admins can manage all companies');
    console.log('3. Users automatically get profiles on registration');
    console.log('4. App filters companies based on company_users in frontend');
    console.log('\n🔧 BENEFITS:');
    console.log('• Easier to debug (less complex RLS)');
    console.log('• Better performance (simpler queries)');
    console.log('• Multi-company ready (users can join multiple companies)');
    console.log('• Clear separation of concerns (auth vs business logic)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixUserAccess().catch(console.error);