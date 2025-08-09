import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../utils/translations';
import { generateAutoInvoiceNumber } from '../utils/autoInvoiceNumber';

export default function ManualInvoice() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Client details
    clientCompany: '',
    clientAddress: '',
    clientCity: '',
    clientPostalCode: '',
    clientEmail: '',
    
    // Invoice details
    invoiceDate: new Date().toISOString().split('T')[0],
    
    // Service details
    serviceName: '',
    hours: '',
    hourlyRate: '',
    
    // Additional notes
    notes: ''
  });

  // Calculate total automatically
  const total = formData.hours && formData.hourlyRate 
    ? parseFloat(formData.hours) * parseFloat(formData.hourlyRate) 
    : 0;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.clientCompany || !formData.serviceName || !formData.hours || !formData.hourlyRate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('You must be logged in to create invoices');
      }

      // Generate invoice number
      const invoiceNumber = await generateAutoInvoiceNumber(formData.clientCompany);

      // Calculate due date (30 days from invoice date)
      const dueDate = new Date(formData.invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Service period (same as invoice date for manual invoices)
      const servicePeriodStart = formData.invoiceDate;
      const servicePeriodEnd = formData.invoiceDate;

      // Prepare invoice data to match database schema
      const invoiceData = {
        user_id: session.user.id,
        invoice_number: invoiceNumber,
        client_company: formData.clientCompany,
        client_address: formData.clientAddress,
        client_city: formData.clientCity,
        client_postal_code: formData.clientPostalCode,
        client_country: 'Israel', // Default country
        client_email: formData.clientEmail,
        invoice_date: formData.invoiceDate,
        due_date: dueDate.toISOString().split('T')[0],
        service_period_start: servicePeriodStart,
        service_period_end: servicePeriodEnd,
        service_description: formData.serviceName,
        quantity: parseFloat(formData.hours),
        rate: parseFloat(formData.hourlyRate),
        subtotal: total,
        vat_rate: 0, // No VAT for now
        vat_amount: 0,
        total: total, // This matches the database schema
        currency: 'ILS',
        language: 'en',
        notes: formData.notes,
        status: 'draft'
      };

      // Save to database
      const { error: insertError } = await supabase
        .from('invoices')
        .insert(invoiceData);

      if (insertError) {
        console.error('Error saving invoice:', insertError);
        throw insertError;
      }

      // Success!
      toast.success('Invoice created and saved successfully!');
      
      // Generate PDF (simple alert for now - you can implement PDF generation later)
      alert(`PDF would be generated here for Invoice #${invoiceNumber}\n\nClient: ${formData.clientCompany}\nService: ${formData.serviceName}\nHours: ${formData.hours}\nRate: ₪${formData.hourlyRate}\nTotal: ₪${total.toFixed(2)}`);
      
      // Reset form
      setFormData({
        clientCompany: '',
        clientAddress: '',
        clientCity: '',
        clientPostalCode: '',
        clientEmail: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        serviceName: '',
        hours: '',
        hourlyRate: '',
        notes: ''
      });

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">📝 Manual Invoice</CardTitle>
          <CardDescription>
            Create an invoice manually by filling in all the details
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Client Information</h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="clientCompany">Company Name *</Label>
                  <Input
                    id="clientCompany"
                    type="text"
                    value={formData.clientCompany}
                    onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                    placeholder="e.g. SHALAM PACKAGING SOLUTIONS LTD."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientAddress">Address</Label>
                  <Input
                    id="clientAddress"
                    type="text"
                    value={formData.clientAddress}
                    onChange={(e) => handleInputChange('clientAddress', e.target.value)}
                    placeholder="e.g. Industrial Zone, Building 5"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientCity">City</Label>
                    <Input
                      id="clientCity"
                      type="text"
                      value={formData.clientCity}
                      onChange={(e) => handleInputChange('clientCity', e.target.value)}
                      placeholder="e.g. Tel Aviv"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientPostalCode">Postal Code</Label>
                    <Input
                      id="clientPostalCode"
                      type="text"
                      value={formData.clientPostalCode}
                      onChange={(e) => handleInputChange('clientPostalCode', e.target.value)}
                      placeholder="e.g. 12345"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="e.g. contact@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Invoice Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Invoice Details</h3>
              
              <div>
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => handleInputChange('invoiceDate', e.target.value)}
                />
              </div>
            </div>

            {/* Service Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Service Details</h3>
              
              <div>
                <Label htmlFor="serviceName">Service Name *</Label>
                <Input
                  id="serviceName"
                  type="text"
                  value={formData.serviceName}
                  onChange={(e) => handleInputChange('serviceName', e.target.value)}
                  placeholder="e.g. Web Development, Consulting, Design..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hours">Hours *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.hours}
                    onChange={(e) => handleInputChange('hours', e.target.value)}
                    placeholder="e.g. 40"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hourlyRate">Rate per Hour (₪) *</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                    placeholder="e.g. 150"
                    required
                  />
                </div>
              </div>
              
              {/* Total Display */}
              {total > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border">
                  <div className="text-xl font-bold text-green-800">
                    Total: ₪{total.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">
                    {formData.hours} hours × ₪{formData.hourlyRate} = ₪{total.toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Additional Notes</h3>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information or special terms..."
                  rows={3}
                />
              </div>
            </div>

          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full text-lg py-6"
              disabled={loading || !formData.clientCompany || !formData.serviceName || !formData.hours || !formData.hourlyRate}
            >
              {loading ? '⏳ Creating Invoice...' : '🚀 Create PDF & Save Invoice'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
