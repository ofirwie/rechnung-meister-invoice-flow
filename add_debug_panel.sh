#\!/bin/bash

# Find the line with "totals.subtotal.toFixed(2)"
LINE=$(grep -n "totals.subtotal.toFixed(2)" src/components/InvoiceForm.tsx  < /dev/null |  tail -1 | cut -d: -f1)

# Insert the debug info box before that line
sed -i "${LINE}i\
            {/* DEBUG INFO BOX */}\
            {DEBUG_MODE && (\
              <div className=\"bg-red-100 border-2 border-red-500 p-4 mb-4 rounded\">\
                <h3 className=\"text-red-700 font-bold mb-2\">🐛 Debug Info - Loop Detection</h3>\
                <div className=\"space-y-1 text-sm\">\
                  <p>Calculate Totals Called: <span className=\"font-mono font-bold\">{calcCount}</span> times</p>\
                  <p>Services Count: <span className=\"font-mono\">{services.length}</span></p>\
                  <p>Added Services: <span className=\"font-mono\">{services.filter(s => s.addedToInvoice).length}</span></p>\
                  <p>Current Subtotal: <span className=\"font-mono\">€{totals.subtotal.toFixed(2)}</span></p>\
                  {calcCount > 10 && (\
                    <p className=\"text-red-600 font-bold animate-pulse\">\
                      ⚠️ INFINITE LOOP DETECTED! calculateTotals called {calcCount} times!\
                    </p>\
                  )}\
                </div>\
              </div>\
            )}\
" src/components/InvoiceForm.tsx

echo "Debug panel added!"
