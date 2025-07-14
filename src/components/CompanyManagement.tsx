import React, { useState } from 'react';
import { Plus, Settings, Users, Building, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserManagement } from '@/hooks/useUserManagement';
import CompanyUserManagement from './CompanyUserManagement';
import { CompanyForm } from './CompanyForm';
import { formatCurrency } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';

export const CompanyManagement: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { selectedCompany, companies, switchCompany } = useCompany();
  const { canCreateCompanies } = useUserManagement();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Get current user email
  React.useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
    };
    getUserEmail();
  }, []);

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t.createCompany}</h1>
          <Button variant="outline" onClick={() => setShowCreateForm(false)}>
            {t.cancel}
          </Button>
        </div>
        <CompanyForm onSuccess={() => setShowCreateForm(false)} />
      </div>
    );
  }

  if (showUserManagement && selectedCompany) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{t.companyUsers}</h1>
          <Button variant="outline" onClick={() => setShowUserManagement(false)}>
            {t.cancel}
          </Button>
        </div>
        <CompanyUserManagement />
      </div>
    );
  }

  if (editingCompany) {
    const company = companies.find(c => c.id === editingCompany);
    if (company) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{t.companySettings}</h1>
            <Button variant="outline" onClick={() => setEditingCompany(null)}>
              {t.cancel}
            </Button>
          </div>
          <CompanyForm 
            company={company} 
            onSuccess={() => setEditingCompany(null)} 
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t.companyManagement}</h1>
        <div className={`flex items-center gap-2 ${isRTL ? 'space-x-reverse' : ''}`}>
          {selectedCompany && (
            <Button
              variant="outline"
              onClick={() => setShowUserManagement(true)}
              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Users className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.companyUsers}
            </Button>
          )}
          {canCreateCompanies() && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.addCompany}
            </Button>
          )}
        </div>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies found</h3>
            <p className="text-muted-foreground mb-4">
              {canCreateCompanies() 
                ? "Create your first company to start working with the system" 
                : "You don't have permission to create new companies. Contact the system admin."}
            </p>
            {canCreateCompanies() ? (
              <Button onClick={() => setShowCreateForm(true)} size="lg">
                <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                Create First Company
              </Button>
            ) : (
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card 
              key={company.id} 
              className={`cursor-pointer transition-all ${
                selectedCompany?.id === company.id 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => switchCompany(company.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{company.name}</CardTitle>
                    {company.business_name && (
                      <p className="text-sm text-muted-foreground">
                        {company.business_name}
                      </p>
                    )}
                  </div>
                  {selectedCompany?.id === company.id && (
                    <Badge className="bg-primary">
                      {t.active}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {company.tax_id && (
                    <div>
                      <span className="text-muted-foreground">{t.taxId}:</span>
                      <br />
                      <span className="font-mono">{company.tax_id}</span>
                    </div>
                  )}
                  {company.default_currency && (
                    <div>
                      <span className="text-muted-foreground">{t.currency}:</span>
                      <br />
                      <span>{company.default_currency}</span>
                    </div>
                  )}
                </div>

                {company.address && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t.address}:</span>
                    <br />
                    <span>{company.address}</span>
                  </div>
                )}

                <div className={`flex gap-2 pt-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCompany(company.id);
                    }}
                    className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <Edit className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t.edit}
                  </Button>
                  
                  {selectedCompany?.id === company.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserManagement(true);
                      }}
                      className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                    >
                      <Users className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.users}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};