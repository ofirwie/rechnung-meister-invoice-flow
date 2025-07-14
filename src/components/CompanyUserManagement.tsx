import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings, UserMinus, Mail, User, AlertCircle } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';
import type { UserRole } from '@/types/company';

export default function CompanyUserManagement() {
  const { selectedCompany, userRole } = useCompany();
  const { users, loading, error, inviteUser, updateUserRole, removeUser } = useCompanyUsers(selectedCompany?.id);
  const { t, isRTL } = useLanguage();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');
  const [inviteLoading, setInviteLoading] = useState(false);

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <div className="text-muted-foreground">{t.noCompanySelected}</div>
        </div>
      </div>
    );
  }

  if (userRole !== 'owner' && userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <div className="text-muted-foreground">You don't have permission to manage users</div>
        </div>
      </div>
    );
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setInviteLoading(true);
    try {
      const success = await inviteUser(inviteEmail, inviteRole);
      if (success) {
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRole('user');
        toast.success('User invited successfully');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const success = await updateUserRole(userId, newRole);
    if (success) {
      toast.success('Role updated successfully');
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to remove ${userEmail} from the company?`)) {
      const success = await removeUser(userId);
      if (success) {
        toast.success('User removed successfully');
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'owner': return t.owner || 'Owner';
      case 'admin': return t.admin || 'Admin';
      case 'user': return t.user || 'User';
      case 'viewer': return t.viewer || 'Viewer';
      default: return role;
    }
  };

  const getInitials = (email: string, displayName?: string | null) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">{selectedCompany.name}</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Plus className="w-4 h-4" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="example@company.com"
                  disabled={inviteLoading}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={inviteRole} 
                  onValueChange={(value) => setInviteRole(value as UserRole)}
                  disabled={inviteLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleInviteUser}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Settings className="w-5 h-5" />
            Company Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <User className="w-12 h-12 text-muted-foreground mx-auto" />
              <div className="text-muted-foreground">No users in this company</div>
              <Button onClick={() => setShowInviteDialog(true)} variant="outline" size="sm">
                Invite First User
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {getInitials(user.user_email, user.user_display_name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {user.user_display_name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.user_email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {getRoleText(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.user_is_active ? "default" : "secondary"}>
                        {user.user_is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('he-IL')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.role !== 'owner' && userRole === 'owner' && (
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => handleRoleChange(user.user_id, newRole as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        {user.role !== 'owner' && (userRole === 'owner' || userRole === 'admin') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user.user_id, user.user_email)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <div className="text-sm text-muted-foreground">{selectedCompany.name}</div>
            </div>
            {selectedCompany.business_name && (
              <div>
                <Label>Business Name</Label>
                <div className="text-sm text-muted-foreground">{selectedCompany.business_name}</div>
              </div>
            )}
            {selectedCompany.tax_id && (
              <div>
                <Label>Tax ID / Company ID</Label>
                <div className="text-sm text-muted-foreground">{selectedCompany.tax_id}</div>
              </div>
            )}
            <div>
              <Label>Default Currency</Label>
              <div className="text-sm text-muted-foreground">{selectedCompany.default_currency}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
//Fix: Enhanced CompanyUserManagement with proper user display
