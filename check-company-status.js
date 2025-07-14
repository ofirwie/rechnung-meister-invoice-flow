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

async function checkCompanyStatus() {
  console.log('🔍 Checking company status...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Check all companies (including inactive)
    console.log('\n📋 All companies in database:');
    const allCompanies = await client.query(`
      SELECT id, name, active, owner_id, created_at, updated_at, can_be_deleted
      FROM public.companies
      ORDER BY created_at;
    `);
    
    if (allCompanies.rows.length === 0) {
      console.log('❌ No companies found in database!');
      
      // Check if there were any companies that got hard deleted
      console.log('\n🔍 Checking audit logs if available...');
      const auditExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'audit_logs'
        );
      `);
      
      if (auditExists.rows[0].exists) {
        const deletedCompanies = await client.query(`
          SELECT * FROM public.audit_logs
          WHERE table_name = 'companies' 
          AND action = 'DELETE'
          ORDER BY created_at DESC
          LIMIT 5;
        `);
        
        if (deletedCompanies.rows.length > 0) {
          console.log('⚠️ Found deleted companies in audit logs:');
          deletedCompanies.rows.forEach(log => {
            console.log(`  • Deleted at: ${log.created_at}`);
            console.log(`    Company ID: ${log.record_id}`);
            if (log.old_values) {
              console.log(`    Company Name: ${log.old_values.name || 'Unknown'}`);
            }
          });
        }
      }
    } else {
      console.log(`Found ${allCompanies.rows.length} companies:`);
      allCompanies.rows.forEach((company, index) => {
        console.log(`\n${index + 1}. ${company.name}`);
        console.log(`   ID: ${company.id}`);
        console.log(`   Active: ${company.active}`);
        console.log(`   Can be deleted: ${company.can_be_deleted}`);
        console.log(`   Owner: ${company.owner_id}`);
        console.log(`   Created: ${company.created_at}`);
        console.log(`   Updated: ${company.updated_at}`);
      });
    }
    
    // Check company_users for ofir.wienerman
    console.log('\n🔍 Checking company assignments for ofir.wienerman@gmail.com...');
    const ofirAssignments = await client.query(`
      SELECT 
        cu.company_id,
        cu.role,
        cu.active as user_active,
        c.name as company_name,
        c.active as company_active
      FROM public.company_users cu
      LEFT JOIN public.companies c ON c.id = cu.company_id
      WHERE cu.user_id = (
        SELECT id FROM auth.users WHERE email = 'ofir.wienerman@gmail.com'
      );
    `);
    
    if (ofirAssignments.rows.length > 0) {
      console.log(`Found ${ofirAssignments.rows.length} company assignments:`);
      ofirAssignments.rows.forEach((assignment, index) => {
        console.log(`\n${index + 1}. ${assignment.company_name || 'Company deleted!'}`);
        console.log(`   Company ID: ${assignment.company_id}`);
        console.log(`   Role: ${assignment.role}`);
        console.log(`   User active in company: ${assignment.user_active}`);
        console.log(`   Company active: ${assignment.company_active}`);
      });
    } else {
      console.log('❌ No company assignments found for ofir.wienerman@gmail.com');
    }
    
    // Check DELETE policy on companies
    console.log('\n🔐 Checking DELETE policy on companies table...');
    const deletePolicies = await client.query(`
      SELECT policyname, definition
      FROM pg_policies
      WHERE schemaname = 'public' 
      AND tablename = 'companies'
      AND cmd = 'DELETE';
    `);
    
    if (deletePolicies.rows.length > 0) {
      console.log('Found DELETE policies:');
      deletePolicies.rows.forEach(policy => {
        console.log(`  • ${policy.policyname}`);
      });
      console.log('\n⚠️ DELETE policies exist! Companies can be hard deleted.');
      console.log('Need to remove DELETE policies to prevent hard deletion.');
    }
    
    console.log('\n📝 Summary:');
    if (allCompanies.rows.length === 0) {
      console.log('  • No companies exist - need to create a new one');
      console.log('  • Companies might have been hard deleted');
      console.log('  • Need to fix delete functionality to soft delete only');
    } else {
      const activeCompanies = allCompanies.rows.filter(c => c.active);
      console.log(`  • Total companies: ${allCompanies.rows.length}`);
      console.log(`  • Active companies: ${activeCompanies.length}`);
      console.log(`  • Inactive companies: ${allCompanies.rows.length - activeCompanies.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking company status:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

checkCompanyStatus().catch(console.error);