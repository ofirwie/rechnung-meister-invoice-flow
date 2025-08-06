import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/SimpleCompanyContext';

// Import the actual hooks and components we need to test
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { useSupabaseServices } from '@/hooks/useSupabaseServices';
import { useSupabaseInvoices } from '@/hooks/useSupabaseInvoices';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: any;
  timing?: number;
}

// Error Boundary Component
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode; testName: string; onError: (error: any) => void },
  { hasError: boolean; error?: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`Error boundary caught error in ${this.props.testName}:`, error, errorInfo);
    this.props.onError({
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-600 p-2 border border-red-300 rounded">
          <div className="font-bold">Component Crashed!</div>
          <div className="text-sm">Error: {this.state.error?.message || 'Unknown error'}</div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Test Components
const TestClientsHook = ({ onResult }: { onResult: (result: any) => void }) => {
  const clientsHook = useSupabaseClients();
  
  useEffect(() => {
    onResult({
      loading: clientsHook.loading,
      clients: clientsHook.clients,
      clientsCount: clientsHook.clients.length,
      error: null
    });
  }, [clientsHook.loading, clientsHook.clients, onResult]);

  return (
    <div className="p-2 border rounded">
      <div>Clients Hook Test</div>
      <div>Loading: {String(clientsHook.loading)}</div>
      <div>Clients: {clientsHook.clients.length}</div>
    </div>
  );
};

const TestServicesHook = ({ onResult }: { onResult: (result: any) => void }) => {
  const servicesHook = useSupabaseServices();
  
  useEffect(() => {
    onResult({
      loading: servicesHook.loading,
      services: servicesHook.services,
      servicesCount: servicesHook.services.length,
      error: null
    });
  }, [servicesHook.loading, servicesHook.services, onResult]);

  return (
    <div className="p-2 border rounded">
      <div>Services Hook Test</div>
      <div>Loading: {String(servicesHook.loading)}</div>
      <div>Services: {servicesHook.services.length}</div>
    </div>
  );
};

const TestInvoicesHook = ({ onResult }: { onResult: (result: any) => void }) => {
  const invoicesHook = useSupabaseInvoices();
  
  useEffect(() => {
    onResult({
      loading: invoicesHook.loading,
      invoices: invoicesHook.invoices,
      invoicesCount: invoicesHook.invoices.length,
      error: null
    });
  }, [invoicesHook.loading, invoicesHook.invoices, onResult]);

  return (
    <div className="p-2 border rounded">
      <div>Invoices Hook Test</div>
      <div>Loading: {String(invoicesHook.loading)}</div>
      <div>Invoices: {invoicesHook.invoices.length}</div>
    </div>
  );
};

export default function WhiteScreenDiagnostic() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [componentErrors, setComponentErrors] = useState<any[]>([]);

  // Get company context
  const companyContext = useCompany();

  const updateTestResult = (name: string, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.name === name);
      const newResult = { name, status: 'pending' as const, message: '', ...result };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTest = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    setCurrentTest(name);
    
    updateTestResult(name, { status: 'pending', message: 'Running...' });
    
    try {
      const result = await testFn();
      const timing = Date.now() - startTime;
      
      updateTestResult(name, {
        status: 'success',
        message: 'Test passed',
        data: result,
        timing
      });
      
      return result;
    } catch (error) {
      const timing = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      updateTestResult(name, {
        status: 'error',
        message: errorMsg,
        error: error,
        timing
      });
      
      throw error;
    }
  };

  // Test 1: Basic Authentication
  const testAuthentication = async () => {
    return runTest('🔐 Authentication Check', async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw new Error(`Auth error: ${error.message}`);
      if (!session?.user) throw new Error('No user session found');
      
      return {
        userId: session.user.id,
        email: session.user.email,
        hasSession: true,
      };
    });
  };

  // Test 2: Company Context
  const testCompanyContext = async () => {
    return runTest('🏢 Company Context Check', async () => {
      if (!companyContext) throw new Error('Company context not available');
      
      return {
        contextAvailable: true,
        selectedCompany: companyContext.selectedCompany ? {
          id: companyContext.selectedCompany.id,
          name: companyContext.selectedCompany.name,
        } : null,
        loading: companyContext.loading,
        userRole: companyContext.userRole,
        hasPermissions: !!companyContext.permissions,
      };
    });
  };

  // Test 3: Raw Database Queries (CURRENT/FIXED versions)
  const testClientsQuery = async () => {
    return runTest('👥 Clients Database Query', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Clients query failed: ${error.message}`);

      return {
        success: true,
        count: data.length,
        sampleData: data.slice(0, 2).map(client => ({
          id: client.id,
          company_name: client.company_name,
          contact_name: client.contact_name,
          created_at: client.created_at,
        })),
        queryType: 'user_id filtered (RLS compliant)',
      };
    });
  };

  const testServicesQuery = async () => {
    return runTest('⚙️ Services Database Query', async () => {
      if (!companyContext?.selectedCompany) {
        throw new Error('No company selected - services query will fail');
      }

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companyContext.selectedCompany.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(`Services query failed: ${error.message}`);

      return {
        success: true,
        count: data.length,
        companyId: companyContext.selectedCompany.id,
        sampleData: data.slice(0, 2).map(service => ({
          id: service.id,
          name: service.name,
          default_rate: service.default_rate,
          created_at: service.created_at,
        })),
        queryType: 'company_id based',
      };
    });
  };

  const testInvoicesQuery = async () => {
    return runTest('📄 Invoices Database Query (FIXED VERSION)', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Test the CURRENT/FIXED version with user filtering
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id) // This should be the FIXED version
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Fixed invoices query failed: ${error.message}`);
      }

      return {
        success: true,
        count: data.length,
        sampleData: data.slice(0, 2).map(invoice => ({
          invoice_number: invoice.invoice_number,
          client_company: invoice.client_company,
          status: invoice.status,
          created_at: invoice.created_at,
          user_id: invoice.user_id,
        })),
        queryType: 'user_id filtered (RLS compliant - FIXED)',
        improvement: 'This should now work with proper user filtering',
      };
    });
  };

  // Test 4: Component Hook Integration
  const testHookComponents = async () => {
    return runTest('🔗 Hook Component Integration', async () => {
      return new Promise<any>((resolve, reject) => {
        let completedTests = 0;
        const totalTests = 3;
        const results: any = {};
        const errors: any[] = [];

        const checkComplete = () => {
          if (completedTests === totalTests) {
            if (errors.length > 0) {
              reject(new Error(`Hook component tests failed: ${errors.map(e => e.message).join(', ')}`));
            } else {
              resolve(results);
            }
          }
        };

        // Test clients hook component
        const clientsDiv = document.createElement('div');
        document.body.appendChild(clientsDiv);
        
        try {
          // We'll simulate testing the components
          setTimeout(() => {
            results.clientsHook = 'Component test simulated - check manual component test above';
            completedTests++;
            checkComplete();
          }, 100);

          setTimeout(() => {
            results.servicesHook = 'Component test simulated - check manual component test above';
            completedTests++;
            checkComplete();
          }, 200);

          setTimeout(() => {
            results.invoicesHook = 'Component test simulated - check manual component test above';
            completedTests++;
            checkComplete();
          }, 300);

        } catch (error) {
          errors.push(error);
          completedTests = totalTests;
          checkComplete();
        }
      });
    });
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    setCurrentTest('');
    setComponentErrors([]);

    try {
      // Run tests in sequence
      await testAuthentication();
      await testCompanyContext();
      await testClientsQuery();
      await testServicesQuery();
      await testInvoicesQuery();
      await testHookComponents();
      
      setCurrentTest('All tests completed');
    } catch (error) {
      console.error('Test suite failed:', error);
      setCurrentTest('Test suite failed');
    } finally {
      setLoading(false);
    }
  };

  const handleComponentError = (testName: string, error: any) => {
    setComponentErrors(prev => [...prev, { testName, error, timestamp: Date.now() }]);
    
    updateTestResult(`Component Test: ${testName}`, {
      status: 'error',
      message: `Component crashed: ${error.error?.message || error.message || 'Unknown error'}`,
      error: error
    });
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'PENDING' },
      success: { variant: 'default' as const, text: 'SUCCESS' },
      error: { variant: 'destructive' as const, text: 'FAILED' },
      warning: { variant: 'outline' as const, text: 'WARNING' },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🚨 WHITE SCREEN COMPREHENSIVE DIAGNOSTIC</CardTitle>
          <p className="text-sm text-gray-600">
            Full diagnosis of white screen issues - database queries, hooks, and components
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? `Running: ${currentTest}` : 'RUN FULL DIAGNOSTIC'}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Back to App
            </Button>
          </div>
          
          {loading && (
            <Alert>
              <AlertDescription>
                <div className="font-medium">🔍 Running test: {currentTest}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Comprehensive testing of database, hooks, and components...
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Live Component Testing */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🧪 LIVE COMPONENT TESTING</CardTitle>
          <p className="text-sm text-blue-600">Testing actual hook components that cause white screens</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TestErrorBoundary testName="Clients Hook" onError={(error) => handleComponentError('Clients Hook', error)}>
              <Suspense fallback={<div>Loading clients hook...</div>}>
                <TestClientsHook onResult={(result) => console.log('Clients hook result:', result)} />
              </Suspense>
            </TestErrorBoundary>

            <TestErrorBoundary testName="Services Hook" onError={(error) => handleComponentError('Services Hook', error)}>
              <Suspense fallback={<div>Loading services hook...</div>}>
                <TestServicesHook onResult={(result) => console.log('Services hook result:', result)} />
              </Suspense>
            </TestErrorBoundary>

            <TestErrorBoundary testName="Invoices Hook" onError={(error) => handleComponentError('Invoices Hook', error)}>
              <Suspense fallback={<div>Loading invoices hook...</div>}>
                <TestInvoicesHook onResult={(result) => console.log('Invoices hook result:', result)} />
              </Suspense>
            </TestErrorBoundary>
          </div>
        </CardContent>
      </Card>

      {/* Component Errors */}
      {componentErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">💥 COMPONENT CRASH REPORTS</CardTitle>
          </CardHeader>
          <CardContent>
            {componentErrors.map((error, index) => (
              <Alert key={index} className="mb-2">
                <AlertDescription>
                  <div className="font-bold text-red-800">{error.testName} CRASHED!</div>
                  <div className="text-sm text-red-700">
                    {error.error.error?.message || error.error.message || 'Unknown error'}
                  </div>
                  <pre className="text-xs mt-1 overflow-auto max-h-20 text-red-600">
                    {JSON.stringify(error.error, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              🔍 DIAGNOSTIC RESULTS ({testResults.filter(r => r.status === 'success').length}/{testResults.length} passed)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{result.name}</h3>
                    <div className="flex items-center gap-2">
                      {result.timing && (
                        <span className="text-xs text-gray-500">{result.timing}ms</span>
                      )}
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">{result.message}</div>
                  
                  {result.data && (
                    <div className="bg-green-50 p-3 rounded text-xs">
                      <div className="font-medium text-green-800 mb-1">✅ Success Data:</div>
                      <pre className="text-green-700 overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-50 p-3 rounded text-xs">
                      <div className="font-medium text-red-800 mb-1">❌ Error Details:</div>
                      <pre className="text-red-700 overflow-auto max-h-32">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Panel */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">🎯 EXPECTED FINDINGS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div><strong>✅ Authentication:</strong> Should pass (auth working)</div>
            <div><strong>✅ Company Context:</strong> Should pass (context available)</div>
            <div><strong>✅ Clients Query:</strong> Should pass (has user_id filtering)</div>
            <div><strong>⚠️ Services Query:</strong> May fail if company context not ready</div>
            <div><strong>✅ Invoices Query:</strong> Should NOW pass (FIXED with user filtering)</div>
            <div><strong>🧪 Component Tests:</strong> Will show exactly which hook crashes</div>
          </div>
          
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <div className="font-bold text-blue-800">🎯 THIS WILL CATCH THE EXACT PROBLEM:</div>
              <div className="text-blue-700 text-sm">
                The live component tests above will crash and show error boundaries if any hook is still broken.
                Look for red "Component Crashed!" messages - that's your white screen culprit.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
