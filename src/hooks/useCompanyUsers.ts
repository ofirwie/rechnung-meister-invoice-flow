import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyUser, UserRole, UserPermissions } from '@/types/company';

// Helper function to get default permissions based on role
function getDefaultPermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'owner':
      return {
        expenses: { create: true, read: true, update: true, delete: true },
        suppliers: { create: true, read: true, update: true, delete: true },
        categories: { create: true, read: true, update: true, delete: true },
        reports: { export: true, view_all: true },
        company: { manage_users: true, manage_settings: true, view_sensitive: true }
      };
    case 'admin':
      return {
        expenses: { create: true, read: true, update: true, delete: true },
        suppliers: { create: true, read: true, update: true, delete: true },
        categories: { create: true, read: true, update: true, delete: false },
        reports: { export: true, view_all: true },
        company: { manage_users: true, manage_settings: false, view_sensitive: true }
      };
    case 'member':
      return {
        expenses: { create: true, read: true, update: true, delete: false },
        suppliers: { create: true, read: true, update: false, delete: false },
        categories: { create: false, read: true, update: false, delete: false },
        reports: { export: true, view_all: false },
        company: { manage_users: false, manage_settings: false, view_sensitive: false }
      };
    case 'viewer':
      return {
        expenses: { create: false, read: true, update: false, delete: false },
        suppliers: { create: false, read: true, update: false, delete: false },
        categories: { create: false, read: true, update: false, delete: false },
        reports: { export: false, view_all: false },
        company: { manage_users: false, manage_settings: false, view_sensitive: false }
      };
    default:
      return {
        expenses: { create: false, read: false, update: false, delete: false },
        suppliers: { create: false, read: false, update: false, delete: false },
        categories: { create: false, read: false, update: false, delete: false },
        reports: { export: false, view_all: false },
        company: { manage_users: false, manage_settings: false, view_sensitive: false }
      };
  }
}

// Extended type with profile data
export interface CompanyUserWithProfile extends Omit<CompanyUser, 'user_id'> {
  user_id: string;
  user_email: string;
  user_display_name: string | null;
  user_is_active: boolean;
  profiles?: {
    id: string;
    email: string;
    display_name: string | null;
    is_active: boolean;
  };
}

export const useCompanyUsers = (companyId?: string) => {
  const [users, setUsers] = useState<CompanyUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!companyId) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔧 Fetching company users from database...');

      const { data, error } = await supabase
        .from('company_users')
        .select(`
          *,
          profiles!company_users_user_id_fkey (
            id,
            email,
            display_name,
            is_active
          )
        `)
        .eq('company_id', companyId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company users:', error);
        throw error;
      }

      const formattedUsers: CompanyUserWithProfile[] = data.map(item => ({
        id: item.id,
        company_id: item.company_id,
        user_id: item.user_id,
        role: item.role as UserRole,
        permissions: item.permissions as UserPermissions,
        active: item.active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        user_email: item.profiles?.email || '',
        user_display_name: item.profiles?.display_name || null,
        user_is_active: item.profiles?.is_active || false,
        profiles: item.profiles
      }));

      console.log('📊 Company users fetched:', formattedUsers);
      setUsers(formattedUsers);
    } catch (err) {
      console.error('Error fetching company users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(`Error loading users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (email: string, role: UserRole, permissions?: UserPermissions): Promise<boolean> => {
    try {
      setError(null);
      
      console.log('🔧 Inviting user:', email);
      
      if (!companyId) {
        throw new Error('No company selected');
      }

      // First check if user exists in profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (profileError || !profileData) {
        throw new Error('User not found. They must sign up first.');
      }

      // Check if user is already in company
      const { data: existingUser } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', profileData.id)
        .single();

      if (existingUser) {
        throw new Error('User is already a member of this company');
      }

      // Add user to company
      const { error: insertError } = await supabase
        .from('company_users')
        .insert({
          company_id: companyId,
          user_id: profileData.id,
          role: role,
          permissions: permissions || getDefaultPermissions(role),
          active: true
        });

      if (insertError) throw insertError;

      console.log(`✅ User ${email} invited successfully`);
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error inviting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setError(`Error inviting user: ${errorMessage}`);
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole, permissions?: UserPermissions): Promise<boolean> => {
    try {
      setError(null);

      const updates: any = { role };
      if (permissions) {
        updates.permissions = permissions;
      }

      const { error } = await supabase
        .from('company_users')
        .update(updates)
        .eq('company_id', companyId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error updating user role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role';
      setError(`Error updating role: ${errorMessage}`);
      return false;
    }
  };

  const removeUser = async (userId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('company_users')
        .update({ active: false })
        .eq('company_id', companyId)
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error removing user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove user';
      setError(`Error removing user: ${errorMessage}`);
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [companyId]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    inviteUser,
    updateUserRole,
    removeUser,
  };
};
//Fix: Enhanced useCompanyUsers hook with proper JOIN
