import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Trash2 } from 'lucide-react';
import { InvoiceData, InvoiceService } from '../types/invoice';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { generateAutoInvoiceNumber } from '../utils/autoInvoiceNumber';
import { useLanguage } from '../hooks/useLanguage';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';
import { toast } from 'sonner';

interface PendingInvoiceFormProps {
  selectedClient?: Client | null;
  selectedService?: Service | null;
  onClientClear?: () => void;
  onServiceClear?: () => void;
  onSelectClient?: () => void;
  setCurrentView?: (view: 'invoice' | 'clients' | 'services' | 'history' | 'pending') => void;
}

export default function PendingInvoiceForm({ 
  selectedClient,
  selectedService,
  onClientClear,
  onServiceClear,
  onSelectClient,
  setCurrentView 
}: PendingInvoiceFormProps) {
  const { t } = useLanguage();
  const { saveInvoice } = useSupabaseInvoices();
  
  // Simple form state - just the essentials
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceNumber: '',
      servicePeriodStart: startOfMonth.toISOString().split('T')[0],
      servicePeriodEnd: endOfMonth.toISOString().split('T')[0],
      clientName: '',
      clientCompany: '',
      clientAddress: '',
      clientCity: '',
      clientPostalCode: '',
      clientEmail: '',
      clientCountry: 'Israel',
    };
  });

  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [services, setServices] = useState<InvoiceService[]>([
    { id: '1', description: '', hours: 0, rate: 0, currency: 'EUR', amount: 0, addedToInvoice: true }
  ]);
  const [exchangeRate, setExchangeRate] = useState<number>(3.91);

  // Single, clean useEffect for client selection
  useEffect(() => {
    if (selectedClient) {
      console.log('🔄 [PendingInvoice] Client selected:', selectedClient.company_name);
      
      // Auto-fill client data immediately
      const clientData = {
        clientName: selectedClient.contact_name || '',
        clientCompany: selectedClient.company_name || '',
        clientAddress: selectedClient.address || '',
        clientCity: selectedClient.city || '',
        clientPostalCode: selectedClient.postal_code || selectedClient.postalCode || '',
        clientEmail: selectedClient.email || '',
        clientCountry: selectedClient.country || 'Israel',
      };

      console.log('🔄 [PendingInvoice] Setting client data:', clientData);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        ...clientData
      }));

      // Auto-calculate due date (invoice date + 10 days)
      const invoiceDate = new Date(formData.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 10);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      setFormData(prev => ({ ...prev, dueDate: dueDateStr }));

      // Generate invoice number automatically (no regenerate button)
      if (!formData.invoiceNumber) {
        generateInvoiceNumber(selectedClient);
      }
    }
  }, [selectedClient]); // Only depend on selectedClient

  // Handle service selection
  useEffect(() => {
    if (selectedService) {
      console.log('🔄 [PendingInvoice] Service selected:', selectedService.name);
      
      const serviceRate = selectedService.hourlyRate || selectedService.default_rate || 0;
      const serviceCurrency = selectedService.currency || 'EUR';
      
      const serviceData: InvoiceService = {
        id: '1',
        description: selectedService.name || '',
        hours: 1,
        rate: serviceRate,
        currency: serviceCurrency,
        amount: serviceRate,
        addedToInvoice: true
      };
      
      console.log('🔄 [PendingInvoice] Setting service data:', serviceData);
      setServices([serviceData]);
    }
  }, [selectedService]);

  // Simple invoice number generation
  const generateInvoiceNumber = async (client: Client) => {
    setIsGeneratingNumber(true);
    try {
      const clientCompanyName = client.company_name || client.company || '';
      const autoNumber = await generateAutoInvoiceNumber(clientCompanyName);
      
      setFormData(prev => ({ ...prev, invoiceNumber: autoNumber }));
      
      console.log('✅ [PendingInvoice] Generated invoice number:', autoNumber);
      toast.success(`Invoice number generated: ${autoNumber}`);
      
    } catch (error) {
      console.error('❌ Failed to generate invoice number:', error);
      
      // Simple fallback
      const fallbackNumber = `${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
      setFormData(prev => ({ ...prev, invoiceNumber: fallbackNumber }));
      
      toast.error('Using fallback invoice number');
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Basic validation - email is no longer required since we're only generating PDFs
      const requiredFields = ['clientName', 'clientCompany', 'clientAddress', 'clientCity'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
        return;
      }

      if (!formData.invoiceNumber) {
        toast.error('Invoice number is required');
        return;
      }

      // Calculate totals
      const addedServices = services.filter(s => s.addedToInvoice);
      
      if (addedServices.length === 0) {
        toast.error('Please add at least one service');
        return;
      }

      const subtotal = addedServices.reduce((sum, service) => sum + service.amount, 0);
      const vatAmount = 0; // No VAT for now
      const total = subtotal;

      // Create the invoice data in the correct format for the database
      const invoiceData: InvoiceData = {
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        servicePeriodStart: formData.servicePeriodStart || formData.invoiceDate,
        servicePeriodEnd: formData.servicePeriodEnd || formData.dueDate,
        language: 'en' as const,
        currency: 'EUR',
        clientCompany: formData.clientCompany,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientAddress: formData.clientAddress,
        clientCity: formData.clientCity,
        clientPostalCode: formData.clientPostalCode,
        clientCountry: formData.clientCountry,
        clientBusinessLicense: '', // Optional field
        clientCompanyRegistration: '', // Optional field
        services: addedServices,
        exchangeRate: exchangeRate,
        subtotal,
        vatAmount,
        total,
        status: 'pending_approval' as const, // Start as pending approval
        createdAt: new Date().toISOString()
      };

      console.log('💾 Saving invoice to database:', invoiceData);
      
      // Actually save the invoice to the database
      await saveInvoice(invoiceData);
      
      toast.success('✅ Pending invoice created successfully!');
      console.log('✅ Invoice saved successfully');
      
      // Navigate to pending invoices table to show the created invoice
      if (setCurrentView) {
        setCurrentView('pending');
      }
      
    } catch (error) {
      console.error('❌ Error creating pending invoice:', error);
      toast.error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Service management functions
  const calculateTotals = useMemo(() => {
    const subtotal = services
      .filter(service => service.addedToInvoice)
      .reduce((sum, service) => sum + service.amount, 0);
    
    return {
      subtotal,
      vatAmount: 0,
      total: subtotal
    };
  }, [services]);

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

  const addService = () => {
    const newId = (Math.max(...services.map(s => parseInt(s.id))) + 1).toString();
    setServices([...services, { 
      id: newId, 
      description: '', 
      hours: 0, 
      rate: 0, 
      currency: 'EUR', 
      amount: 0, 
      addedToInvoice: true 
    }]);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Pending Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, invoiceDate: e.target.value }));
                  
                  // Auto-update due date when invoice date changes
                  if (e.target.value) {
                    const invoiceDate = new Date(e.target.value);
                    const dueDate = new Date(invoiceDate);
                    dueDate.setDate(dueDate.getDate() + 10);
                    const dueDateStr = dueDate.toISOString().split('T')[0];
                    setFormData(prev => ({ ...prev, dueDate: dueDateStr }));
                  }
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="invoiceNumber">
                Invoice Number
                <span className="text-xs text-muted-foreground ml-2">(Auto-generated)</span>
              </Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber || (isGeneratingNumber ? 'Generating...' : '')}
                readOnly
                className="bg-muted cursor-not-allowed"
                placeholder={isGeneratingNumber ? 'Generating...' : 'Select customer first'}
              />
            </div>
          </div>

          <div>
            <Label>Service Period</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="servicePeriodStart" className="text-sm text-muted-foreground">From</Label>
                <Input
                  id="servicePeriodStart"
                  type="date"
                  value={formData.servicePeriodStart || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, servicePeriodStart: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="servicePeriodEnd" className="text-sm text-muted-foreground">To</Label>
                <Input
                  id="servicePeriodEnd"
                  type="date"
                  value={formData.servicePeriodEnd || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, servicePeriodEnd: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Customer Details</CardTitle>
          <div className="flex gap-2">
            {selectedClient && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedClient.company_name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClientClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onSelectClient) {
                  onSelectClient();
                } else if (setCurrentView) {
                  // Remember where we came from so we can return here
                  console.log('🔄 [PendingInvoice] Setting return view to pending-form');
                  sessionStorage.setItem('clientSelectionReturnView', 'pending-form');
                  setCurrentView('clients');
                }
              }}
            >
              {selectedClient ? 'Change Customer' : 'Select Customer'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedClient && (
            <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground">
              <p className="mb-2">👆 Please select a customer first</p>
              <p className="text-sm">Customer details will auto-fill once selected</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Contact Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder={selectedClient ? "Auto-filled from customer" : "Select customer first"}
                required
              />
            </div>

            <div>
              <Label htmlFor="clientCompany">Company Name *</Label>
              <Input
                id="clientCompany"
                value={formData.clientCompany}
                onChange={(e) => setFormData(prev => ({ ...prev, clientCompany: e.target.value }))}
                placeholder={selectedClient ? "Auto-filled from customer" : "Select customer first"}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="clientAddress">Address *</Label>
            <Textarea
              id="clientAddress"
              value={formData.clientAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
              rows={3}
              placeholder={selectedClient ? "Auto-filled from customer" : "Select customer first"}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="clientCity">City *</Label>
              <Input
                id="clientCity"
                value={formData.clientCity}
                onChange={(e) => setFormData(prev => ({ ...prev, clientCity: e.target.value }))}
                placeholder={selectedClient ? "Auto-filled" : "Select customer first"}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="clientPostalCode">Postal Code</Label>
              <Input
                id="clientPostalCode"
                value={formData.clientPostalCode}
                onChange={(e) => setFormData(prev => ({ ...prev, clientPostalCode: e.target.value }))}
                placeholder={selectedClient ? "Auto-filled" : "Select customer first"}
              />
            </div>

            <div>
              <Label htmlFor="clientCountry">Country</Label>
              <Select 
                value={formData.clientCountry} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, clientCountry: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deutschland">Deutschland</SelectItem>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="Israel">Israel</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="clientEmail">Email (Optional for PDF generation)</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder={selectedClient ? "Auto-filled from customer" : "Select customer first"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Service Selection</CardTitle>
          <div className="flex gap-2">
            {selectedService && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Selected: {selectedService.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onServiceClear}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (setCurrentView) {
                  // Remember where we came from so we can return here
                  console.log('🔄 [PendingInvoice] Setting service return view to pending-form');
                  sessionStorage.setItem('serviceSelectionReturnView', 'pending-form');
                  setCurrentView('services');
                }
              }}
            >
              {selectedService ? 'Change Service' : 'Select Service'}
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
                    {selectedService.currency === 'EUR' ? '€' : '₪'}
                    {selectedService.hourlyRate?.toFixed(2) || selectedService.default_rate?.toFixed(2)} / hour
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground">
              <p className="mb-2">👆 Please select a service</p>
              <p className="text-sm">Service details will auto-fill once selected</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Services & Pricing</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="exchangeRate">Exchange Rate (EUR/ILS):</Label>
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
              Add Service
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
                      {service.addedToInvoice ? 'Include in Invoice' : 'Not Included'}
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
                  <Label>Description</Label>
                  <Textarea
                    value={service.description}
                    onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                    rows={2}
                    disabled={!service.addedToInvoice}
                    required={service.addedToInvoice}
                    placeholder={selectedService ? "Auto-filled from selected service" : "Enter service description"}
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={service.hours || ''}
                      onChange={(e) => handleServiceChange(index, 'hours', e.target.value)}
                      disabled={!service.addedToInvoice}
                      required={service.addedToInvoice}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      step="10"
                      value={service.rate || ''}
                      onChange={(e) => handleServiceChange(index, 'rate', e.target.value)}
                      disabled={!service.addedToInvoice}
                      required={service.addedToInvoice}
                      placeholder={selectedService ? "Auto-filled" : "0"}
                    />
                  </div>

                  <div>
                    <Label>Currency</Label>
                    <Select 
                      value={service.currency} 
                      onValueChange={(value) => handleServiceChange(index, 'currency', value)}
                      disabled={!service.addedToInvoice}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="ILS">ILS (₪)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Total</Label>
                    <Input
                      type="number"
                      value={service.amount?.toFixed(2) || '0.00'}
                      readOnly
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 text-right">
            <div className="flex justify-between">
              <span className="font-medium">Subtotal:</span>
              <span>€{calculateTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">VAT (0%):</span>
              <span>€{calculateTotals.vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>€{calculateTotals.total.toFixed(2)}</span>
            </div>
            {exchangeRate && exchangeRate !== 1 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total in ILS (≈{exchangeRate} rate):</span>
                <span>₪{(calculateTotals.total * exchangeRate).toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setCurrentView && setCurrentView('invoice')}
        >
          ← Back to Full Invoice Form
        </Button>
        
        <Button 
          type="submit" 
          size="lg"
          disabled={!selectedClient || isGeneratingNumber || calculateTotals.total === 0}
        >
          Create Pending Invoice (€{calculateTotals.total.toFixed(2)})
        </Button>
      </div>

      {/* Debug info */}
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        <strong>Debug:</strong> Customer: {selectedClient?.company_name || 'None'} | 
        Service: {selectedService?.name || 'None'} |
        Invoice #: {formData.invoiceNumber || 'Not generated'} |
        Services: {services.filter(s => s.addedToInvoice).length} |
        Total: €{calculateTotals.total.toFixed(2)}
      </div>
    </form>
  );
}
