import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a unique automatic invoice number
 * Format: YYYY-NNNN (e.g., 2024-0001, 2024-0002)
 */
export async function generateAutoInvoiceNumber(): Promise<string> {
  try {
    console.log('🔢 Generating automatic invoice number...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Get the highest invoice number for this year for this user
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .like('invoice_number', `${yearPrefix}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    let nextNumber = 1;
    
    if (invoices && invoices.length > 0) {
      const lastInvoiceNumber = invoices[0].invoice_number;
      console.log('📋 Last invoice number:', lastInvoiceNumber);
      
      // Extract number from format YYYY-NNNN
      const match = lastInvoiceNumber.match(/^\d{4}-(\d{4})$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }

    // Format with leading zeros (e.g., 0001, 0002)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    const invoiceNumber = `${yearPrefix}-${formattedNumber}`;
    
    console.log('✅ Generated invoice number:', invoiceNumber);
    return invoiceNumber;
  } catch (error) {
    console.error('❌ Error generating invoice number:', error);
    throw error;
  }
}

/**
 * Checks if an invoice number already exists for the current user
 */
export async function checkInvoiceNumberExists(invoiceNumber: string): Promise<boolean> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .eq('invoice_number', invoiceNumber)
      .limit(1);

    if (error) {
      console.error('Error checking invoice number:', error);
      throw error;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking invoice number existence:', error);
    throw error;
  }
}

/**
 * Validates invoice number format (YYYY-NNNN)
 */
export function validateInvoiceNumberFormat(invoiceNumber: string): boolean {
  const pattern = /^\d{4}-\d{4}$/;
  return pattern.test(invoiceNumber);
}