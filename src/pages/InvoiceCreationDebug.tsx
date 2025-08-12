import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSupabaseClients } from '@/hooks/useSupabaseClients';
import { useSupabaseServices } from '@/hooks/useSupabaseServices';
import { useSupabaseInvoices } from '@/hooks/useSupabaseInvoices';
import { generateAutoInvoiceNumber, checkInvoiceNumberExists } from '@/utils/autoInvoiceNumber';
import { InvoiceData, InvoiceService } from '@/types/invoice';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
  stack?: string;
}

const InvoiceCreationDebug: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [functionCalls, setFunctionCalls] = useState<{ [key: string]: number }>({});
  const logIdCounter = useRef(0);
  const saveInvoiceCallCount = useRef(0);
  const generateInvoiceNumberCallCount = useRef(0);

  const { clients } = useSupabaseClients();
  const { services } = useSupabaseServices();
  const originalSaveInvoice = useSupabaseInvoices().saveInvoice;

  // Track component renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    addLog('info', `Component rendered (render #${renderCount + 1})`);
  }, []);

  const addLog = (type: LogEntry['type'], message: string, data?: any, stack?: string) => {
    const newLog: LogEntry = {
      id: `log-${logIdCounter.current++}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
      stack
    };
    setLogs(prev => [...prev, newLog]);
    console.log(`[DEBUG ${type.toUpperCase()}]`, message, data || '');
  };

  const clearLogs = () => {
    setLogs([]);
    setFunctionCalls({});
    saveInvoiceCallCount.current = 0;
    generateInvoiceNumberCallCount.current = 0;
    logIdCounter.current = 0;
  };

  // Wrapped saveInvoice to track calls
  const wrappedSaveInvoice = async (invoice: InvoiceData) => {
    saveInvoiceCallCount.current++;
    const callNumber = saveInvoiceCallCount.current;
    
    addLog('warning', `🔄 saveInvoice called (call #${callNumber})`, {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      total: invoice.total
    });

    try {
      const result = await originalSaveInvoice(invoice);
      addLog('success', `✅ saveInvoice completed (call #${callNumber})`, { 
        invoiceNumber: invoice.invoiceNumber 
      });
      return result;
    } catch (error: any) {
      addLog('error', `❌ saveInvoice failed (call #${callNumber})`, {
        error: error.message,
        invoiceNumber: invoice.invoiceNumber
      }, error.stack);
      throw error;
    }
  };

  const testInvoiceCreation = async () => {
    addLog('info', '🚀 Starting invoice creation test');
    setIsCreating(true);
    clearLogs();

    try {
      // Step 1: Select test data
      const testClient = clients[0];
      const testService = services[0];
      
      if (!testClient || !testService) {
        addLog('error', 'No test data available. Please ensure you have at least one client and service.');
        return;
      }

      addLog('info', '📋 Test data selected', {
        client: testClient.company_name,
        service: testService.name
      });

      // Step 2: Check current invoice numbers
      addLog('info', '🔍 Checking existing invoices...');
      
      try {
        // Test the invoice number generation
        generateInvoiceNumberCallCount.current++;
        const callNumber = generateInvoiceNumberCallCount.current;
        
        addLog('info', `📝 Calling generateAutoInvoiceNumber (call #${callNumber})...`);
        const generatedNumber = await generateAutoInvoiceNumber(testClient.company_name);
        addLog('success', `✅ Generated invoice number: ${generatedNumber}`, {
          callNumber,
          clientCompany: testClient.company_name
        });

        // Check if it already exists
        addLog('info', `🔍 Checking if ${generatedNumber} already exists...`);
        const exists = await checkInvoiceNumberExists(generatedNumber);
        addLog(exists ? 'warning' : 'success', 
          exists ? `⚠️ Invoice ${generatedNumber} already exists!` : `✅ Invoice ${generatedNumber} is available`
        );

        // Step 3: Create invoice data
        const today = new Date().toISOString().split('T')[0];
        const dueDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const invoiceService: InvoiceService = {
          id: testService.id,
          description: testService.description,
          hours: 10,
          rate: testService.default_rate,
          currency: testService.currency,
          amount: testService.default_rate * 10
        };

        const invoiceData: InvoiceData = {
          invoiceNumber: generatedNumber,
          invoiceDate: today,
          servicePeriodStart: today,
          servicePeriodEnd: today,
          dueDate: dueDate,
          language: 'en',
          currency: 'EUR',
          clientId: testClient.id,
          clientCompany: testClient.company_name,
          clientName: testClient.contact_name,
          clientEmail: testClient.email,
          clientAddress: testClient.address,
          clientCity: testClient.city,
          clientPostalCode: testClient.postal_code || '',
          clientCountry: testClient.country,
          clientBusinessLicense: testClient.business_license,
          clientCompanyRegistration: testClient.company_registration,
          services: [invoiceService],
          subtotal: invoiceService.amount,
          vatAmount: 0,
          total: invoiceService.amount,
          status: 'pending_approval',
          createdAt: new Date().toISOString()
        };

        addLog('info', '📄 Invoice data prepared', {
          invoiceNumber: generatedNumber,
          client: testClient.company_name,
          total: invoiceData.total
        });

        // Step 4: Save invoice
        addLog('info', '💾 Attempting to save invoice...');
        await wrappedSaveInvoice(invoiceData);
        
        // Step 5: Test duplicate handling
        addLog('info', '🔄 Testing duplicate save (this should fail)...');
        try {
          await wrappedSaveInvoice(invoiceData);
          addLog('error', '❌ Duplicate save succeeded when it should have failed!');
        } catch (error: any) {
          if (error.message === 'DUPLICATE_INVOICE_NUMBER') {
            addLog('success', '✅ Duplicate correctly rejected with DUPLICATE_INVOICE_NUMBER');
          } else {
            addLog('warning', '⚠️ Duplicate rejected with different error', { error: error.message });
          }
        }

      } catch (error: any) {
        addLog('error', '❌ Error during invoice creation', {
          message: error.message,
          code: error.code
        }, error.stack);
      }

    } catch (error: any) {
      addLog('error', '❌ Fatal error', { error: error.message }, error.stack);
    } finally {
      setIsCreating(false);
      addLog('info', '🏁 Test completed', {
        totalSaveInvoiceCalls: saveInvoiceCallCount.current,
        totalGenerateNumberCalls: generateInvoiceNumberCallCount.current
      });
    }
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-700 bg-red-50';
      case 'warning': return 'text-yellow-700 bg-yellow-50';
      case 'success': return 'text-green-700 bg-green-50';
      default: return 'text-blue-700 bg-blue-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">🔍 Invoice Creation Debug Tool</CardTitle>
          <p className="text-gray-600">Track and debug invoice creation process in real-time</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button 
              onClick={testInvoiceCreation} 
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="h-4 w-4 mr-2" />
              {isCreating ? 'Running Test...' : 'Run Invoice Creation Test'}
            </Button>
            <Button 
              onClick={clearLogs}
              variant="outline"
              disabled={isCreating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{renderCount}</div>
                <p className="text-xs text-muted-foreground">Component Renders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{saveInvoiceCallCount.current}</div>
                <p className="text-xs text-muted-foreground">saveInvoice Calls</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{generateInvoiceNumberCallCount.current}</div>
                <p className="text-xs text-muted-foreground">generateNumber Calls</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{logs.length}</div>
                <p className="text-xs text-muted-foreground">Log Entries</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Execution Logs</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <TabsContent value="logs">
              <ScrollArea className="h-[600px] border rounded-lg p-4">
                {logs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No logs yet. Click "Run Invoice Creation Test" to start.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-3 rounded-lg font-mono text-sm ${getLogColor(log.type)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getLogIcon(log.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs opacity-70">
                                {new Date(log.timestamp).toLocaleTimeString('he-IL', { 
                                  hour12: false,
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {log.type}
                              </Badge>
                            </div>
                            <div className="font-semibold">{log.message}</div>
                            {log.data && (
                              <pre className="mt-2 text-xs opacity-80 overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                            {log.stack && (
                              <details className="mt-2">
                                <summary className="cursor-pointer text-xs">Stack trace</summary>
                                <pre className="mt-1 text-xs opacity-70 overflow-x-auto">
                                  {log.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="summary">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Test Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Errors:</span>
                      <span className="font-bold text-red-600">
                        {logs.filter(l => l.type === 'error').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Warnings:</span>
                      <span className="font-bold text-yellow-600">
                        {logs.filter(l => l.type === 'warning').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Operations:</span>
                      <span className="font-bold text-green-600">
                        {logs.filter(l => l.type === 'success').length}
                      </span>
                    </div>
                  </div>
                  
                  {logs.filter(l => l.type === 'error').length > 0 && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Errors detected:</strong>
                        <ul className="mt-2 list-disc list-inside">
                          {logs.filter(l => l.type === 'error').map(log => (
                            <li key={log.id} className="text-sm">
                              {log.message}
                            </li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceCreationDebug;
