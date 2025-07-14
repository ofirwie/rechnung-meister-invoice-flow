import pg from 'pg';
import crypto from 'crypto';

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

async function createAdminUser() {
  console.log('👤 Creating admin user...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Check if admin user already exists
    console.log('\n🔍 Checking if admin user already exists...');
    const existingUser = await client.query(`
      SELECT id, email, email_confirmed_at 
      FROM auth.users 
      WHERE email = 'admin@system.local';
    `);
    
    if (existingUser.rows.length > 0) {
      console.log('ℹ️ Admin user already exists:');
      console.log(`  • ID: ${existingUser.rows[0].id}`);
      console.log(`  • Email: ${existingUser.rows[0].email}`);
      console.log(`  • Confirmed: ${existingUser.rows[0].email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Update password for existing user
      console.log('\n🔄 Updating password for existing admin user...');
      const hashedPassword = crypto.createHash('sha256').update('OfirAI393$').digest('hex');
      
      await client.query(`
        UPDATE auth.users 
        SET encrypted_password = crypt($1, gen_salt('bf')),
            email_confirmed_at = NOW(),
            updated_at = NOW()
        WHERE email = 'admin@system.local';
      `, ['OfirAI393$']);
      
      console.log('✅ Password updated for existing admin user');
      return;
    }
    
    // Create new admin user
    console.log('\n👤 Creating new admin user...');
    
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();
    
    const insertUserResult = await client.query(`
      INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        role,
        aud,
        confirmation_token,
        email_change_token_new,
        recovery_token
      ) VALUES (
        $1,
        'admin@system.local',
        crypt($2, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated',
        '',
        '',
        ''
      ) RETURNING id, email;
    `, [userId, 'OfirAI393$']);
    
    console.log('✅ Admin user created successfully:');
    console.log(`  • ID: ${insertUserResult.rows[0].id}`);
    console.log(`  • Email: ${insertUserResult.rows[0].email}`);
    console.log(`  • Password: OfirAI393$`);
    
    // Add user to user_roles table if it exists
    console.log('\n📋 Adding admin role...');
    try {
      const userRoleExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'user_roles'
        );
      `);
      
      if (userRoleExists.rows[0].exists) {
        await client.query(`
          INSERT INTO public.user_roles (user_id, role, created_at)
          VALUES ($1, 'admin', NOW())
          ON CONFLICT (user_id, role) DO NOTHING;
        `, [userId]);
        console.log('✅ Admin role added to user_roles table');
      } else {
        console.log('ℹ️ user_roles table does not exist, skipping role assignment');
      }
    } catch (e) {
      console.log('ℹ️ Could not add to user_roles table:', e.message);
    }
    
    // Test login credentials
    console.log('\n🧪 Testing login credentials...');
    const loginTest = await client.query(`
      SELECT id, email, 
             encrypted_password = crypt($1, encrypted_password) as password_match
      FROM auth.users 
      WHERE email = 'admin@system.local';
    `, ['OfirAI393$']);
    
    if (loginTest.rows[0]?.password_match) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }
    
    console.log('\n🎉 Admin user setup complete!');
    console.log('📝 Login credentials:');
    console.log('  • Email: admin@system.local');
    console.log('  • Password: OfirAI393$');
    console.log('\n📋 Note:');
    console.log('  • This user can log in but is not a root admin');
    console.log('  • Only ofir.wienerman@gmail.com and firestar393@gmail.com are root admins');
    console.log('  • Admin user will need to be assigned to companies by root admins');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

createAdminUser().catch(console.error);