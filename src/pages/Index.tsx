import React, { useState, useEffect } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import ClientManagement from '../components/ClientManagement';
import ServiceManagement from '../components/ServiceManagement';
import InvoiceHistoryTable from '../components/InvoiceHistoryTable';
import PendingInvoicesTable from '../components/PendingInvoicesTable';
import Navigation from '../components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceData } from '../types/invoice';
import { InvoiceHistory } from '../types/invoiceHistory';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { useDataMigration } from '../hooks/useDataMigration';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';

const Index = () => {
  const [currentView, setCurrentView] = useState<'invoice' | 'clients' | 'services' | 'history' | 'pending'>('invoice');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [language, setLanguage] = useState<'de' | 'en'>('en');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  const { updateInvoiceStatus } = useSupabaseInvoices();
  const { 
    isMigrating, 
    migrationStatus, 
    migrateToSupabase, 
    hasLocalData, 
    localDataCounts 
  } = useDataMigration();

  useEffect(() => {
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      
      // If user is logged in and has local data, show migration dialog
      if (user && hasLocalData()) {
        setShowMigrationDialog(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      
      // Show migration dialog when user logs in and has local data
      if (session?.user && hasLocalData()) {
        setShowMigrationDialog(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [hasLocalData]);

  const handleMigration = async () => {
    const success = await migrateToSupabase();
    if (success) {
      setTimeout(() => {
        setShowMigrationDialog(false);
        window.location.reload(); // Refresh to load from Supabase
      }, 2000);
    }
  };

  const handleInvoiceGenerated = (invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
  };

  const handleInvoiceStatusChange = (newStatus: InvoiceData['status']) => {
    if (currentInvoice) {
      const updatedInvoice = { 
        ...currentInvoice, 
        status: newStatus,
        ...(newStatus === 'approved' && { approvedAt: new Date().toISOString() }),
        ...(newStatus === 'issued' && { issuedAt: new Date().toISOString() })
      };
      setCurrentInvoice(updatedInvoice);
    }
  };

  const handleBackToForm = () => {
    setCurrentInvoice(null);
  };

  if (currentInvoice) {
    return (
      <InvoicePreview 
        invoice={currentInvoice} 
        onBack={handleBackToForm}
        onStatusChange={handleInvoiceStatusChange}
        language={language}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
        language={language}
        onLanguageChange={setLanguage}
      />
      
      <div className="max-w-6xl mx-auto p-6">
        {currentView === 'invoice' && (
          <InvoiceForm 
            onInvoiceGenerated={handleInvoiceGenerated}
            language={language}
            onLanguageChange={setLanguage}
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
            language={language} 
            onClientSelect={(client) => {
              setSelectedClient(client);
              setCurrentView('invoice');
            }}
          />
        )}
        {currentView === 'services' && (
          <ServiceManagement 
            language={language} 
            onServiceSelect={(service) => {
              setSelectedService(service);
              setCurrentView('invoice');
            }}
            searchTerm={serviceSearchTerm}
            onSearchChange={setServiceSearchTerm}
          />
        )}
        {currentView === 'history' && (
          <InvoiceHistoryTable language={language} />
        )}
        {currentView === 'pending' && (
          <PendingInvoicesTable 
            language={language} 
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
      </div>

      {/* Migration Dialog */}
      <Dialog open={showMigrationDialog} onOpenChange={setShowMigrationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>העברת נתונים לבסיס נתונים חיצוני</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>זוהו נתונים שמורים במקום (localStorage) שעלולים להיעלם:</p>
            <Card>
              <CardContent className="p-4">
                <ul className="space-y-2 text-sm">
                  <li>לקוחות: {localDataCounts.clients}</li>
                  <li>שירותים: {localDataCounts.services}</li>
                  <li>חשבוניות: {localDataCounts.invoices}</li>
                  <li>היסטוריה: {localDataCounts.history}</li>
                </ul>
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground">
              מומלץ להעביר את הנתונים לבסיס נתונים חיצוני (Supabase) כדי:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside">
              <li>להבטיח שהנתונים לא ייעלמו</li>
              <li>לגשת לנתונים מכל מכשיר</li>
              <li>לקבל גיבוי אוטומטי</li>
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
                לא עכשיו
              </Button>
              <Button 
                onClick={handleMigration}
                disabled={isMigrating}
                className="bg-corporate-blue hover:bg-corporate-blue-dark"
              >
                {isMigrating ? 'מעביר...' : 'העבר נתונים'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Message for non-authenticated users */}
      {!user && (
        <div className="fixed bottom-4 right-4 bg-orange-100 border border-orange-300 rounded-lg p-4 max-w-sm">
          <p className="text-sm text-orange-800 font-medium">
            התחבר כדי לשמור נתונים בענן
          </p>
          <p className="text-xs text-orange-600 mt-1">
            כרגע הנתונים נשמרים רק במכשיר הזה
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
