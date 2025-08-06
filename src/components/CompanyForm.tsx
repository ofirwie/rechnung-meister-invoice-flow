


import React, { useState, useEffect } from 'react';
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
import { useCompany } from '@/contexts/SimpleCompanyContext';
import { Company } from '@/types/company';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CompanyFormProps {
  company?: Company;
  onSuccess: () => void;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ company, onSuccess }) => {
  const { t, isRTL } = useLanguage();
  const { createCompany, updateCompany } = useCompanies();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isRootAdmin, setIsRootAdmin] = useState(false);

  useEffect(() => {
    const checkRootAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const rootAdminEmails = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'];
        setIsRootAdmin(rootAdminEmails.includes(user.email));
      }
    };
    checkRootAdmin();
  }, []);

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
    // Banking information
    bank_name: company?.bank_name || '',
    iban: company?.iban || '',
    bic: company?.bic || '',
    account_number: company?.account_number || '',
    // Company flags
    is_main_company: company?.is_main_company ?? false,
    can_be_deleted: company?.can_be_deleted ?? true,
    active: company?.active ?? true,
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website must start with http:// or https://';
    }

    if (formData.iban && !formData.iban.match(/^[A-Z]{2}\d{2}[\s]?[\d\s]*$/)) {
      newErrors.iban = 'Invalid IBAN format (example: DE89 3704 0044 0532 0130 00)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
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
        
        // Companies list will be refreshed automatically by the hook
      }
      
      onSuccess();
    } catch (error) {
      console.error('Unexpected error saving company:', error);
      toast.error('Unexpected error saving company');
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
                {t.companySettings || 'Company Settings'}
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-blue-600" />
                {t.createCompany || 'Create New Company'}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t.name || 'Name'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                placeholder={t.name || 'Company Name'}
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
                {t.businessName || 'Business Name'}
              </Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
                placeholder={t.businessName || 'Business Name'}
                disabled={loading}
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax_id" className="text-sm font-medium">
                {t.taxId || 'Tax ID / Company ID'}
              </Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder={t.taxId || 'Tax ID number'}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="german_vat_id" className="text-sm font-medium">
                {t.germanVatId || 'German VAT number'}
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
              {t.address || 'Address'}
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={t.address || 'Company address'}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                {t.phone || 'Phone'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder={t.phone || 'Phone number'}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t.email || 'Email'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder={t.email || 'Email Address'}
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
              {t.website || 'Website'}
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

          {/* Banking Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Bank Account Details
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bank_name" className="text-sm font-medium">
                  Bank Name
                </Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleChange('bank_name', e.target.value)}
                  placeholder="Bank Name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bic" className="text-sm font-medium">
                  BIC/SWIFT
                </Label>
                <Input
                  id="bic"
                  value={formData.bic}
                  onChange={(e) => handleChange('bic', e.target.value.toUpperCase())}
                  placeholder="DEUTDEFF"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="iban" className="text-sm font-medium">
                  IBAN
                </Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => handleChange('iban', e.target.value.toUpperCase())}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className={errors.iban ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.iban && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.iban}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number" className="text-sm font-medium">
                  Account Number
                </Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => handleChange('account_number', e.target.value)}
                  placeholder="1234567890"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="default_currency" className="text-sm font-medium">
                {t.defaultCurrency || 'Default Currency'}
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
                {t.fiscalYearStart || 'Fiscal Year Start'}
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
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => handleChange('active', checked)}
                disabled={loading}
              />
              <Label htmlFor="active" className="text-sm font-medium">
                {t.active || 'Active'}
              </Label>
            </div>

            {/* Main Company Flag - Only for root admins */}
            {isRootAdmin && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_main_company"
                  checked={formData.is_main_company}
                  onCheckedChange={(checked) => handleChange('is_main_company', checked)}
                  disabled={loading}
                />
                <Label htmlFor="is_main_company" className="text-sm font-medium">
                  Main company (can overwrite existing company with same tax ID)
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className={`flex gap-2 ${isRTL ? 'space-x-reverse' : ''}`}>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            t.save || 'Save'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          {t.cancel || 'Cancel'}
        </Button>
      </div>
    </form>
  );
};

///Fix: Enhanced CompanyForm with validation and improved UX
