export interface Client {
  id: string;
  company_name: string;
  company?: string; // alias for company_name
  contact_name?: string;
  contactPerson?: string; // alias for contact_name
  address: string;
  city: string;
  postal_code?: string;
  postalCode?: string; // alias for postal_code
  country: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  taxId?: string; // alias for tax_id
  business_license?: string; // מספר עוסק מורשה
  businessLicense?: string; // alias for business_license
  company_registration?: string; // ח.פ
  companyRegistration?: string; // alias for company_registration
  customerReference?: string;
  created_at: string;
  createdAt: string; // alias for created_at
  updated_at: string;
  updatedAt: string; // alias for updated_at
}

export interface ClientFormData {
  companyName: string;
  contactName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  taxId: string;
  businessLicense: string;
  companyRegistration: string;
}