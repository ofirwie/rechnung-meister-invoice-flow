import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
  error?: any;
}

export default function SimpleWhiteScreenDebug() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const updateResult = (name: string, status: TestResult['status'], message: string, data?: any, error?: any) => {
    setTestResults(prev => {
      const existing = prev.findIndex(r => r.name === name);
      const newResult = { name, status, message, data, error };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      }
      return [...prev, newResult];
    });
  };

  const testAuth = async () => {
    updateResult('Authentication', 'pending', 'Checking auth...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session?.user) throw new Error('No user session');
      
      updateResult('Authentication', 'success', 'Auth working', {
        userId: session.user.id,
        email: session.user.email
      });
    } catch (error: any) {
      updateResult('Authentication', 'error', `Auth failed: ${error.message}`, null, error);
    }
  };

  const testClientsQuery = async () => {
    updateResult('Clients Query', 'pending', 'Testing clients...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      updateResult('Clients Query', 'success', `Found ${data.length} clients`, {
        count: data.length,
        sample: data.slice(0, 2)
      });
    } catch (error: any) {
      updateResult('Clients Query', 'error', `Clients failed: ${error.message}`, null, error);
    }
  };

  const testInvoicesQuery = async () => {
    updateResult('Invoices Query', 'pending', 'Testing invoices...');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session');

      // Test the FIXED query with user filtering
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      updateResult('Invoices Query', 'success', `Found ${data.length} invoices (FIXED)`, {
        count: data.length,
        sample: data.slice(0, 2)
      });
    } catch (error: any) {
      updateResult('Invoices Query', 'error', `Invoices failed: ${error.message}`, null, error);
    }
  };

  const testServicesQuery = async () => {
    updateResult('Services Query', 'pending', 'Testing services...');
    try {
      // Get first company for services test
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No user session');

      // Get user's companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(1);

      if (companiesError) throw companiesError;
      if (!companies.length) throw new Error('No companies found');

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', companies[0].id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      updateResult('Services Query', 'success', `Found ${data.length} services`, {
        count: data.length,
        companyId: companies[0].id,
        sample: data.slice(0, 2)
      });
    } catch (error: any) {
      updateResult('Services Query', 'error', `Services failed: ${error.message}`, null, error);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    try {
      await testAuth();
      await testClientsQuery();
      await testInvoicesQuery();
      await testServicesQuery();
    } catch (error) {
      console.error('Test suite failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadge = (status: TestResult['status']) => {
    switch(status) {
      case 'pending': return <Badge variant="secondary">PENDING</Badge>;
      case 'success': return <Badge variant="default">SUCCESS</Badge>;
      case 'error': return <Badge variant="destructive">FAILED</Badge>;
      case 'warning': return <Badge variant="outline">WARNING</Badge>;
      default: return <Badge>UNKNOWN</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🚨 WHITE SCREEN SIMPLE DEBUG</CardTitle>
          <p className="text-sm text-gray-600">
            Testing database queries to identify white screen causes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? 'Running Tests...' : 'RUN DATABASE TESTS'}
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Back to App
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Test Results ({testResults.filter(r => r.status === 'success').length}/{testResults.length} passed)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{result.name}</h3>
                    {getBadge(result.status)}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">{result.message}</div>
                  
                  {result.data && (
                    <div className="bg-green-50 p-3 rounded text-xs">
                      <div className="font-medium text-green-800 mb-1">✅ Success:</div>
                      <pre className="text-green-700 overflow-auto max-h-32">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="bg-red-50 p-3 rounded text-xs">
                      <div className="font-medium text-red-800 mb-1">❌ Error:</div>
                      <pre className="text-red-700 overflow-auto max-h-32">
                        {result.error.message || JSON.stringify(result.error, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🎯 DIAGNOSIS GOAL</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              <div className="space-y-2 text-sm">
                <div><strong>This will test:</strong></div>
                <div>• Authentication (should pass)</div>
                <div>• Clients query with user_id filtering</div>
                <div>• Invoices query with FIXED user_id filtering</div>
                <div>• Services query with company_id filtering</div>
                <div><strong>If any of these fail, that's your white screen cause!</strong></div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
