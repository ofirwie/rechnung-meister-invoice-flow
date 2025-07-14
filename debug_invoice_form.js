// Add this at the top of InvoiceForm component after imports
const DEBUG_MODE = true;
let renderCount = 0;
let calcCount = 0;

// Add this at the beginning of the component function
if (DEBUG_MODE) {
  renderCount++;
  console.log(`\n🔄 RENDER #${renderCount} ==================`);
  console.log('Services count:', services.length);
}

// Replace calculateTotals function
const calculateTotals = () => {
  if (DEBUG_MODE) {
    calcCount++;
    console.log(`\n📊 calculateTotals called #${calcCount}`);
    const stack = new Error().stack;
    console.log('Called from:', stack.split('\n')[2]);
  }
  
  const subtotal = services
    .filter(service => service.addedToInvoice)
    .reduce((sum, service) => {
      return sum + service.amount;
    }, 0);
  
  if (DEBUG_MODE) {
    console.log(`📊 Subtotal: ${subtotal}`);
    console.log(`📊 Added services: ${services.filter(s => s.addedToInvoice).length}/${services.length}`);
  }
  
  return {
    subtotal,
    vatAmount: 0,
    total: subtotal
  };
};

// Replace useMemo line
const totals = useMemo(() => {
  if (DEBUG_MODE) {
    console.log('\n🎯 useMemo recalculating totals');
  }
  return calculateTotals();
}, [services]);

// Add to each setServices call
// Before: setServices(...)
// After: if (DEBUG_MODE) console.log('🔧 setServices from:', new Error().stack.split('\n')[2]); setServices(...)
