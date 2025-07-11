import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyUser, CompanyFormData } from '@/types/company';
import { toast } from 'sonner';

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching companies...');

      // Get current user first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw new Error('שגיאת אימות: ' + authError.message);
      }

      if (!user) {
        console.error('❌ No user logged in');
        throw new Error('משתמש לא מחובר');
      }

      console.log('✅ Current user:', user.id);

      // DEBUG: Try a simple query first to isolate the RLS issue
      console.log('🧪 Testing simple companies query...');
      const { data: testData, error: testError } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);

      if (testError) {
        console.error('❌ Simple query failed:', testError);
        
        // If this fails, it's definitely an RLS issue
        if (testError.code === '42P17') {
          console.error('🔥 RLS INFINITE RECURSION DETECTED!');
          throw new Error('RLS Policy Loop Detected - יש בעיה בהגדרות הרשאות ב-Supabase. צריך לתקן ב-Dashboard.');
        }
        
        if (testError.message?.includes('permission denied')) {
          console.error('🚫 Permission denied - RLS blocking access');
          throw new Error('אין הרשאות גישה לטבלת החברות. צריך לבדוק RLS policies.');
        }
        
        throw new Error('שגיאה בשאילתת החברות: ' + testError.message);
      }

      console.log('✅ Simple query succeeded:', testData);

      // DEBUG: Test company_users table
      console.log('🧪 Testing company_users query...');
      const { data: testUserCompanies, error: testUserError } = await supabase
        .from('company_users')
        .select('id, company_id')
        .eq('user_id', user.id)
        .limit(1);

      if (testUserError) {
        console.error('❌ Company_users query failed:', testUserError);
        throw new Error('שגיאה בטבלת משתמשי החברות: ' + testUserError.message);
      }

      console.log('✅ Company_users query succeeded:', testUserCompanies);

      // Now try the full query
      console.log('🚀 Attempting full query with JOIN...');
      
      const { data: userCompanies, error: userCompaniesError } = await supabase
        .from('company_users')
        .select(`
          company_id,
          companies!inner (
            *
          )
        `)
        .eq('user_id', user.id)
        .eq('active', true);

      if (userCompaniesError) {
        console.error('❌ Full query failed:', userCompaniesError);
        
        if (userCompaniesError.code === '42P17') {
          console.error('🔥 RLS INFINITE RECURSION in JOIN query!');
          throw new Error('בעיית הרשאות בשאילת JOIN. צריך לתקן RLS policies ב-Supabase Dashboard.');
        }
        
        throw userCompaniesError;
      }

      console.log('✅ Full query succeeded! Raw data:', userCompanies);

      // Transform the data to get just the companies
      const companiesData = userCompanies?.map((item: any) => item.companies) || [];
      
      console.log('🔄 Transformed companies:', companiesData);

      const activeCompanies = companiesData.filter((company: any) => company && company.active) as Company[];
      
      console.log('✅ Final active companies:', activeCompanies);

      setCompanies(activeCompanies);
      
      if (activeCompanies.length === 0) {
        console.log('⚠️ No companies found for user');
        toast.info('לא נמצאו חברות עבור המשתמש הנוכחי');
      } else {
        console.log(`✅ Successfully loaded ${activeCompanies.length} companies`);
      }

    } catch (err) {
      console.error('❌ Error fetching companies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch companies';
      setError(errorMessage);
      toast.error('שגיאה בטעינת חברות: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (companyData: CompanyFormData): Promise<Company | null> => {
    try {
      setError(null);
      console.log('🏗️ Creating company with data:', companyData);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error during creation:', authError);
        throw new Error('שגיאת אימות: ' + authError.message);
      }

      if (!user) {
        console.error('❌ No user during creation');
        throw new Error('משתמש לא מחובר');
      }

      console.log('✅ Creating company for user:', user.id);

      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          owner_id: user.id,
          active: true,
        })
        .select()
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        
        if (companyError.code === '42P17') {
          throw new Error('בעיית הרשאות ביצירת חברה. צריך לתקן RLS policies.');
        }
        
        throw new Error('שגיאה ביצירת חברה: ' + companyError.message);
      }

      console.log('✅ Company created successfully:', company);

      // Add the owner as a company user with full permissions
      const ownerPermissions = {
        expenses: { create: true, read: true, update: true, delete: true },
        suppliers: { create: true, read: true, update: true, delete: true },
        categories: { create: true, read: true, update: true, delete: true },
        reports: { export: true, view_all: true },
        company: { manage_users: true, manage_settings: true, view_sensitive: true }
      };

      console.log('👤 Adding owner to company_users...');

      const { error: userError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'owner',
          permissions: ownerPermissions,
          active: true
        });

      if (userError) {
        console.error('❌ Error adding owner to company_users:', userError);
        
        // Try to delete the company if user creation failed
        console.log('🗑️ Attempting to cleanup created company...');
        await supabase.from('companies').delete().eq('id', company.id);
        
        throw new Error('שגיאה בהוספת בעלים לחברה: ' + userError.message);
      }

      console.log('✅ Owner added to company successfully');

      // Refresh the companies list
      console.log('🔄 Refreshing companies list...');
      await fetchCompanies();
      
      toast.success('החברה נוצרה בהצלחה!');
      return company as Company;
    } catch (err) {
      console.error('❌ Error creating company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create company';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    }
  };

  const updateCompany = async (id: string, updates: Partial<CompanyFormData>): Promise<boolean> => {
    try {
      setError(null);
      console.log('📝 Updating company:', id, updates);

      const { error } = await supabase
        .from('companies')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error updating company:', error);
        
        if (error.code === '42P17') {
          throw new Error('בעיית הרשאות בעדכון חברה. צריך לתקן RLS policies.');
        }
        
        throw new Error('שגיאה בעדכון חברה: ' + error.message);
      }

      console.log('✅ Company updated successfully');
      await fetchCompanies();
      toast.success('החברה עודכנה בהצלחה!');
      return true;
    } catch (err) {
      console.error('❌ Error updating company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update company';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  const deleteCompany = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      console.log('🗑️ Deleting company:', id);

      // Soft delete
      const { error } = await supabase
        .from('companies')
        .update({ 
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting company:', error);
        
        if (error.code === '42P17') {
          throw new Error('בעיית הרשאות במחיקת חברה. צריך לתקן RLS policies.');
        }
        
        throw new Error('שגיאה במחיקת חברה: ' + error.message);
      }

      console.log('✅ Company deleted successfully');
      await fetchCompanies();
      toast.success('החברה נמחקה בהצלחה');
      return true;
    } catch (err) {
      console.error('❌ Error deleting company:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete company';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  };

  useEffect(() => {
    console.log('🔄 useCompanies hook mounted, fetching companies...');
    fetchCompanies();
  }, []);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
};
