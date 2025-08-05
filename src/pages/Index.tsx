import React, { useState, useEffect, useCallback } from 'react';
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

const Index = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  
  // Simplified state management
  const [currentView, setCurrentView] = useState<'invoice' | 'clients' | 'services' | 'history' | 'pending' | 'expenses' | 'companies'>('invoice');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

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
        
        console.log('Auth check completed:', { hasUser: !!user });

        if (!user) {
          console.log('No authenticated user found, redirecting to auth');
          navigate('/auth');
          return;
        }

        setUser(user);
        
        // If user is logged in and has local data, show migration dialog
        if (user && hasLocalData()) {
          setShowMigrationDialog(true);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/auth');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Setup auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, hasUser: !!session?.user });

      const user = session?.user || null;
      setUser(user);
      
      // If user logs out, redirect to auth
      if (!user && event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to auth');
        navigate('/auth');
        return;
      }
      
      // Show migration dialog when user logs in and has local data
      if (user && hasLocalData()) {
        setShowMigrationDialog(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, hasLocalData]);

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
      {/* Debug components temporarily disabled */}
      
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
              console.log('Client selected:', client.company_name);
              setSelectedClient(client);
              setCurrentView('invoice');
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
