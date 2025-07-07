import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { Service } from '../types/service';
import { translations } from '../utils/translations';

interface ServiceTableProps {
  language: 'de' | 'en' | 'he' | 'fr';
  services: Service[];
  onServiceSelect?: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

export default function ServiceTable({ 
  language, 
  services, 
  onServiceSelect,
  onEdit, 
  onDelete 
}: ServiceTableProps) {
  const t = translations[language];

  if (services.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t.noServices}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t.serviceName}</TableHead>
          <TableHead>{t.category}</TableHead>
          <TableHead>{t.serviceDescription}</TableHead>
          <TableHead>{t.hourlyRate}</TableHead>
          <TableHead className="text-right">{t.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell 
              className="font-medium"
              onClick={() => onServiceSelect?.(service)}
            >
              {service.name}
            </TableCell>
            <TableCell onClick={() => onServiceSelect?.(service)}>
              {service.category}
            </TableCell>
            <TableCell onClick={() => onServiceSelect?.(service)}>
              {service.description}
            </TableCell>
            <TableCell onClick={() => onServiceSelect?.(service)}>
              €{service.hourlyRate.toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(service)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(service.id)}
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