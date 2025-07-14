import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company, CompanyUser, CompanyFormData } from '@/types/company';

export const useCompanies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setCompanies((data || []) as Company[]);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const createCompany = async (companyData: CompanyFormData): Promise<Company | null> => {
    try {
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // יצירת החברה
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          ...companyData,
          owner_id: user.user.id,
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // הוספת הבעלים כמשתמש של החברה
      const { error: userError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: user.user.id,
          role: 'owner',
          permissions: {
            expenses: { create: true, read: true, update: true, delete: true },
            suppliers: { create: true, read: true, update: true, delete: true },
            categories: { create: true, read: true, update: true, delete: true },
            reports: { export: true, view_all: true },
            company: { manage_users: true, manage_settings: true, view_sensitive: true }
          }
        });

      if (userError) throw userError;

      // רענון רשימת החברות
      await fetchCompanies();
      
      // עדכון הרשימה מיידית
      setCompanies(prev => [...prev, company as Company]);
      
      return company as Company;
    } catch (err) {
      console.error('Error creating company:', err);
      setError(err instanceof Error ? err.message : 'Failed to create company');
      return null;
    }
  };

  const updateCompany = async (id: string, updates: Partial<CompanyFormData>): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchCompanies();
      return true;
    } catch (err) {
      console.error('Error updating company:', err);
      setError(err instanceof Error ? err.message : 'Failed to update company');
      return false;
    }
  };

  const deleteCompany = async (id: string): Promise<boolean> => {
    try {
      setError(null);

      // Soft delete
      const { error } = await supabase
        .from('companies')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchCompanies();
      return true;
    } catch (err) {
      console.error('Error deleting company:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete company');
      return false;
    }
  };

  useEffect(() => {
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