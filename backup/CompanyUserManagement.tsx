import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Settings, UserMinus, Mail } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanyUsers } from '@/hooks/useCompanyUsers';
import { useLanguage } from '@/hooks/useLanguage';
import type { UserRole, UserPermissions } from '@/types/company';

export default function CompanyUserManagement() {
  const { selectedCompany, userRole } = useCompany();
  const { users, loading, error, inviteUser, updateUserRole, removeUser } = useCompanyUsers(selectedCompany?.id);
  const { t, isRTL } = useLanguage();

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">{t.noCompanySelected}</div>
      </div>
    );
  }

  if (userRole !== 'owner' && userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">אין לך הרשאה לנהל משתמשים</div>
      </div>
    );
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;

    const success = await inviteUser(inviteEmail, inviteRole);
    if (success) {
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await updateUserRole(userId, newRole);
  };

  const handleRemoveUser = async (userId: string) => {
    if (confirm('האם אתה בטוח שברצונך להסיר את המשתמש הזה?')) {
      await removeUser(userId);
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
      case 'owner': return t.owner;
      case 'admin': return t.admin;
      case 'user': return t.user;
      case 'viewer': return t.viewer;
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">טוען משתמשים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
          <p className="text-muted-foreground">{selectedCompany.name}</p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Plus className="w-4 h-4" />
              הזמן משתמש
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>הזמן משתמש חדש</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="example@company.com"
                />
              </div>
              <div>
                <Label htmlFor="role">תפקיד</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">משתמש</SelectItem>
                    <SelectItem value="admin">מנהל</SelectItem>
                    <SelectItem value="viewer">צופה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  ביטול
                </Button>
                <Button onClick={handleInviteUser}>
                  שלח הזמנה
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
          {error}
        </div>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Settings className="w-5 h-5" />
            משתמשי החברה
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              אין משתמשים בחברה זו
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>משתמש</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>תאריך הצטרפות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.user_id.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.user_id}</div>
                          <div className="text-sm text-muted-foreground">
                            <Mail className="w-3 h-3 inline mr-1" />
                            {user.user_id}
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
                              <SelectItem value="user">משתמש</SelectItem>
                              <SelectItem value="admin">מנהל</SelectItem>
                              <SelectItem value="viewer">צופה</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        
                        {user.role !== 'owner' && (userRole === 'owner' || userRole === 'admin') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveUser(user.user_id)}
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
          <CardTitle>פרטי החברה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם החברה</Label>
              <div className="text-sm text-muted-foreground">{selectedCompany.name}</div>
            </div>
            {selectedCompany.business_name && (
              <div>
                <Label>שם עסקי</Label>
                <div className="text-sm text-muted-foreground">{selectedCompany.business_name}</div>
              </div>
            )}
            {selectedCompany.tax_id && (
              <div>
                <Label>ח.פ / ע.מ</Label>
                <div className="text-sm text-muted-foreground">{selectedCompany.tax_id}</div>
              </div>
            )}
            <div>
              <Label>מטבע ברירת מחדל</Label>
              <div className="text-sm text-muted-foreground">{selectedCompany.default_currency}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}