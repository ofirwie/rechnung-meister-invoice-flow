import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Download } from 'lucide-react';
import { InvoiceHistory } from '../types/invoiceHistory';
import { translations } from '../utils/translations';
import { formatGermanDate, formatCurrency } from '../utils/formatters';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface InvoiceHistoryTableProps {
  language: 'de' | 'en';
  onInvoiceView?: (invoice: InvoiceHistory) => void;
}

export default function InvoiceHistoryTable({ language, onInvoiceView }: InvoiceHistoryTableProps) {
  const t = translations[language];
  const isRTL = false;
  
  const [invoices] = useLocalStorage<InvoiceHistory[]>('invoice-history', []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: InvoiceHistory['status']) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-gray-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: InvoiceHistory['status']) => {
    switch (status) {
      case 'issued':
        return language === 'de' ? 'Ausgestellt' : 'Issued';
      case 'approved':
        return language === 'de' ? 'Genehmigt' : 'Approved';
      case 'pending_approval':
        return language === 'de' ? 'Zur Genehmigung' : 'Pending Approval';
      case 'draft':
        return language === 'de' ? 'Entwurf' : 'Draft';
      case 'cancelled':
        return t.cancelled;
      default:
        return status;
    }
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">{t.invoiceHistory}</h2>
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
                          onClick={() => onInvoiceView?.(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Future: Add PDF download functionality
                            console.log('Download invoice:', invoice.invoiceNumber);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-corporate-blue">
                  {filteredInvoices.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Gesamte Rechnungen' : 'Total Invoices'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredInvoices.filter(i => i.status === 'issued').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getStatusText('issued')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredInvoices.filter(i => i.status === 'pending_approval').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getStatusText('pending_approval')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {filteredInvoices.filter(i => i.status === 'cancelled').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {getStatusText('cancelled')}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-corporate-blue">
                  {formatCurrency(
                    filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
                    language
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Gesamtwert' : 'Total Value'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}