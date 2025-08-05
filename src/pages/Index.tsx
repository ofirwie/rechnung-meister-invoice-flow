import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebugLogger } from '../hooks/useDebugLogger';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import ClientManagement from '../components/ClientManagement';
import ServiceManagement from '../components/ServiceManagement';
import InvoiceHistoryTable from '../components/InvoiceHistoryTable';
import PendingInvoicesTable from '../components/PendingInvoicesTable';
import ExpenseManagement from '../components/ExpenseManagement';
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceData } from '../types/invoice';
import { InvoiceHistory } from '../types/invoiceHistory';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { useDataMigration } from '../hooks/useDataMigration';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';
import { useLanguage } from '../hooks/useLanguage';
import { CompanyProvider } from '../contexts/CompanyContext';
import CompanySelector from '../components/CompanySelector';
import CompanyUserManagement from '../components/CompanyUserManagement';
import { CompanyManagement } from '../components/CompanyManagement';
import UserManagement from '../components/UserManagement';
import { DebugPanel } from '../components/DebugPanel';
import { TestCompanies } from '../components/TestCompanies';
import { StateDebugger } from '../components/StateDebugger';

const Index = () => {
  const { info, warn, error: logError, trace } = useDebugLogger({ component: 'Index' });
  
  // DEBUGGING: Add render counter to detect infinite loops
  const renderCounter = useRef(0);
  const emergencyStop = useRef(0);
  
  renderCounter.current++;
  emergencyStop.current++;
  
  trace('render', `Index render #${renderCounter.current}`, {
    renderCount: renderCounter.current,
    emergencyStop: emergencyStop.current
  });
  
  if (renderCounter.current > 100) {
    console.error(`🚨 INFINITE LOOP DETECTED in Index - Render #${renderCounter.current}`);
    console.trace('Index infinite loop stack trace');
  }
  
  if (emergencyStop.current > 5000) {
    throw new Error('EMERGENCY STOP - Index infinite loop detected');
  }

  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  // DEEP STATE DEBUGGING: Track every state change with stack traces
  const [_currentView, _setCurrentView] = useState<'invoice' | 'clients' | 'services' | 'history' | 'pending' | 'expenses' | 'companies'>('invoice');
  const [_selectedClient, _setSelectedClient] = useState<Client | null>(null);
  
  // Previous state refs for comparison
  const prevViewRef = useRef(_currentView);
  const prevClientRef = useRef(_selectedClient);
  const stateChangeIdRef = useRef(0);

  // Wrapped setters with deep debugging
  const setCurrentView = useCallback((newView: typeof _currentView) => {
    const changeId = ++stateChangeIdRef.current;
    const oldView = _currentView;
    
    info('view-change-attempt', `Attempting to change view from ${oldView} to ${newView}`, {
      changeId,
      oldView,
      newView,
      stackTrace: new Error().stack,
      timestamp: Date.now(),
      renderCount: renderCounter.current
    });
    
    _setCurrentView((prev) => {
      info('view-change-executed', `View change executed: ${prev} → ${newView}`, {
        changeId,
        previousView: prev,
        newView,
        stackTrace: new Error().stack,
        renderCount: renderCounter.current
      });
      return newView;
    });
  }, [_currentView, info]);

  const setSelectedClient = useCallback((newClient: Client | null) => {
    const changeId = ++stateChangeIdRef.current;
    const oldClient = _selectedClient;
    const oldClientName = oldClient?.company_name || 'null';
    const newClientName = newClient?.company_name || 'null';
    
    info('client-change-attempt', `Attempting to change client from ${oldClientName} to ${newClientName}`, {
      changeId,
      oldClientId: oldClient?.id,
      oldClientName,
      newClientId: newClient?.id,
      newClientName,
      stackTrace: new Error().stack,
      timestamp: Date.now(),
      renderCount: renderCounter.current
    });
    
    _setSelectedClient((prev) => {
      const prevName = prev?.company_name || 'null';
      info('client-change-executed', `Client change executed: ${prevName} → ${newClientName}`, {
        changeId,
        previousClientId: prev?.id,
        previousClientName: prevName,
        newClientId: newClient?.id,
        newClientName,
        stackTrace: new Error().stack,
        renderCount: renderCounter.current
      });
      return newClient;
    });
  }, [_selectedClient, info]);

  // Expose current state values
  const currentView = _currentView;
  const selectedClient = _selectedClient;

  // Monitor state changes with useEffect
  useEffect(() => {
    if (prevViewRef.current !== currentView) {
      info('view-state-changed', `View state changed: ${prevViewRef.current} → ${currentView}`, {
        oldView: prevViewRef.current,
        newView: currentView,
        renderCount: renderCounter.current,
        stackTrace: new Error().stack
      });
      prevViewRef.current = currentView;
    }
  }, [currentView, info]);

  useEffect(() => {
    if (prevClientRef.current !== selectedClient) {
      const oldName = prevClientRef.current?.company_name || 'null';
      const newName = selectedClient?.company_name || 'null';
      
      if (selectedClient === null && prevClientRef.current !== null) {
        warn('client-cleared', `Selected client was CLEARED! Previous: ${oldName}`, {
          previousClientId: prevClientRef.current?.id,
          previousClientName: oldName,
          renderCount: renderCounter.current,
          stackTrace: new Error().stack,
          timestamp: Date.now()
        });
      }
      
      info('client-state-changed', `Client state changed: ${oldName} → ${newName}`, {
        oldClientId: prevClientRef.current?.id,
        oldClientName: oldName,
        newClientId: selectedClient?.id,
        newClientName: newName,
        renderCount: renderCounter.current,
        stackTrace: new Error().stack
      });
      prevClientRef.current = selectedClient;
    }
  }, [selectedClient, info, warn]);

  const [showUserManagement, setShowUserManagement] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  const { updateInvoiceStatus, saveInvoice } = useSupabaseInvoices();
  const { 
    isMigrating, 
    migrationStatus, 
    migrateToSupabase, 
    hasLocalData, 
    localDataCounts 
  } = useDataMigration();

  useEffect(() => {
    // AUTHENTICATION GUARD: Check auth state first
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        info('auth-check', 'Authentication check completed', {
          hasUser: !!user,
          userId: user?.id,
          userEmail: user?.email,
          sessionValid: !!session
        });

        if (!user) {
          warn('auth-required', 'No authenticated user found, redirecting to auth', {
            currentPath: window.location.pathname,
            renderCount: renderCounter.current
          });
          
          // Redirect to auth page immediately if no user
          navigate('/auth');
          return;
        }

        setUser(user);
        
        // If user is logged in and has local data, show migration dialog
        if (user && hasLocalData()) {
          setShowMigrationDialog(true);
        }
      } catch (error) {
        logError('auth-check-error', 'Error checking authentication', {
          error: error,
          renderCount: renderCounter.current
        }, error as Error);
        
        // On auth error, redirect to auth page
        navigate('/auth');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      info('auth-state-changed', 'Authentication state changed', {
        event,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      const user = session?.user || null;
      setUser(user);
      
      // If user logs out, redirect to auth
      if (!user && event === 'SIGNED_OUT') {
        info('user-signed-out', 'User signed out, redirecting to auth');
        navigate('/auth');
        return;
      }
      
      // Show migration dialog when user logs in and has local data
      if (user && hasLocalData()) {
        setShowMigrationDialog(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, info, warn, logError, hasLocalData]);

  const handleMigration = useCallback(async () => {
    const success = await migrateToSupabase();
    if (success) {
      setTimeout(() => {
        setShowMigrationDialog(false);
        window.location.reload(); // Refresh to load from Supabase
      }, 2000);
    }
  }, [migrateToSupabase]);

  const handleInvoiceGenerated = useCallback(async (invoice: InvoiceData) => {
    try {
      await saveInvoice(invoice);
      setCurrentInvoice(invoice);
      console.log('Invoice saved successfully to Supabase');
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert(t.errorSavingInvoice);
    }
  }, [saveInvoice, t.errorSavingInvoice]);

  const handleInvoiceStatusChange = useCallback(async (newStatus: InvoiceData['status']) => {
    if (currentInvoice) {
      try {
        await updateInvoiceStatus(currentInvoice.invoiceNumber, newStatus);
        const updatedInvoice = { 
          ...currentInvoice, 
          status: newStatus,
          ...(newStatus === 'approved' && { approvedAt: new Date().toISOString() }),
          ...(newStatus === 'issued' && { issuedAt: new Date().toISOString() })
        };
        setCurrentInvoice(updatedInvoice);
        console.log('Invoice status updated successfully in Supabase');
      } catch (error) {
        console.error('Failed to update invoice status:', error);
        alert(t.errorUpdatingStatus);
      }
    }
  }, [currentInvoice, updateInvoiceStatus, t.errorUpdatingStatus]);

  const handleBackToForm = useCallback(() => {
    setCurrentInvoice(null);
  }, []);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (currentInvoice) {
    return (
      <InvoicePreview 
        invoice={currentInvoice} 
        onBack={handleBackToForm}
        onStatusChange={handleInvoiceStatusChange}
      />
    );
  }

  return (
    <CompanyProvider>
      {/* <DebugPanel /> */}
      {/* <TestCompanies /> */}
      
      {/* State Debugger - Real-time state monitoring */}
      <StateDebugger 
        currentView={currentView}
        selectedClient={selectedClient}
        renderCount={renderCounter.current}
      />
      
      <div className="min-h-screen bg-background">
        {/* Company Selector */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="max-w-6xl mx-auto">
            <CompanySelector 
              onManageCompanies={() => setCurrentView('companies')}
              onManageUsers={() => setShowUserManagement(true)}
            />
          </div>
        </div>
        
        <Navigation
          currentView={currentView}
          onViewChange={setCurrentView}
          onLogout={async () => {
            await supabase.auth.signOut();
            navigate('/auth');
          }}
        />
        
      
      <div className="max-w-6xl mx-auto p-6">
        {currentView === 'invoice' && (
          <InvoiceForm 
            onInvoiceGenerated={handleInvoiceGenerated}
            selectedClient={selectedClient}
            selectedService={selectedService}
            onClientClear={() => setSelectedClient(null)}
            onServiceClear={() => setSelectedService(null)}
            onSelectClient={() => setCurrentView('clients')}
            setCurrentView={setCurrentView}
          />
        )}
        {currentView === 'clients' && (
          <ClientManagement 
            onClientSelect={(client) => {
              info('client-management-callback', 'ClientManagement onClientSelect called', {
                clientId: client.id,
                company_name: client.company_name,
                contact_name: client.contact_name,
                currentView: currentView,
                previousClient: selectedClient?.company_name || 'none',
                renderCount: renderCounter.current,
                stackTrace: new Error().stack
              });
              
              try {
                info('before-state-changes', 'About to set selectedClient and change view', {
                  clientId: client.id,
                  company_name: client.company_name,
                  currentView,
                  currentSelectedClient: selectedClient?.company_name || 'none',
                  renderCount: renderCounter.current
                });
                
                setSelectedClient(client);
                
                info('between-state-changes', 'Set selectedClient, now changing view', {
                  clientId: client.id,
                  company_name: client.company_name,
                  renderCount: renderCounter.current
                });
                
                setCurrentView('invoice');
                
                info('after-state-changes', 'Completed both state changes', {
                  clientId: client.id,
                  company_name: client.company_name,
                  renderCount: renderCounter.current
                });
              } catch (err) {
                logError('client-selection-error', 'Error in client selection process', {
                  clientId: client.id,
                  company_name: client.company_name,
                  error: err,
                  renderCount: renderCounter.current
                }, err as Error);
              }
            }}
          />
        )}
        {currentView === 'services' && (
          <ServiceManagement 
            onServiceSelect={(service) => {
              setSelectedService(service);
              setCurrentView('invoice');
            }}
            searchTerm={serviceSearchTerm}
            onSearchChange={setServiceSearchTerm}
          />
        )}
        {currentView === 'history' && (
          <InvoiceHistoryTable />
        )}
        {currentView === 'pending' && (
          <PendingInvoicesTable 
            onInvoiceView={(invoice: InvoiceHistory) => {
              // Convert InvoiceHistory back to InvoiceData for viewing
              const invoiceData: InvoiceData = {
                invoiceNumber: invoice.invoiceNumber,
                invoiceDate: invoice.createdAt.split('T')[0],
                servicePeriodStart: invoice.servicePeriodFrom,
                servicePeriodEnd: invoice.servicePeriodTo,
                dueDate: invoice.dueDate,
                language: invoice.language,
                currency: 'EUR',
                clientCompany: invoice.clientName,
                clientAddress: '',
                clientCity: '',
                clientPostalCode: '',
                clientCountry: '',
                services: [],
                subtotal: invoice.amount,
                vatAmount: 0,
                total: invoice.amount,
                status: invoice.status,
                createdAt: invoice.createdAt,
              };
              setCurrentInvoice(invoiceData);
            }}
            onInvoiceEdit={(invoice: InvoiceHistory) => {
              // For editing, we need to go back to the invoice form
              // TODO: This would need to pre-populate the form with the invoice data
              setCurrentView('invoice');
            }}
          />
        )}
        {currentView === 'expenses' && (
          <ExpenseManagement />
        )}
        {showUserManagement && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Company User Management</h1>
              <Button variant="outline" onClick={() => setShowUserManagement(false)}>
                Back
              </Button>
            </div>
            <CompanyUserManagement />
          </div>
        )}
        {currentView === 'companies' && <CompanyManagement />}
      </div>

      {/* Migration Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Data Migration to External Database</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Local data found that may be lost:</p>
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm">
                  <li>Clients: {localDataCounts.clients}</li>
                  <li>Services: {localDataCounts.services}</li>
                  <li>Invoices: {localDataCounts.invoices}</li>
                  <li>History: {localDataCounts.history}</li>
                </ul>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              We recommend migrating data to external database (Supabase) to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              <li>Ensure data won't be lost</li>
              <li>Access data from any device</li>
              <li>Get automatic backup</li>
            </ul>
            {migrationStatus && (
              <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
                {migrationStatus}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowMigrationDialog(false)}
                disabled={isMigrating}
              >
                Not now
              </Button>
              <Button 
                onClick={handleMigration}
                disabled={isMigrating}
                className="bg-corporate-blue hover:bg-corporate-blue-dark"
              >
                {isMigrating ? 'Migrating...' : 'Migrate Data'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout button for authenticated users */}
      {user && (
        <div className="fixed bottom-4 right-4">
          <Button 
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate('/auth');
            }}
            className="bg-background/80 backdrop-blur-sm"
          >
            Logout
          </Button>
        </div>
      )}
    </div>
    </CompanyProvider>
  );
};

export default Index;
