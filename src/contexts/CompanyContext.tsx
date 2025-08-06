import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import { Company, CompanyUser, UserRole, UserPermissions } from '@/types/company';
import { supabase } from '@/integrations/supabase/client';
import { useCompanies } from '@/hooks/useCompanies';
import { NoCompanyScreen } from '@/components/NoCompanyScreen';
import { RenderLoopDebugger } from '@/components/RenderLoopDebugger';

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

  const fetchUserPermissions = useCallback(async (companyId: string) => {
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
  }, []);

  const switchCompany = useCallback(async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      return;
    }

    setSelectedCompany(company);
    localStorage.setItem('selectedCompanyId', companyId);
    
    await fetchUserPermissions(companyId);
  }, [companies, fetchUserPermissions]);

  const refreshCompanies = useCallback(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const canAccess = useCallback((resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof UserPermissions];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] === true;
  }, [permissions]);

  const loading = companiesLoading;

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    selectedCompany,
    companies,
    userRole,
    permissions,
    loading,
    switchCompany,
    refreshCompanies,
    canAccess,
  }), [selectedCompany, companies, userRole, permissions, loading, switchCompany, refreshCompanies, canAccess]);

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
    console.log('🎯 [CompanyProvider] useEffect #1 fired with deps:', {
      companiesCount: companies.length,
      companiesLoading,
      selectedCompanyId: selectedCompany?.id,
      switchCompanyRef: switchCompany.toString().slice(0, 50)
    });
    
    // Only auto-select if we have companies and no company is selected
    if (!companiesLoading && companies.length > 0 && !selectedCompany) {
      console.log('🎯 [CompanyProvider] Auto-selecting company...');
      // Try to restore the previously selected company from localStorage
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      const companyToSelect = savedCompanyId 
        ? companies.find(c => c.id === savedCompanyId) || companies[0]
        : companies[0];
      
      switchCompany(companyToSelect.id);
    }
  }, [companies, companiesLoading, selectedCompany, switchCompany]);

  // Reset selected company when companies list changes and current selection is no longer valid
  useEffect(() => {
    console.log('🎯 [CompanyProvider] useEffect #2 fired with deps:', {
      selectedCompanyId: selectedCompany?.id,
      companiesCount: companies.length
    });
    
    if (selectedCompany && companies.length > 0) {
      const stillExists = companies.some(c => c.id === selectedCompany.id);
      if (!stillExists) {
        console.log('🎯 [CompanyProvider] Resetting selected company - no longer exists');
        setSelectedCompany(null);
        setUserRole(null);
        setPermissions(null);
        localStorage.removeItem('selectedCompanyId');
      }
    }
  }, [companies, selectedCompany]);

  // If not loading and user has no companies, show the NoCompanyScreen
  if (!loading && companies.length === 0 && userEmail) {
    return <NoCompanyScreen userEmail={userEmail} />;
  }

  return (
    <>
      <RenderLoopDebugger
        componentName="CompanyProvider"
        stateChanges={{
          selectedCompany: selectedCompany?.id || 'null',
          companiesLength: companies.length,
          companiesLoading,
          userRole,
          permissions: permissions ? 'set' : 'null',
          userEmail
        }}
        callbacks={{
          switchCompany,
          refreshCompanies,
          canAccess,
          fetchUserPermissions
        }}
        dependencies={{
          companies: companies.map(c => c.id),
          companiesLoading,
          selectedCompany: selectedCompany?.id || 'null',
          switchCompanyDeps: 'companies,fetchUserPermissions'
        }}
      />
      <CompanyContext.Provider value={contextValue}>
        {children}
      </CompanyContext.Provider>
    </>
  );
};
