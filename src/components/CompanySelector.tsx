import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Settings, Users, Plus } from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useLanguage } from '@/hooks/useLanguage';

interface CompanySelectorProps {
  onManageCompanies?: () => void;
  onCreateCompany?: () => void;
}

export default function CompanySelector({ onManageCompanies, onCreateCompany }: CompanySelectorProps) {
  const { selectedCompany, companies, userRole, switchCompany } = useCompany();
  const { t, isRTL } = useLanguage();

  if (!selectedCompany) {
    return (
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Building2 className="w-5 h-5 text-muted-foreground" />
        <span className="text-muted-foreground">{t.noCompanySelected || 'לא נבחרה חברה'}</span>
        {onCreateCompany && (
          <Button size="sm" onClick={onCreateCompany} className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Plus className="w-4 h-4" />
            {t.createCompany || 'צור חברה'}
          </Button>
        )}
      </div>
    );
  }

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

  return (
    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* בוחר חברה */}
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Building2 className="w-5 h-5 text-primary" />
        <Select value={selectedCompany.id} onValueChange={switchCompany}>
          <SelectTrigger className="w-[280px]">
            <SelectValue>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-1">
                  <div className="font-medium text-sm">{selectedCompany.name}</div>
                  {selectedCompany.business_name && (
                    <div className="text-xs text-muted-foreground">{selectedCompany.business_name}</div>
                  )}
                </div>
                {userRole && (
                  <Badge variant="secondary" className={`text-xs ${getRoleBadgeColor(userRole)}`}>
                    {getRoleText(userRole)}
                  </Badge>
                )}
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                <div className={`flex items-center gap-2 w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <div className="font-medium">{company.name}</div>
                    {company.business_name && (
                      <div className="text-xs text-muted-foreground">{company.business_name}</div>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* כפתורי פעולה */}
      <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {onCreateCompany && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onCreateCompany}
            className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Plus className="w-4 h-4" />
            {t.addCompany || 'הוסף חברה'}
          </Button>
        )}
        
        {onManageCompanies && (userRole === 'owner' || userRole === 'admin') && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onManageCompanies}
            className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <Settings className="w-4 h-4" />
            {t.manageCompany || 'נהל חברה'}
          </Button>
        )}
      </div>
    </div>
  );
}