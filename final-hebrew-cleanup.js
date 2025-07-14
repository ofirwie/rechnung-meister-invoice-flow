import fs from 'fs';
import path from 'path';

// Complete Hebrew to English translations
const translations = {
  // CompanyManagement
  'לא נמצאו חברות': 'No companies found',
  'Create את החברה הראשונה שלך כדי להתחיל לעבוד במערכת': 'Create your first company to start working with the system',
  'אין לך הרשאה ליCreate חברות חדשות. פנה לAdmin המערכת.': 'You don\'t have permission to create new companies. Contact the system admin.',
  'Create Company ראשונה': 'Create First Company',
  'רענן את הדף': 'Refresh Page',
  
  // Form related
  'מספר עוסק מורשה': 'Licensed dealer number',
  'ח.פ (מספר חברה)': 'Company registration number',
  'ח.פ': 'Company ID',
  'מספר זיהוי מס': 'Tax ID number',
  'מספר מע"מ גרמני': 'German VAT number',
  'כתובת': 'Address',
  'כתובת החברה': 'Company address',
  'טלפון': 'Phone',
  'מספר טלפון': 'Phone number',
  'אתר אינטרנט': 'Website',
  
  // CategoryManagement
  'ניהול קטגוריות הוצאות': 'Expense Categories Management',
  'הערה:': 'Note:',
  'הקטגוריות מוגדרות מראש במערכת ואינן ניתנות לעריכה כעת.': 'Categories are predefined in the system and cannot be edited currently.',
  'ניתן לראות את הקטגוריות הזמינות לכל סוג הוצאה.': 'You can see the available categories for each expense type.',
  'קטגוריות עסקיות': 'Business Categories',
  'קטגוריות אישיות': 'Personal Categories',
  'קטגוריות הוצאות עסקיות': 'Business Expense Categories',
  'טוען קטגוריות...': 'Loading categories...',
  'אין קטגוריות עסקיות להצגה': 'No business categories to display',
  'קטגוריות הוצאות אישיות': 'Personal Expense Categories',
  'אין קטגוריות אישיות להצגה': 'No personal categories to display',
  
  // ClientForm
  'הדבק פרטי לקוח (Copy & Paste)': 'Paste Client Details (Copy & Paste)',
  'הדבק כאן כתובת מייל, פרטי איש קשר או כל מידע על הלקוח...': 'Paste here email address, contact details or any client information...',
  'נתח פרטים (AI)': 'Parse Details (AI)',
  
  // Common statuses
  'פעיל': 'Active',
  'לא פעיל': 'Inactive',
  
  // Comments
  'כפתורי פעולה': 'Action buttons',
  'בוחר חברה': 'Company Selector',
  
  // General UI
  'טוען...': 'Loading...',
  'שומר...': 'Saving...',
  'נתח...': 'Parsing...',
  'מחק': 'Delete',
  'ערוך': 'Edit',
  'הוסף': 'Add',
  'צפייה': 'View',
  'אישור': 'Confirm',
  'ביטול': 'Cancel',
  'שמור': 'Save',
  'עדכן': 'Update',
};

function convertHebrewInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const [hebrew, english] of Object.entries(translations)) {
    if (content.includes(hebrew)) {
      // Use global replace to catch all instances
      content = content.replaceAll(hebrew, english);
      hasChanges = true;
      console.log(`Replaced "${hebrew}" with "${english}" in ${path.basename(filePath)}`);
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Critical files to convert
const files = [
  'src/components/CompanyManagement.tsx',
  'src/components/CategoryManagement.tsx',
  'src/components/ClientForm.tsx',
  'src/components/ClientTable.tsx',
  'src/components/CompanyForm.tsx',
  'src/components/ExpenseForm.tsx',
  'src/components/ExpenseTable.tsx',
  'src/components/CompanySelector.tsx',
  'src/components/NoCompanyScreen.tsx',
  'src/pages/Index.tsx',
  'src/pages/Auth.tsx'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  convertHebrewInFile(fullPath);
});

console.log('Final Hebrew cleanup completed!');