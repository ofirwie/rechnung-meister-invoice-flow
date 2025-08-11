// Script to check localStorage for old invoice data
console.log('Checking localStorage for old invoice data...\n');

const keysToCheck = [
  'invoice-clients',
  'invoice-services', 
  'invoice-data',
  'invoice-history'
];

let hasOldData = false;

keysToCheck.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      const count = Array.isArray(parsed) ? parsed.length : 0;
      console.log(`✓ Found ${key}: ${count} items`);
      if (count > 0) {
        hasOldData = true;
        console.log(`  Sample:`, parsed[0]);
      }
    } catch (e) {
      console.log(`✗ Error parsing ${key}:`, e.message);
    }
  } else {
    console.log(`✗ No data found for ${key}`);
  }
});

console.log('\n' + '='.repeat(50));
if (hasOldData) {
  console.log('Old localStorage data detected!');
  console.log('The migration dialog will appear until this data is cleared.');
  console.log('\nOptions:');
  console.log('1. Click "Migrate Data" in the dialog to transfer to Supabase');
  console.log('2. Or run: localStorage.clear() to remove all localStorage data');
} else {
  console.log('No old localStorage data found.');
  console.log('The migration dialog should not appear.');
}
