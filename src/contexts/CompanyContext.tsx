import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, CompanyUser, UserRole, UserPermissions } from '@/types/company';
import { supabase } from '@/integrations/supabase/client';
import { useCompanies } from '@/hooks/useCompanies';
import { NoCompanyScreen } from '@/components/NoCompanyScreen';

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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // Use the useCompanies hook that has the proper JOIN logic
  const { companies, loading: companiesLoading, fetchCompanies } = useCompanies();
  
  console.log('🏢 CompanyContext: companies =', companies);
  console.log('🏢 CompanyContext: companiesLoading =', companiesLoading);
  console.log('🏢 CompanyContext: selectedCompany =', selectedCompany);

  const fetchUserPermissions = async (companyId: string) => {
    try {
      
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (authError || !user) {
        return;
      }

      // Check if user is root admin
      const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
      const isRootAdmin = rootAdminEmails.includes(user.email || '');

      const { data, error } = await supabase
        .from('company_users')
        .select('role, permissions')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (error) {
        console.error('❌ Error fetching user permissions, using fallback for root admin:', error);
        // Fallback for root admin when company_users query fails
        if (isRootAdmin) {
          console.log('🔧 FALLBACK: Setting owner role for root admin');
          setUserRole('owner');
          setPermissions({
            expenses: { create: true, read: true, update: true, delete: true },
            suppliers: { create: true, read: true, update: true, delete: true },
            categories: { create: true, read: true, update: true, delete: true },
            reports: { export: true, view_all: true },
            company: { manage_users: true, manage_settings: true, view_sensitive: true }
          });
        } else {
          setUserRole(null);
          setPermissions(null);
        }
        return;
      }
      setUserRole(data.role as UserRole);
      setPermissions(data.permissions as unknown as UserPermissions);
    } catch (error) {
      console.error('❌ CompanyContext: Error fetching user permissions:', error);
      setUserRole(null);
      setPermissions(null);
    }
  };

  const switchCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      return;
    }

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

  // Get current user email
  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (user) {
        setUserEmail(user.email || '');
      }
    };
    getUserEmail();
  }, []);

  // Effect to select the first company when companies are loaded
  useEffect(() => {
    // Only auto-select if we have companies and no company is selected
    if (!companiesLoading && companies.length > 0 && !selectedCompany) {
      // Try to restore the previously selected company from localStorage
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      const companyToSelect = savedCompanyId 
        ? companies.find(c => c.id === savedCompanyId) || companies[0]
        : companies[0];
      
      switchCompany(companyToSelect.id);
    }
  }, [companies, companiesLoading]);

  // Reset selected company when companies list changes and current selection is no longer valid
  useEffect(() => {
    if (selectedCompany && companies.length > 0) {
      const stillExists = companies.some(c => c.id === selectedCompany.id);
      if (!stillExists) {
        setSelectedCompany(null);
        setUserRole(null);
        setPermissions(null);
        localStorage.removeItem('selectedCompanyId');
      }
    }
  }, [companies, selectedCompany]);

  const loading = companiesLoading;

  // If not loading and user has no companies, show the NoCompanyScreen
  if (!loading && companies.length === 0 && userEmail) {
    return <NoCompanyScreen userEmail={userEmail} />;
  }

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
