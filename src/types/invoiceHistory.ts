export interface InvoiceHistory {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  dueDate: string;
  servicePeriodFrom: string;
  servicePeriodTo: string;
  language: 'de' | 'en' | 'he' | 'fr';
}