import React, { useState } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import InvoicePreview from '../components/InvoicePreview';
import { InvoiceData } from '../types/invoice';

const Index = () => {
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const [language, setLanguage] = useState<'de' | 'en' | 'he'>('de');

  const handleInvoiceGenerated = (invoice: InvoiceData) => {
    setCurrentInvoice(invoice);
  };

  const handleBackToForm = () => {
    setCurrentInvoice(null);
  };

  if (currentInvoice) {
    return (
      <InvoicePreview 
        invoice={currentInvoice} 
        onBack={handleBackToForm}
      />
    );
  }

  return (
    <InvoiceForm 
      onInvoiceGenerated={handleInvoiceGenerated}
      language={language}
      onLanguageChange={setLanguage}
    />
  );
};

export default Index;
