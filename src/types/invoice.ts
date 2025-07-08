export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  servicePeriodStart: string;
  servicePeriodEnd: string;
  dueDate: string;
  language: 'de' | 'en';
  currency: 'EUR';
  
  // Client information
  clientCompany: string;
  clientAddress: string;
  clientCity: string;
  clientPostalCode: string;
  clientCountry: string;
  
  // Services
  services: InvoiceService[];
  
  // Exchange rate (when converting from ILS to EUR)
  exchangeRate?: number;
  
  // Calculated totals
  subtotal: number;
  vatAmount: number;
  total: number;
  
  // Draft and approval workflow
  status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'cancelled';
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  issuedAt?: string;
}

export interface InvoiceService {
  id: string;
  description: string;
  hours: number;
  rate: number;
  currency: 'EUR' | 'ILS';
  amount: number; // Always in EUR for the invoice
  originalAmount?: number; // Original amount in service currency
  exchangeRateUsed?: number; // Exchange rate used for conversion
  addedToInvoice?: boolean;
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