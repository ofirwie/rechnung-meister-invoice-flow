import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LogEntry {
  step: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: any;
  timestamp: string;
}

export const DebugCompanies: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (step: string, status: 'pending' | 'success' | 'error', data?: any, error?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { step, status, data, error, timestamp }]);
  };

  const debugCompaniesFlow = async () => {
    setLogs([]);
    setIsRunning(true);

    try {
      // Step 1: Check auth status
      addLog('1. Getting current user from auth', 'pending');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addLog('1. Getting current user from auth', 'error', null, authError);
        return;
      }
      
      if (!user) {
        addLog('1. Getting current user from auth', 'error', null, 'No user logged in');
        return;
      }
      
      addLog('1. Getting current user from auth', 'success', {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at
      });

      // Step 2: Check if root admin
      addLog('2. Checking if user is root admin', 'pending');
      const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
      const isRootAdmin = rootAdminEmails.includes(user.email || '');
      addLog('2. Checking if user is root admin', 'success', { 
        userEmail: user.email, 
        isRootAdmin,
        rootAdminEmails 
      });

      // Step 3: Query companies table
      addLog('3. Querying companies table', 'pending');
      let companiesQuery = supabase.from('companies').select('*');
      
      if (!isRootAdmin) {
        companiesQuery = companiesQuery.eq('active', true);
        addLog('3.1. Adding active filter for non-root admin', 'success');
      } else {
        addLog('3.1. No active filter - root admin sees all', 'success');
      }
      
      const { data: allCompanies, error: companiesError } = await companiesQuery;
      
      if (companiesError) {
        addLog('3. Querying companies table', 'error', null, companiesError);
        return;
      }
      
      addLog('3. Querying companies table', 'success', {
        companiesCount: allCompanies?.length || 0,
        companies: allCompanies
      });

      // Step 4: Handle filtering logic
      if (isRootAdmin) {
        addLog('4. Root admin - showing all companies', 'success', {
          finalCompanies: allCompanies,
          count: allCompanies?.length || 0
        });
      } else {
        // Step 4a: Get user memberships
        addLog('4a. Getting user company memberships', 'pending');
        const { data: userMemberships, error: membershipsError } = await supabase
          .from('company_users')
          .select('company_id, role, active')
          .eq('user_id', user.id)
          .eq('active', true);

        if (membershipsError) {
          addLog('4a. Getting user company memberships', 'error', null, membershipsError);
          return;
        }

        addLog('4a. Getting user company memberships', 'success', {
          membershipsCount: userMemberships?.length || 0,
          memberships: userMemberships
        });

        // Step 4b: Filter companies by membership
        addLog('4b. Filtering companies by membership', 'pending');
        const userCompanyIds = userMemberships?.map(m => m.company_id) || [];
        const filteredCompanies = (allCompanies || []).filter(company => 
          userCompanyIds.includes(company.id)
        );

        addLog('4b. Filtering companies by membership', 'success', {
          userCompanyIds,
          filteredCompanies,
          finalCount: filteredCompanies.length
        });
      }

      // Step 5: Check profiles table
      addLog('5. Checking profiles table', 'pending');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        addLog('5. Checking profiles table', 'error', null, profileError);
      } else {
        addLog('5. Checking profiles table', 'success', profile);
      }

      // Step 6: Check useCompanies hook state
      addLog('6. Checking useCompanies hook', 'pending');
      // We'll simulate what the hook should return
      
      // Step 7: Test direct database queries
      addLog('7. Testing direct database access', 'pending');
      
      // Raw SQL equivalent test
      const { data: rawCompanies, error: rawError } = await supabase
        .rpc('get_user_companies', { user_email: user.email });
      
      if (rawError) {
        addLog('7. Testing direct database access', 'error', null, rawError);
      } else {
        addLog('7. Testing direct database access', 'success', rawCompanies);
      }

    } catch (error) {
      addLog('UNEXPECTED ERROR', 'error', null, error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusColor = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Companies Debug Screen
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              onClick={debugCompaniesFlow} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running Debug...' : 'Start Debug'}
            </Button>
            <Button 
              onClick={() => setLogs([])} 
              variant="outline"
              disabled={isRunning}
            >
              Clear Logs
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="border-l-4 border-gray-300 pl-4 py-2">
                <div className="flex items-center gap-2 font-medium">
                  <span>{getStatusIcon(log.status)}</span>
                  <span className={getStatusColor(log.status)}>
                    {log.step}
                  </span>
                  <span className="text-sm text-gray-500">
                    {log.timestamp}
                  </span>
                </div>
                
                {log.data && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    <strong>Data:</strong>
                    <pre className="mt-1 overflow-x-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                {log.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                    <strong>Error:</strong>
                    <pre className="mt-1 overflow-x-auto">
                      {JSON.stringify(log.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                Click "Start Debug" to begin tracing the companies loading process
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};