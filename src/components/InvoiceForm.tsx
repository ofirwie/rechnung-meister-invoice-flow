import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvoiceData, InvoiceService } from '../types/invoice';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { InvoiceHistory } from '../types/invoiceHistory';
import { translations } from '../utils/translations';
import { generateInvoiceNumber, calculateDueDate } from '../utils/formatters';
import { getNextInvoiceNumber } from '../utils/invoiceNumberManager';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface InvoiceFormProps {
  onInvoiceGenerated: (invoice: InvoiceData) => void;
  language: 'de' | 'en' | 'he';
  onLanguageChange: (language: 'de' | 'en' | 'he') => void;
  selectedClient?: Client | null;
  selectedService?: Service | null;
  onClientClear?: () => void;
  onServiceClear?: () => void;
  onSelectClient?: () => void;
  setCurrentView?: (view: 'invoice' | 'clients' | 'services' | 'history' | 'pending') => void;
}

export default function InvoiceForm({ 
  onInvoiceGenerated, 
  language, 
  onLanguageChange, 
  selectedClient, 
  selectedService, 
  onClientClear, 
  onServiceClear,
  onSelectClient,
  setCurrentView 
}: InvoiceFormProps) {
  const t = translations[language];
  
  const [clients] = useLocalStorage<Client[]>('invoice-clients', []);
  const [invoiceHistory] = useLocalStorage<InvoiceHistory[]>('invoice-history', []);
  
  const [formData, setFormData] = useState<Partial<InvoiceData>>({
    invoiceDate: new Date().toISOString().split('T')[0],
    servicePeriodStart: '',
    servicePeriodEnd: '',
    dueDate: '',
    language: language,
    currency: 'EUR',
    clientCountry: 'Israel',
    services: []
  });

  const [services, setServices] = useState<InvoiceService[]>([
    { id: '1', description: '', hours: 0, rate: 0, currency: 'EUR', amount: 0, addedToInvoice: false }
  ]);

  const [exchangeRate, setExchangeRate] = useState<number>(3.91);

  // Auto-calculate due date when invoice date changes
  useEffect(() => {
    if (formData.invoiceDate) {
      const invoiceDate = new Date(formData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 10);
      setFormData(prev => ({ ...prev, dueDate: dueDate.toISOString().split('T')[0] }));
    }
  }, [formData.invoiceDate]);

  // Recalculate all service amounts when exchange rate changes
  useEffect(() => {
    setServices(prev => prev.map(service => ({
      ...service,
      amount: Number(service.hours) * Number(service.rate)
    })));
  }, [exchangeRate]);

  // Auto-generate invoice number when client company changes
  useEffect(() => {
    if (formData.clientCompany) {
      const invoiceNumber = `${formData.clientCompany}-1`;
      setFormData(prev => ({ ...prev, invoiceNumber }));
    }
  }, [formData.clientCompany, invoiceHistory]);

  // Update form when client is selected
  useEffect(() => {
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientCompany: selectedClient.companyName,
        clientAddress: selectedClient.address,
        clientCity: selectedClient.city,
        clientPostalCode: selectedClient.postalCode,
        clientCountry: selectedClient.country
      }));
    }
  }, [selectedClient]);

  // Update form when service is selected
  useEffect(() => {
    if (selectedService) {
      const newService: InvoiceService = {
        id: Date.now().toString(),
        description: selectedService.description,
        hours: 1,
        rate: selectedService.hourlyRate,
        currency: selectedService.currency,
        amount: 1 * selectedService.hourlyRate, // Calculate amount properly
        addedToInvoice: false
      };
      setServices(prev => [...prev.slice(0, -1), newService, { id: Date.now().toString() + '1', description: '', hours: 0, rate: 0, currency: 'EUR', amount: 0, addedToInvoice: false }]);
    }
  }, [selectedService]);

  const handleInputChange = (field: keyof InvoiceData, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    const newService: InvoiceService = {
      id: Date.now().toString(),
      description: '',
      hours: 0,
      rate: 0,
      currency: 'EUR',
      amount: 0,
      addedToInvoice: false
    };
    setServices(prev => [...prev, newService]);
  };

  const calculateServiceAmount = (serviceId: string) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        const originalAmount = Number(service.hours) * Number(service.rate);
        console.log('=== Debug calculateServiceAmount ===');
        console.log('Service ID:', serviceId);
        console.log('Hours:', service.hours);
        console.log('Rate:', service.rate);
        console.log('Currency:', service.currency);
        console.log('Original amount:', originalAmount);
        console.log('Exchange rate:', exchangeRate);
        
        const finalAmount = service.currency === 'ILS' ? originalAmount / exchangeRate : originalAmount;
        console.log('Final amount (EUR):', finalAmount);
        console.log('==============================');
        
        return {
          ...service,
          amount: finalAmount,
          originalAmount: originalAmount,
          exchangeRateUsed: service.currency === 'ILS' ? exchangeRate : undefined
        };
      }
      return service;
    }));
  };

  const addServiceToInvoice = (serviceId: string) => {
    setServices(prev => prev.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          addedToInvoice: true
        };
      }
      return service;
    }));
  };

  const removeService = (id: string) => {
    if (services.length > 1) {
      setServices(prev => prev.filter(service => service.id !== id));
    }
  };

  const updateService = (id: string, field: keyof InvoiceService, value: string | number) => {
    setServices(prev => prev.map(service => {
      if (service.id === id) {
        const updated = { ...service, [field]: value };
        // Reset amount to 0 when hours, rate, or currency changes to force recalculation
        if (field === 'hours' || field === 'rate' || field === 'currency') {
          updated.amount = 0;
        }
        return updated;
      }
      return service;
    }));
  };

  const calculateTotals = () => {
    const subtotal = services
      .filter(service => service.addedToInvoice)
      .reduce((sum, service) => {
        // Amount is already in EUR after calculateServiceAmount
        return sum + service.amount;
      }, 0);
    return {
      subtotal,
      vatAmount: 0, // VAT-exempt for Germany to Israel
      total: subtotal
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotals();
    const hasILSServices = services.some(service => service.currency === 'ILS');
    
    const invoice: InvoiceData = {
      ...formData as InvoiceData,
      services,
      ...totals,
      ...(hasILSServices && { exchangeRate }),
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    
    onInvoiceGenerated(invoice);
  };

  const resetForm = () => {
    setFormData({
      invoiceDate: new Date().toISOString().split('T')[0],
      servicePeriodStart: '',
      servicePeriodEnd: '',
      dueDate: '',
      language: language,
      currency: 'EUR',
      clientCountry: 'Israel',
      services: []
    });
    setServices([{ id: '1', description: '', hours: 0, rate: 0, currency: 'EUR', amount: 0, addedToInvoice: false }]);
  };

  const totals = calculateTotals();

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${language === 'he' ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-corporate-blue">{t.title}</h1>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="he">עברית</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-corporate-blue">{t.invoiceDetails}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">{t.invoiceNumber} *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber || ''}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                placeholder="Client-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="invoiceDate">{t.invoiceDate} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.invoiceDate ? format(new Date(formData.invoiceDate), "dd.MM.yyyy", { locale: de }) : <span>{t.invoiceDate}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.invoiceDate ? new Date(formData.invoiceDate) : undefined}
                    onSelect={(date) => setFormData({ ...formData, invoiceDate: date?.toISOString().split('T')[0] || '' })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="servicePeriodStart">{t.servicePeriodStart} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.servicePeriodStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.servicePeriodStart ? format(new Date(formData.servicePeriodStart), "dd.MM.yyyy", { locale: de }) : <span>{t.servicePeriodStart}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.servicePeriodStart ? new Date(formData.servicePeriodStart) : undefined}
                    onSelect={(date) => setFormData({ ...formData, servicePeriodStart: date?.toISOString().split('T')[0] || '' })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="servicePeriodEnd">{t.servicePeriodEnd} *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.servicePeriodEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.servicePeriodEnd ? format(new Date(formData.servicePeriodEnd), "dd.MM.yyyy", { locale: de }) : <span>{t.servicePeriodEnd}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.servicePeriodEnd ? new Date(formData.servicePeriodEnd) : undefined}
                    onSelect={(date) => setFormData({ ...formData, servicePeriodEnd: date?.toISOString().split('T')[0] || '' })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-corporate-blue">{t.clientInfo}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSelectClient}
            >
              {t.selectClientFromList}
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <div className="space-y-2">
                <Label htmlFor="clientCompany">{t.clientCompany} *</Label>
                <div className="flex gap-2">
                  <Input
                    id="clientCompany"
                    value={formData.clientCompany || ''}
                    onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                    required
                    className="flex-1"
                  />
                  {selectedClient && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onClientClear}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                {selectedClient && (
                  <p className="text-xs text-muted-foreground">
                    {t.selectClient}: {selectedClient.companyName}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="clientAddress">{t.clientAddress} *</Label>
              <Input
                id="clientAddress"
                value={formData.clientAddress || ''}
                onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientCity">{t.clientCity} *</Label>
              <Input
                id="clientCity"
                value={formData.clientCity || ''}
                onChange={(e) => handleInputChange('clientCity', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="clientPostalCode">{t.postalCode}</Label>
              <Input
                id="clientPostalCode"
                value={formData.clientPostalCode || ''}
                onChange={(e) => handleInputChange('clientPostalCode', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="clientCountry">{t.country}</Label>
              <Input
                id="clientCountry"
                value={formData.clientCountry || 'Israel'}
                onChange={(e) => handleInputChange('clientCountry', e.target.value)}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Exchange Rate */}
        {services.some(service => service.currency === 'ILS') && (
          <Card>
            <CardHeader>
              <CardTitle className="text-corporate-blue">{t.exchangeRate}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exchangeRate">{t.exchangeRateValue} (ILS/EUR) *</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 3.91)}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.exchangeRateHelp}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{t.services}</h3>
              <div className="flex gap-2">
                <Button type="button" onClick={addService} variant="outline" size="sm">
                  {t.addService}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('services')}
                >
                  {t.selectServiceFromList}
                </Button>
                {selectedService && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onServiceClear}
                    className="px-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {selectedService && (
              <p className="text-xs text-muted-foreground mb-4">
                שירות שנבחר: {selectedService.name}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className={`grid grid-cols-1 md:grid-cols-8 gap-4 p-4 border rounded-lg ${service.addedToInvoice ? 'bg-green-50 border-green-200' : ''}`}>
                <div className="md:col-span-2">
                  <Label>{t.serviceDescription} *</Label>
                  <Textarea
                    value={service.description}
                    onChange={(e) => updateService(service.id, 'description', e.target.value)}
                    placeholder={t.serviceDescription}
                    required
                    disabled={service.addedToInvoice}
                    className={`min-h-[80px] ${service.addedToInvoice ? 'bg-muted' : ''}`}
                  />
                </div>
                <div>
                  <Label>{t.hours}</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={service.hours}
                    onChange={(e) => updateService(service.id, 'hours', parseFloat(e.target.value) || 0)}
                    required
                    disabled={service.addedToInvoice}
                    className={service.addedToInvoice ? 'bg-muted' : ''}
                  />
                </div>
                <div>
                  <Label>{t.hourlyRate}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={service.rate}
                    onChange={(e) => updateService(service.id, 'rate', parseFloat(e.target.value) || 0)}
                    required
                    disabled={service.addedToInvoice}
                    className={service.addedToInvoice ? 'bg-muted' : ''}
                  />
                </div>
                <div>
                  <Label>{t.currency}</Label>
                  <Select 
                    value={service.currency} 
                    onValueChange={(value: 'EUR' | 'ILS') => updateService(service.id, 'currency', value)}
                    disabled={service.addedToInvoice}
                  >
                    <SelectTrigger className={service.addedToInvoice ? 'bg-muted' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="ILS">ILS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.amount}</Label>
                  <div className="space-y-1">
                     <Input
                       type="text"
                       value={`${service.amount.toFixed(2)} EUR`}
                       disabled
                       className="bg-muted"
                     />
                     {service.addedToInvoice && service.currency === 'ILS' && service.originalAmount && (
                       <div className="text-xs text-green-700 space-y-1">
                         <p>{service.hours} שעות × {service.rate} ש"ח = {service.originalAmount.toFixed(2)} ש"ח</p>
                         <p>≈ €{service.amount.toFixed(2)} (שער: {service.exchangeRateUsed || exchangeRate})</p>
                       </div>
                     )}
                    {!service.addedToInvoice && service.currency === 'ILS' && service.hours > 0 && service.rate > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>{service.hours} שעות × {service.rate} ש"ח = {(service.hours * service.rate).toFixed(2)} ש"ח</p>
                        <p>≈ €{((service.hours * service.rate) / exchangeRate).toFixed(2)} (שער: {exchangeRate})</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* Calculate button */}
                  {!service.addedToInvoice && service.description && service.hours > 0 && service.rate > 0 && service.amount === 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => calculateServiceAmount(service.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      חשב
                    </Button>
                  )}
                  
                  {/* Add to invoice button */}
                  {!service.addedToInvoice && service.amount > 0 && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => addServiceToInvoice(service.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      הוסף לחשבונית
                    </Button>
                  )}
                  
                  {/* Status display */}
                  {service.addedToInvoice && (
                    <div className="text-xs text-green-600 font-medium">
                      ✓ נוסף לחשבונית
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {services.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeService(service.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={service.addedToInvoice}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex justify-end space-y-2">
                <div className="text-right space-y-1 min-w-48">
                  <div className="flex justify-between">
                    <span className="font-medium">{t.subtotal}:</span>
                    <span>{totals.subtotal.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>VAT (0%):</span>
                    <span>{totals.vatAmount.toFixed(2)} EUR</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-1">
                    <span>{t.total}:</span>
                    <span>{totals.total.toFixed(2)} EUR</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={resetForm}>
            {t.reset}
          </Button>
          <Button type="submit" className="bg-corporate-blue hover:bg-corporate-blue-dark">
            {t.generateInvoice}
          </Button>
        </div>
      </form>
    </div>
  );
}