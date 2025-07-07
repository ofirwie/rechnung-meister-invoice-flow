import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceFormData, Service } from '../types/service';
import { translations } from '../utils/translations';

interface ServiceFormProps {
  language: 'de' | 'en' | 'he' | 'fr';
  formData: ServiceFormData;
  editingService: Service | null;
  onInputChange: (field: keyof ServiceFormData, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function ServiceForm({ 
  language, 
  formData, 
  editingService, 
  onInputChange, 
  onSubmit, 
  onCancel
}: ServiceFormProps) {
  const t = translations[language];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="serviceName">{t.serviceName} *</Label>
          <Input
            id="serviceName"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">{t.category}</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">{t.serviceDescription} *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="hourlyRate">{t.hourlyRate} *</Label>
          <Input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            value={formData.hourlyRate}
            onChange={(e) => onInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">{t.currency} *</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value: 'EUR' | 'ILS') => onInputChange('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="ILS">ILS (₪)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.cancel}
        </Button>
        <Button type="submit" className="bg-corporate-blue hover:bg-corporate-blue-dark">
          {t.save}
        </Button>
      </div>
    </form>
  );
}