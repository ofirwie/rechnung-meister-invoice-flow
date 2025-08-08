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
  const isRTL = false;
  const [invoiceHistory, setInvoiceHistory] = useLocalStorage<InvoiceHistory[]>('invoice-history', []);
  const { selectedCompany } = useCompany();

  // Convert InvoiceData to InvoiceHistory format
  const convertToHistory = (invoiceData: InvoiceData): InvoiceHistory => {
    return {
      id: invoiceData.invoiceNumber,
      invoiceNumber: invoiceData.invoiceNumber,
      clientId: invoiceData.invoiceNumber, // Using invoice number as client ID for now
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
        // Update existing invoice
        const updated = [...prev];
        updated[existingIndex] = historyItem;
        return updated;
      } else {
        // Add new invoice
        return [...prev, historyItem];
      }
    });
  }, [invoice, setInvoiceHistory]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Print Actions - Hidden in print */}
      <div className="print:hidden bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.home}
          </Button>
          <Button onClick={handlePrint} className="bg-corporate-blue hover:bg-corporate-blue-dark">
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
      {fromPending && onStatusChange && (invoice.status === 'draft' || !invoice.status) && (
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
      <div className="max-w-4xl mx-auto bg-white p-8 print:p-6 print:max-w-none print:mx-0">
        {/* Header - Centered */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold text-invoice-header">{t.invoice}</h1>
            {(invoice.status === 'draft' || !invoice.status) && (
              <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-lg text-xl font-bold print:bg-red-200 print:border-2 print:border-red-600 print:text-red-900">
                DRAFT
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            <p><strong>{t.invoiceNumber}:</strong> {invoice.invoiceNumber}</p>
            <p><strong>{t.invoiceDate}:</strong> {formatGermanDate(invoice.invoiceDate)}</p>
          </div>
        </div>

        {/* Business Info - Left Aligned */}
        <div className="mb-8">
          <div className="text-sm text-left">
            <div className="font-bold text-lg mb-2">{businessInfo.name}</div>
            <div className="text-muted-foreground">
              <p>{businessInfo.address}</p>
              <p>{businessInfo.city}</p>
              <p>{businessInfo.country}</p>
              <p className="mt-2">{businessInfo.phone}</p>
              <p>{businessInfo.email}</p>
              <p className="mt-2"><strong>Steuernummer:</strong> {businessInfo.taxId}</p>
              {businessInfo.vatId && <p><strong>USt-IdNr:</strong> {businessInfo.vatId}</p>}
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-3 text-invoice-header">{t.billTo}</h3>
          <div className="text-sm">
            <p className="font-semibold">{invoice.clientCompany}</p>
            <p>{invoice.clientAddress}</p>
            <p>{invoice.clientCity} {invoice.clientPostalCode}</p>
            <p>{invoice.clientCountry}</p>
            {invoice.clientBusinessLicense && (
              <p className="mt-2"><strong>מספר עוסק מורשה:</strong> {invoice.clientBusinessLicense}</p>
            )}
            {invoice.clientCompanyRegistration && (
              <p><strong>ח.פ:</strong> {invoice.clientCompanyRegistration}</p>
            )}
          </div>
        </div>

        {/* Invoice Details Box */}
        <div className="bg-corporate-blue-light p-4 rounded-lg mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-semibold text-corporate-blue">{t.invoiceDate}</p>
              <p>{formatGermanDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="font-semibold text-corporate-blue">{t.servicePeriodStart} - {t.servicePeriodEnd}</p>
              <p>{formatGermanDate(invoice.servicePeriodStart)} - {formatGermanDate(invoice.servicePeriodEnd)}</p>
            </div>
            <div>
              <p className="font-semibold text-corporate-blue">{t.dueDate}</p>
              <p>{formatGermanDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="font-semibold text-corporate-blue">Currency</p>
              <p>{invoice.currency}</p>
            </div>
          </div>
        </div>

        {/* Services Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-invoice-border">
            <thead>
              <tr className="bg-corporate-blue-light">
                <th className="border border-invoice-border p-3 text-left font-semibold text-corporate-blue">{t.serviceDescription}</th>
                <th className="border border-invoice-border p-3 text-center font-semibold text-corporate-blue w-20">{t.hours}</th>
                <th className="border border-invoice-border p-3 text-right font-semibold text-corporate-blue w-24">Hourly Rate</th>
                <th className="border border-invoice-border p-3 text-right font-semibold text-corporate-blue w-24">{t.amount}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.services.map((service, index) => (
                <tr key={service.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="border border-invoice-border p-3">{service.description}</td>
                  <td className="border border-invoice-border p-3 text-center">{service.hours ? service.hours.toFixed(1) : '0.0'}</td>
                   <td className="border border-invoice-border p-3 text-right">
                     {formatCurrency(service.rate || 0, invoice.language)}
                   </td>
                   <td className="border border-invoice-border p-3 text-right font-semibold">{formatCurrency(service.amount, invoice.language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-invoice-border">
              <span className="font-semibold">{t.subtotal}:</span>
              <span>{formatCurrency(invoice.subtotal, invoice.language)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-invoice-border text-sm text-muted-foreground">
              <span>VAT (0%):</span>
              <span>{formatCurrency(invoice.vatAmount, invoice.language)}</span>
            </div>
            <div className="flex justify-between py-3 text-lg font-bold border-b-2 border-corporate-blue">
              <span>{t.total}:</span>
              <span>{formatCurrency(invoice.total, invoice.language)}</span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-3 text-invoice-header">{t.paymentTerms}</h3>
          <p className="text-sm mb-4">{t.paymentText}</p>
          
          <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
            <h4 className="font-semibold mb-2 text-corporate-blue">{t.bankDetails}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Bank:</strong> {selectedCompany?.bank_name || businessInfo.bankName}</p>
                <p><strong>IBAN:</strong> {selectedCompany?.iban || businessInfo.iban}</p>
              </div>
              <div>
                <p><strong>BIC:</strong> {selectedCompany?.bic || businessInfo.bic}</p>
                <p><strong>Account:</strong> {selectedCompany?.account_number || businessInfo.accountNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-invoice-border pt-6 text-center mb-8">
          <p className="text-lg font-semibold text-corporate-blue mb-2">{t.thankYou}</p>
          <p className="text-xs text-muted-foreground">{t.archivalNote}</p>
        </div>

        {/* Reverse Charge Notice - Always on second page */}
        <div className="page-break-before bg-yellow-50 border-l-4 border-yellow-400 p-6 print:bg-white print:border print:border-yellow-400">
          <p className="text-lg font-bold text-yellow-800 mb-3">
            <strong>Reverse Charge</strong>
          </p>
          <p className="text-sm text-yellow-700 leading-relaxed">
            {invoice.language === 'de' 
              ? 'Gemäß § 13b UStG wird die Umsatzsteuer vom Leistungsempfänger geschuldet. Diese Rechnung enthält keine Umsatzsteuer.'
              : 'According to § 13b UStG (German VAT Act), VAT is payable by the recipient of services. This invoice does not contain VAT.'
            }
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .print\\:hidden { display: none !important; }
          .print\\:p-6 { padding: 1.5rem !important; }
          .print\\:max-w-none { max-width: none !important; }
          .print\\:mx-0 { margin-left: 0 !important; margin-right: 0 !important; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:border { border: 1px solid #d1d5db !important; }
          .print\\:border-gray-300 { border-color: #d1d5db !important; }
          .print\\:border-yellow-400 { border-color: #f59e0b !important; }
          .print\\:bg-red-200 { background-color: #fecaca !important; }
          .print\\:border-2 { border-width: 2px !important; }
          .print\\:border-red-600 { border-color: #dc2626 !important; }
          .print\\:text-red-900 { color: #7f1d1d !important; }
          
          /* Page break control */
          .page-break-before { 
            page-break-before: always !important; 
            break-before: page !important;
          }
          
          /* Optimize spacing for short invoices */
          .services-table-container { 
            min-height: auto !important; 
          }
          
          /* Ensure proper page distribution */
          .invoice-main-content {
            page-break-after: auto;
          }
          
          @page { 
            size: A4; 
            margin: 2cm; 
          }
        }
      `}</style>
    </div>
  );
}
