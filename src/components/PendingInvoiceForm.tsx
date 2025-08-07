import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { Client } from '../types/client';
import { generateAutoInvoiceNumber } from '../utils/autoInvoiceNumber';
import { useLanguage } from '../hooks/useLanguage';
import { toast } from 'sonner';

interface PendingInvoiceFormProps {
  selectedClient?: Client | null;
  onClientClear?: () => void;
  onSelectClient?: () => void;
  setCurrentView?: (view: 'invoice' | 'clients' | 'services' | 'history' | 'pending') => void;
}

export default function PendingInvoiceForm({ 
  selectedClient,
  onClientClear,
  onSelectClient,
  setCurrentView 
}: PendingInvoiceFormProps) {
  const { t } = useLanguage();
  
  // Simple form state - just the essentials
  const [formData, setFormData] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceNumber: '',
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientCity: '',
    clientPostalCode: '',
    clientEmail: '',
    clientCountry: 'Israel',
  });

  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

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
    
    // Basic validation
    const requiredFields = ['clientName', 'clientCompany', 'clientAddress', 'clientCity', 'clientEmail'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    
    if (missingFields.length > 0) {
      toast.error(`Please fill required fields: ${missingFields.join(', ')}`);
      return;
    }

    if (!formData.invoiceNumber) {
      toast.error('Invoice number is required');
      return;
    }

    toast.success('Pending invoice created successfully!');
    console.log('📋 Pending Invoice Data:', formData);
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
            <Label htmlFor="clientEmail">Email *</Label>
            <Input
              id="clientEmail"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder={selectedClient ? "Auto-filled from customer" : "Select customer first"}
              required
            />
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
          disabled={!selectedClient || isGeneratingNumber}
        >
          Create Pending Invoice
        </Button>
      </div>

      {/* Debug info */}
      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        <strong>Debug:</strong> Customer: {selectedClient?.company_name || 'None'} | 
        Invoice #: {formData.invoiceNumber || 'Not generated'} |
        Fields filled: {Object.values(formData).filter(v => v && v.trim() !== '').length}/10
      </div>
    </form>
  );
}
