import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { useCompany } from '@/contexts/SimpleCompanyContext';

export default function ClientSelectionDiagnostic() {
  const [diagnosticData, setDiagnosticData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState(0);

  // Test company context
  let companyContext = null;
  let contextError = null;
  try {
    companyContext = useCompany();
  } catch (error) {
    contextError = error instanceof Error ? error.message : 'Unknown context error';
  }

  const addError = (error: string) => {
    setErrors(prev => [...prev, `[Step ${step}] ${error}`]);
  };

  const runDiagnostic = async () => {
    setLoading(true);
    setErrors([]);
    setStep(0);
    
    const data: any = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    try {
      // Step 1: Check authentication
      setStep(1);
      console.log('🔍 Step 1: Checking authentication...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      data.authentication = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        error: authError?.message
      };

      if (authError) {
        addError(`Authentication error: ${authError.message}`);
      }

      // Step 2: Check company context
      setStep(2);
      console.log('🔍 Step 2: Checking company context...');
      data.companyContext = {
        contextAvailable: !!companyContext,
        contextError: contextError,
        selectedCompany: companyContext?.selectedCompany ? {
          id: companyContext.selectedCompany.id,
          name: companyContext.selectedCompany.name,
        } : null,
        loading: companyContext?.loading,
        userRole: companyContext?.userRole,
        hasPermissions: !!companyContext?.permissions,
      };

      if (contextError) {
        addError(`Context error: ${contextError}`);
      }

      // Step 3: Test direct client query
      setStep(3);
      console.log('🔍 Step 3: Testing direct client query...');
      if (session?.user) {
        try {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

          data.clientQuery = {
            success: !clientError,
            error: clientError?.message,
            count: clientData?.length || 0,
            sampleClient: clientData?.[0] ? {
              id: clientData[0].id,
              company_name: clientData[0].company_name,
              created_at: clientData[0].created_at,
            } : null,
          };

          if (clientError) {
            addError(`Client query error: ${clientError.message}`);
          } else {
            // Convert database client format to Client type
            const formattedClients: Client[] = (clientData || []).map(client => ({
              ...client,
              createdAt: client.created_at,
              updatedAt: client.updated_at
            }));
            setClients(formattedClients);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown client query error';
          addError(`Client query exception: ${errorMsg}`);
          data.clientQuery = { success: false, error: errorMsg, count: 0 };
        }
      }

      // Step 4: Test client selection
      setStep(4);
      console.log('🔍 Step 4: Testing client selection...');
      if (clients.length > 0) {
        try {
          const testClient = clients[0];
          console.log('🔍 Attempting to select client:', testClient.company_name);
          
          // Simulate the client selection that causes white screen
          setSelectedClient(testClient);
          
          data.clientSelection = {
            success: true,
            selectedClientId: testClient.id,
            selectedClientName: testClient.company_name,
          };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown selection error';
          addError(`Client selection error: ${errorMsg}`);
          data.clientSelection = { success: false, error: errorMsg };
        }
      }

      // Step 5: Check for JavaScript errors
      setStep(5);
      console.log('🔍 Step 5: Checking for JavaScript errors...');
      data.browserState = {
        hasConsoleErrors: errors.length > 0,
        errorCount: errors.length,
        memoryUsage: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        } : 'Not available',
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown diagnostic error';
      addError(`Diagnostic error: ${errorMsg}`);
      console.error('❌ Diagnostic error:', error);
    }

    setDiagnosticData(data);
    setLoading(false);
    setStep(0);
  };

  const testClientSelection = (client: Client) => {
    try {
      console.log('🔍 Testing client selection:', client.company_name);
      setSelectedClient(client);
      
      // This is where the white screen might occur
      setTimeout(() => {
        console.log('✅ Client selection completed without crash');
      }, 100);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addError(`Client selection test failed: ${errorMsg}`);
      console.error('❌ Client selection test failed:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">🚨 CLIENT SELECTION DIAGNOSTIC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runDiagnostic} disabled={loading}>
              {loading ? `Running Step ${step}...` : 'Run Full Diagnostic'}
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>

          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription>
                <div className="font-bold text-red-800">Errors Detected:</div>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {errors.map((error, index) => (
                    <li key={index} className="text-red-700 text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Display Diagnostic Data */}
      {Object.keys(diagnosticData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Client List for Testing */}
      {clients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Client Selection ({clients.length} clients found)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{client.company_name}</div>
                    <div className="text-sm text-gray-500">{client.contact_name}</div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => testClientSelection(client)}
                    variant={selectedClient?.id === client.id ? "default" : "outline"}
                  >
                    {selectedClient?.id === client.id ? "Selected" : "Select"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Client Info */}
      {selectedClient && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">✅ Selected Client (No White Screen!)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div><strong>Company:</strong> {selectedClient.company_name}</div>
              <div><strong>Contact:</strong> {selectedClient.contact_name}</div>
              <div><strong>Email:</strong> {selectedClient.email}</div>
              <div><strong>City:</strong> {selectedClient.city}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
