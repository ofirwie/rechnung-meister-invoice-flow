/**
 * Debug script to identify and fix CSS deprecation warnings
 * Paste this into browser console to analyze CSS issues
 */

console.log('🔍 CSS Deprecation Warning Debug Tool');
console.log('=====================================');

// Function to check for high contrast mode detection loops
function detectHighContrastLoops() {
  console.log('🔄 Checking for high contrast detection loops...');
  
  let checkCount = 0;
  const originalMatchMedia = window.matchMedia;
  
  // Override matchMedia to count high contrast queries
  window.matchMedia = function(query) {
    if (query.includes('-ms-high-contrast')) {
      checkCount++;
      if (checkCount > 10) {
        console.warn('🚨 HIGH CONTRAST QUERY LOOP DETECTED!', {
          query: query,
          checkCount: checkCount,
          stack: new Error().stack
        });
      }
    }
    return originalMatchMedia.call(this, query);
  };
  
  // Reset after 5 seconds
  setTimeout(() => {
    window.matchMedia = originalMatchMedia;
    console.log(`✅ High contrast checks completed. Total queries: ${checkCount}`);
  }, 5000);
}

// Function to add CSS fixes directly via JavaScript (emergency fix)
function addEmergencyCSSFixes() {
  console.log('🚑 Adding emergency CSS fixes...');
  
  const style = document.createElement('style');
  style.id = 'emergency-css-fixes';
  style.textContent = `
    /* Emergency CSS fixes for deprecation warnings */
    @media screen and (-ms-high-contrast: active) {
      :root {
        --high-contrast-emergency: active;
      }
    }
    
    @media screen and (-ms-high-contrast: black-on-white) {
      :root {
        --high-contrast-emergency: black-on-white;
      }
    }
    
    @media screen and (-ms-high-contrast: white-on-black) {
      :root {
        --high-contrast-emergency: white-on-black;
      }
    }
    
    @media (forced-colors: active) {
      * {
        forced-color-adjust: auto !important;
      }
      
      button, input, select, textarea {
        border: 1px solid ButtonText !important;
      }
    }
    
    /* Prevent extension loops */
    * {
      -ms-high-contrast-adjust: auto !important;
      forced-color-adjust: auto !important;
    }
    
    /* Suppress specific elements that might cause loops */
    .invoice-form * {
      -ms-high-contrast-adjust: none !important;
    }
  `;
  
  // Remove existing emergency fixes first
  const existing = document.getElementById('emergency-css-fixes');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(style);
  console.log('✅ Emergency CSS fixes applied');
}

// Function to monitor console for deprecation warnings
function monitorDeprecationWarnings() {
  console.log('👂 Monitoring console for deprecation warnings...');
  
  const originalConsoleWarn = console.warn;
  let warningCount = 0;
  const warningTypes = new Map();
  
  console.warn = function(...args) {
    const message = args.join(' ');
    
    if (message.includes('-ms-high-contrast') || message.includes('Deprecation')) {
      warningCount++;
      
      const type = message.includes('-ms-high-contrast') ? 'high-contrast' : 'other-deprecation';
      warningTypes.set(type, (warningTypes.get(type) || 0) + 1);
      
      if (warningCount > 50) {
        console.error('🚨 TOO MANY DEPRECATION WARNINGS!', {
          total: warningCount,
          types: Object.fromEntries(warningTypes),
          message: message
        });
        
        // Auto-apply emergency fixes
        addEmergencyCSSFixes();
      }
    }
    
    return originalConsoleWarn.apply(this, args);
  };
  
  // Report after 10 seconds
  setTimeout(() => {
    console.log('📊 Deprecation Warning Report:', {
      totalWarnings: warningCount,
      warningTypes: Object.fromEntries(warningTypes)
    });
    
    if (warningCount > 0) {
      console.log('💡 Recommendation: Update CSS to use modern standards');
    }
  }, 10000);
}

// Function to test invoice save functionality from browser
function testInvoiceSave() {
  console.log('🧪 Testing invoice save functionality...');
  
  // This would need to be called from within the React app context
  console.log('💡 To test invoice saving:');
  console.log('1. Fill out the invoice form');
  console.log('2. Open browser dev tools');
  console.log('3. Look for detailed console logs during save');
  console.log('4. Check for any database errors');
  
  // Check if Supabase is available
  if (typeof window.supabase !== 'undefined') {
    console.log('✅ Supabase client detected');
  } else {
    console.log('⚠️ Supabase client not found in global scope');
  }
}

// Main debug function
function runCSSDebug() {
  console.log('🚀 Starting CSS debug session...');
  
  detectHighContrastLoops();
  monitorDeprecationWarnings();
  testInvoiceSave();
  
  console.log('✅ CSS debug tools activated');
  console.log('💡 You can call addEmergencyCSSFixes() manually if needed');
}

// Auto-run the debug
runCSSDebug();

// Make functions available globally for manual use
window.debugCSS = {
  detectHighContrastLoops,
  addEmergencyCSSFixes,
  monitorDeprecationWarnings,
  testInvoiceSave,
  run: runCSSDebug
};

console.log('🛠️ Debug tools available via window.debugCSS');
