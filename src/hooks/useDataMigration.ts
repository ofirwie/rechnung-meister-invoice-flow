import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocalStorage } from './useLocalStorage';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { InvoiceData } from '../types/invoice';
import { InvoiceHistory } from '../types/invoiceHistory';

export function useDataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>('');
  
  const [localClients] = useLocalStorage<Client[]>('invoice-clients', []);
  const [localServices] = useLocalStorage<Service[]>('invoice-services', []);
  const [localInvoices] = useLocalStorage<InvoiceData[]>('invoice-data', []);
  const [localHistory] = useLocalStorage<InvoiceHistory[]>('invoice-history', []);

  const migrateToSupabase = async () => {
    setIsMigrating(true);
    setMigrationStatus('מתחיל העברת נתונים...');

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('יש להתחבר לפני העברת הנתונים');
      }

      // Migrate clients
      if (localClients.length > 0) {
        setMigrationStatus(`מעביר ${localClients.length} לקוחות...`);
        
        const clientsData = localClients.map(client => ({
          company_name: client.company_name,
          contact_name: client.contact_name,
          address: client.address,
          city: client.city,
          postal_code: client.postalCode,
          country: client.country,
          email: client.email,
          phone: client.phone,
          tax_id: client.taxId,
          business_license: client.businessLicense,
          company_registration: client.companyRegistration,
          user_id: user.id
        }));

        const { error: clientsError } = await supabase
          .from('clients')
          .insert(clientsData);

        if (clientsError) throw clientsError;
      }

      // Migrate services
      if (localServices.length > 0) {
        setMigrationStatus(`מעביר ${localServices.length} שירותים...`);
        
        const servicesData = localServices.map(service => ({
          name: service.name,
          description: service.description,
          default_rate: service.hourlyRate,
          currency: service.currency,
          user_id: user.id
        }));

        const { error: servicesError } = await supabase
          .from('services')
          .insert(servicesData);

        if (servicesError) throw servicesError;
      }

      // Migrate invoices
      if (localInvoices.length > 0) {
        setMigrationStatus(`מעביר ${localInvoices.length} חשבוניות...`);
        
        const invoicesData = localInvoices.map(invoice => ({
          invoice_number: invoice.invoiceNumber,
          invoice_date: invoice.invoiceDate,
          service_period_start: invoice.servicePeriodStart,
          service_period_end: invoice.servicePeriodEnd,
          due_date: invoice.dueDate,
          language: invoice.language,
          currency: invoice.currency,
          client_company: invoice.clientCompany,
          client_address: invoice.clientAddress,
          client_city: invoice.clientCity,
          client_postal_code: invoice.clientPostalCode,
          client_country: invoice.clientCountry,
          client_business_license: invoice.clientBusinessLicense,
          client_company_registration: invoice.clientCompanyRegistration,
          services: JSON.stringify(invoice.services),
          exchange_rate: invoice.exchangeRate,
          subtotal: invoice.subtotal,
          vat_amount: invoice.vatAmount,
          total: invoice.total,
          status: invoice.status,
          approved_at: invoice.approvedAt,
          approved_by: invoice.approvedBy,
          issued_at: invoice.issuedAt,
          user_id: user.id
        }));

        const { error: invoicesError } = await supabase
          .from('invoices')
          .insert(invoicesData);

        if (invoicesError) throw invoicesError;
      }

      setMigrationStatus('ההעברה הושלמה בהצלחה!');
      
      // Clear localStorage after successful migration
      localStorage.removeItem('invoice-clients');
      localStorage.removeItem('invoice-services'); 
      localStorage.removeItem('invoice-data');
      localStorage.removeItem('invoice-history');
      
      return true;
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus(`שגיאה בהעברת הנתונים: ${error.message}`);
      return false;
    } finally {
      setIsMigrating(false);
    }
  };

  const hasLocalData = () => {
    return localClients.length > 0 || 
           localServices.length > 0 || 
           localInvoices.length > 0 || 
           localHistory.length > 0;
  };

  return {
    isMigrating,
    migrationStatus,
    migrateToSupabase,
    hasLocalData,
    localDataCounts: {
      clients: localClients.length,
      services: localServices.length,
      invoices: localInvoices.length,
      history: localHistory.length
    }
  };
}