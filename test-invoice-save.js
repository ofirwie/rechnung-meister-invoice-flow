/**
 * Test script to verify invoice saving functionality
 * Run with: node test-invoice-save.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables (you'll need to set these)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInvoiceSave() {
  console.log('🔄 Testing invoice save functionality...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('📡 Testing Supabase connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('invoices')
      .select('count', { count: 'exact', head: true });
    
    if (tablesError) {
      console.error('❌ Supabase connection failed:', tablesError);
      return;
    }
    
    console.log('✅ Supabase connection successful');
    
    // Test 2: Try to insert a test invoice
    console.log('📄 Testing invoice insertion...');
    
    const testInvoice = {
      invoice_number: `TEST-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      service_period_start: new Date().toISOString().split('T')[0],
      service_period_end: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      language: 'de',
      currency: 'EUR',
      client_company: 'Test Company Ltd.',
      client_address: '123 Test Street',
      client_city: 'Test City',
      client_postal_code: '12345',
      client_country: 'Deutschland',
      services: JSON.stringify([{
        id: '1',
        description: 'Test Service',
        hours: 1,
        rate: 100,
        currency: 'EUR',
        amount: 100,
        addedToInvoice: true
      }]),
      subtotal: 100,
      vat_amount: 0,
      total: 100,
      status: 'draft',
      user_id: 'test-user-id' // This would normally come from auth
    };
    
    console.log('💾 Attempting to save test invoice...');
    const { data, error } = await supabase
      .from('invoices')
      .insert(testInvoice)
      .select();
    
    if (error) {
      console.error('❌ Invoice save failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Check specific error types
      if (error.code === '42P01') {
        console.error('💡 Table does not exist. Please run Supabase migrations.');
      } else if (error.code === '23502') {
        console.error('💡 Missing required field. Check table schema.');
      } else if (error.code === '23503') {
        console.error('💡 Foreign key constraint violation. Check user_id.');
      }
      
      return;
    }
    
    console.log('✅ Test invoice saved successfully:', data);
    
    // Test 3: Clean up - delete the test invoice
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('invoice_number', testInvoice.invoice_number);
    
    if (deleteError) {
      console.warn('⚠️ Could not clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }
    
    console.log('🎉 All tests passed! Invoice save functionality is working.');
    
  } catch (error) {
    console.error('💥 Unexpected error during testing:', error);
  }
}

// Also test the table structure
async function checkTableStructure() {
  console.log('🔍 Checking invoices table structure...');
  
  try {
    // Get a sample record to see the structure
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('❌ Could not check table structure:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Table structure (sample record):', Object.keys(data[0]));
    } else {
      console.log('ℹ️ Table exists but is empty');
    }
    
  } catch (error) {
    console.error('💥 Error checking table structure:', error);
  }
}

// Run the tests
async function runAllTests() {
  await checkTableStructure();
  await testInvoiceSave();
}

runAllTests();
