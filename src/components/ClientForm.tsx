import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Client, ClientFormData } from '../types/client';
import { translations } from '../utils/translations';
import { useClientParser } from '../hooks/useClientParser';

interface ClientFormProps {
  language: 'de' | 'en' | 'he';
  formData: ClientFormData;
  editingClient: Client | null;
  onInputChange: (field: keyof ClientFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onUpdateFormData: (data: Partial<ClientFormData>) => void;
}

export default function ClientForm({ 
  language, 
  formData, 
  editingClient, 
  onInputChange, 
  onSubmit, 
  onCancel,
  onUpdateFormData 
}: ClientFormProps) {
  const t = translations[language];
  const { pasteText, setPasteText, parseClientInfo, resetPasteText } = useClientParser();

  const handleParseAndUpdate = async () => {
    const parsedData = await parseClientInfo(pasteText);
    onUpdateFormData(parsedData);
    resetPasteText();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Smart Paste Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <Label htmlFor="pasteText">Paste Client Details (Copy & Paste)</Label>
          <textarea
            id="pasteText"
            className="w-full h-24 p-2 border rounded-md resize-none mt-2"
            placeholder="Paste client details here - email, address, contact info, or any client information..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleParseAndUpdate}
            >
              Parse Details (AI)
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="companyName">{t.clientCompany} *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => onInputChange('companyName', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactName">{t.contactName}</Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) => onInputChange('contactName', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">{t.email}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t.phone}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="taxId">{t.taxId}</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => onInputChange('taxId', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="businessLicense">Licensed dealer number</Label>
          <Input
            id="businessLicense"
            value={formData.businessLicense}
            onChange={(e) => onInputChange('businessLicense', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="companyRegistration">Company registration number</Label>
          <Input
            id="companyRegistration"
            value={formData.companyRegistration}
            onChange={(e) => onInputChange('companyRegistration', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">{t.clientAddress} *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => onInputChange('address', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">{t.clientCity} *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => onInputChange('city', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="postalCode">{t.postalCode}</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => onInputChange('postalCode', e.target.value)}
          />
        </div>
      </div>
      
      <div className="sticky bottom-0 bg-white border-t pt-4 mt-6">
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t.cancel}
          </Button>
          <Button type="submit" className="bg-corporate-blue hover:bg-corporate-blue-dark min-w-[100px]">
            {t.save}
          </Button>
        </div>
      </div>
    </form>
  );
}