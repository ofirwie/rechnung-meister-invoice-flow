import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceData } from '../types/invoice';

export function useSupabaseInvoices() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load invoices from Supabase
  const loadInvoices = async () => {
    try {
      // 🔧 CRITICAL FIX: Add user authentication and filtering
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Auth error in loadInvoices:', authError);
        throw authError;
      }
      
      if (!session?.user) {
        console.log('⚠️ No authenticated user - invoices will be empty');
        setInvoices([]);
        setLoading(false);
        return;
      }
      
      console.log('🔍 Loading invoices for user:', session.user.email);
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id) // 🔧 FIX: Add user filtering for RLS compliance
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

  useEffect(() => {
    loadInvoices();
  }, []);

  const saveInvoice = async (invoice: InvoiceData) => {
    try {
      console.log('🔄 Starting invoice save process...');
      console.log('📄 Invoice data to save:', invoice);
      
      // Get current user from session
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Authentication error:', authError);
        throw new Error(`Authentication error: ${authError.message}`);
      }
      
      if (!session?.user) {
        console.error('❌ No user session found');
        throw new Error('User not authenticated. Please log in to save invoices.');
      }
      
      const user = session.user;
      console.log('✅ User authenticated:', user.id);

      // Prepare the data for database insertion
      const dbData = {
        invoice_number: invoice.invoiceNumber,
        invoice_date: invoice.invoiceDate,
        service_period_start: invoice.servicePeriodStart,
        service_period_end: invoice.servicePeriodEnd,
        due_date: invoice.dueDate,
        language: invoice.language,
        currency: invoice.currency,
        client_company: invoice.clientCompany,
        client_address: invoice.clientAddress,
        client_city: invoice.clientCity || 'Unknown', // Provide fallback for required field
        client_postal_code: invoice.clientPostalCode || '',
        client_country: invoice.clientCountry,
        client_business_license: invoice.clientBusinessLicense || null,
        client_company_registration: invoice.clientCompanyRegistration || null,
        services: JSON.stringify(invoice.services),
        exchange_rate: invoice.exchangeRate || null,
        subtotal: invoice.subtotal,
        vat_amount: invoice.vatAmount,
        total: invoice.total,
        status: invoice.status,
        approved_at: invoice.approvedAt || null,
        approved_by: invoice.approvedBy || null,
        issued_at: invoice.issuedAt || null,
        user_id: user.id
      };
      
      console.log('💾 Database payload:', dbData);
      
      // Validate required fields before sending to database
      const requiredFields = ['invoice_number', 'invoice_date', 'client_company', 'client_address', 'client_city', 'client_country'];
      const missingFields = requiredFields.filter(field => !dbData[field as keyof typeof dbData]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      const { data, error } = await supabase
        .from('invoices')
        .upsert(dbData)
        .select(); // Add select to get the inserted data back

      if (error) {
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Provide more specific error messages based on common issues
        if (error.code === '23502') {
          throw new Error(`Database constraint violation: ${error.message}. Please check all required fields are filled.`);
        } else if (error.code === '23505') {
          throw new Error(`Duplicate entry: ${error.message}. This invoice number may already exist.`);
        } else if (error.code === '42703') {
          throw new Error(`Database column error: ${error.message}. There may be a field mapping issue.`);
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }
      
      console.log('✅ Invoice saved successfully:', data);
      
      await loadInvoices();
      
      console.log('✅ Invoice save process completed successfully');
    } catch (error) {
      console.error('❌ Error saving invoice:', error);
      
      // Re-throw with more context if it's a generic error
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error(`Unknown error occurred while saving invoice: ${String(error)}`);
      }
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

      // First, check the current status of the invoice
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('status')
        .eq('invoice_number', invoiceNumber)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !currentInvoice) {
        throw new Error('Invoice not found or access denied.');
      }

      // Business rule validation
      if (currentInvoice.status === 'approved' || currentInvoice.status === 'issued') {
        if (status === 'cancelled') {
          throw new Error('Cannot cancel approved or issued invoices! This violates business rules.');
        }
        // Only allow status progression, not regression
        if (status !== 'issued' && currentInvoice.status === 'approved') {
          throw new Error('Approved invoices can only be marked as issued, not edited or cancelled.');
        }
      }

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

  const getApprovedInvoices = () => {
    return invoices.filter(invoice => 
      invoice.status === 'approved' || invoice.status === 'issued'
    );
  };

  return {
    invoices,
    loading,
    saveInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    loadInvoices,
    getPendingInvoices,
    getApprovedInvoices
  };
}
