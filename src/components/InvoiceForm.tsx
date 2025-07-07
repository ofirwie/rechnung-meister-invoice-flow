import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { InvoiceData, InvoiceService } from '../types/invoice';
import { translations } from '../utils/translations';
import { generateInvoiceNumber, calculateDueDate } from '../utils/formatters';

interface InvoiceFormProps {
  onInvoiceGenerated: (invoice: InvoiceData) => void;
  language: 'de' | 'en' | 'he';
  onLanguageChange: (language: 'de' | 'en' | 'he') => void;
}

export default function InvoiceForm({ onInvoiceGenerated, language, onLanguageChange }: InvoiceFormProps) {
  const t = translations[language];
  
  const [formData, setFormData] = useState<Partial<InvoiceData>>({
    invoiceDate: new Date().toISOString().split('T')[0],
    servicePeriodFrom: '',
    servicePeriodTo: '',
    dueDate: '',
    language: language,
    currency: 'EUR',
    clientCountry: 'Israel',
    services: []
  });

  const [services, setServices] = useState<InvoiceService[]>([
    { id: '1', description: '', hours: 0, rate: 0, amount: 0 }
  ]);

  // Auto-calculate due date when invoice date changes
  useEffect(() => {
    if (formData.invoiceDate) {
      const dueDate = calculateDueDate(formData.invoiceDate);
      setFormData(prev => ({ ...prev, dueDate }));
    }
  }, [formData.invoiceDate]);

  // Auto-generate invoice number when client company changes
  useEffect(() => {
    if (formData.clientCompany) {
      const invoiceNumber = generateInvoiceNumber(formData.clientCompany);
      setFormData(prev => ({ ...prev, invoiceNumber }));
    }
  }, [formData.clientCompany]);

  const handleInputChange = (field: keyof InvoiceData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addService = () => {
    const newService: InvoiceService = {
      id: Date.now().toString(),
      description: '',
      hours: 0,
      rate: 0,
      amount: 0
    };
    setServices(prev => [...prev, newService]);
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
        if (field === 'hours' || field === 'rate') {
          updated.amount = Number(updated.hours) * Number(updated.rate);
        }
        return updated;
      }
      return service;
    }));
  };

  const calculateTotals = () => {
    const subtotal = services.reduce((sum, service) => sum + service.amount, 0);
    return {
      subtotal,
      vatAmount: 0, // VAT-exempt for Germany to Israel
      total: subtotal
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totals = calculateTotals();
    
    const invoice: InvoiceData = {
      ...formData as InvoiceData,
      services,
      ...totals
    };
    
    onInvoiceGenerated(invoice);
  };

  const resetForm = () => {
    setFormData({
      invoiceDate: new Date().toISOString().split('T')[0],
      servicePeriodFrom: '',
      servicePeriodTo: '',
      dueDate: '',
      language: language,
      currency: 'EUR',
      clientCountry: 'Israel',
      services: []
    });
    setServices([{ id: '1', description: '', hours: 0, rate: 0, amount: 0 }]);
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
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate || ''}
                onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">{t.dueDate}</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="servicePeriodFrom">{t.servicePeriod} {t.from} *</Label>
              <Input
                id="servicePeriodFrom"
                type="date"
                value={formData.servicePeriodFrom || ''}
                onChange={(e) => handleInputChange('servicePeriodFrom', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="servicePeriodTo">{t.servicePeriod} {t.to} *</Label>
              <Input
                id="servicePeriodTo"
                type="date"
                value={formData.servicePeriodTo || ''}
                onChange={(e) => handleInputChange('servicePeriodTo', e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-corporate-blue">{t.clientInfo}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="clientCompany">{t.clientCompany} *</Label>
              <Input
                id="clientCompany"
                value={formData.clientCompany || ''}
                onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                required
              />
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

        {/* Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-corporate-blue">{t.services}</CardTitle>
            <Button type="button" onClick={addService} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t.addService}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-2">
                  <Label>{t.serviceDescription} *</Label>
                  <Textarea
                    value={service.description}
                    onChange={(e) => updateService(service.id, 'description', e.target.value)}
                    placeholder={t.serviceDescription}
                    required
                    className="min-h-[80px]"
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
                  />
                </div>
                <div>
                  <Label>{t.amount}</Label>
                  <Input
                    type="text"
                    value={service.amount.toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="flex items-end">
                  {services.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeService(service.id)}
                      className="text-red-600 hover:text-red-700"
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