// German date formatting utilities
export const formatGermanDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format currency for German business standards
export const formatCurrency = (amount: number, language: string = 'de'): string => {
  return new Intl.NumberFormat(language === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format hours with German decimal formatting
export const formatHours = (hours: number): string => {
  return hours.toFixed(2).replace('.', ',');
};

// Generate invoice number format: ClientName-1, ClientName-2, etc.
export const generateInvoiceNumber = (clientName: string, sequenceNumber: number = 1): string => {
  const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
  return `${cleanClientName}-${sequenceNumber}`;
};

// Calculate due date (default 10 days from invoice date)
export const calculateDueDate = (invoiceDate: string, daysDue: number = 10): string => {
  if (!invoiceDate) return '';
  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + daysDue);
  return date.toISOString().split('T')[0];
};