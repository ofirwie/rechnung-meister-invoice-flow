import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, Send } from 'lucide-react';
import { InvoiceData } from '../types/invoice';
import { translations } from '../utils/translations';

interface InvoiceWorkflowProps {
  invoice: InvoiceData;
  language: 'de' | 'en';
  onStatusChange: (newStatus: InvoiceData['status']) => void;
}

export default function InvoiceWorkflow({ invoice, language, onStatusChange }: InvoiceWorkflowProps) {
  const t = translations[language];

  const getStatusBadge = (status: InvoiceData['status']) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', text: t.draft, icon: FileText },
      pending_approval: { color: 'bg-yellow-500', text: t.pendingApproval, icon: Clock },
      approved: { color: 'bg-green-500', text: t.approved, icon: CheckCircle },
      issued: { color: 'bg-blue-500', text: t.issued, icon: Send }
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getAvailableActions = () => {
    switch (invoice.status) {
      case 'draft':
        return [
          {
            label: t.submitForApproval,
            action: () => onStatusChange('pending_approval'),
            variant: 'default' as const
          }
        ];
      case 'pending_approval':
        return [
          {
            label: t.approveInvoice,
            action: () => onStatusChange('approved'),
            variant: 'default' as const
          },
          {
            label: t.backToDraft,
            action: () => onStatusChange('draft'),
            variant: 'outline' as const
          }
        ];
      case 'approved':
        return [
          {
            label: t.issueInvoice,
            action: () => onStatusChange('issued'),
            variant: 'default' as const
          },
          {
            label: t.backToDraft,
            action: () => onStatusChange('draft'),
            variant: 'outline' as const
          }
        ];
      case 'issued':
        return [];
      default:
        return [];
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t.invoiceStatus}</span>
          {getStatusBadge(invoice.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {getAvailableActions().map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              onClick={action.action}
              className={action.variant === 'default' ? 'bg-corporate-blue hover:bg-corporate-blue-dark' : ''}
            >
              {action.label}
            </Button>
          ))}
        </div>
        
        {invoice.status !== 'draft' && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>נוצר ב: {new Date(invoice.createdAt).toLocaleDateString('he-IL')}</p>
            {invoice.approvedAt && (
              <p>אושר ב: {new Date(invoice.approvedAt).toLocaleDateString('he-IL')}</p>
            )}
            {invoice.issuedAt && (
              <p>הונפק ב: {new Date(invoice.issuedAt).toLocaleDateString('he-IL')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}