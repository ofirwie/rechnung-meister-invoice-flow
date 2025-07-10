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
import SupplierManagement from './SupplierManagement';
import CategoryManagement from './CategoryManagement';
import { useSupabaseExpenses } from '@/hooks/useSupabaseExpenses';
import { useSupabaseSuppliers } from '@/hooks/useSupabaseSuppliers';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import { useLanguage } from '@/hooks/useLanguage';
import type { ExpenseFilters } from '@/types/expense';

const ExpenseManagement = () => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'business' | 'personal'>('business');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showSupplierManagement, setShowSupplierManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
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
      <div className={`flex justify-between items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h1 className="text-3xl font-bold">{t.expenseManagement}</h1>
        <Button onClick={() => setShowExpenseForm(true)} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Plus className="w-4 h-4" />
          {t.newExpense}
        </Button>
      </div>

      {/* Expense Type Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'business' | 'personal')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="business" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            📊 {t.business}
          </TabsTrigger>
          <TabsTrigger value="personal" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            🏠 {t.personal}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Statistics Header */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.totalThisMonth}</CardTitle>
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
                  <CardTitle className="text-sm font-medium">{t.activeSubscriptions}</CardTitle>
                  <span className="text-green-600">🔄</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.highestExpense}</CardTitle>
                  <span className="text-orange-600">📈</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₪{stats.highestExpenseThisMonth.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t.topCategory}</CardTitle>
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
                    placeholder={`${t.search} ${t.description}, ${t.supplier}, ${t.category}...`}
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder={t.dateFrom}
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder={t.dateTo}
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>

                <Select value={filters.isRecurring} onValueChange={(value) => handleFilterChange('isRecurring', value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.all}</SelectItem>
                    <SelectItem value="true">{t.subscription}</SelectItem>
                    <SelectItem value="false">{t.oneTime}</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={clearFilters}>
                  {t.clearFilters}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className={`flex gap-2 flex-wrap ${isRTL ? 'justify-end' : ''}`}>
            <Button onClick={() => setShowExpenseForm(true)} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Plus className="w-4 h-4" />
              {t.newExpense}
            </Button>
            <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Download className="w-4 h-4" />
              {t.exportToExcel}
            </Button>
            <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => setShowSupplierManagement(true)}>
              <Users className="w-4 h-4" />
              {t.supplierManagement}
            </Button>
            <Button variant="outline" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} onClick={() => setShowCategoryManagement(true)}>
              <Tags className="w-4 h-4" />
              {t.categoryManagement}
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

      {/* Supplier Management Dialog */}
      <SupplierManagement 
        open={showSupplierManagement} 
        onClose={() => setShowSupplierManagement(false)} 
      />

      {/* Category Management Dialog */}
      <CategoryManagement 
        open={showCategoryManagement} 
        onClose={() => setShowCategoryManagement(false)} 
      />
    </div>
  );
};

export default ExpenseManagement;