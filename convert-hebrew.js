import fs from 'fs';
import path from 'path';

// Hebrew to English translations
const translations = {
  // Mixed Hebrew-English from script output
  'הUser הוסר בהצלחה': 'User removed successfully',
  'טוען Userים...': 'Loading users...',
  'Invite User חדש': 'Invite New User',
  'User ללא Name': 'Unnamed User',
  'לא Active': 'Inactive',
  'Invite User ראשון': 'Invite First User',
  'User ללא Name': 'Unnamed User',
  'ניהול Company Users': 'Company User Management',
  'חזור': 'Back',
  'העברת נתונים לבסיס נתונים חיצוני': 'Data Migration to External Database',
  'זוהו נתונים Saveים במקום (localStorage) שעלולים להיעלם:': 'Local data found that may be lost:',
  'לקוחות:': 'Clients:',
  'שירותים:': 'Services:',
  'חשבוניות:': 'Invoices:',
  'היסטוריה:': 'History:',
  'מומלץ להעביר את הנתונים לבסיס נתונים חיצוני (Supabase) כדי:': 'We recommend migrating data to external database (Supabase) to:',
  'להבטיח שהנתונים לא ייעלמו': 'Ensure data won\'t be lost',
  'לגשת לנתונים מכל מכשיר': 'Access data from any device',
  'לקבל גיבוי אוטומטי': 'Get automatic backup',
  'לא עכשיו': 'Not now',
  'מעביר...': 'Migrating...',
  'העבר נתונים': 'Migrate Data',
  'התנתק': 'Logout',
  'נדרשת התחברות': 'Login Required',
  'כדי להשתמש במערכת ולשמור את הנתונים שלך בענן, עליך להתחבר או להירשם': 'To use the system and save your data to the cloud, you need to login or register',
  'התחבר / הירשם': 'Login / Register',
  
  // Auth page
  'התחברות': 'Login',
  'רישום': 'Registration',
  'שכחתי סיסמה': 'Forgot Password',
  'אין לך חשבון?': 'Don\'t have an account?',
  'יש לך חשבון?': 'Already have an account?',
  'איפוס סיסמה': 'Reset Password',
  
  // Form validation messages
  'Company Name הוא שדה חובה': 'Company name is required',
  'Email Address לא תקינה': 'Invalid email address',
  'כתובת אתר חייבת להתחיל ב-http:// או https://': 'Website must start with http:// or https://',
  'פורמט IBAN לא תקין (דוגמה: DE89 3704 0044 0532 0130 00)': 'Invalid IBAN format (example: DE89 3704 0044 0532 0130 00)',
  'נא לתקן את השגיאות בטופס': 'Please fix the form errors',
  'שגיאה לא צפויה בשמירת החברה': 'Unexpected error saving company',
  
  // Company form
  'הגדרות חברה': 'Company Settings',
  'יצירת חברה חדשה': 'Create New Company',
  'פרטי חשבון בנק': 'Bank Account Details',
  'Name הבנק': 'Bank Name',
  'מספר חשבון': 'Account Number',
  'תחילת שנת כספים': 'Fiscal Year Start',
  'חברה ראשית (יכולה לכתוב על חברה קיימת עם אותו ח.פ)': 'Main company (can overwrite existing company with same tax ID)',
  'שומר...': 'Saving...',
  
  // Confirmation dialogs
  'האם אתה בטוח שברצונך להסיר את': 'Are you sure you want to remove',
  'מהחברה?': 'from the company?',
  // User Management
  'אין לך הרשאה לנהל משתמשים': 'You don\'t have permission to manage users',
  'ניהול משתמשים': 'User Management',
  'הזמן משתמש': 'Invite User',
  'הזמן משתמש חדש': 'Invite New User',
  'כתובת אימייל': 'Email Address',
  'תפקיד': 'Role',
  'ביטול': 'Cancel',
  'שולח...': 'Sending...',
  'שלח הזמנה': 'Send Invitation',
  'משתמשי החברה': 'Company Users',
  'אין משתמשים בחברה זו': 'No users in this company',
  'הזמן משתמש ראשון': 'Invite First User',
  'משתמש': 'User',
  'סטטוס': 'Status',
  'תאריך הצטרפות': 'Join Date',
  'פעולות': 'Actions',
  'משתמש ללא שם': 'Unnamed User',
  'פעיל': 'Active',
  'לא פעיל': 'Inactive',
  'פרטי החברה': 'Company Details',
  'שם החברה': 'Company Name',
  'שם עסקי': 'Business Name',
  'ח.פ / ע.מ': 'Tax ID / Company ID',
  'מטבע ברירת מחדל': 'Default Currency',
  
  // Roles
  'בעלים': 'Owner',
  'מנהל': 'Admin',
  'צופה': 'Viewer',
  
  // Company Management
  'לא נבחרה חברה': 'No company selected',
  'צור חברה': 'Create Company',
  'הוסף חברה': 'Add Company',
  'נהל משתמשים': 'Manage Users',
  'נהל חברה': 'Manage Company',
  
  // Loading states
  'טוען משתמשים...': 'Loading users...',
  'טוען...': 'Loading...',
  
  // General
  'שם': 'Name',
  'אימייל': 'Email',
  'סיסמה': 'Password',
  'שמור': 'Save',
  'עדכן': 'Update',
  'מחק': 'Delete',
  'ערוך': 'Edit',
  'הוסף': 'Add',
  'צור': 'Create'
};

function convertHebrewInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const [hebrew, english] of Object.entries(translations)) {
    const regex = new RegExp(hebrew.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    if (content.includes(hebrew)) {
      content = content.replace(regex, english);
      hasChanges = true;
      console.log(`Replaced "${hebrew}" with "${english}" in ${path.basename(filePath)}`);
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Files to convert
const files = [
  'src/components/CompanyUserManagement.tsx',
  'src/components/CompanyManagement.tsx',
  'src/components/NoCompanyScreen.tsx',
  'src/pages/Index.tsx',
  'src/pages/Auth.tsx',
  'src/components/CompanyForm.tsx',
  'src/components/Navigation.tsx'
];

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  convertHebrewInFile(fullPath);
});

console.log('Hebrew to English conversion completed!');