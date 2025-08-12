import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calculator, FileText, Bug } from 'lucide-react';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { InvoiceData, InvoiceService } from '../types/invoice';
import { generateAutoInvoiceNumber } from '../utils/autoInvoiceNumber';
import { useSupabaseClients } from '../hooks/useSupabaseClients';
import { useSupabaseServices } from '../hooks/useSupabaseServices';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuickInvoiceDebugProps {
  onInvoiceGenerated: (invoice: InvoiceData) => void;
}

interface DebugLog {
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}

const QuickInvoiceDebug: React.FC<QuickInvoiceDebugProps> = ({ onInvoiceGenerated }) => {
  const { clients } = useSupabaseClients();
  const { services } = useSupabaseServices();
  const { saveInvoice } = useSupabaseInvoices();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [hours, setHours] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(3.8);
  const [isCreating, setIsCreating] = useState(false);
  
  // Debug state
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [saveAttempts, setSaveAttempts] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  
  // Date controls
  const today = new Date().toISOString().split('T')[0];
  const [invoiceDate, setInvoiceDate] = useState<string>(today);
  const [servicePeriodStart, setServicePeriodStart] = useState<string>(today);
  const [servicePeriodEnd, setServicePeriodEnd] = useState<string>(today);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  // Track renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    addDebugLog('info', `Component rendered (count: ${renderCount + 1})`);
  }, []);

  const addDebugLog = (type: DebugLog['type'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    setDebugLogs(prev => [...prev, log]);
    console.log(`[DEBUG ${type.toUpperCase()}] ${message}`, data || '');
  };

  const clearDebugLogs = () => {
    setDebugLogs([]);
    setSaveAttempts(0);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!selectedService || hours <= 0) {
      return { subtotal: 0, total: 0 };
    }

    let amountInEUR = 0;
    if (selectedService.currency === 'EUR') {
      amountInEUR = selectedService.default_rate * hours;
    } else if (selectedService.currency === 'ILS') {
      amountInEUR = (selectedService.default_rate * hours) / exchangeRate;
    }

    return {
      subtotal: amountInEUR,
      total: amountInEUR
    };
  };

  const totals = calculateTotals();

  const handleCreateInvoice = async () => {
    if (!selectedClient || !selectedService || hours <= 0) {
      addDebugLog('error', 'Missing required fields');
      alert('Please fill in all required fields');
      return;
    }

    addDebugLog('info', '🚀 Starting invoice creation', {
      client: selectedClient.company_name,
      service: selectedService.name,
      hours,
      total: totals.total
    });

    setIsCreating(true);
    setSaveAttempts(prev => prev + 1);
    const currentAttempt = saveAttempts + 1;
    addDebugLog('warning', `Save attempt #${currentAttempt} started`);

    try {
      // Generate invoice number
      let invoiceNumber: string;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          addDebugLog('info', `Generating invoice number (attempt ${retryCount + 1})...`);
          invoiceNumber = await generateAutoInvoiceNumber(selectedClient.company_name);
          addDebugLog('success', `Generated invoice number: ${invoiceNumber}`);
          break;
        } catch (error) {
          addDebugLog('error', `Error generating invoice number (attempt ${retryCount + 1})`, error);
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new Error('Failed to generate invoice number after multiple attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
        }
      }

      const now = new Date();
      const dueDate = new Date(new Date(invoiceDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Create invoice service
      const invoiceService: InvoiceService = {
        id: selectedService.id,
        description: selectedService.description,
        hours: hours,
        rate: selectedService.currency === 'ILS' 
          ? selectedService.default_rate / exchangeRate
          : selectedService.default_rate,
        currency: 'EUR',
        amount: totals.total,
        originalAmount: selectedService.currency === 'ILS' ? selectedService.default_rate * hours : undefined,
        exchangeRateUsed: selectedService.currency === 'ILS' ? exchangeRate : undefined
      };

      // Create invoice data
      const invoiceData: InvoiceData = {
        invoiceNumber: invoiceNumber!,
        invoiceDate: invoiceDate,
        servicePeriodStart: servicePeriodStart,
        servicePeriodEnd: servicePeriodEnd,
        dueDate: dueDate,
        language: 'en',
        currency: 'EUR',
        clientId: selectedClient.id,
        clientCompany: selectedClient.company_name,
        clientName: selectedClient.contact_name,
        clientEmail: selectedClient.email,
        clientAddress: selectedClient.address,
        clientCity: selectedClient.city,
        clientPostalCode: selectedClient.postal_code || '',
        clientCountry: selectedClient.country,
        clientBusinessLicense: selectedClient.business_license,
        clientCompanyRegistration: selectedClient.company_registration,
        services: [invoiceService],
        exchangeRate: selectedService.currency === 'ILS' ? exchangeRate : undefined,
        subtotal: totals.subtotal,
        vatAmount: 0,
        total: totals.total,
        status: 'pending_approval',
        createdAt: now.toISOString(),
      };

      addDebugLog('info', '📋 Invoice data prepared', {
        invoiceNumber: invoiceData.invoiceNumber,
        status: invoiceData.status
      });

      // Save to database
      try {
        addDebugLog('warning', `🔄 Calling saveInvoice (attempt #${currentAttempt})...`);
        await saveInvoice(invoiceData);
        
        addDebugLog('success', `✅ saveInvoice completed successfully (attempt #${currentAttempt})`);
        
        // Success - navigate to preview
        addDebugLog('info', 'Calling onInvoiceGenerated callback...');
        onInvoiceGenerated(invoiceData);
        
        addDebugLog('success', '🎉 Invoice creation completed successfully!');
      } catch (saveError: any) {
        addDebugLog('error', `❌ saveInvoice failed (attempt #${currentAttempt})`, {
          message: saveError.message,
          stack: saveError.stack,
          code: saveError.code
        });
        
        // Check if it's a duplicate error
        if (saveError.message === 'DUPLICATE_INVOICE_NUMBER') {
          addDebugLog('warning', '⚠️ Duplicate invoice detected, attempting recovery...');
          
          // Generate new number
          const newNumber = await generateAutoInvoiceNumber(selectedClient.company_name);
          addDebugLog('info', `Generated new invoice number: ${newNumber}`);
          
          invoiceData.invoiceNumber = newNumber;
          
          // Try once more
          addDebugLog('warning', '🔄 Retrying saveInvoice with new number...');
          setSaveAttempts(prev => prev + 1);
          
          await saveInvoice(invoiceData);
          addDebugLog('success', '✅ Retry successful!');
          
          onInvoiceGenerated(invoiceData);
          addDebugLog('success', '🎉 Invoice creation completed after retry!');
        } else {
          throw saveError;
        }
      }
      
    } catch (error: any) {
      addDebugLog('error', `❌ Fatal error in invoice creation (attempt #${currentAttempt})`, {
        message: error.message,
        stack: error.stack
      });
      alert(`Error creating invoice: ${error.message}`);
    } finally {
      setIsCreating(false);
      addDebugLog('info', `Invoice creation process ended. Total save attempts: ${saveAttempts}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Alert className="mb-4">
        <Bug className="h-4 w-4" />
        <AlertDescription>
          <strong>Debug Mode Active:</strong> This version includes detailed logging to help identify the duplicate invoice issue.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Form */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="client-select">Select Client *</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="invoice-date">Invoice Date *</Label>
              <Input
                id="invoice-date"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="service-select">Select Service *</Label>
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service..." />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.default_rate} {service.currency})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hours">Hours *</Label>
              <Input
                id="hours"
                type="number"
                min="0"
                step="0.5"
                value={hours || ''}
                onChange={(e) => setHours(Number(e.target.value) || 0)}
                placeholder="Enter hours worked..."
              />
            </div>

            {selectedService?.currency === 'ILS' && (
              <div>
                <Label htmlFor="exchange-rate">EUR/ILS Exchange Rate *</Label>
                <Input
                  id="exchange-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(Number(e.target.value) || 3.8)}
                />
              </div>
            )}

            <Button 
              onClick={handleCreateInvoice}
              disabled={!selectedClient || !selectedService || hours <= 0 || isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? 'Creating Invoice...' : 'Create Invoice (Debug Mode)'}
            </Button>

            <Button 
              onClick={clearDebugLogs}
              variant="outline"
              className="w-full"
            >
              Clear Debug Logs
            </Button>
          </CardContent>
        </Card>

        {/* Middle Column - Calculation */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedService && hours > 0 && (
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Service:</span>
                      <span>{selectedService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span>{selectedService.default_rate} {selectedService.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hours:</span>
                      <span>{hours}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total (EUR):</span>
                      <span>€{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Component Renders:</span>
                <span className="font-mono">{renderCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Save Attempts:</span>
                <span className="font-mono">{saveAttempts}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Debug Logs:</span>
                <span className="font-mono">{debugLogs.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Debug Logs */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debug Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] border rounded p-2">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500 text-center">No logs yet...</p>
              ) : (
                <div className="space-y-1">
                  {debugLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`text-xs font-mono p-1 rounded ${
                        log.type === 'error' ? 'bg-red-100 text-red-800' :
                        log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        log.type === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span className="opacity-60">
                        {new Date(log.timestamp).toLocaleTimeString('he-IL')}
                      </span>
                      {' '}
                      <span className="font-semibold">{log.message}</span>
                      {log.data && (
                        <pre className="mt-1 text-xs opacity-80 whitespace-pre-wrap">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickInvoiceDebug;
