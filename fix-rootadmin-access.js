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

async function fixRootAdminAccess() {
  console.log('🔧 Fixing root admin access to all companies...');
  
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // First, let's check all constraints
    console.log('\n📋 Checking all constraints on companies and company_users tables...');
    const constraints = await client.query(`
      SELECT 
        tc.table_name,
        tc.constraint_name,
        tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('companies', 'company_users')
      ORDER BY tc.table_name, tc.constraint_type;
    `);
    
    console.log('Current constraints:');
    constraints.rows.forEach(c => {
      console.log(`  • ${c.table_name}.${c.constraint_name} (${c.constraint_type})`);
    });
    
    // Drop all existing policies to start fresh
    console.log('\n🗑️ Dropping all existing policies...');
    
    // Companies table
    await client.query(`DROP POLICY IF EXISTS "allow_authenticated_select" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_insert" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_update" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete" ON public.companies;`);
    
    // Company users table
    await client.query(`DROP POLICY IF EXISTS "allow_authenticated_select_company_users" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_insert_company_users" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_update_company_users" ON public.company_users;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete_company_users" ON public.company_users;`);
    
    console.log('✅ All policies dropped');
    
    // Create new policies for companies table
    console.log('\n📋 Creating new policies for companies table...');
    
    // SELECT: Root admins see all, others see only their companies
    await client.query(`
      CREATE POLICY "companies_select_policy" 
      ON public.companies 
      FOR SELECT 
      TO authenticated
      USING (
        -- Root admins see all companies
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
        OR
        -- Others see companies they own
        owner_id = auth.uid()
        OR
        -- Others see companies they belong to
        EXISTS (
          SELECT 1 FROM public.company_users cu 
          WHERE cu.company_id = companies.id 
          AND cu.user_id = auth.uid() 
          AND cu.active = true
        )
      );
    `);
    console.log('✅ SELECT policy created (root admins see all)');
    
    // INSERT: Only root admins
    await client.query(`
      CREATE POLICY "companies_insert_policy" 
      ON public.companies 
      FOR INSERT 
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ INSERT policy created (root admins only)');
    
    // UPDATE: Only root admins
    await client.query(`
      CREATE POLICY "companies_update_policy" 
      ON public.companies 
      FOR UPDATE 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ UPDATE policy created (root admins only)');
    
    // DELETE: Only root admins and only deletable companies
    await client.query(`
      CREATE POLICY "companies_delete_policy" 
      ON public.companies 
      FOR DELETE 
      TO authenticated
      USING (
        can_be_deleted = true AND
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ DELETE policy created (root admins only, deletable companies)');
    
    // Create policies for company_users table
    console.log('\n📋 Creating new policies for company_users table...');
    
    // SELECT: Root admins see all, others see their own
    await client.query(`
      CREATE POLICY "company_users_select_policy" 
      ON public.company_users 
      FOR SELECT 
      TO authenticated
      USING (
        -- Root admins see all
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
        OR
        -- Users see their own assignments
        user_id = auth.uid()
      );
    `);
    console.log('✅ SELECT policy created for company_users');
    
    // INSERT/UPDATE/DELETE: Only root admins
    await client.query(`
      CREATE POLICY "company_users_insert_policy" 
      ON public.company_users 
      FOR INSERT 
      TO authenticated
      WITH CHECK (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    
    await client.query(`
      CREATE POLICY "company_users_update_policy" 
      ON public.company_users 
      FOR UPDATE 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    
    await client.query(`
      CREATE POLICY "company_users_delete_policy" 
      ON public.company_users 
      FOR DELETE 
      TO authenticated
      USING (
        (auth.jwt() ->> 'email') IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com')
      );
    `);
    console.log('✅ INSERT/UPDATE/DELETE policies created for company_users');
    
    // Add root admins to company_users for the existing company
    console.log('\n🔧 Ensuring root admins have access to existing company...');
    
    const existingCompany = await client.query(`
      SELECT id, name FROM public.companies LIMIT 1;
    `);
    
    if (existingCompany.rows.length > 0) {
      const companyId = existingCompany.rows[0].id;
      console.log(`Found company: ${existingCompany.rows[0].name}`);
      
      // Get root admin user IDs
      const rootAdmins = await client.query(`
        SELECT id, email FROM auth.users 
        WHERE email IN ('ofir.wienerman@gmail.com', 'firestar393@gmail.com');
      `);
      
      for (const admin of rootAdmins.rows) {
        console.log(`\nChecking access for ${admin.email}...`);
        
        // Check if already exists
        const existing = await client.query(`
          SELECT id FROM public.company_users 
          WHERE company_id = $1 AND user_id = $2;
        `, [companyId, admin.id]);
        
        if (existing.rows.length === 0) {
          // Add the root admin
          await client.query(`
            INSERT INTO public.company_users (
              company_id, 
              user_id, 
              role, 
              permissions, 
              active
            ) VALUES (
              $1, 
              $2, 
              'owner',
              '{"expenses": {"create": true, "read": true, "update": true, "delete": true}, "suppliers": {"create": true, "read": true, "update": true, "delete": true}, "categories": {"create": true, "read": true, "update": true, "delete": true}, "reports": {"export": true, "view_all": true}, "company": {"manage_users": true, "manage_settings": true, "view_sensitive": true}}'::jsonb,
              true
            );
          `, [companyId, admin.id]);
          console.log(`✅ Added ${admin.email} to company_users`);
        } else {
          console.log(`✅ ${admin.email} already has access`);
        }
      }
    }
    
    console.log('\n🎉 Root admin access fixed!');
    console.log('📝 Summary:');
    console.log('  • Root admins can now see ALL companies');
    console.log('  • Root admins can create/update/delete any company');
    console.log('  • Root admins can manage all company_users');
    console.log('  • Regular users see only their assigned companies');
    console.log('  • No more auth.users permission issues');
    
  } catch (error) {
    console.error('❌ Error fixing root admin access:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

fixRootAdminAccess().catch(console.error);