import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyUser, UserRole, UserPermissions } from '@/types/company';

export const useCompanyUsers = (companyId?: string) => {
  const [users, setUsers] = useState<CompanyUser[]>([]);
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

      const { data, error } = await supabase
        .from('company_users')
        .select('*')
        .eq('company_id', companyId)
        .eq('active', true)
        .order('created_at');

      if (error) throw error;

      setUsers((data || []) as unknown as CompanyUser[]);
    } catch (err) {
      console.error('Error fetching company users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async (email: string, role: UserRole, permissions?: UserPermissions): Promise<boolean> => {
    try {
      setError(null);

      // בדיקה אם המשתמש קיים במערכת
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (!existingUser) {
        throw new Error('המשתמש לא נמצא במערכת. יש להזמין אותו להירשם תחילה.');
      }

      // בדיקה אם המשתמש כבר חבר בחברה
      const { data: existingMember } = await supabase
        .from('company_users')
        .select('id')
        .eq('company_id', companyId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        throw new Error('המשתמש כבר חבר בחברה זו.');
      }

      const defaultPermissions: UserPermissions = {
        expenses: { create: true, read: true, update: true, delete: false },
        suppliers: { create: true, read: true, update: true, delete: false },
        categories: { create: false, read: true, update: false, delete: false },
        reports: { export: true, view_all: false }
      };

      const { error } = await supabase
        .from('company_users')
        .insert({
          company_id: companyId!,
          user_id: existingUser.id,
          role,
          permissions: JSON.parse(JSON.stringify(permissions || defaultPermissions))
        });

      if (error) throw error;

      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Error inviting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to invite user');
      return false;
    }
  };

  const updateUserRole = async (userId: string, role: UserRole, permissions?: UserPermissions): Promise<boolean> => {
    try {
      setError(null);

      const updates: any = { role };
      if (permissions) {
        updates.permissions = JSON.parse(JSON.stringify(permissions));
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
      setError(err instanceof Error ? err.message : 'Failed to update user role');
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
      setError(err instanceof Error ? err.message : 'Failed to remove user');
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