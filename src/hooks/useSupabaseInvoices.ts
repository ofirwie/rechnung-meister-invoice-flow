import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceData } from '../types/invoice';
import { InvoiceHistory } from '../types/invoiceHistory';

export function useSupabaseInvoices() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Load invoices from Supabase
  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .is('deleted_at', null) // Only load non-deleted invoices
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInvoices: InvoiceData[] = data.map(invoice => ({
        invoiceNumber: invoice.invoice_number,
        invoiceDate: invoice.invoice_date,
        servicePeriodStart: invoice.service_period_start,
        servicePeriodEnd: invoice.service_period_end,
        dueDate: invoice.due_date,
        language: invoice.language as 'de' | 'en',
        currency: 'EUR',
        clientCompany: invoice.client_company,
        clientAddress: invoice.client_address,
        clientCity: invoice.client_city,
        clientPostalCode: invoice.client_postal_code || '',
        clientCountry: invoice.client_country,
        clientBusinessLicense: invoice.client_business_license,
        clientCompanyRegistration: invoice.client_company_registration,
        services: typeof invoice.services === 'string' ? JSON.parse(invoice.services) : (Array.isArray(invoice.services) ? invoice.services as any[] : []),
        exchangeRate: invoice.exchange_rate,
        subtotal: invoice.subtotal,
        vatAmount: invoice.vat_amount,
        total: invoice.total,
        status: invoice.status as InvoiceData['status'],
        createdAt: invoice.created_at,
        approvedAt: invoice.approved_at,
        approvedBy: invoice.approved_by,
        issuedAt: invoice.issued_at
      }));

      setInvoices(formattedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load invoice history from Supabase
  const loadInvoiceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedHistory: InvoiceHistory[] = data.map(item => ({
        id: item.id,
        invoiceNumber: item.invoice_number,
        clientId: item.client_id || '',
        clientName: item.client_name,
        amount: item.amount,
        currency: item.currency,
        status: item.status as InvoiceHistory['status'],
        createdAt: item.created_at,
        dueDate: item.due_date,
        servicePeriodFrom: item.service_period_from,
        servicePeriodTo: item.service_period_to,
        language: item.language as 'de' | 'en'
      }));

      setInvoiceHistory(formattedHistory);
    } catch (error) {
      console.error('Error loading invoice history:', error);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadInvoiceHistory();
  }, []);

  const saveInvoice = async (invoice: InvoiceData) => {
    try {
      // Get current user from session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('User not authenticated. Please log in to save invoices.');
      }
      
      const user = session.user;

      const { error } = await supabase
        .from('invoices')
        .upsert({
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
          user_id: user.id  // Add user_id to satisfy RLS policy
        });

      if (error) throw error;
      
      await loadInvoices();
      await loadInvoiceHistory();
    } catch (error) {
      console.error('Error saving invoice:', error);
      throw error;
    }
  };

  const updateInvoiceStatus = async (invoiceNumber: string, status: InvoiceData['status']) => {
    try {
      // Get current user from session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('User not authenticated. Please log in to update invoice status.');
      }
      
      const user = session.user;

      const updateData: any = { status };
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.email || 'User';
      } else if (status === 'issued') {
        updateData.issued_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('invoice_number', invoiceNumber)
        .eq('user_id', user.id); // Ensure user can only update their own invoices

      if (error) throw error;
      
      await loadInvoices();
      await loadInvoiceHistory();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  };

  const deleteInvoice = async (invoiceNumber: string) => {
    try {
      // Get current user from session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('User not authenticated. Please log in to delete invoices.');
      }
      
      const user = session.user;

      // First, get the invoice to check its status
      const { data: invoiceData, error: fetchError } = await supabase
        .from('invoices')
        .select('status')
        .eq('invoice_number', invoiceNumber)
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        throw new Error('Invoice not found or access denied.');
      }

      // Prevent deletion of approved or issued invoices
      if (invoiceData.status === 'approved' || invoiceData.status === 'issued') {
        throw new Error('אסור למחוק חשבוניות שאושרו או הונפקו! זהו הפרה של חוקי הנהלת חשבונות.\n\nCannot delete approved or issued invoices! This violates accounting regulations.\n\nרק חשבוניות עם סטטוס "טיוטה" ניתנות למחיקה.\nOnly invoices with "draft" status can be deleted.');
      }

      // Use soft delete instead of hard delete
      const { error } = await supabase
        .from('invoices')
        .update({ deleted_at: new Date().toISOString() })
        .eq('invoice_number', invoiceNumber)
        .eq('user_id', user.id); // Ensure user can only delete their own invoices

      if (error) throw error;
      
      await loadInvoices();
      await loadInvoiceHistory();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  };

  const getPendingInvoices = () => {
    return invoices.filter(invoice => 
      invoice.status === 'draft' || invoice.status === 'pending_approval'
    );
  };

  return {
    invoices,
    invoiceHistory,
    loading,
    saveInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    loadInvoices,
    loadInvoiceHistory,
    getPendingInvoices
  };
}