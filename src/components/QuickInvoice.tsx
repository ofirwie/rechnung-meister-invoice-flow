import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calculator, FileText } from 'lucide-react';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { InvoiceData, InvoiceService } from '../types/invoice';
import { generateAutoInvoiceNumber } from '../utils/autoInvoiceNumber';
import { useSupabaseClients } from '../hooks/useSupabaseClients';
import { useSupabaseServices } from '../hooks/useSupabaseServices';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';

interface QuickInvoiceProps {
  onInvoiceGenerated: (invoice: InvoiceData) => void;
}

const QuickInvoice: React.FC<QuickInvoiceProps> = ({ onInvoiceGenerated }) => {
  const { clients } = useSupabaseClients();
  const { services } = useSupabaseServices();
  const { saveInvoice } = useSupabaseInvoices();

  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [hours, setHours] = useState<number>(0);
  const [exchangeRate, setExchangeRate] = useState<number>(3.8); // Default EUR/ILS rate
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const selectedService = services.find(s => s.id === selectedServiceId);

  // Calculate totals in real-time
  const calculateTotals = () => {
    if (!selectedService || hours <= 0) {
      return { subtotal: 0, total: 0 };
    }

    let amountInEUR = 0;

    if (selectedService.currency === 'EUR') {
      // Direct EUR calculation
      amountInEUR = selectedService.default_rate * hours;
    } else if (selectedService.currency === 'ILS') {
      // ILS to EUR conversion: (ILS_price * hours) / exchange_rate
      amountInEUR = (selectedService.default_rate * hours) / exchangeRate;
    }

    return {
      subtotal: amountInEUR,
      total: amountInEUR // No VAT for now, always in EUR
    };
  };

  const totals = calculateTotals();

  // Generate invoice number when client is selected
  useEffect(() => {
    if (selectedClient) {
      generateAutoInvoiceNumber(selectedClient.company_name)
        .then(number => {
          console.log('Generated invoice number:', number);
          setInvoiceNumber(number);
        })
        .catch(error => {
          console.error('Error generating invoice number:', error);
          setInvoiceNumber('ERROR-GENERATING-NUMBER');
        });
    }
  }, [selectedClient]);

  const handleCreateInvoice = async () => {
    if (!selectedClient || !selectedService || hours <= 0 || !invoiceNumber) {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const now = new Date();
      const invoiceDate = now.toISOString().split('T')[0];
      const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days later

      // Create invoice service
      const invoiceService: InvoiceService = {
        id: selectedService.id,
        description: selectedService.description,
        hours: hours,
        rate: selectedService.default_rate,
        currency: selectedService.currency,
        amount: totals.total, // Always in EUR
        originalAmount: selectedService.currency === 'ILS' ? selectedService.default_rate * hours : undefined,
        exchangeRateUsed: selectedService.currency === 'ILS' ? exchangeRate : undefined
      };

      // Create invoice data
      const invoiceData: InvoiceData = {
        invoiceNumber: invoiceNumber,
        invoiceDate: invoiceDate,
        servicePeriodStart: invoiceDate,
        servicePeriodEnd: invoiceDate,
        dueDate: dueDate,
        language: 'en',
        currency: 'EUR', // Always EUR
        
        // Client information
        clientCompany: selectedClient.company_name,
        clientName: selectedClient.contact_name,
        clientEmail: selectedClient.email,
        clientAddress: selectedClient.address,
        clientCity: selectedClient.city,
        clientPostalCode: selectedClient.postal_code || '',
        clientCountry: selectedClient.country,
        clientBusinessLicense: selectedClient.business_license,
        clientCompanyRegistration: selectedClient.company_registration,
        
        // Services
        services: [invoiceService],
        
        // Exchange rate if used
        exchangeRate: selectedService.currency === 'ILS' ? exchangeRate : undefined,
        
        // Totals
        subtotal: totals.subtotal,
        vatAmount: 0,
        total: totals.total,
        
        // Status
        status: 'pending_approval', // Set to pending approval as requested
        createdAt: now.toISOString(),
      };

      // Save to database
      await saveInvoice(invoiceData);
      
      // Call the callback to navigate to preview
      onInvoiceGenerated(invoiceData);

      console.log('Invoice created successfully:', invoiceNumber);
      
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Error creating invoice. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Quick Invoice Creation</h1>
        <p className="text-gray-600 mt-2">Create invoices quickly and easily</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column - Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
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

            {/* Invoice Number - Auto-generated */}
            {invoiceNumber && (
              <div>
                <Label>Invoice Number</Label>
                <Input value={invoiceNumber} disabled className="bg-gray-50" />
              </div>
            )}

            {/* Service Selection */}
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

            {/* Hours */}
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

            {/* Exchange Rate - Only for ILS services */}
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
                  placeholder="e.g., 3.98"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Current rate: 1 EUR = {exchangeRate} ILS
                </p>
              </div>
            )}

            {/* Create Invoice Button */}
            <Button 
              onClick={handleCreateInvoice}
              disabled={!selectedClient || !selectedService || hours <= 0 || isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? 'Creating Invoice...' : 'Create Invoice'}
            </Button>
          </CardContent>
        </Card>

        {/* Right Column - Preview & Calculation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Live Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClient && (
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold">Client Information:</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p><strong>{selectedClient.company_name}</strong></p>
                  <p>{selectedClient.address}</p>
                  <p>{selectedClient.city}, {selectedClient.country}</p>
                  {selectedClient.email && <p>Email: {selectedClient.email}</p>}
                </div>
              </div>
            )}

            {selectedService && hours > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Calculation:</h3>
                
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
                    
                    {selectedService.currency === 'ILS' && (
                      <>
                        <div className="flex justify-between">
                          <span>Subtotal (ILS):</span>
                          <span>{(selectedService.default_rate * hours).toFixed(2)} ILS</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exchange Rate:</span>
                          <span>1 EUR = {exchangeRate} ILS</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Calculation:</span>
                          <span>({selectedService.default_rate} × {hours}) ÷ {exchangeRate}</span>
                        </div>
                      </>
                    )}
                    
                    {selectedService.currency === 'EUR' && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Calculation:</span>
                        <span>{selectedService.default_rate} × {hours}</span>
                      </div>
                    )}
                    
                    <hr className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total (EUR):</span>
                      <span>€{totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!selectedService || hours <= 0) && (
              <div className="text-center text-gray-500 py-8">
                <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select service and enter hours to see calculation</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuickInvoice;
