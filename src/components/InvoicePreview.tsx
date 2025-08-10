import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft, Check } from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { InvoiceHistory } from '../types/invoiceHistory';
import { translations } from '../utils/translations';
import { businessInfo } from '../utils/businessInfo';
import { formatGermanDate, formatCurrency } from '../utils/formatters';
import InvoiceWorkflow from './InvoiceWorkflow';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCompany } from '../contexts/SimpleCompanyContext';

interface InvoicePreviewProps {
  invoice: InvoiceData;
  onBack: () => void;
  onStatusChange?: (newStatus: InvoiceData['status']) => void;
  fromPending?: boolean;
}

export default function InvoicePreview({ invoice, onBack, onStatusChange, fromPending }: InvoicePreviewProps) {
  const t = translations[invoice.language];
  const [invoiceHistory, setInvoiceHistory] = useLocalStorage<InvoiceHistory[]>('invoice-history', []);
  const { selectedCompany } = useCompany();

  // Convert InvoiceData to InvoiceHistory format
  const convertToHistory = (invoiceData: InvoiceData): InvoiceHistory => {
    return {
      id: invoiceData.invoiceNumber,
      invoiceNumber: invoiceData.invoiceNumber,
      clientId: invoiceData.invoiceNumber,
      clientName: invoiceData.clientCompany,
      amount: invoiceData.total,
      currency: invoiceData.currency,
      status: invoiceData.status,
      createdAt: invoiceData.createdAt,
      dueDate: invoiceData.dueDate,
      servicePeriodFrom: invoiceData.servicePeriodStart,
      servicePeriodTo: invoiceData.servicePeriodEnd,
      language: invoiceData.language,
    };
  };

  // Save invoice to history when created or updated
  useEffect(() => {
    const historyItem = convertToHistory(invoice);
    setInvoiceHistory(prev => {
      const existingIndex = prev.findIndex(item => item.invoiceNumber === invoice.invoiceNumber);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = historyItem;
        return updated;
      } else {
        return [...prev, historyItem];
      }
    });
  }, [invoice, setInvoiceHistory]);

  const handlePrint = () => {
    window.print();
  };

  // Check if any service has exchange rate info
  const hasExchangeRate = invoice.services.some(s => s.exchangeRateUsed && s.originalAmount);

  return (
    <div className="min-h-screen bg-background">
      {/* Print Actions - Hidden in print */}
      <div className="print:hidden bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.home}
          </Button>
          <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
            <Printer className="w-4 h-4 mr-2" />
            {t.print}
          </Button>
        </div>
      </div>

      {/* Workflow - Only shown if onStatusChange is provided */}
      {onStatusChange && (
        <div className="max-w-4xl mx-auto px-8 print:hidden">
          <InvoiceWorkflow 
            invoice={invoice} 
            onStatusChange={onStatusChange} 
          />
        </div>
      )}

      {/* Special Approval Button for Pending View */}
      {fromPending && onStatusChange && (invoice.status === 'draft' || !invoice.status || invoice.status === 'pending_approval') && (
        <div className="max-w-4xl mx-auto px-8 print:hidden mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-orange-800">{t.approvalRequired}</h3>
                <p className="text-sm text-orange-600">
                  {t.pendingApprovalMessage || 'This invoice is waiting for your approval.'}
                </p>
              </div>
              <Button
                onClick={() => onStatusChange('approved')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                {t.approveInvoice}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Document */}
      <div className="invoice-container max-w-4xl mx-auto bg-white p-8 print:p-6 print:max-w-none print:mx-0">
        {/* Header */}
        <div className="invoice-header text-center mb-5">
          <h1 className="text-3xl font-bold text-blue-600 mb-1">INVOICE</h1>
          <div className="text-sm">
            Invoice Number: <strong>{invoice.invoiceNumber}</strong> | 
            Invoice Date: <strong>{formatGermanDate(invoice.invoiceDate)}</strong>
          </div>
        </div>
        
        {/* Supplier and Client Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="section-box bg-gray-50 p-3 rounded">
            <div className="section-title font-bold text-blue-600 mb-2 text-sm">From:</div>
            <div className="section-content text-xs">
              <div className="font-bold">{businessInfo.name}</div>
              <div>{businessInfo.address}</div>
              <div>{businessInfo.city}, {businessInfo.country}</div>
              <div>{businessInfo.phone}</div>
              <div>{businessInfo.email}</div>
              <div className="mt-2 text-xs">
                <div>Steuernummer: {businessInfo.taxId}</div>
                {businessInfo.vatId && <div>USt-IdNr: {businessInfo.vatId}</div>}
              </div>
            </div>
          </div>
          
          <div className="section-box bg-gray-50 p-3 rounded">
            <div className="section-title font-bold text-blue-600 mb-2 text-sm">Bill To:</div>
            <div className="section-content text-xs">
              <div className="font-bold">{invoice.clientCompany}</div>
              <div>{invoice.clientAddress}</div>
              <div>{invoice.clientCity} {invoice.clientPostalCode}</div>
              <div>{invoice.clientCountry}</div>
              {invoice.clientBusinessLicense && (
                <div className="mt-2">Licensed Business Number: {invoice.clientBusinessLicense}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Invoice Information Grid */}
        <div className="invoice-info grid grid-cols-4 gap-3 mb-4 bg-gray-50 p-3 rounded">
          <div className="info-item">
            <div className="info-label text-xs text-gray-600">Service Period From</div>
            <div className="info-value font-bold text-blue-600 text-xs">{formatGermanDate(invoice.servicePeriodStart)}</div>
          </div>
          <div className="info-item">
            <div className="info-label text-xs text-gray-600">Service Period To</div>
            <div className="info-value font-bold text-blue-600 text-xs">{formatGermanDate(invoice.servicePeriodEnd)}</div>
          </div>
          <div className="info-item">
            <div className="info-label text-xs text-gray-600">Due Date</div>
            <div className="info-value font-bold text-blue-600 text-xs">{formatGermanDate(invoice.dueDate)}</div>
          </div>
          <div className="info-item">
            <div className="info-label text-xs text-gray-600">Currency</div>
            <div className="info-value font-bold text-blue-600 text-xs">{invoice.currency}</div>
          </div>
        </div>
        
        {/* Services Table */}
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-300 p-2 text-left text-xs" style={{width: '50%'}}>Service Description</th>
              <th className="border border-gray-300 p-2 text-left text-xs" style={{width: '15%'}}>Hours</th>
              <th className="border border-gray-300 p-2 text-left text-xs" style={{width: '15%'}}>Hourly Rate</th>
              <th className="border border-gray-300 p-2 text-right text-xs" style={{width: '20%'}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.services.map((service, index) => (
              <tr key={service.id}>
                <td className="border border-gray-300 p-2 text-xs">{service.description || 'Service'}</td>
                <td className="border border-gray-300 p-2 text-xs">{(service.hours || 0).toFixed(1)}</td>
                <td className="border border-gray-300 p-2 text-xs">{formatCurrency(service.rate || 0, invoice.language, invoice.currency)}</td>
                <td className="border border-gray-300 p-2 text-right font-bold text-xs">{formatCurrency(service.amount || 0, invoice.language, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Totals */}
        <div className="totals-section mb-4 border-t-2 border-blue-600 pt-3">
          <div className="flex justify-between mb-1 text-xs">
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.subtotal, invoice.language, invoice.currency)}</span>
          </div>
          <div className="flex justify-between mb-1 text-xs">
            <span>VAT (0%):</span>
            <span>{formatCurrency(invoice.vatAmount, invoice.language, invoice.currency)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-blue-600 border-t-2 border-blue-600 pt-1 mt-1">
            <span>Total Amount:</span>
            <span>{formatCurrency(invoice.total, invoice.language, invoice.currency)}</span>
          </div>
          {hasExchangeRate && invoice.services[0].exchangeRateUsed && invoice.services[0].originalAmount && (
            <div className="text-xs text-gray-600 mt-2">
              Exchange Rate: 1 EUR = {invoice.services[0].exchangeRateUsed.toFixed(2)} ILS 
              (Original amount: ₪{invoice.services[0].originalAmount.toFixed(2)})
            </div>
          )}
        </div>
        
        {/* Footer Sections */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="footer-box bg-gray-50 p-3 rounded">
            <h3 className="text-blue-600 text-sm font-bold mb-1">Payment Terms</h3>
            <p className="text-xs">Please transfer the invoice amount within 10 days, mentioning the invoice number to the bank account specified.</p>
          </div>
          
          <div className="footer-box bg-gray-50 p-3 rounded">
            <h3 className="text-blue-600 text-sm font-bold mb-1">Bank Details</h3>
            <div className="text-xs">
              <p><strong>Bank:</strong> {selectedCompany?.bank_name || businessInfo.bankName}</p>
              <p><strong>IBAN:</strong> {selectedCompany?.iban || businessInfo.iban}</p>
              <p><strong>BIC:</strong> {selectedCompany?.bic || businessInfo.bic}</p>
              <p><strong>Account:</strong> {selectedCompany?.account_number || businessInfo.accountNumber}</p>
            </div>
          </div>
        </div>
        
        {/* Reverse Charge Notice */}
        <div className="notice-box bg-yellow-50 border border-yellow-300 p-2 mb-3 rounded">
          <h4 className="text-yellow-800 text-xs font-bold mb-1">Reverse Charge</h4>
          <p className="text-yellow-700 text-xs">
            {invoice.language === 'de' 
              ? 'Gemäß § 13b UStG wird die Umsatzsteuer vom Leistungsempfänger geschuldet.'
              : 'According to § 13b UStG (German VAT Act), VAT is payable by the recipient of services.'
            }
          </p>
          <p className="text-yellow-700 text-xs">
            {invoice.language === 'de' 
              ? 'Diese Rechnung enthält keine Umsatzsteuer.'
              : 'This invoice does not contain VAT.'
            }
          </p>
        </div>
        
        {/* Thank You Message */}
        <div className="text-center">
          <div className="thank-you text-blue-600 text-sm font-bold mb-1">Thank you for your business!</div>
          <div className="archive-note text-xs text-gray-600">Archival requirement: 10 years for tax audit</div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body { 
            margin: 0; 
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print\\:hidden { display: none !important; }
          .print\\:p-6 { padding: 1.5rem !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:mx-0 { margin-left: 0 !important; margin-right: 0 !important; }
          
          .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            page-break-inside: avoid;
          }
          
          /* Ensure colors print */
          .bg-blue-600 { background-color: #0066cc !important; }
          .text-blue-600 { color: #0066cc !important; }
          .bg-gray-50 { background-color: #f5f5f5 !important; }
          .bg-yellow-50 { background-color: #fff3cd !important; }
          .border-yellow-300 { border-color: #ffeaa7 !important; }
          .text-yellow-800 { color: #856404 !important; }
          .text-yellow-700 { color: #856404 !important; }
          
          /* Table styling */
          table { border-collapse: collapse !important; }
          th { 
            background-color: #0066cc !important; 
            color: white !important;
            padding: 8px !important;
          }
          td { 
            padding: 8px !important;
            border: 1px solid #ddd !important;
          }
          
          /* Prevent page breaks in critical sections */
          .section-box, .invoice-info, .footer-box, .notice-box {
            page-break-inside: avoid;
          }
          
          /* Ensure 2-page layout */
          .totals-section {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
