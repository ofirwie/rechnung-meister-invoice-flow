import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';

interface CategoryManagementProps {
  open: boolean;
  onClose: () => void;
}

const CategoryManagement = ({ open, onClose }: CategoryManagementProps) => {
  const [activeTab, setActiveTab] = useState<'business' | 'personal'>('business');
  const { categories, loading, getCategoriesByType } = useExpenseCategories();

  useEffect(() => {
    // Categories are loaded automatically by the hook
  }, []);

  const businessCategories = getCategoriesByType('business');
  const personalCategories = getCategoriesByType('personal');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ניהול קטגוריות הוצאות</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>הערה:</strong> הקטגוריות מוגדרות מראש במערכת ואינן ניתנות לעריכה כעת. 
              ניתן לראות את הקטגוריות הזמינות לכל סוג הוצאה.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'business' | 'personal')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="business">קטגוריות עסקיות</TabsTrigger>
              <TabsTrigger value="personal">קטגוריות אישיות</TabsTrigger>
            </TabsList>

            <TabsContent value="business" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>קטגוריות הוצאות עסקיות</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">טוען קטגוריות...</p>
                    </div>
                  ) : businessCategories.length === 0 ? (
                    <p className="text-muted-foreground">אין קטגוריות עסקיות להצגה</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {businessCategories.map((category) => (
                        <div key={category.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{category.name}</h3>
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                          <div className="mt-2">
                            <Badge variant={category.active ? "default" : "secondary"} className="text-xs">
                              {category.active ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>קטגוריות הוצאות אישיות</CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">טוען קטגוריות...</p>
                    </div>
                  ) : personalCategories.length === 0 ? (
                    <p className="text-muted-foreground">אין קטגוריות אישיות להצגה</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {personalCategories.map((category) => (
                        <div key={category.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{category.name}</h3>
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                          <div className="mt-2">
                            <Badge variant={category.active ? "default" : "secondary"} className="text-xs">
                              {category.active ? 'פעיל' : 'לא פעיל'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryManagement;