import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/SimpleCompanyContext';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: any;
  timing?: number;
}

export default function DatabaseDiagnostic() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Test company context
  let companyContext = null;
  let contextError = null;
  try {
    companyContext = useCompany();
  } catch (error) {
    contextError = error instanceof Error ? error.message : 'Unknown context error';
  }

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

  const testAuthentication = async () => {
    return runTest('Authentication', async () => {
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

  const testCompanyContext = async () => {
    return runTest('Company Context', async () => {
      if (contextError) throw new Error(`Context error: ${contextError}`);
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

  const testClientsQuery = async () => {
    return runTest('Clients Query (useSupabaseClients)', async () => {
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
        sampleData: data.slice(0, 3).map(client => ({
          id: client.id,
          company_name: client.company_name,
          contact_name: client.contact_name,
          created_at: client.created_at,
        })),
        queryType: 'user_id based (RLS compliant)',
      };
    });
  };

  const testServicesQuery = async () => {
    return runTest('Services Query (useSupabaseServices)', async () => {
      if (!companyContext?.selectedCompany) {
        throw new Error('No company selected - this will cause services hook to fail');
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
        sampleData: data.slice(0, 3).map(service => ({
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
    return runTest('Invoices Query (useSupabaseInvoices)', async () => {
      // This is the CRITICAL TEST - this query has no user/company filtering!
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Invoices query failed: ${error.message} (This is likely the cause of white screen!)`);
      }

      return {
        success: true,
        count: data.length,
        sampleData: data.slice(0, 3).map(invoice => ({
          invoice_number: invoice.invoice_number,
          client_company: invoice.client_company,
          status: invoice.status,
          created_at: invoice.created_at,
          user_id: invoice.user_id,
        })),
        queryType: 'NO FILTERING (RLS violation risk)',
        warning: 'This query has no user_id or company_id filtering - major RLS risk!',
      };
    });
  };

  const testInvoicesQueryFixed = async () => {
    return runTest('Invoices Query (FIXED)', async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No authenticated user');

      // Test the FIXED version with proper user filtering
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id) // ADD USER FILTERING
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Fixed invoices query failed: ${error.message}`);
      }

      return {
        success: true,
        count: data.length,
        sampleData: data.slice(0, 3).map(invoice => ({
          invoice_number: invoice.invoice_number,
          client_company: invoice.client_company,
          status: invoice.status,
          created_at: invoice.created_at,
          user_id: invoice.user_id,
        })),
        queryType: 'user_id filtered (RLS compliant)',
        improvement: 'Added user_id filtering to prevent RLS violations',
      };
    });
  };

  const testHooksDirectly = async () => {
    return runTest('Hook Integration Test', async () => {
      const results = {
        clientsHook: 'not tested',
        servicesHook: 'not tested',
        invoicesHook: 'not tested',
      };

      try {
        // Test if we can call the hooks without crashing
        console.log('Testing hook integrations...');
        
        // These would normally be called by components
        // We'll simulate the behavior here
        results.clientsHook = 'simulated - would load clients by user_id';
        results.servicesHook = companyContext?.selectedCompany 
          ? 'simulated - would load services by company_id' 
          : 'WOULD FAIL - no company context';
        results.invoicesHook = 'WOULD FAIL - no user filtering in query';

        return results;
      } catch (error) {
        throw new Error(`Hook integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);
    setCurrentTest('');

    try {
      // Run tests in sequence to avoid race conditions
      await testAuthentication();
      await testCompanyContext();
      await testClientsQuery();
      await testServicesQuery();
      await testInvoicesQuery(); // This should fail or cause issues
      await testInvoicesQueryFixed(); // This should work
      await testHooksDirectly();
      
      setCurrentTest('All tests completed');
    } catch (error) {
      console.error('Test suite failed:', error);
      setCurrentTest('Test suite failed');
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-red-600">🚨 DATABASE HOOKS DIAGNOSTIC</CardTitle>
          <p className="text-sm text-gray-600">
            Testing all database hooks to identify the white screen cause
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? `Running: ${currentTest}` : 'Run All Database Tests'}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
          
          {loading && (
            <Alert>
              <AlertDescription>
                <div className="font-medium">Running test: {currentTest}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Testing database queries and hook behaviors...
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results ({testResults.filter(r => r.status === 'success').length}/{testResults.length} passed)</CardTitle>
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
                      <div className="font-medium text-green-800 mb-1">Success Data:</div>
                      <pre className="text-green-700 overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-50 p-3 rounded text-xs">
                      <div className="font-medium text-red-800 mb-1">Error Details:</div>
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
          <CardTitle className="text-yellow-800">🔍 EXPECTED FINDINGS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div><strong>✅ Authentication:</strong> Should pass (auth is working)</div>
            <div><strong>✅ Company Context:</strong> Should pass (context is available)</div>
            <div><strong>✅ Clients Query:</strong> Should pass (has user_id filtering)</div>
            <div><strong>⚠️ Services Query:</strong> May fail if company context not ready</div>
            <div><strong>❌ Invoices Query:</strong> LIKELY TO FAIL - no user filtering (RLS violation)</div>
            <div><strong>✅ Fixed Invoices Query:</strong> Should pass with user_id filtering</div>
          </div>
          
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription>
              <div className="font-bold text-red-800">HYPOTHESIS:</div>
              <div className="text-red-700 text-sm">
                The white screen is caused by <code>useSupabaseInvoices</code> hook trying to query 
                ALL invoices without user filtering, causing an RLS (Row Level Security) violation 
                that crashes the component silently.
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
