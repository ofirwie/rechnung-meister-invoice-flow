import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, UserPlus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';

interface NoCompanyScreenProps {
  userEmail: string;
}

export const NoCompanyScreen: React.FC<NoCompanyScreenProps> = ({ userEmail }) => {
  const { isRTL } = useLanguage();
  
  const isRootAdmin = userEmail === 'ofir.wienerman@gmail.com' || userEmail === 'firestar393@gmail.com';
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <CardTitle className="text-2xl">
            {isRootAdmin ? 'ברוך הבא למערכת' : 'ממתין להרשאה'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isRootAdmin ? (
            <div className="text-center space-y-4">
              <p className="text-lg text-gray-600">
                אתה Admin ראשי של המערכת. עליך ליCreate First Company כדי להתחיל.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">שלבים להתחלה:</h3>
                <ol className={`text-${isRTL ? 'right' : 'left'} space-y-2 text-blue-800`}>
                  <li>1. Create Company חדשה דרך ניהול חברות</li>
                  <li>2. Add Userים לחברה</li>
                  <li>3. הגדר הרשאות לUserים</li>
                </ol>
              </div>
              <Button 
                onClick={() => window.location.href = '/'} 
                size="lg"
                className="w-full"
              >
                המשך למערכת
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Clock className="w-12 h-12 mx-auto text-orange-400" />
              <p className="text-lg text-gray-600">
                החשבון שלך נוצר בהצלחה, אך עדיין לא שויך לאף חברה.
              </p>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <UserPlus className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                <p className="text-orange-800">
                  פנה לAdmin המערכת כדי שיוסיף אותך לחברה קיימת.
                </p>
                <p className="text-sm text-orange-700 mt-2">
                  המייל שלך: <strong>{userEmail}</strong>
                </p>
              </div>
              <div className="pt-4 space-y-2">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="w-full"
                >
                  Refresh Page
                </Button>
                <Button 
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full"
                >
                  Logout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};