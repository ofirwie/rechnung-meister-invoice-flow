import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, Home, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleDebug } from './SimpleDebug';

interface LogEntry {
  step: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: any;
  timestamp: string;
}

export const DebugScreen: React.FC = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [loopDetection, setLoopDetection] = useState({
    calculateTotalsCount: 0,
    lastDetectedAt: '',
    isLooping: false
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunningDebug, setIsRunningDebug] = useState(false);

  // Track renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);

  // Monitor for infinite loops by checking global counters
  useEffect(() => {
    const checkForLoops = () => {
      // Check if there's a global calcCount from the InvoiceForm
      const globalCalcCount = (window as any).calcCount || 0;
      if (globalCalcCount > loopDetection.calculateTotalsCount) {
        setLoopDetection(prev => ({
          calculateTotalsCount: globalCalcCount,
          lastDetectedAt: new Date().toISOString(),
          isLooping: globalCalcCount > 10
        }));
      }
    };

    const interval = setInterval(checkForLoops, 1000);
    return () => clearInterval(interval);
  }, [loopDetection.calculateTotalsCount]);

  const addLog = (step: string, status: 'pending' | 'success' | 'error', data?: any, error?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { step, status, data, error, timestamp }]);
  };

  const debugCompaniesFlow = async () => {
    setLogs([]);
    setIsRunningDebug(true);

    try {
      // Step 1: Check auth status
      addLog('1. Getting current user from auth', 'pending');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addLog('1. Getting current user from auth', 'error', null, authError);
        // Continue anyway to see what's happening
      }
      
      if (!user && !authError) {
        addLog('1. Getting current user from auth', 'error', null, 'No user logged in');
        return;
      }
      
      if (user) {
        addLog('1. Getting current user from auth', 'success', {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at
        });
      }

      // Step 1.5: Check session
      addLog('1.5. Checking session', 'pending');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addLog('1.5. Checking session', 'error', null, sessionError);
      } else {
        addLog('1.5. Checking session', 'success', {
          hasSession: !!session,
          sessionUser: session?.user?.email,
          accessToken: session?.access_token ? 'Present' : 'Missing'
        });
      }

      // Step 2: Check if root admin
      addLog('2. Checking if user is root admin', 'pending');
      const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
      const currentUser = user || session?.user;
      const isRootAdmin = rootAdminEmails.includes(currentUser?.email || '');
      addLog('2. Checking if user is root admin', 'success', { 
        userEmail: currentUser?.email, 
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
      } else {
        addLog('3. Querying companies table', 'success', {
          companiesCount: allCompanies?.length || 0,
          companies: allCompanies
        });
      }

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
          .eq('user_id', currentUser?.id)
          .eq('active', true);

        if (membershipsError) {
          addLog('4a. Getting user company memberships', 'error', null, membershipsError);
        } else {
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
      }

      // Step 5: Check profiles table
      addLog('5. Checking profiles table', 'pending');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser?.id)
        .single();

      if (profileError) {
        addLog('5. Checking profiles table', 'error', null, profileError);
      } else {
        addLog('5. Checking profiles table', 'success', profile);
      }

    } catch (error) {
      addLog('UNEXPECTED ERROR', 'error', null, error);
    } finally {
      setIsRunningDebug(false);
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
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">🛠️ Debug Screen</h1>
          <p className="text-muted-foreground">System information and loop detection</p>
        </div>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          <Home className="w-4 h-4 mr-2" />
          Back to Main
        </Button>
      </div>

      <div className="space-y-4">
        {/* Loop Detection Alert */}
        {loopDetection.isLooping && (
          <Alert className="border-red-500 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>🚨 INFINITE LOOP DETECTED!</strong> calculateTotals has been called {loopDetection.calculateTotalsCount} times. 
              Last detected at: {new Date(loopDetection.lastDetectedAt).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        <Card className={loopDetection.isLooping ? "border-red-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Loop Detection Status
              {loopDetection.isLooping && <Badge variant="destructive">LOOPING</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>calculateTotals Calls:</span>
                <Badge variant={loopDetection.calculateTotalsCount > 10 ? "destructive" : "secondary"}>
                  {loopDetection.calculateTotalsCount}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={loopDetection.isLooping ? "destructive" : "default"}>
                  {loopDetection.isLooping ? "INFINITE LOOP" : "NORMAL"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Component Renders:</span>
                <Badge variant="secondary">{renderCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <Badge>{import.meta.env.MODE}</Badge>
              </div>
            </div>
            
            {loopDetection.lastDetectedAt && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm"><strong>Last Update:</strong> {new Date(loopDetection.lastDetectedAt).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Real-time Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between">
                <span>Current Time:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Global calcCount:</span>
                <span className="font-mono text-2xl font-bold text-red-600">{(window as any).calcCount || 0}</span>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded">
                <p className="text-sm">
                  <strong>Note:</strong> This debug screen monitors the infinite loop issue in real-time. 
                  If the calculateTotals count keeps increasing rapidly, there's an infinite loop in the InvoiceForm component.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Companies Debug
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Button 
                onClick={debugCompaniesFlow} 
                disabled={isRunningDebug}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunningDebug ? 'Running Debug...' : 'Debug Companies Loading'}
              </Button>
              <Button 
                onClick={() => setLogs([])} 
                variant="outline"
                disabled={isRunningDebug}
              >
                Clear Companies Logs
              </Button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
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
                      <pre className="mt-1 overflow-x-auto text-xs">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {log.error && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                      <strong>Error:</strong>
                      <pre className="mt-1 overflow-x-auto text-xs">
                        {JSON.stringify(log.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  Click "Debug Companies Loading" to trace the companies loading process step by step
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => window.location.reload()} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
            <Button onClick={() => localStorage.clear()} size="sm" variant="outline">
              Clear Local Storage
            </Button>
            <Button onClick={() => window.location.href = '/'} size="sm" variant="default">
              <Home className="w-4 h-4 mr-2" />
              Back to Main
            </Button>
          </CardContent>
        </Card>

        {/* Simple Debug Section */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Simple Debug (Fallback)</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleDebug />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};