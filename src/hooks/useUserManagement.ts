import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  last_login: string | null;
  role?: 'rootadmin' | 'admin' | 'manager' | 'user';
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const { toast } = useToast();

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const usersWithRoles = profiles?.map((profile: any) => ({
        ...profile,
        role: profile.user_roles?.[0]?.role || 'user'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת רשימת המשתמשים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserRole = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_role');
      if (error) throw error;
      setCurrentUserRole(data);
      return data;
    } catch (error) {
      console.error('Error getting current user role:', error);
      return null;
    }
  };

  const assignRole = async (userId: string, role: 'rootadmin' | 'admin' | 'manager' | 'user') => {
    try {
      // First, remove existing roles for this user
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Then assign the new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role
        });

      if (error) throw error;

      toast({
        title: "תפקיד עודכן",
        description: "התפקיד של המשתמש עודכן בהצלחה",
      });

      // Reload users to show updated roles
      loadUsers();
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהקצאת התפקיד",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "סטטוס עודכן",
        description: `המשתמש ${!isActive ? 'הופעל' : 'הושבת'} בהצלחה`,
      });

      // Reload users
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון סטטוס המשתמש",
        variant: "destructive",
      });
    }
  };

  const isRootAdmin = () => {
    return currentUserRole === 'rootadmin';
  };

  const isAdmin = () => {
    return currentUserRole === 'admin' || currentUserRole === 'rootadmin';
  };

  const canManageUsers = () => {
    return ['rootadmin', 'admin', 'manager'].includes(currentUserRole || '');
  };

  const canCreateCompanies = () => {
    return currentUserRole === 'rootadmin';
  };

  const canAssignRole = (targetRole: string) => {
    if (currentUserRole === 'rootadmin') return true;
    if (currentUserRole === 'admin' && ['manager', 'user'].includes(targetRole)) return true;
    return false;
  };

  useEffect(() => {
    getCurrentUserRole();
  }, []);

  return {
    users,
    loading,
    currentUserRole,
    loadUsers,
    assignRole,
    toggleUserStatus,
    isRootAdmin,
    isAdmin,
    canManageUsers,
    canCreateCompanies,
    canAssignRole
  };
};