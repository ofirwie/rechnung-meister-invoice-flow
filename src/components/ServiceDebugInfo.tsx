import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '../contexts/SimpleCompanyContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ServiceDebugInfo: React.FC = () => {
  const { selectedCompany, userRole, permissions } = useCompany();
  const [user, setUser] = useState<any>(null);
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    checkStatus();
  }, [selectedCompany]);

  const checkStatus = async () => {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    setUser(user);

    if (!user) {
      setDebugInfo({ error: 'Not logged in' });
      return;
    }

    // Check services table
    if (selectedCompany) {
      const { data: services, error: servicesError, count } = await supabase
        .from('services')
        .select('*', { count: 'exact' })
        .eq('company_id', selectedCompany.id);

      if (servicesError) {
        setDebugInfo(prev => ({ ...prev, servicesError: servicesError.message }));
      } else {
        setServicesCount(count || 0);
      }

      // Check if user has permission to create services
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('company_id', selectedCompany.id)
        .single();

      setDebugInfo(prev => ({
        ...prev,
        companyUser,
        canCreateServices: companyUser?.role && ['owner', 'admin', 'user'].includes(companyUser.role)
      }));
    }
  };

  return (
    <Card className="mt-4 border-orange-500">
      <CardHeader className="bg-orange-50">
        <CardTitle className="text-orange-700">🔍 Service Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <strong>User:</strong> {user ? user.email : 'Not logged in'}
        </div>
        <div>
          <strong>Selected Company:</strong> {selectedCompany ? `${selectedCompany.name} (ID: ${selectedCompany.id})` : 'None'}
        </div>
        <div>
          <strong>User Role:</strong> {userRole || 'N/A'}
        </div>
        <div>
          <strong>Services Count:</strong> {servicesCount}
        </div>
        <div>
          <strong>Can Create Services:</strong> {debugInfo.canCreateServices ? '✅ Yes' : '❌ No'}
        </div>
        {debugInfo.servicesError && (
          <div className="text-red-600">
            <strong>Services Error:</strong> {debugInfo.servicesError}
          </div>
        )}
        {debugInfo.error && (
          <div className="text-red-600">
            <strong>Error:</strong> {debugInfo.error}
          </div>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-blue-600">Full Debug Info (click to expand)</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify({ user, selectedCompany, userRole, permissions, debugInfo }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};
