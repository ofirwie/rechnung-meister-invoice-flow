import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/hooks/useLanguage';
import { useCompanies } from '@/hooks/useCompanies';
import { useCompany } from '@/contexts/CompanyContext';
import { Company } from '@/types/company';
import { toast } from 'sonner';

interface CompanyFormProps {
  company?: Company;
  onSuccess: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company, onSuccess }) => {
  const { t, isRTL } = useLanguage();
  const { createCompany, updateCompany } = useCompanies();
  const { refreshCompanies } = useCompany();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: company?.name || '',
    business_name: company?.business_name || '',
    tax_id: company?.tax_id || '',
    german_vat_id: (company as any)?.german_vat_id || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    default_currency: company?.default_currency || 'EUR',
    fiscal_year_start: company?.fiscal_year_start || 1,
    active: company?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const companyData = {
        ...formData,
        settings: {
          ...((company?.settings as any) || {}),
        },
      };

      if (company) {
        await updateCompany(company.id, companyData);
        toast.success(t.save + ' ' + t.companySettings);
      } else {
        const result = await createCompany(companyData);
        if (result) {
          toast.success(t.createCompany);
          // רענון הקונטקסט
          refreshCompanies();
        } else {
          toast.error('Failed to create company');
          return;
        }
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Error saving company');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{company ? t.companySettings : t.createCompany}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                placeholder={t.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name">{t.businessName}</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder={t.businessName}
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_id">{t.taxId}</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder={t.taxId}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="german_vat_id">{t.germanVatId}</Label>
              <Input
                id="german_vat_id"
                value={formData.german_vat_id}
                onChange={(e) => handleChange('german_vat_id', e.target.value)}
                placeholder="DE123456789"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="address">{t.address}</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t.address}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t.phone}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t.email}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">{t.website}</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {/* Financial Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_currency">{t.defaultCurrency}</Label>
              <Select
                value={formData.default_currency}
                onValueChange={(value) => handleChange('default_currency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="ILS">ILS - Israeli Shekel</SelectItem>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal_year_start">{t.fiscalYearStart}</Label>
              <Select
                value={formData.fiscal_year_start.toString()}
                onValueChange={(value) => handleChange('fiscal_year_start', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => handleChange('active', checked)}
            />
            <Label htmlFor="active">{t.active}</Label>
          </div>
        </CardContent>
      </Card>

      <div className={`flex gap-2 ${isRTL ? 'space-x-reverse' : ''}`}>
        <Button type="submit" disabled={loading}>
          {loading ? '...' : t.save}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          {t.cancel}
        </Button>
      </div>
    </form>
  );
};