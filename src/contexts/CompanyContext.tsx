import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Company, CompanyUser, UserRole, UserPermissions } from '@/types/company';
import { supabase } from '@/integrations/supabase/client';
import { NoCompanyScreen } from '@/components/NoCompanyScreen';
import { RenderTracker } from '@/components/RenderTracker';

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
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  
  // HARDCODED COMPANY - Emergency fix to stop render loop
  const HARDCODED_COMPANY_ID = '019e9514-c181-4577-b173-a201184c990c';
  
  // Static company object with all required fields to prevent re-renders
  const selectedCompany: Company = useMemo(() => ({
    id: HARDCODED_COMPANY_ID,
    name: 'Default Company',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: '',
    can_be_deleted: false,
    is_main_company: true,
    default_currency: 'EUR',
    fiscal_year_start: 1,
    settings: {}
  }), [HARDCODED_COMPANY_ID]);
  
  // Static companies array
  const companies: Company[] = useMemo(() => [selectedCompany], [selectedCompany]);
  
  // No loading state needed - always ready
  const loading = false;

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
  }, []); // Stable callback - no dependencies needed

  // Simplified callbacks - no dependencies to prevent recreation
  const switchCompany = useCallback(async (companyId: string) => {
    // No-op since we only have one hardcoded company
    console.log('switchCompany called but using hardcoded company:', HARDCODED_COMPANY_ID);
    await fetchUserPermissions(HARDCODED_COMPANY_ID);
  }, [fetchUserPermissions]);

  const refreshCompanies = useCallback(() => {
    // No-op since we're using hardcoded company
    console.log('refreshCompanies called but using hardcoded company');
  }, []);

  const canAccess = useCallback((resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof UserPermissions];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] === true;
  }, [permissions]);

  // Static context value with minimal dependencies
  const contextValue = useMemo(() => ({
    selectedCompany,
    companies,
    userRole,
    permissions,
    loading,
    switchCompany,
    refreshCompanies,
    canAccess,
  }), [selectedCompany, companies, userRole, permissions, switchCompany, refreshCompanies, canAccess]);

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

  // Single effect to fetch permissions for hardcoded company
  useEffect(() => {
    console.log('🎯 [CompanyProvider] Initializing hardcoded company:', HARDCODED_COMPANY_ID);
    
    // Set company in localStorage
    localStorage.setItem('selectedCompanyId', HARDCODED_COMPANY_ID);
    
    // Fetch permissions for the hardcoded company
    fetchUserPermissions(HARDCODED_COMPANY_ID);
  }, [fetchUserPermissions, HARDCODED_COMPANY_ID]);

  // If not loading and user has no companies, show the NoCompanyScreen
  if (!loading && companies.length === 0 && userEmail) {
    return <NoCompanyScreen userEmail={userEmail} />;
  }

  return (
    <>
      <RenderTracker
        componentName="CompanyProvider"
        stateChanges={{
          selectedCompany: HARDCODED_COMPANY_ID,
          companiesLength: 1,
          companiesLoading: false,
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
          companies: ['HARDCODED_COMPANY'],
          companiesLoading: false,
          selectedCompany: HARDCODED_COMPANY_ID,
          switchCompanyDeps: 'HARDCODED - no dependencies'
        }}
      />
      <CompanyContext.Provider value={contextValue}>
        {children}
      </CompanyContext.Provider>
    </>
  );
};
