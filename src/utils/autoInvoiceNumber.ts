import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a company abbreviation from company name
 * Takes first 4 characters from words, removes spaces and special characters
 */
function generateCompanyAbbreviation(companyName: string): string {
  if (!companyName) return 'UNKN';
  
  // Remove common suffixes and clean the name
  const cleanName = companyName
    .replace(/\b(Ltd|LLC|Inc|Corp|GmbH|AG|SA|BV|Pty|Co\.?)\b/gi, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim();
  
  // Split into words and take first letters
  const words = cleanName.split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 1) {
    // Single word - take first 4 characters
    return words[0].substring(0, 4).toUpperCase();
  } else {
    // Multiple words - take first letter of each word, then pad with remaining chars from first word
    let abbreviation = '';
    words.forEach(word => {
      if (abbreviation.length < 4) {
        abbreviation += word.charAt(0).toUpperCase();
      }
    });
    
    // If still less than 4 chars, pad with remaining chars from first word
    if (abbreviation.length < 4 && words[0].length > 1) {
      const remaining = words[0].substring(1, 1 + (4 - abbreviation.length)).toUpperCase();
      abbreviation += remaining;
    }
    
    // Ensure exactly 4 characters
    return abbreviation.substring(0, 4).padEnd(4, 'X');
  }
}

/**
 * Generates a unique automatic invoice number
 * Format: YYYY-MM-COMP-NNN (e.g., 2024-01-ACME-001, 2024-01-ACME-002)
 */
export async function generateAutoInvoiceNumber(clientCompanyName?: string): Promise<string> {
  try {
    console.log('🔢 Generating automatic invoice number for company:', clientCompanyName);
    
    // Get current user from session (more reliable than getUser)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      throw new Error('User not authenticated');
    }
    
    const user = session.user;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() returns 0-11
    
    const yearStr = currentYear.toString();
    const monthStr = currentMonth.toString().padStart(2, '0');
    
    // Generate company abbreviation
    const companyAbbr = generateCompanyAbbreviation(clientCompanyName || '');
    const monthYearCompanyPrefix = `${yearStr}-${monthStr}-${companyAbbr}`;
    
    console.log('📅 Generated prefix:', monthYearCompanyPrefix);
    
    // Get the highest invoice number for this year-month-company combination for this user
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .like('invoice_number', `${monthYearCompanyPrefix}-%`)
      .is('deleted_at', null) // 🔧 FIX: Only consider non-deleted invoices
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
      
      // Extract number from format YYYY-MM-COMP-NNN
      const match = lastInvoiceNumber.match(/^\d{4}-\d{2}-[A-Z]{4}-(\d{3})$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }

    // Format with leading zeros (e.g., 001, 002, 003)
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    const invoiceNumber = `${monthYearCompanyPrefix}-${formattedNumber}`;
    
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
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session?.user) {
      throw new Error('User not authenticated');
    }
    
    const user = session.user;

    const { data, error } = await supabase
      .from('invoices')
      .select('invoice_number')
      .eq('user_id', user.id)
      .eq('invoice_number', invoiceNumber)
      .is('deleted_at', null) // 🔧 FIX: Only check non-deleted invoices
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
 * Validates invoice number format (YYYY-MM-COMP-NNN)
 */
export function validateInvoiceNumberFormat(invoiceNumber: string): boolean {
  const pattern = /^\d{4}-\d{2}-[A-Z]{4}-\d{3}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Exports the company abbreviation function for use in other components
 */
export { generateCompanyAbbreviation };
