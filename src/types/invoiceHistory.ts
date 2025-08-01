export interface InvoiceHistory {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'cancelled';
  createdAt: string;
  dueDate: string;
  servicePeriodFrom: string;
  servicePeriodTo: string;
  language: 'de' | 'en';
}