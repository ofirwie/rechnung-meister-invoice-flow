export interface Client {
  id: string;
  companyName: string;
  contactName?: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
  email?: string;
  phone?: string;
  taxId?: string;
  createdAt: string;
  updatedAt: string;
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
}