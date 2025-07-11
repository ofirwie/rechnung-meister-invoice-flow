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

  // Use the proper JOIN query like in useCompanies hook
  const fetchCompanies = async () => {
    try {
      setLoading(true);
      console.log('🔍 CompanyContext: Starting fetchCompanies...');

      // Get current user first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ CompanyContext: Auth error:', authError);
        setCompanies([]);
        setLoading(false);
        return;
      }

      if (!user) {
        console.error('❌ CompanyContext: No user logged in');
        setCompanies([]);
        setLoading(false);
        return;
      }

      console.log('✅ CompanyContext: Current user:', user.id, user.email);

      // First, let's check companies table directly
      console.log('🧪 CompanyContext: Testing direct companies query...');
      const { data: allCompanies, error: allCompaniesError } = await supabase
        .from('companies')
        .select('*');

      if (allCompaniesError) {
        console.error('❌ CompanyContext: Direct companies query failed:', allCompaniesError);
      } else {
        console.log('✅ CompanyContext: All companies in database:', allCompanies.length);
        allCompanies.forEach(company => {
          console.log(`  📍 ${company.name} - Owner: ${company.owner_id} - Active: ${company.active}`);
        });
      }

      // Then check company_users table
      console.log('🧪 CompanyContext: Testing company_users query...');
      const { data: allCompanyUsers, error: allUsersError } = await supabase
        .from('company_users')
        .select('*');

      if (allUsersError) {
        console.error('❌ CompanyContext: Company_users query failed:', allUsersError);
      } else {
        console.log('✅ CompanyContext: All company_users records:', allCompanyUsers.length);
        allCompanyUsers.forEach(cu => {
          console.log(`  👤 User: ${cu.user_id.substring(0,8)}... - Company: ${cu.company_id.substring(0,8)}... - Role: ${cu.role} - Active: ${cu.active}`);
        });

        // Check specifically for current user
        const currentUserCompanies = allCompanyUsers.filter(cu => cu.user_id === user.id);
        console.log('🎯 CompanyContext: Current user company relationships:', currentUserCompanies.length);
        currentUserCompanies.forEach(cu => {
          console.log(`  🔗 User linked to company: ${cu.company_id} - Role: ${cu.role} - Active: ${cu.active}`);
        });
      }

      // Now try the JOIN query
      console.log('🧪 CompanyContext: Testing JOIN query...');
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
        console.error('❌ CompanyContext: JOIN query failed:', userCompaniesError);
        console.error('❌ CompanyContext: Full error details:', userCompaniesError);
        setCompanies([]);
        setLoading(false);
        return;
      }

      console.log('✅ CompanyContext: JOIN query successful! Raw data:', userCompanies);

      // Transform the data to get just the companies
      const companiesData = userCompanies?.map((item: any) => item.companies) || [];
      
      console.log('🔄 CompanyContext: Transformed companies data:', companiesData);

      const activeCompanies = companiesData.filter((company: any) => company && company.active) as Company[];
      
      console.log('✅ CompanyContext: Final active companies:', activeCompanies.length);
      activeCompanies.forEach(company => {
        console.log(`  🏢 Active company: ${company.name} (${company.id})`);
      });

      setCompanies(activeCompanies);
      
      // Auto-select first company if none selected
      if (activeCompanies.length > 0 && !selectedCompany) {
        const savedCompanyId = localStorage.getItem('selectedCompanyId');
        const companyToSelect = savedCompanyId 
          ? activeCompanies.find(c => c.id === savedCompanyId) || activeCompanies[0]
          : activeCompanies[0];
        
        console.log('🎯 CompanyContext: Auto-selecting company:', companyToSelect.name, companyToSelect.id);
        await switchCompany(companyToSelect.id);
      } else if (activeCompanies.length === 0) {
        console.log('⚠️ CompanyContext: No active companies found for user');
      }

    } catch (err) {
      console.error('❌ CompanyContext: Unexpected error in fetchCompanies:', err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (companyId: string) => {
    try {
      console.log('👤 CompanyContext: Fetching permissions for company:', companyId);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ CompanyContext: Auth error getting user for permissions:', authError);
        return;
      }

      const { data, error } = await supabase
        .from('company_users')
        .select('role, permissions')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .eq('active', true)
        .single();

      if (error) {
        console.error('❌ CompanyContext: Error fetching user permissions:', error);
        setUserRole(null);
        setPermissions(null);
        return;
      }

      console.log('✅ CompanyContext: User permissions loaded:', data);
      setUserRole(data.role as UserRole);
      setPermissions(data.permissions as unknown as UserPermissions);
    } catch (error) {
      console.error('❌ CompanyContext: Error fetching user permissions:', error);
      setUserRole(null);
      setPermissions(null);
    }
  };

  const switchCompany = async (companyId: string) => {
    console.log('🔄 CompanyContext: Switching to company:', companyId);
    
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      console.error('❌ CompanyContext: Company not found in local list:', companyId);
      console.log('Available companies:', companies.map(c => `${c.name} (${c.id})`));
      return;
    }

    setSelectedCompany(company);
    localStorage.setItem('selectedCompanyId', companyId);
    
    await fetchUserPermissions(companyId);
    
    console.log('✅ CompanyContext: Successfully switched to company:', company.name);
  };

  const refreshCompanies = () => {
    console.log('🔄 CompanyContext: Refreshing companies...');
    fetchCompanies();
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof UserPermissions];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] === true;
  };

  // Only run once on mount - no dependencies to avoid loops
  useEffect(() => {
    console.log('🔄 CompanyContext: Component mounted, starting fetch...');
    fetchCompanies();
  }, []); // Empty dependency array!

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
