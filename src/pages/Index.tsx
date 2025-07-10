import React, { useState, useEffect } from 'react';
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

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'invoice' | 'clients' | 'services' | 'history' | 'pending' | 'expenses'>('invoice');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [language, setLanguage] = useState<'de' | 'en'>('en');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
    // Check auth state
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      
      // If user is logged in and has local data, show migration dialog
      if (user && hasLocalData()) {
        setShowMigrationDialog(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
      
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

  const handleInvoiceGenerated = async (invoice: InvoiceData) => {
    try {
      await saveInvoice(invoice);
      setCurrentInvoice(invoice);
      console.log('Invoice saved successfully to Supabase');
    } catch (error) {
      console.error('Failed to save invoice:', error);
      alert('שגיאה בשמירת החשבונית. אנא נסה שוב.');
    }
  };

  const handleInvoiceStatusChange = async (newStatus: InvoiceData['status']) => {
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
        alert('שגיאה בעדכון סטטוס החשבונית. אנא נסה שוב.');
      }
    }
  };

  const handleBackToForm = () => {
    setCurrentInvoice(null);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-orange-50 border border-orange-300 rounded-lg p-6">
            <h2 className="text-xl font-bold text-orange-800 mb-4">נדרשת התחברות</h2>
            <p className="text-orange-700 mb-4">
              כדי להשתמש במערכת ולשמור את הנתונים שלך בענן, עליך להתחבר או להירשם
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full"
            >
              התחבר / הירשם
            </Button>
          </div>
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
        {currentView === 'expenses' && (
          <ExpenseManagement />
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
            התנתק
          </Button>
        </div>
      )}
    </div>
  );
};

export default Index;
