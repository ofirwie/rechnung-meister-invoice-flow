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
          <div className="text-muted-foreground">אין לך הרשאה לנהל משתמשים</div>
        </div>
      </div>
    );
  }

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast.error('נא להזין כתובת אימייל');
      return;
    }

    setInviteLoading(true);
    try {
      const success = await inviteUser(inviteEmail, inviteRole);
      if (success) {
        setShowInviteDialog(false);
        setInviteEmail('');
        setInviteRole('user');
        toast.success('המשתמש הוזמן בהצלחה');
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
      toast.success('התפקיד עודכן בהצלחה');
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (confirm(`האם אתה בטוח שברצונך להסיר את ${userEmail} מהחברה?`)) {
      const success = await removeUser(userId);
      if (success) {
        toast.success('המשתמש הוסר בהצלחה');
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
      case 'owner': return t.owner || 'בעלים';
      case 'admin': return t.admin || 'מנהל';
      case 'user': return t.user || 'משתמש';
      case 'viewer': return t.viewer || 'צופה';
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
                  disabled={inviteLoading}
                />
              </div>
              <div>
                <Label htmlFor="role">תפקיד</Label>
                <Select 
                  value={inviteRole} 
                  onValueChange={(value) => setInviteRole(value as UserRole)}
                  disabled={inviteLoading}
                >
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                  disabled={inviteLoading}
                >
                  ביטול
                </Button>
                <Button 
                  onClick={handleInviteUser}
                  disabled={inviteLoading}
                >
                  {inviteLoading ? 'שולח...' : 'שלח הזמנה'}
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
            משתמשי החברה ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center p-8 space-y-2">
              <User className="w-12 h-12 text-muted-foreground mx-auto" />
              <div className="text-muted-foreground">אין משתמשים בחברה זו</div>
              <Button onClick={() => setShowInviteDialog(true)} variant="outline" size="sm">
                הזמן משתמש ראשון
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>משתמש</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תאריך הצטרפות</TableHead>
                  <TableHead>פעולות</TableHead>
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
                            {user.user_display_name || 'משתמש ללא שם'}
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
                        {user.user_is_active ? 'פעיל' : 'לא פעיל'}
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
//Fix: Enhanced CompanyUserManagement with proper user display
