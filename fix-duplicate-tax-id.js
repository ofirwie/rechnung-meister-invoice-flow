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

async function fixDuplicateTaxId() {
  console.log('🔧 תיקון בעיית tax_id כפול...');
  
  try {
    await client.connect();
    console.log('✅ התחברות למסד הנתונים הצליחה');
    
    // בדיקה אילו חברות קיימות עם tax_id
    console.log('\n📊 בדיקת חברות קיימות:');
    const existingCompanies = await client.query(`
      SELECT id, name, tax_id, active, created_at
      FROM public.companies 
      ORDER BY created_at;
    `);
    
    console.log(`מספר חברות: ${existingCompanies.rows.length}`);
    existingCompanies.rows.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} - tax_id: ${company.tax_id || 'NULL'} - פעיל: ${company.active}`);
    });
    
    // הסרת unique constraint על tax_id
    console.log('\n🗑️ הסרת unique constraint על tax_id...');
    try {
      await client.query(`ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_tax_id_key;`);
      console.log('✅ Unique constraint על tax_id הוסר');
    } catch (err) {
      console.log('ℹ️ Constraint לא קיים או כבר הוסר');
    }
    
    // הוספת עמודה is_main_company
    console.log('\n📋 הוספת עמודה is_main_company...');
    try {
      await client.query(`ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_main_company BOOLEAN DEFAULT false;`);
      console.log('✅ עמודה is_main_company נוספה');
    } catch (err) {
      console.log('ℹ️ עמודה כבר קיימת');
    }
    
    // הוספת עמודה can_be_deleted
    console.log('\n📋 הוספת עמודה can_be_deleted...');
    try {
      await client.query(`ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS can_be_deleted BOOLEAN DEFAULT true;`);
      console.log('✅ עמודה can_be_deleted נוספה');
    } catch (err) {
      console.log('ℹ️ עמודה כבר קיימת');
    }
    
    // עדכון החברה הקיימת להיות החברה הראשית
    if (existingCompanies.rows.length > 0) {
      console.log('\n🏢 סימון החברה הקיימת כחברה ראשית...');
      await client.query(`
        UPDATE public.companies 
        SET is_main_company = true 
        WHERE id = $1;
      `, [existingCompanies.rows[0].id]);
      console.log(`✅ החברה "${existingCompanies.rows[0].name}" סומנה כחברה ראשית`);
    }
    
    // עדכון RLS policies רק ל-rootadmin
    console.log('\n🔐 עדכון RLS policies רק ל-rootadmin...');
    
    // מחיקת policies קיימים
    await client.query(`DROP POLICY IF EXISTS "simple_insert_policy" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_select_companies" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_owner_or_rootadmin_update" ON public.companies;`);
    await client.query(`DROP POLICY IF EXISTS "allow_rootadmin_delete" ON public.companies;`);
    
    // יצירת policies חדשים רק ל-rootadmin
    await client.query(`
      CREATE POLICY "rootadmin_only_select" 
      ON public.companies 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
        )
        OR
        -- או משתמשים שחברים בחברה
        EXISTS (
          SELECT 1 FROM company_users cu 
          WHERE cu.company_id = companies.id 
          AND cu.user_id = auth.uid() 
          AND cu.active = true
        )
      );
    `);
    
    await client.query(`
      CREATE POLICY "rootadmin_only_insert" 
      ON public.companies 
      FOR INSERT 
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
        )
      );
    `);
    
    await client.query(`
      CREATE POLICY "rootadmin_only_update" 
      ON public.companies 
      FOR UPDATE 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
        )
      );
    `);
    
    await client.query(`
      CREATE POLICY "rootadmin_only_delete" 
      ON public.companies 
      FOR DELETE 
      USING (
        EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = auth.uid() AND ur.role = 'rootadmin'
        )
        AND can_be_deleted = true
      );
    `);
    
    console.log('✅ RLS policies עודכנו - רק rootadmin יכול לנהל חברות');
    
    // בדיקת המבנה החדש
    console.log('\n📊 בדיקת המבנה החדש:');
    const newStructure = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND table_schema = 'public'
      AND column_name IN ('is_main_company', 'can_be_deleted', 'tax_id')
      ORDER BY column_name;
    `);
    
    console.log('📋 עמודות חדשות:');
    newStructure.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });
    
    console.log('\n🎉 תיקון הושלם!');
    console.log('📝 עכשיו:');
    console.log('  • רק rootadmin יכול ליצור/לערוך חברות');
    console.log('  • אין unique constraint על tax_id');
    console.log('  • יש דגל is_main_company');
    console.log('  • יש דגל can_be_deleted למניעת מחיקה');
    
  } catch (error) {
    console.error('❌ שגיאה בתיקון:', error);
  } finally {
    await client.end();
    console.log('\n🔌 החיבור למסד הנתונים נסגר');
  }
}

fixDuplicateTaxId().catch(console.error);