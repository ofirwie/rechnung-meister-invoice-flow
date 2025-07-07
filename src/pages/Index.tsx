import React, { useState } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import ClientManagement from '../components/ClientManagement';
import InvoiceHistoryTable from '../components/InvoiceHistoryTable';
import Navigation from '../components/Navigation';
import { InvoiceData } from '../types/invoice';

const Index = () => {
  const [currentView, setCurrentView] = useState<'invoice' | 'clients' | 'history'>('invoice');
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [language, setLanguage] = useState<'de' | 'en' | 'he' | 'fr'>('de');

  const handleInvoiceGenerated = (invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
  };

  const handleBackToForm = () => {
    setCurrentInvoice(null);
  };

  if (currentInvoice) {
    return <InvoicePreview invoice={currentInvoice} onBack={handleBackToForm} />;
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
          />
        )}
        {currentView === 'clients' && (
          <ClientManagement language={language} />
        )}
        {currentView === 'history' && (
          <InvoiceHistoryTable language={language} />
        )}
      </div>
    </div>
  );
};

export default Index;
