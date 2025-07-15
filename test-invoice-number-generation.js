import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://lzhgyyihnsqwcbsdsdxs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aGd5eWlobnNxd2Nic2RzZHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MTcyNTYsImV4cCI6MjA2NzQ5MzI1Nn0.aFHhnr2rpizDMe_s9BD96E0XURoRyag-Dc2BgvEUSQw";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInvoiceNumberGeneration() {
  console.log('🔢 Testing invoice number generation...\n');

  try {
    // Test 1: Check existing invoices
    console.log('1️⃣ Checking existing invoices...');
    const { data: existingInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('invoice_number, user_id')
      .order('invoice_number', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching invoices:', fetchError);
    } else {
      console.log('✅ Found', existingInvoices.length, 'existing invoices');
      if (existingInvoices.length > 0) {
        console.log('📋 Latest invoice numbers:');
        existingInvoices.slice(0, 5).forEach(inv => {
          console.log(`  - ${inv.invoice_number} (user: ${inv.user_id?.substring(0, 8)}...)`);
        });
      }
    }

    // Test 2: Generate next number logic
    console.log('\n2️⃣ Testing invoice number generation logic...');
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString();
    
    // Get highest number for this year
    const { data: yearInvoices, error: yearError } = await supabase
      .from('invoices')
      .select('invoice_number')
      .like('invoice_number', `${yearPrefix}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    if (yearError) {
      console.error('❌ Error fetching year invoices:', yearError);
    } else {
      let nextNumber = 1;
      if (yearInvoices && yearInvoices.length > 0) {
        const lastNumber = yearInvoices[0].invoice_number;
        console.log('📋 Latest', yearPrefix, 'invoice:', lastNumber);
        
        const match = lastNumber.match(/^\d{4}-(\d{4})$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
      
      const suggestedNumber = `${yearPrefix}-${nextNumber.toString().padStart(4, '0')}`;
      console.log('🎯 Next suggested number:', suggestedNumber);
    }

    // Test 3: Check for duplicates
    console.log('\n3️⃣ Checking for duplicate invoice numbers...');
    const { data: duplicates, error: dupError } = await supabase
      .from('invoices')
      .select('invoice_number, user_id')
      .order('invoice_number');

    if (dupError) {
      console.error('❌ Error checking duplicates:', dupError);
    } else {
      const numberCounts = {};
      duplicates.forEach(inv => {
        const key = `${inv.invoice_number}-${inv.user_id}`;
        numberCounts[key] = (numberCounts[key] || 0) + 1;
      });
      
      const duplicateNumbers = Object.entries(numberCounts)
        .filter(([key, count]) => count > 1)
        .map(([key, count]) => ({ key, count }));
      
      if (duplicateNumbers.length > 0) {
        console.log('⚠️  Found duplicates:');
        duplicateNumbers.forEach(({ key, count }) => {
          console.log(`  - ${key}: ${count} occurrences`);
        });
      } else {
        console.log('✅ No duplicates found');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('\n📊 Test complete');
}

testInvoiceNumberGeneration().catch(console.error);