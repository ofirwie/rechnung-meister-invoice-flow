import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Check, X } from 'lucide-react';
import { InvoiceHistory } from '../types/invoiceHistory';
import { translations } from '../utils/translations';
import { formatGermanDate, formatCurrency } from '../utils/formatters';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface PendingInvoicesTableProps {
  language: 'de' | 'en' | 'he';
  onInvoiceView?: (invoice: InvoiceHistory, fromPending?: boolean) => void;
}

export default function PendingInvoicesTable({ language, onInvoiceView }: PendingInvoicesTableProps) {
  const t = translations[language];
  const isRTL = language === 'he';
  
  const [invoices, setInvoices] = useLocalStorage<InvoiceHistory[]>('invoice-history', []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(invoice =>
    (invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
     invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status: InvoiceHistory['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: InvoiceHistory['status']) => {
    switch (status) {
      case 'paid':
        return language === 'de' ? 'Bezahlt' : language === 'he' ? 'שולם' : 'Paid';
      case 'sent':
        return language === 'de' ? 'Gesendet' : language === 'he' ? 'נשלח' : 'Sent';
      case 'overdue':
        return language === 'de' ? 'Überfällig' : language === 'he' ? 'באיחור' : 'Overdue';
      case 'draft':
        return language === 'de' ? 'Entwurf' : language === 'he' ? 'טיוטה' : 'Draft';
      case 'cancelled':
        return t.cancelled;
      default:
        return status;
    }
  };

  const handleApproveInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'sent' as const }
        : invoice
    ));
  };

  const handleCancelInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: 'cancelled' as const }
        : invoice
    ));
  };

  const needsApproval = (status: InvoiceHistory['status']) => {
    return status === 'draft';
  };

  const canBeCancelled = (status: InvoiceHistory['status']) => {
    return status === 'draft';
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">{t.pendingInvoices}</h2>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={`${t.search} ${t.invoiceNumber.toLowerCase()}, ${t.clientCompany.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? t.noInvoices : t.noInvoices}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.invoiceNumber}</TableHead>
                  <TableHead>{t.clientCompany}</TableHead>
                  <TableHead>{t.amount}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead>{t.invoiceDate}</TableHead>
                  <TableHead>{t.dueDate}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium font-mono">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(invoice.amount, invoice.language)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {getStatusText(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatGermanDate(invoice.createdAt.split('T')[0])}
                    </TableCell>
                    <TableCell>
                      {formatGermanDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onInvoiceView?.(invoice, true)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {t.viewInvoice}
                        </Button>
                        {needsApproval(invoice.status) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApproveInvoice(invoice.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {t.approveInvoice}
                          </Button>
                        )}
                        {canBeCancelled(invoice.status) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelInvoice(invoice.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            {t.cancelInvoice}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {filteredInvoices.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-corporate-blue">
                  {filteredInvoices.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Gesamte Rechnungen' : 
                   language === 'he' ? 'סה"כ חשבוניות' : 'Total Invoices'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {filteredInvoices.filter(i => i.status === 'draft').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.approvalRequired}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredInvoices.filter(i => i.status === 'sent').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getStatusText('sent')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {filteredInvoices.filter(i => i.status === 'overdue').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getStatusText('overdue')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}