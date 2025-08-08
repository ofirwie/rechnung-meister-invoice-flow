// Debug script to check what services are saved in database
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kfmqchdkwqevhlrjcypp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbXFjaGRrd3FldmhscmpjeXBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA2MDk3NTcsImV4cCI6MjAzNjE4NTc1N30.fz5Sg8s8IzKjQccVWvl4yCDUPTLlxCJwOddO3C8MeBE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkInvoiceServices() {
  try {
    console.log('🔍 Checking invoices and their services...')
    
    // Get the latest invoices
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('invoice_number, client_company, services, total')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('❌ Error fetching invoices:', error)
      return
    }

    console.log(`📋 Found ${invoices?.length || 0} invoices:`)

    invoices?.forEach((invoice, index) => {
      console.log(`\n--- Invoice ${index + 1} ---`)
      console.log('Invoice Number:', invoice.invoice_number)
      console.log('Client:', invoice.client_company)
      console.log('Total:', invoice.total)
      
      // Parse and show services
      let services = []
      try {
        if (typeof invoice.services === 'string') {
          services = JSON.parse(invoice.services)
        } else {
          services = invoice.services || []
        }
        
        console.log('Services data:', services)
        
        if (Array.isArray(services)) {
          services.forEach((service, sIndex) => {
            console.log(`  Service ${sIndex + 1}:`)
            console.log(`    Description: "${service.description || 'No description'}"`)
            console.log(`    Hours: ${service.hours || 0}`)
            console.log(`    Rate: ${service.rate || 0}`)
            console.log(`    Amount: ${service.amount || 0}`)
            console.log(`    Added to Invoice: ${service.addedToInvoice}`)
          })
        } else {
          console.log('    ⚠️ Services is not an array:', typeof services)
        }
      } catch (parseError) {
        console.log('    ❌ Error parsing services:', parseError.message)
        console.log('    Raw services data:', invoice.services)
      }
    })

  } catch (error) {
    console.error('❌ Error in debug script:', error)
  }
}

// Run the debug check
checkInvoiceServices()
