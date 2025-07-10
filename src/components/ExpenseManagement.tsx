import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Download, Users, Tags, Zap } from 'lucide-react';
import ExpenseTable from './ExpenseTable';
import ExpenseForm from './ExpenseForm';
import { useSupabaseExpenses } from '@/hooks/useSupabaseExpenses';
import { useSupabaseSuppliers } from '@/hooks/useSupabaseSuppliers';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import type { ExpenseFilters } from '@/types/expense';

const ExpenseManagement = () => {
  const [activeTab, setActiveTab] = useState<'business' | 'personal'>('business');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filters, setFilters] = useState<ExpenseFilters>({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    suppliers: [],
    categories: [],
    currencies: [],
    expenseType: 'business',
    isRecurring: 'all',
  });

  const { expenses, loading, stats, loadExpenses, calculateStats } = useSupabaseExpenses();
  const { suppliers } = useSupabaseSuppliers();
  const { categories, getCategoriesByType } = useExpenseCategories();

  useEffect(() => {
    setFilters(prev => ({ ...prev, expenseType: activeTab }));
  }, [activeTab]);

  useEffect(() => {
    loadExpenses(filters);
    calculateStats(activeTab);
  }, [filters, activeTab]);

  const handleFilterChange = (key: keyof ExpenseFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      suppliers: [],
      categories: [],
      currencies: [],
      expenseType: activeTab,
      isRecurring: 'all',
    });
  };

  const currentCategories = getCategoriesByType(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ניהול הוצאות</h1>
        <Button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          הוצאה חדשה
        </Button>
      </div>

      {/* Expense Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'business' | 'personal')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business" className="flex items-center gap-2">
            📊 עסקי
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-2">
            🏠 אישי/משפחה
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Statistics Header */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">סה״כ החודש</CardTitle>
                  <span className="text-blue-600">💰</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₪{stats.totalCurrentMonth.ILS.toLocaleString()}
                  </div>
                  {stats.totalCurrentMonth.EUR > 0 && (
                    <div className="text-lg text-muted-foreground">
                      €{stats.totalCurrentMonth.EUR.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">מנויים פעילים</CardTitle>
                  <span className="text-green-600">🔄</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">הוצאה גדולה</CardTitle>
                  <span className="text-orange-600">📈</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₪{stats.highestExpenseThisMonth.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">קטגוריה מובילה</CardTitle>
                  <span className="text-purple-600">🏷️</span>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {stats.expensesByCategory[0]?.category || 'אין נתונים'}
                  </div>
                  {stats.expensesByCategory[0] && (
                    <div className="text-sm text-muted-foreground">
                      {stats.expensesByCategory[0].percentage}%
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="חיפוש בתיאור, ספק, קטגוריה..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="מתאריך"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="עד תאריך"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>

                <Select value={filters.isRecurring} onValueChange={(value) => handleFilterChange('isRecurring', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="true">מנוי</SelectItem>
                    <SelectItem value="false">חד-פעמי</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  נקה פילטרים
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowExpenseForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              הוצאה חדשה
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              ייצוא לאקסל
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              ניהול ספקים
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Tags className="w-4 h-4" />
              ניהול קטגוריות
            </Button>
          </div>

          {/* Expenses Table */}
          <ExpenseTable
            expenses={expenses}
            loading={loading}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setShowExpenseForm(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Expense Form Dialog */}
      {showExpenseForm && (
        <ExpenseForm
          expense={editingExpense}
          onClose={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          onSave={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
            loadExpenses(filters);
          }}
          defaultExpenseType={activeTab}
        />
      )}
    </div>
  );
};

export default ExpenseManagement;