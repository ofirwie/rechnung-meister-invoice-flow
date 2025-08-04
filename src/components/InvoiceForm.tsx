import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
import { generateAutoInvoiceNumber, checkInvoiceNumberExists } from '../utils/autoInvoiceNumber';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useLanguage } from '../hooks/useLanguage';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';
import { toast } from 'sonner';


interface InvoiceFormProps {
  onInvoiceGenerated: (invoice: InvoiceData) => void;
  selectedClient?: Client | null;
  selectedService?: Service | null;
  onClientClear?: () => void;
  onServiceClear?: () => void;
  onSelectClient?: () => void;
  setCurrentView?: (view: 'invoice' | 'clients' | 'services' | 'history' | 'pending') => void;
}

export default function InvoiceForm({ 
  onInvoiceGenerated, 
  selectedClient, 
  selectedService, 
  onClientClear, 
  onServiceClear,
  onSelectClient,
  setCurrentView 
}: InvoiceFormProps) {
  // Circuit breaker to prevent infinite renders (moved BEFORE hooks)
  const renderCountRef = React.useRef(0);
  const lastPropsRef = React.useRef<string>('');
  
  // Create a stable reference for props comparison
  const currentPropsString = JSON.stringify({ 
    selectedClient: selectedClient?.id || selectedClient?.company_name, 
    selectedService: selectedService?.id || selectedService?.name 
  });
  
  // Reset render count when actual props change
  if (lastPropsRef.current !== currentPropsString) {
    renderCountRef.current = 0;
    lastPropsRef.current = currentPropsString;
  }
  
  renderCountRef.current += 1;
  
  // Check for infinite loop but don't return early
  const hasRenderLoop = renderCountRef.current > 50;
  if (hasRenderLoop) {
    console.error('🚨 INFINITE RENDER DETECTED! Render count:', renderCountRef.current);
  }
  
  // ALWAYS call hooks in the same order
  const { language, t, changeLanguage } = useLanguage();
  const { saveInvoice, invoiceHistory } = useSupabaseInvoices();
  
  const [clients] = useLocalStorage<Client[]>('invoice-clients', []);
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  
  // Memoize date calculations to prevent infinite re-renders
  const monthDates = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0]
    };
  }, []); // Empty dependency array - only calculate once

  const [formData, setFormData] = useState<Partial<InvoiceData>>(() => ({
    invoiceDate: new Date().toISOString().split('T')[0],
    servicePeriodStart: monthDates.start,
    servicePeriodEnd: monthDates.end,
    dueDate: '',
    language: 'de', // Set static initial value
    currency: 'EUR',
    clientCountry: 'Israel',
    clientCity: '',
    clientPostalCode: '',
    services: [],
    invoiceNumber: '' // Will be auto-generated
  }));

  const [services, setServices] = useState<InvoiceService[]>([
    { id: '1', description: '', hours: 0, rate: 0, currency: 'EUR', amount: 0, addedToInvoice: true }
  ]);

  const [exchangeRate, setExchangeRate] = useState<number>(3.91);

  // Track previous values to prevent unnecessary updates
  const prevLanguageRef = React.useRef(language);
  const prevInvoiceDateRef = React.useRef(formData.invoiceDate);
  const prevClientRef = React.useRef(selectedClient);

  // Set language to match current language state (only when actually different)
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      prevLanguageRef.current = language;
      setFormData(prev => ({ ...prev, language: language as 'de' | 'en' }));
    }
  }, [language]);

  // Auto-calculate due date when invoice date changes (prevent loops)
  useEffect(() => {
    if (formData.invoiceDate !== prevInvoiceDateRef.current) {
      prevInvoiceDateRef.current = formData.invoiceDate;
      
      if (formData.invoiceDate && !formData.dueDate) {
        const invoiceDate = new Date(formData.invoiceDate);
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 10);
        const dueDateStr = dueDate.toISOString().split('T')[0];
        
        setFormData(prev => ({ ...prev, dueDate: dueDateStr }));
      }
    }
  }, [formData.invoiceDate]); // Removed formData.dueDate to prevent loop

  // Stable invoice number generation function
  const generateInvoiceNumberForClient = useCallback(async (clientData: Client | null) => {
    if (!clientData?.company_name && !clientData?.company) {
      return;
    }

    setIsGeneratingNumber(true);
    try {
      const clientCompanyName = clientData.company_name || clientData.company || '';
      const autoNumber = await generateAutoInvoiceNumber(clientCompanyName);
      
      setFormData(prev => {
        // Only update if different to prevent loops
        if (prev.invoiceNumber !== autoNumber) {
          return { ...prev, invoiceNumber: autoNumber };
        }
        return prev;
      });
      console.log('✅ Auto-generated invoice number for client:', clientCompanyName, '→', autoNumber);
    } catch (error) {
      console.error('❌ Failed to generate invoice number:', error);
      
      // Fallback to timestamp-based number if auto-generation fails
      const fallbackNumber = `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, invoiceNumber: fallbackNumber }));
      
      toast.error('Could not generate automatic invoice number. Using fallback number.');
    } finally {
      setIsGeneratingNumber(false);
    }
  }, []);

  // Handle client selection (with circuit breaker)
  useEffect(() => {
    const currentClient = selectedClient;
    const prevClient = prevClientRef.current;
    
    // Only update if client actually changed
    if (currentClient && currentClient !== prevClient) {
      prevClientRef.current = currentClient;
      
      const client = currentClient;
      
      setFormData(prev => ({
        ...prev,
        clientName: client.contact_name || client.contactPerson || '',
        clientCompany: client.company_name || client.company || '',
        clientAddress: client.address,
        clientCity: client.city || '',
        clientPostalCode: client.postal_code || '',
        clientEmail: client.email,
        clientCountry: client.country,
        clientReference: client.customerReference || ''
      }));
      
      // Generate invoice number for the new client
      generateInvoiceNumberForClient(currentClient);
    }
  }, [selectedClient]); // Removed generateInvoiceNumberForClient to prevent loop

  // Handle service selection
  useEffect(() => {
    if (selectedService) {
      const serviceRate = selectedService.hourlyRate || selectedService.default_rate || 0;
      const serviceCurrency = selectedService.currency || 'EUR';
      setServices([{
        id: '1',
        description: selectedService.name || '',
        hours: 1,
        rate: serviceRate,
        currency: serviceCurrency,
        amount: serviceRate,
        addedToInvoice: true
      }]);
    }
  }, [selectedService]);

  const calculateTotals = () => {
    const subtotal = services
      .filter(service => service.addedToInvoice)
      .reduce((sum, service) => {
        return sum + service.amount;
      }, 0);
    
    return {
      subtotal,
      vatAmount: 0,
      total: subtotal
    };
  };

  const totals = useMemo(() => calculateTotals(), [services]);

  const handleServiceChange = (index: number, field: keyof InvoiceService, value: any) => {
    const newServices = [...services];
    newServices[index] = { ...newServices[index], [field]: value };
    
    if (field === 'hours' || field === 'rate') {
      const hours = Number(newServices[index].hours) || 0;
      const rate = Number(newServices[index].rate) || 0;
      newServices[index].amount = hours * rate;
    }
    
    setServices(newServices);
  };

  const handleLanguageChange = (lang: 'de' | 'en') => {
    changeLanguage(lang);
    setFormData(prev => ({ ...prev, language: lang }));
  };

  const addService = () => {
    const newId = (Math.max(...services.map(s => parseInt(s.id))) + 1).toString();
    setServices([...services, { id: newId, description: '', hours: 0, rate: 0, currency: 'EUR', amount: 0, addedToInvoice: true }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const toggleServiceInInvoice = (index: number) => {
    const newServices = [...services];
    newServices[index].addedToInvoice = !newServices[index].addedToInvoice;
    setServices(newServices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 Starting invoice submission process...');
    
    const addedServices = services.filter(s => s.addedToInvoice);
    
    if (addedServices.length === 0) {
      console.log('❌ No services added to invoice');
      toast.error(t.pleaseAddService || 'Please add at least one service to the invoice');
      return;
    }
    
    // Validate that we have an invoice number
    if (!formData.invoiceNumber) {
      console.log('❌ No invoice number found');
      toast.error('Invoice number is required. Please refresh the page to generate a new number.');
      return;
    }
    
    // Validate required fields
    const requiredFields = ['clientName', 'clientCompany', 'clientAddress', 'clientCity', 'clientEmail'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      console.log('🔄 Checking if invoice number exists:', formData.invoiceNumber);
      
      // Check if invoice number already exists (double-check for uniqueness)
      const exists = await checkInvoiceNumberExists(formData.invoiceNumber);
      if (exists) {
        console.log('⚠️ Invoice number already exists, generating new one');
        toast.error('Invoice number already exists. Generating a new one...');
        
        // Generate a new unique number
        const clientCompanyName = selectedClient?.company_name || selectedClient?.company || formData.clientCompany || '';
        const newNumber = await generateAutoInvoiceNumber(clientCompanyName);
        setFormData(prev => ({ ...prev, invoiceNumber: newNumber }));
        toast.success(`New invoice number generated: ${newNumber}`);
        return;
      }
      
      console.log('✅ Invoice number is unique, preparing invoice data...');
      
      const invoice: InvoiceData = {
        ...formData as InvoiceData,
        services: addedServices,
        currency: formData.currency || 'EUR',
        subtotal: totals.subtotal,
        vatRate: 0,
        vatAmount: totals.vatAmount,
        total: totals.total,
        exchangeRate: exchangeRate,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
      
      console.log('🔄 Attempting to save invoice:', {
        invoiceNumber: invoice.invoiceNumber,
        clientCompany: invoice.clientCompany,
        total: invoice.total,
        services: invoice.services.length,
        formDataKeys: Object.keys(formData),
        invoiceKeys: Object.keys(invoice)
      });
      
      // Enhanced error handling with more specific messages
      try {
        // Save to database
        await saveInvoice(invoice);
        
        console.log('✅ Invoice saved successfully!');
        toast.success(`Invoice ${invoice.invoiceNumber} saved successfully!`);
        
        // Also call the callback for any additional processing
        onInvoiceGenerated(invoice);
        
      } catch (saveError) {
        console.error('❌ Detailed save error:', saveError);
        
        // Provide more helpful error messages based on error type
        let errorMessage = 'Failed to save invoice';
        
        if (saveError instanceof Error) {
          const error = saveError;
          
          if (error.message.includes('Authentication')) {
            errorMessage = 'Authentication error. Please log in again and try saving.';
          } else if (error.message.includes('constraint')) {
            errorMessage = 'Data validation error. Please check all required fields are properly filled.';
          } else if (error.message.includes('duplicate') || error.message.includes('23505')) {
            errorMessage = 'This invoice number already exists. A new number will be generated.';
            
            // Auto-generate new number and retry
            const clientCompanyName = selectedClient?.company_name || selectedClient?.company || formData.clientCompany || '';
            const newNumber = await generateAutoInvoiceNumber(clientCompanyName);
            setFormData(prev => ({ ...prev, invoiceNumber: newNumber }));
            toast.success(`New invoice number generated: ${newNumber}. Please try saving again.`);
            return;
          } else if (error.message.includes('Missing required fields')) {
            errorMessage = `Missing data: ${error.message}`;
          } else {
            errorMessage = `Save error: ${error.message}`;
          }
        }
        
        toast.error(errorMessage);
        throw saveError; // Re-throw for the outer catch block
      }
      
    } catch (error) {
      console.error('❌ Error saving invoice:', error);
      console.error('❌ Complete error context:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        formData: {
          invoiceNumber: formData.invoiceNumber,
          clientCompany: formData.clientCompany,
          clientName: formData.clientName,
          clientAddress: formData.clientAddress,
          clientCity: formData.clientCity,
          clientEmail: formData.clientEmail,
          services: addedServices.length,
          total: totals.total
        },
        environment: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      });
      
      // Final fallback error message if not already handled above
      if (!error?.message?.includes('New invoice number generated')) {
        toast.error(`Failed to save invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // CIRCUIT BREAKER: Render error state if infinite loop detected
  if (hasRenderLoop) {
    return (
      <div className="p-4 border border-red-500 bg-red-50">
        <h3 className="text-red-700 font-bold">Render Loop Detected</h3>
        <p className="text-red-600">The form has been stopped to prevent infinite rendering. Please refresh the page.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.newInvoice}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant={language === 'de' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('de')}
            >
              Deutsch
            </Button>
            <Button
              type="button"
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLanguageChange('en')}
            >
              English
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceDate">{t.invoiceDate}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.invoiceDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.invoiceDate ? format(new Date(formData.invoiceDate), 'PPP', { locale: de }) : <span>{t.selectDate}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.invoiceDate ? new Date(formData.invoiceDate) : undefined}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, invoiceDate: date.toISOString().split('T')[0] }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="dueDate">{t.dueDate}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label>{t.servicePeriod}</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={formData.servicePeriodStart || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, servicePeriodStart: e.target.value }))}
                required
              />
              <Input
                type="date"
                value={formData.servicePeriodEnd || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, servicePeriodEnd: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="invoiceNumber">
              {t.invoiceNumber}
              <span className="text-xs text-muted-foreground ml-2">(Auto-generated)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber || (isGeneratingNumber ? 'Generating...' : '')}
                readOnly
                disabled={isGeneratingNumber}
                className="bg-muted cursor-not-allowed flex-1"
                placeholder={isGeneratingNumber ? 'Generating unique number...' : 'Auto-generated'}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  setIsGeneratingNumber(true);
                  try {
                    const clientCompanyName = selectedClient?.company_name || selectedClient?.company || formData.clientCompany || '';
                    const newNumber = await generateAutoInvoiceNumber(clientCompanyName);
                    setFormData(prev => ({ ...prev, invoiceNumber: newNumber }));
                    toast.success(`New invoice number generated: ${newNumber}`);
                  } catch (error) {
                    console.error('Failed to regenerate invoice number:', error);
                    
                    // Fallback to timestamp-based number
                    const fallbackNumber = `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
                    setFormData(prev => ({ ...prev, invoiceNumber: fallbackNumber }));
                    
                    toast.error('Could not generate automatic invoice number. Using fallback number.');
                  } finally {
                    setIsGeneratingNumber(false);
                  }
                }}
                disabled={isGeneratingNumber}
              >
                {isGeneratingNumber ? 'Generating...' : 'Regenerate'}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="clientReference">{t.clientReference}</Label>
            <Input
              id="clientReference"
              value={formData.clientReference || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, clientReference: e.target.value }))}
              placeholder={t.optional}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.clientDetails}</CardTitle>
          <div className="flex gap-2">
            {selectedClient && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClientClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onSelectClient) {
                  onSelectClient();
                } else if (setCurrentView) {
                  setCurrentView('clients');
                }
              }}
            >
              {t.selectClient}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientName">{t.clientName}</Label>
            <Input
              id="clientName"
              value={formData.clientName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="clientCompany">{t.companyName}</Label>
            <Input
              id="clientCompany"
              value={formData.clientCompany || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="clientAddress">{t.address}</Label>
            <Textarea
              id="clientAddress"
              value={formData.clientAddress || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
              rows={3}
              required
              placeholder="Street address, building number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientCity">{t.clientCity || 'City'}</Label>
              <Input
                id="clientCity"
                value={formData.clientCity || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, clientCity: e.target.value }))}
                required
                placeholder="City"
              />
            </div>
            
            <div>
              <Label htmlFor="clientPostalCode">{t.postalCode || 'Postal Code'}</Label>
              <Input
                id="clientPostalCode"
                value={formData.clientPostalCode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, clientPostalCode: e.target.value }))}
                placeholder="Postal/ZIP code"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="clientEmail">{t.email}</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="clientCountry">{t.country}</Label>
            <Select 
              value={formData.clientCountry || 'Israel'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, clientCountry: value }))}
            >
              <SelectTrigger id="clientCountry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Deutschland">Deutschland</SelectItem>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="Israel">Israel</SelectItem>
                <SelectItem value="Other">{t.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.serviceSelection}</CardTitle>
          <div className="flex gap-2">
            {selectedService && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onServiceClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (setCurrentView) {
                  setCurrentView('services');
                }
              }}
            >
              {t.selectService}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedService ? (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{selectedService.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedService.description}
                  </p>
                  <p className="text-sm font-medium mt-2">
                    {selectedService.currency === 'EUR' ? '€' : '₪'}{selectedService.hourlyRate?.toFixed(2) || selectedService.default_rate?.toFixed(2)} / {t.hour}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onServiceClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground">
              <p>{t.noServiceSelected}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  if (setCurrentView) {
                    setCurrentView('services');
                  }
                }}
              >
                {t.selectService}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t.services}</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="exchangeRate">{t.exchangeRate} (USD/EUR):</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addService}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t.addService}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={service.addedToInvoice}
                      onChange={() => toggleServiceInInvoice(index)}
                      className="h-4 w-4"
                    />
                    <Label className="text-sm font-medium">
                      {service.addedToInvoice ? t.includeInInvoice : t.notIncluded}
                    </Label>
                  </div>
                  {services.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeService(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div>
                  <Label>{t.description}</Label>
                  <Textarea
                    value={service.description}
                    onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                    rows={2}
                    disabled={!service.addedToInvoice}
                    required={service.addedToInvoice}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label>{t.hours}</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={service.hours || ''}
                      onChange={(e) => handleServiceChange(index, 'hours', e.target.value)}
                      disabled={!service.addedToInvoice}
                      required={service.addedToInvoice}
                    />
                  </div>
                  
                  <div>
                    <Label>{t.rate}</Label>
                    <Input
                      type="number"
                      step="10"
                      value={service.rate || ''}
                      onChange={(e) => handleServiceChange(index, 'rate', e.target.value)}
                      disabled={!service.addedToInvoice}
                      required={service.addedToInvoice}
                    />
                  </div>

                  <div>
                    <Label>{t.currency}</Label>
                    <Select 
                      value={service.currency} 
                      onValueChange={(value) => handleServiceChange(index, 'currency', value)}
                      disabled={!service.addedToInvoice}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ILS">ILS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>{t.total}</Label>
                    <Input
                      type="number"
                      value={service.amount?.toFixed(2) || '0.00'}
                      readOnly
                      disabled
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-right">
            <div className="flex justify-between">
              <span className="font-medium">{t.subtotal}:</span>
              <span>€{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">{t.vat} (0%):</span>
              <span>€{totals.vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>{t.total}:</span>
              <span>€{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          {t.generateInvoice}
        </Button>
      </div>
    </form>
  );
}
