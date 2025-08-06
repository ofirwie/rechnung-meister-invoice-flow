import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company, UserRole, UserPermissions } from '@/types/company';
import { supabase } from '@/integrations/supabase/client';

interface CompanyContextType {
  selectedCompany: Company;
  userRole: UserRole | null;
  permissions: UserPermissions | null;
  loading: boolean;
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

// STATIC COMPANY - NO DYNAMIC LOADING
const STATIC_COMPANY: Company = {
  id: '019e9514-c181-4577-b173-a201184c990c',
  name: 'Default Company',
  active: true,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  owner_id: '',
  can_be_deleted: false,
  is_main_company: true,
  default_currency: 'EUR',
  fiscal_year_start: 1,
  settings: {}
};

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  // STATIC canAccess function - no dependencies that change
  const canAccess = (resource: string, action: string): boolean => {
    if (!permissions) return false;
    
    const resourcePermissions = permissions[resource as keyof UserPermissions];
    if (!resourcePermissions || typeof resourcePermissions !== 'object') return false;
    
    return resourcePermissions[action as keyof typeof resourcePermissions] === true;
  };

  // STATIC context value - only updates when state actually changes
  const contextValue: CompanyContextType = {
    selectedCompany: STATIC_COMPANY,
    userRole,
    permissions,
    loading,
    canAccess,
  };

  // ONE-TIME effect to fetch user permissions
  useEffect(() => {
    let mounted = true;

    const fetchUserPermissions = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (authError || !user || !mounted) {
          setLoading(false);
          return;
        }

        // Check if user is root admin
        const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
        const isRootAdmin = rootAdminEmails.includes(user.email || '');

        const { data, error } = await supabase
          .from('company_users')
          .select('role, permissions')
          .eq('company_id', STATIC_COMPANY.id)
          .eq('user_id', user.id)
          .eq('active', true)
          .single();

        if (!mounted) return;

        if (error) {
          console.log('Company user query failed, checking for root admin fallback');
          if (isRootAdmin) {
            console.log('🔧 Root admin detected, setting owner permissions');
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
        } else {
          setUserRole(data.role as UserRole);
          setPermissions(data.permissions as unknown as UserPermissions);
        }
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        if (mounted) {
          setUserRole(null);
          setPermissions(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUserPermissions();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []); // EMPTY dependency array - runs once only

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
};
