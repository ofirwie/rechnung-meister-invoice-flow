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

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Session error: ' + sessionError.message);
      }
      
      if (!session?.user) {
        throw new Error('User not logged in');
      }

      const user = session.user;
      const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
      const isRootAdmin = rootAdminEmails.includes(user.email || '');
      
      let query;
      
      if (isRootAdmin) {
        query = supabase
          .from('companies')
          .select('*')
          .eq('active', true)
          .order('created_at', { ascending: false });
      } else {
        query = supabase
          .from('company_users')
          .select(`
            company_id,
            companies!inner (*)
          `)
          .eq('user_id', user.id)
          .eq('active', true);
      }
      
      const { data: companiesData, error: companiesError } = await query;
      
      let allCompanies = [];
      if (isRootAdmin && companiesData) {
        allCompanies = companiesData;
      } else if (companiesData) {
        allCompanies = companiesData.map((item: any) => item.companies).filter(Boolean);
      }

      if (companiesError) {
        if (companiesError.code === '42P17') {
          throw new Error('Permission issue in companies query. Need to fix RLS policies in Supabase Dashboard.');
        }
        throw companiesError;
      }

      let activeCompanies: Company[] = [];
      
      if (isRootAdmin) {
        activeCompanies = allCompanies as Company[];
      } else {
        const { data: userMemberships, error: membershipsError } = await supabase
          .from('company_users')
          .select('company_id')
          .eq('user_id', user.id)
          .eq('active', true);

        if (membershipsError) {
          throw membershipsError;
        }

        const userCompanyIds = userMemberships?.map(m => m.company_id) || [];
        activeCompanies = (allCompanies || []).filter((company: Company) => 
          userCompanyIds.includes(company.id)
        ) as Company[];
      }
      
      setCompanies(activeCompanies);

    } catch (err) {
      console.error('❌ Error fetching companies:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch companies';
      setError(errorMessage);
      toast.error('Error loading companies: ' + errorMessage);
      console.log('🚨 Error caught, setting loading to false');
      setLoading(false);
    } finally {
      console.log('🏁 Finally block - setting loading to false');
      setLoading(false);
    }
  };

  const createCompany = async (companyData: CompanyFormData): Promise<Company | null> => {
    try {
      setError(null);
      // console.log('🏗️ Creating company with data:', companyData);

      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (authError) {
        console.error('❌ Auth error during creation:', authError);
        throw new Error('Authentication error: ' + authError.message);
      }

      if (!user) {
        console.error('❌ No user during creation');
        throw new Error('User not logged in');
      }

      // console.log('✅ Creating company for user:', user.id);

      // Check if this will be the main company
      const { data: existingCompanies } = await supabase
        .from('companies')
        .select('id, is_main_company')
        .eq('active', true)
        .limit(1);
      
      const isFirstCompany = !existingCompanies || existingCompanies.length === 0;
      
      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          owner_id: user.id,
          active: true,
          is_main_company: companyData.is_main_company ?? isFirstCompany,
          can_be_deleted: true,
        })
        .select()
        .single();

      if (companyError) {
        console.error('❌ Error creating company:', companyError);
        
        if (companyError.code === '42P17') {
          throw new Error('Permission issue creating company. Need to fix RLS policies.');
        }
        
        throw new Error('Error creating company: ' + companyError.message);
      }

      // console.log('✅ Company created successfully:', company);

      // Check if user is root admin
      const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
      const isRootAdmin = rootAdminEmails.includes(user.email || '');
      
      // Only root admins can add company_users entries
      if (isRootAdmin) {
        // Add the owner as a company user with full permissions
        const ownerPermissions = {
          expenses: { create: true, read: true, update: true, delete: true },
          suppliers: { create: true, read: true, update: true, delete: true },
          categories: { create: true, read: true, update: true, delete: true },
          reports: { export: true, view_all: true },
          company: { manage_users: true, manage_settings: true, view_sensitive: true }
        };

        // console.log('👤 Adding owner to company_users...');

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
        // console.log('🗑️ Attempting to cleanup created company...');
          await supabase.from('companies').delete().eq('id', company.id);
          
          throw new Error('Error adding owner to company: ' + userError.message);
        }
      } else {
        console.log('ℹ️ Non-root admin created company, skipping company_users entry');
      }

      // console.log('✅ Owner added to company successfully');

      // Refresh the companies list
      // console.log('🔄 Refreshing companies list...');
      await fetchCompanies();
      
      toast.success('Company created successfully!');
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
      // console.log('📝 Updating company:', id, updates);

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
          throw new Error('Permission issue updating company. Need to fix RLS policies.');
        }
        
        throw new Error('Error updating company: ' + error.message);
      }

      // console.log('✅ Company updated successfully');
      await fetchCompanies();
      toast.success('Company updated successfully!');
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
      // console.log('🗑️ Deleting company:', id);

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
          throw new Error('Permission issue deleting company. Need to fix RLS policies.');
        }
        
        throw new Error('Error deleting company: ' + error.message);
      }

      // console.log('✅ Company deactivated successfully');
      await fetchCompanies();
      toast.success('Company deactivated successfully');
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
      // console.log('🔄 useCompanies hook mounted, fetching companies...');
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
