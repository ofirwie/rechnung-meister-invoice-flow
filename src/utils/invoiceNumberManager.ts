import { InvoiceHistory } from '../types/invoiceHistory';

// Get the next unique invoice number for a client
export const getNextInvoiceNumber = (clientId: string, clientName: string, existingInvoices: InvoiceHistory[]): string => {
  // Filter invoices for this specific client
  const clientInvoices = existingInvoices.filter(invoice => invoice.clientId === clientId);
  
  // Get the highest sequence number for this client
  let maxSequence = 0;
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  
  clientInvoices.forEach(invoice => {
    const match = invoice.invoiceNumber.match(new RegExp(`^${cleanClientName}-(\\d+)$`));
    if (match) {
      const sequence = parseInt(match[1], 10);
      if (sequence > maxSequence) {
        maxSequence = sequence;
      }
    }
  });
  
  return `${cleanClientName}-${maxSequence + 1}`;
};

// Check if an invoice number already exists
export const isInvoiceNumberUnique = (invoiceNumber: string, existingInvoices: InvoiceHistory[], excludeId?: string): boolean => {
  return !existingInvoices.some(invoice => 
    invoice.invoiceNumber === invoiceNumber && invoice.id !== excludeId
  );
};

// Validate invoice number format
export const validateInvoiceNumber = (invoiceNumber: string): boolean => {
  const pattern = /^[a-zA-Z0-9]+-\d+$/;
  return pattern.test(invoiceNumber);
};