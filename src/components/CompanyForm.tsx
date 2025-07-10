


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
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
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם החברה הוא שדה חובה';
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'כתובת אימייל לא תקינה';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'כתובת אתר חייבת להתחיל ב-http:// או https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('נא לתקן את השגיאות בטופס');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const companyData = {
        ...formData,
        settings: {
          ...((company?.settings as any) || {}),
        },
      };

      console.log('Submitting form with data:', companyData);

      if (company) {
        const success = await updateCompany(company.id, companyData);
        if (!success) {
          return; // Error already handled in useCompanies
        }
      } else {
        const result = await createCompany(companyData);
        if (!result) {
          return; // Error already handled in useCompanies
        }
        
        // Refresh the context to update the companies list
        await refreshCompanies();
      }
      
      onSuccess();
    } catch (error) {
      console.error('Unexpected error saving company:', error);
      toast.error('שגיאה לא צפויה בשמירת החברה');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
          <CardTitle className="flex items-center gap-2">
            {company ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                {t.companySettings || 'הגדרות חברה'}
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-blue-600" />
                {t.createCompany || 'יצירת חברה חדשה'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t.name || 'שם'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                placeholder={t.name || 'שם החברה'}
                className={errors.name ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-sm font-medium">
                {t.businessName || 'שם עסקי'}
              </Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder={t.businessName || 'שם עסקי'}
                disabled={loading}
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_id" className="text-sm font-medium">
                {t.taxId || 'ח.פ / ע.מ'}
              </Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder={t.taxId || 'מספר זיהוי מס'}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="german_vat_id" className="text-sm font-medium">
                {t.germanVatId || 'מספר מע"מ גרמני'}
              </Label>
              <Input
                id="german_vat_id"
                value={formData.german_vat_id}
                onChange={(e) => handleChange('german_vat_id', e.target.value)}
                placeholder="DE123456789"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              {t.address || 'כתובת'}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t.address || 'כתובת החברה'}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                {t.phone || 'טלפון'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t.phone || 'מספר טלפון'}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t.email || 'אימייל'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t.email || 'כתובת אימייל'}
                className={errors.email ? 'border-red-500' : ''}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium">
              {t.website || 'אתר אינטרנט'}
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              placeholder="https://example.com"
              className={errors.website ? 'border-red-500' : ''}
              disabled={loading}
            />
            {errors.website && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.website}
              </p>
            )}
          </div>

          {/* Financial Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_currency" className="text-sm font-medium">
                {t.defaultCurrency || 'מטבע ברירת מחדל'}
              </Label>
              <Select
                value={formData.default_currency}
                onValueChange={(value) => handleChange('default_currency', value)}
                disabled={loading}
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
              <Label htmlFor="fiscal_year_start" className="text-sm font-medium">
                {t.fiscalYearStart || 'תחילת שנת כספים'}
              </Label>
              <Select
                value={formData.fiscal_year_start.toString()}
                onValueChange={(value) => handleChange('fiscal_year_start', parseInt(value))}
                disabled={loading}
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
              disabled={loading}
            />
            <Label htmlFor="active" className="text-sm font-medium">
              {t.active || 'פעיל'}
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className={`flex gap-2 ${isRTL ? 'space-x-reverse' : ''}`}>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              שומר...
            </>
          ) : (
            t.save || 'שמור'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          {t.cancel || 'ביטול'}
        </Button>
      </div>
    </form>
  );
};

///Fix: Enhanced CompanyForm with validation and improved UX
