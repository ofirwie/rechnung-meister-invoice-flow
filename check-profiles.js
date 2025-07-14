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

async function checkProfiles() {
  console.log('🔍 Checking profiles table and user data...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Check if profiles table exists
    console.log('\n📋 Checking if profiles table exists...');
    const profilesExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
      );
    `);
    
    if (!profilesExists.rows[0].exists) {
      console.log('❌ Profiles table does not exist!');
      console.log('Creating profiles table...');
      
      // Create profiles table
      await client.query(`
        CREATE TABLE public.profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('✅ Profiles table created');
      
      // Enable RLS
      await client.query(`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`);
      
      // Create simple RLS policy
      await client.query(`
        CREATE POLICY "allow_authenticated_select_profiles" 
        ON public.profiles 
        FOR SELECT 
        TO authenticated
        USING (true);
      `);
      
      await client.query(`
        CREATE POLICY "allow_authenticated_insert_profiles" 
        ON public.profiles 
        FOR INSERT 
        TO authenticated
        WITH CHECK (auth.uid() = id);
      `);
      
      await client.query(`
        CREATE POLICY "allow_authenticated_update_profiles" 
        ON public.profiles 
        FOR UPDATE 
        TO authenticated
        USING (auth.uid() = id);
      `);
      
      console.log('✅ RLS policies created for profiles');
    } else {
      console.log('✅ Profiles table exists');
    }
    
    // Check users in auth.users
    console.log('\n👥 Checking users in auth.users...');
    const authUsers = await client.query(`
      SELECT id, email, email_confirmed_at, created_at 
      FROM auth.users 
      ORDER BY created_at;
    `);
    
    console.log(`Found ${authUsers.rows.length} users in auth.users:`);
    authUsers.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`     Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    });
    
    // Check users in profiles
    console.log('\n👥 Checking users in profiles...');
    const profileUsers = await client.query(`
      SELECT id, email, display_name, is_active 
      FROM public.profiles 
      ORDER BY created_at;
    `);
    
    console.log(`Found ${profileUsers.rows.length} users in profiles:`);
    profileUsers.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (Active: ${user.is_active})`);
    });
    
    // Sync missing users from auth.users to profiles
    console.log('\n🔄 Syncing users from auth.users to profiles...');
    for (const authUser of authUsers.rows) {
      const existingProfile = profileUsers.rows.find(p => p.id === authUser.id);
      
      if (!existingProfile) {
        console.log(`Adding ${authUser.email} to profiles...`);
        await client.query(`
          INSERT INTO public.profiles (id, email, display_name, is_active)
          VALUES ($1, $2, $3, true)
          ON CONFLICT (id) DO NOTHING;
        `, [authUser.id, authUser.email, authUser.email.split('@')[0]]);
        console.log(`✅ Added ${authUser.email} to profiles`);
      } else {
        console.log(`✅ ${authUser.email} already exists in profiles`);
      }
    }
    
    // Final check
    console.log('\n📊 Final status:');
    const finalProfiles = await client.query(`SELECT COUNT(*) FROM public.profiles;`);
    const finalAuth = await client.query(`SELECT COUNT(*) FROM auth.users;`);
    
    console.log(`  • auth.users: ${finalAuth.rows[0].count} users`);
    console.log(`  • profiles: ${finalProfiles.rows[0].count} users`);
    
    if (finalAuth.rows[0].count === finalProfiles.rows[0].count) {
      console.log('✅ All users synced successfully!');
    } else {
      console.log('⚠️ User count mismatch - some sync issues may remain');
    }
    
  } catch (error) {
    console.error('❌ Error checking profiles:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkProfiles().catch(console.error);