import React, { useState } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import ClientManagement from '../components/ClientManagement';
import ServiceManagement from '../components/ServiceManagement';
import InvoiceHistoryTable from '../components/InvoiceHistoryTable';
import Navigation from '../components/Navigation';
import { InvoiceData } from '../types/invoice';
import { Client } from '../types/client';
import { Service } from '../types/service';

const Index = () => {
  const [currentView, setCurrentView] = useState<'invoice' | 'clients' | 'services' | 'history'>('invoice');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [language, setLanguage] = useState<'de' | 'en' | 'he' | 'fr'>('en');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');

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
      </div>
    </div>
  );
};

export default Index;
