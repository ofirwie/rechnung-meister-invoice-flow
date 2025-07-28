import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { Client } from '../types/client';
import { translations } from '../utils/translations';

interface ClientTableProps {
  language: 'de' | 'en' | 'he';
  clients: Client[];
  onClientSelect: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
}

export default function ClientTable({ 
  language, 
  clients, 
  onClientSelect, 
  onEdit, 
  onDelete 
}: ClientTableProps) {
  const t = translations[language];

  if (clients.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t.noClients}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.clientCompany}</TableHead>
          <TableHead>{t.contactName}</TableHead>
          <TableHead>{t.clientCity}</TableHead>
          <TableHead>Licensed dealer number</TableHead>
          <TableHead>Company ID</TableHead>
          <TableHead>{t.email}</TableHead>
          <TableHead>{t.phone}</TableHead>
          <TableHead className="text-right">{t.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell 
              className="font-medium"
              onClick={() => onClientSelect(client)}
            >
              {client.company_name}
            </TableCell>
            <TableCell onClick={() => onClientSelect(client)}>
              {client.contact_name}
            </TableCell>
            <TableCell onClick={() => onClientSelect(client)}>
              {client.city}, {client.country}
            </TableCell>
            <TableCell onClick={() => onClientSelect(client)}>
              {client.businessLicense}
            </TableCell>
            <TableCell onClick={() => onClientSelect(client)}>
              {client.companyRegistration}
            </TableCell>
            <TableCell onClick={() => onClientSelect(client)}>
              {client.email}
            </TableCell>
            <TableCell onClick={() => onClientSelect(client)}>
              {client.phone}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(client)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(client.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}