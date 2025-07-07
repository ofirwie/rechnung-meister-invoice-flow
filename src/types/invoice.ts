export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  servicePeriodFrom: string;
  servicePeriodTo: string;
  dueDate: string;
  language: 'de' | 'en' | 'he' | 'fr';
  currency: 'EUR';
  
  // Client information
  clientCompany: string;
  clientAddress: string;
  clientCity: string;
  clientPostalCode: string;
  clientCountry: string;
  
  // Services
  services: InvoiceService[];
  
  // Calculated totals
  subtotal: number;
  vatAmount: number;
  total: number;
}

export interface InvoiceService {
  id: string;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface BusinessInfo {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  taxId: string;
  bankName: string;
  iban: string;
  bic: string;
  accountNumber: string;
}