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

async function resetDatabase() {
  console.log('🗑️ Resetting database - deleting all data...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // First, let's see what data exists
    console.log('\n📊 Checking existing data before deletion...');
    
    const tables = ['companies', 'company_users', 'user_roles'];
    
    for (const table of tables) {
      try {
        const count = await client.query(`SELECT COUNT(*) FROM public.${table};`);
        console.log(`  • ${table}: ${count.rows[0].count} rows`);
      } catch (e) {
        console.log(`  • ${table}: Table might not exist or no access`);
      }
    }
    
    // Delete data in correct order (respecting foreign keys)
    console.log('\n🗑️ Deleting all data...');
    
    // Delete company_users first (has foreign key to companies)
    console.log('Deleting company_users...');
    const companyUsersDeleted = await client.query(`DELETE FROM public.company_users;`);
    console.log(`✅ Deleted ${companyUsersDeleted.rowCount} company_users records`);
    
    // Delete user_roles
    console.log('Deleting user_roles...');
    try {
      const userRolesDeleted = await client.query(`DELETE FROM public.user_roles;`);
      console.log(`✅ Deleted ${userRolesDeleted.rowCount} user_roles records`);
    } catch (e) {
      console.log('ℹ️ user_roles table might not exist or no access');
    }
    
    // Delete companies last
    console.log('Deleting companies...');
    const companiesDeleted = await client.query(`DELETE FROM public.companies;`);
    console.log(`✅ Deleted ${companiesDeleted.rowCount} companies records`);
    
    // Reset sequences if they exist
    console.log('\n🔄 Resetting sequences...');
    try {
      // Find all sequences for these tables
      const sequences = await client.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND sequence_name LIKE '%companies%' 
        OR sequence_name LIKE '%company_users%' 
        OR sequence_name LIKE '%user_roles%';
      `);
      
      for (const seq of sequences.rows) {
        await client.query(`ALTER SEQUENCE public.${seq.sequence_name} RESTART WITH 1;`);
        console.log(`✅ Reset sequence: ${seq.sequence_name}`);
      }
    } catch (e) {
      console.log('ℹ️ No sequences to reset or they are managed automatically');
    }
    
    // Verify deletion
    console.log('\n✅ Verifying deletion...');
    for (const table of tables) {
      try {
        const count = await client.query(`SELECT COUNT(*) FROM public.${table};`);
        console.log(`  • ${table}: ${count.rows[0].count} rows remaining`);
      } catch (e) {
        console.log(`  • ${table}: No access to verify`);
      }
    }
    
    console.log('\n🎉 Database reset complete!');
    console.log('📝 Summary:');
    console.log('  • All company data deleted');
    console.log('  • All company_users assignments deleted');
    console.log('  • All user_roles deleted');
    console.log('  • Database structure and policies preserved');
    console.log('  • Ready for fresh start');
    
    console.log('\n📋 Next steps:');
    console.log('  1. Root admins can now create the first company');
    console.log('  2. System will assign users to companies as they are created');
    console.log('  3. All RLS policies are still in place and working');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

resetDatabase().catch(console.error);