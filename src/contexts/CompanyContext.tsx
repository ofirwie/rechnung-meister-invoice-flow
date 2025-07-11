import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, CompanyUser, UserRole, UserPermissions } from '@/types/company';
import { supabase } from '@/integrations/supabase/client';
import { useCompanies } from '@/hooks/useCompanies';

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
  
  // Use the useCompanies hook that has the proper JOIN logic
  const { companies, loading: companiesLoading, fetchCompanies } = useCompanies();

  console.log('📊 CompanyContext - companies loaded:', companies.length);
  console.log('📊 CompanyContext - selected company:', selectedCompany?.name || 'none');

  const fetchUserPermissions = async (companyId: string) => {
    try {
      console.log('👤 Fetching permissions for company:', companyId);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('❌ Auth error getting user for permissions:', authError);
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
        console.error('❌ Error fetching user permissions:', error);
        setUserRole(null);
        setPermissions(null);
        return;
      }

      console.log('✅ User permissions loaded:', data);
      setUserRole(data.role as UserRole);
      setPermissions(data.permissions as unknown as UserPermissions);
    } catch (error) {
      console.error('❌ Error fetching user permissions:', error);
      setUserRole(null);
      setPermissions(null);
    }
  };

  const switchCompany = async (companyId: string) => {
    console.log('🔄 Switching to company:', companyId);
    
    const company = companies.find(c => c.id === companyId);
    if (!company) {
      console.error('❌ Company not found:', companyId);
      return;
    }

    setSelectedCompany(company);
    localStorage.setItem('selectedCompanyId', companyId);
    
    await fetchUserPermissions(companyId);
    
    console.log('✅ Switched to company:', company.name);
  };

  const refreshCompanies = () => {
    console.log('🔄 Refreshing companies...');
    fetchCompanies();
  };

  const canAccess = (resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof UserPermissions];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] === true;
  };

  // Effect to select the first company when companies are loaded
  useEffect(() => {
    console.log('🎯 CompanyContext effect - companies:', companies.length, 'selected:', selectedCompany?.name || 'none');
    
    // Only auto-select if we have companies and no company is selected
    if (!companiesLoading && companies.length > 0 && !selectedCompany) {
      console.log('🎯 Auto-selecting company...');
      
      // Try to restore the previously selected company from localStorage
      const savedCompanyId = localStorage.getItem('selectedCompanyId');
      const companyToSelect = savedCompanyId 
        ? companies.find(c => c.id === savedCompanyId) || companies[0]
        : companies[0];
      
      console.log('🎯 Company to select:', companyToSelect.name, 'ID:', companyToSelect.id);
      switchCompany(companyToSelect.id);
    }
  }, [companies, companiesLoading, selectedCompany]);

  // Reset selected company when companies list changes and current selection is no longer valid
  useEffect(() => {
    if (selectedCompany && companies.length > 0) {
      const stillExists = companies.some(c => c.id === selectedCompany.id);
      if (!stillExists) {
        console.log('⚠️ Selected company no longer exists, clearing selection');
        setSelectedCompany(null);
        setUserRole(null);
        setPermissions(null);
        localStorage.removeItem('selectedCompanyId');
      }
    }
  }, [companies, selectedCompany]);

  const loading = companiesLoading;

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
