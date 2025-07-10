import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, CompanyUser, UserRole, UserPermissions } from '@/types/company';
import { supabase } from '@/integrations/supabase/client';

interface CompanyContextType {
  selectedCompany: Company | null;
  companies: Company[];
  userRole: UserRole | null;
  permissions: UserPermissions | null;
  loading: boolean;
  switchCompany: (companyId: string) => void;
  refreshCompanies: () => void;
  canAccess: (resource: string, action: string) => boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      // טעינת כל החברות שהמשתמש יכול לגשת אליהן
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('active', true)
        .order('name');

      if (companiesError) throw companiesError;

      setCompanies((companiesData || []) as Company[]);

      // אם אין חברה נבחרת, בוחרים את הראשונה
      if (!selectedCompany && companiesData && companiesData.length > 0) {
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        const companyToSelect = savedCompanyId 
          ? companiesData.find(c => c.id === savedCompanyId) || companiesData[0]
          : companiesData[0];
        
        await switchCompany(companyToSelect.id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('company_users')
        .select('role, permissions')
        .eq('company_id', companyId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('active', true)
        .single();

      if (error) throw error;

      setUserRole(data.role as UserRole);
      setPermissions(data.permissions as unknown as UserPermissions);
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserRole(null);
      setPermissions(null);
    }
  };

  const switchCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    setSelectedCompany(company);
    localStorage.setItem('selectedCompanyId', companyId);
    
    await fetchUserPermissions(companyId);
  };

  const refreshCompanies = () => {
    fetchCompanies();
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof UserPermissions];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] === true;
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        selectedCompany,
        companies,
        userRole,
        permissions,
        loading,
        switchCompany,
        refreshCompanies,
        canAccess,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};