import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyUser, UserRole, UserPermissions } from '@/types/company';

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

      // JOIN with profiles to get user details
      const { data, error } = await supabase
        .from('company_users')
        .select(`
          *,
          profiles!inner (
            id,
            email,
            display_name,
            is_active
          )
        `)
        .eq('company_id', companyId)
        .eq('active', true)
        .order('created_at');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Transform data to include profile info at top level
      const transformedUsers = (data || []).map((item: any) => ({
        id: item.id,
        company_id: item.company_id,
        user_id: item.user_id,
        role: item.role,
        permissions: item.permissions,
        active: item.active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Add profile data at top level for easier access
        user_email: item.profiles?.email || 'לא זמין',
        user_display_name: item.profiles?.display_name || null,
        user_is_active: item.profiles?.is_active || false,
        profiles: item.profiles
      }));

      console.log('Fetched company users:', transformedUsers);
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching company users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(`שגיאה בטעינת משתמשים: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (email: string, role: UserRole, permissions?: UserPermissions): Promise<boolean> => {
    try {
      setError(null);

      // Check if user exists in the system
      const { data: existingUser, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw userError;
      }

      if (!existingUser) {
        throw new Error('המשתמש לא נמצא במערכת. יש להזמין אותו להירשם תחילה.');
      }

      // Check if user is already a member of this company
      const { data: existingMember, error: memberError } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', existingUser.id)
        .eq('active', true)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        throw memberError;
      }

      if (existingMember) {
        throw new Error('המשתמש כבר חבר בחברה זו.');
      }

      const defaultPermissions: UserPermissions = {
        expenses: { create: true, read: true, update: true, delete: false },
        suppliers: { create: true, read: true, update: true, delete: false },
        categories: { create: false, read: true, update: false, delete: false },
        reports: { export: true, view_all: false }
      };

      const { error: insertError } = await supabase
        .from('company_users')
        .insert({
          company_id: companyId!,
          user_id: existingUser.id,
          role,
          permissions: permissions || defaultPermissions,
          active: true
        });

      if (insertError) throw insertError;

      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error inviting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite user';
      setError(`שגיאה בהזמנת משתמש: ${errorMessage}`);
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
      setError(`שגיאה בעדכון תפקיד: ${errorMessage}`);
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
      setError(`שגיאה בהסרת משתמש: ${errorMessage}`);
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
