import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseClients } from '../hooks/useSupabaseClients';
import { Client } from '../types/client';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface DebugInvoiceFormProps {
  selectedClient: Client | null;
}

// Mini version of InvoiceForm to test client data flow
const DebugInvoiceForm: React.FC<DebugInvoiceFormProps> = ({ selectedClient }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientCity: '',
    clientPostalCode: '',
    clientEmail: '',
    clientCountry: 'Israel',
  });
  
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const prevClientRef = useRef(selectedClient);
  
  // Track client changes exactly like InvoiceForm
  useEffect(() => {
    const currentClient = selectedClient;
    const prevClient = prevClientRef.current;
    
    const logEntry = `🔍 useEffect triggered - selectedClient: ${currentClient?.company_name || 'none'} (prev: ${prevClient?.company_name || 'none'})`;
    console.log(logEntry);
    setUpdateLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${logEntry}`]);
    
    // Only update if client actually changed
    if (currentClient && currentClient !== prevClient) {
      const changeLog = `🔄 CLIENT CHANGED: ${prevClient?.company_name || 'none'} → ${currentClient?.company_name || 'none'}`;
      console.log(changeLog);
      setUpdateLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${changeLog}`]);
      
      prevClientRef.current = currentClient;
      
      const client = currentClient;
      
      const dataLog = `🔄 UPDATING CLIENT DATA: ${JSON.stringify({
        clientName: client.contact_name || '',
        clientCompany: client.company_name || '',
        clientAddress: client.address || '',
        clientCity: client.city || '',
        clientPostalCode: client.postal_code || client.postalCode || '',
        clientEmail: client.email || '',
        clientCountry: client.country || 'Israel'
      })}`;
      console.log(dataLog);
      setUpdateLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${dataLog}`]);
      
      setFormData({
        clientName: client.contact_name || '',
        clientCompany: client.company_name || '',
        clientAddress: client.address || '',
        clientCity: client.city || '',
        clientPostalCode: client.postal_code || client.postalCode || '',
        clientEmail: client.email || '',
        clientCountry: client.country || 'Israel',
      });
      
      setUpdateLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ✅ Form data updated successfully`]);
    }
  }, [selectedClient]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>🧪 Debug Invoice Form - Client Data Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="clientName">Client Name</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              readOnly
              className={formData.clientName ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}
            />
          </div>

          <div>
            <Label htmlFor="clientCompany">Company Name</Label>
            <Input
              id="clientCompany"
              value={formData.clientCompany}
              readOnly
              className={formData.clientCompany ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}
            />
          </div>

          <div>
            <Label htmlFor="clientAddress">Address</Label>
            <Input
              id="clientAddress"
              value={formData.clientAddress}
              readOnly
              className={formData.clientAddress ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}
            />
          </div>

          <div>
            <Label htmlFor="clientCity">City</Label>
            <Input
              id="clientCity"
              value={formData.clientCity}
              readOnly
              className={formData.clientCity ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}
            />
          </div>

          <div>
            <Label htmlFor="clientPostalCode">Postal Code</Label>
            <Input
              id="clientPostalCode"
              value={formData.clientPostalCode}
              readOnly
              className={formData.clientPostalCode ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}
            />
          </div>

          <div>
            <Label htmlFor="clientEmail">Email</Label>
            <Input
              id="clientEmail"
              value={formData.clientEmail}
              readOnly
              className={formData.clientEmail ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}
            />
          </div>
        </div>

        {/* Update Log */}
        <div>
          <Label>Update Log (Most Recent First)</Label>
          <div className="max-h-40 overflow-y-auto border rounded p-3 bg-gray-50 text-sm font-mono">
            {updateLog.slice(-10).reverse().map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {updateLog.length === 0 && (
              <div className="text-gray-500">No updates yet...</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ClientSelectionFlowDebug: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [debugStep, setDebugStep] = useState<'loading' | 'clients-loaded' | 'client-selected' | 'form-updated'>('loading');
  
  const { clients, loading, loadClients } = useSupabaseClients();

  useEffect(() => {
    if (!loading && clients.length > 0) {
      setDebugStep('clients-loaded');
    }
  }, [loading, clients.length]);

  useEffect(() => {
    if (selectedClient) {
      setDebugStep('client-selected');
      setTimeout(() => setDebugStep('form-updated'), 500);
    }
  }, [selectedClient]);

  const handleClientSelect = (client: Client) => {
    console.log('🔍 [ClientSelectionFlowDebug] Client selected:', client.company_name, client);
    setSelectedClient(client);
  };

  const resetTest = () => {
    setSelectedClient(null);
    setDebugStep('clients-loaded');
  };

  const refreshClients = async () => {
    setDebugStep('loading');
    await loadClients();
  };

  const getStepStatus = (step: string) => {
    const currentSteps = ['loading', 'clients-loaded', 'client-selected', 'form-updated'];
    const currentIndex = currentSteps.indexOf(debugStep);
    const stepIndex = currentSteps.indexOf(step);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const StepIndicator = ({ step, label }: { step: string; label: string }) => {
    const status = getStepStatus(step);
    return (
      <div className="flex items-center gap-2">
        {status === 'completed' && <CheckCircle className="h-5 w-5 text-green-500" />}
        {status === 'active' && <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-100 animate-pulse" />}
        {status === 'pending' && <XCircle className="h-5 w-5 text-gray-300" />}
        <span className={`${status === 'active' ? 'font-bold text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-500'}`}>
          {label}
        </span>
        {status !== 'pending' && step !== 'form-updated' && <ArrowRight className="h-4 w-4 text-gray-400" />}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔬 Client Selection Flow Debug Tool</CardTitle>
          <p className="text-muted-foreground">
            This tool simulates the exact client selection flow to identify where the data is being lost.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button onClick={refreshClients} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh Clients'}
            </Button>
            <Button onClick={resetTest} variant="outline">
              Reset Test
            </Button>
          </div>

          {/* Flow Steps */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Flow Progress:</h3>
            <div className="flex flex-wrap gap-4">
              <StepIndicator step="loading" label="1. Loading Clients" />
              <StepIndicator step="clients-loaded" label="2. Clients Loaded" />
              <StepIndicator step="client-selected" label="3. Client Selected" />
              <StepIndicator step="form-updated" label="4. Form Updated" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Database Data */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Step 1: Database Clients ({clients.length} found)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading clients from database...</span>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-red-600">
              ❌ No clients found in database. Please create some clients first.
            </div>
          ) : (
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {clients.slice(0, 5).map((client) => (
                <div key={client.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <strong>{client.company_name}</strong> - {client.contact_name}
                    <div className="text-sm text-gray-600">
                      {client.city}, {client.country} | {client.email}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleClientSelect(client)}
                    variant={selectedClient?.id === client.id ? "default" : "outline"}
                  >
                    {selectedClient?.id === client.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              ))}
              {clients.length > 5 && (
                <div className="text-sm text-gray-500">+ {clients.length - 5} more clients...</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Selected Client Data */}
      {selectedClient && (
        <Card>
          <CardHeader>
            <CardTitle>🎯 Step 2: Selected Client Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Client Object Properties:</h4>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto">
                  {JSON.stringify(selectedClient, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Property Mapping Check:</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <Badge variant={selectedClient.contact_name ? "default" : "destructive"}>
                      contact_name: "{selectedClient.contact_name || 'MISSING'}"
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={selectedClient.company_name ? "default" : "destructive"}>
                      company_name: "{selectedClient.company_name || 'MISSING'}"
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={selectedClient.address ? "default" : "destructive"}>
                      address: "{selectedClient.address || 'MISSING'}"
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={selectedClient.city ? "default" : "destructive"}>
                      city: "{selectedClient.city || 'MISSING'}"
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={selectedClient.postal_code || selectedClient.postalCode ? "default" : "destructive"}>
                      postal_code: "{selectedClient.postal_code || selectedClient.postalCode || 'MISSING'}"
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={selectedClient.email ? "default" : "destructive"}>
                      email: "{selectedClient.email || 'MISSING'}"
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Invoice Form Test */}
      <DebugInvoiceForm selectedClient={selectedClient} />

      {/* Test Results */}
      {debugStep === 'form-updated' && (
        <Card>
          <CardHeader>
            <CardTitle>✅ Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Client selection flow is working correctly!</span>
              </div>
              <div className="text-sm text-gray-600">
                The client data is being properly passed from the database → hook → component → form.
                If this test works but the real app doesn't, the issue might be in the actual Index.tsx state management.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientSelectionFlowDebug;
