import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Expense, ExpenseStats, ExpenseFilters } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const { toast } = useToast();

  const loadExpenses = async (filters?: ExpenseFilters) => {
    try {
      setLoading(true);
      let query = supabase
        .from('expenses')
        .select(`
          *,
          supplier:suppliers(*),
          category:expense_categories(*),
          expense_type:expense_types(*)
        `)
        .eq('active', true)
        .order('expense_date', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.expenseType !== 'all') {
          const { data: expenseType } = await supabase
            .from('expense_types')
            .select('id')
            .eq('name', filters.expenseType)
            .single();
          if (expenseType) {
            query = query.eq('expense_type_id', expenseType.id);
          }
        }

        if (filters.searchTerm) {
          query = query.ilike('description', `%${filters.searchTerm}%`);
        }

        if (filters.dateFrom) {
          query = query.gte('expense_date', filters.dateFrom);
        }

        if (filters.dateTo) {
          query = query.lte('expense_date', filters.dateTo);
        }

        if (filters.suppliers.length > 0) {
          query = query.in('supplier_id', filters.suppliers);
        }

        if (filters.categories.length > 0) {
          query = query.in('category_id', filters.categories);
        }

        if (filters.currencies.length > 0) {
          query = query.in('currency', filters.currencies);
        }

        if (filters.isRecurring !== 'all') {
          query = query.eq('is_recurring', filters.isRecurring === 'true');
        }

        if (filters.minAmount !== undefined) {
          query = query.gte('amount', filters.minAmount);
        }

        if (filters.maxAmount !== undefined) {
          query = query.lte('amount', filters.maxAmount);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map database fields to frontend types
      const mappedExpenses = (data || []).map(expense => ({
        ...expense,
        currency: expense.currency as 'ILS' | 'EUR',
        expenseTypeId: expense.expense_type_id,
        expenseDate: expense.expense_date,
        isRecurring: expense.is_recurring,
        autoRenew: expense.auto_renew,
        userId: expense.user_id,
        createdAt: expense.created_at,
        updatedAt: expense.updated_at,
        supplierId: expense.supplier_id,
        categoryId: expense.category_id,
        recurringPeriod: expense.recurring_period as 'monthly' | 'yearly' | 'quarterly' | 'weekly',
        recurringStartDate: expense.recurring_start_date,
        recurringNextDate: expense.recurring_next_date,
        recurringEndDate: expense.recurring_end_date,
        paymentMethod: expense.payment_method,
        invoiceNumber: expense.invoice_number,
        receiptFileUrl: expense.receipt_file_url,
        receiptFileName: expense.receipt_file_name,
        receiptDriveId: expense.receipt_drive_id,
        supplier: expense.supplier ? {
          ...expense.supplier,
          userId: expense.supplier.user_id,
          createdAt: expense.supplier.created_at,
          updatedAt: expense.supplier.updated_at,
          taxId: expense.supplier.tax_id,
          contactPerson: expense.supplier.contact_person,
        } : undefined,
        category: expense.category ? {
          ...expense.category,
          expenseTypeId: expense.category.expense_type_id,
          sortOrder: expense.category.sort_order,
          createdAt: expense.category.created_at,
        } : undefined,
      }));
      setExpenses(mappedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת ההוצאות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Map frontend types to database fields
      const dbExpense = {
        expense_type_id: expense.expenseTypeId,
        supplier_id: expense.supplierId,
        category_id: expense.categoryId,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        expense_date: expense.expenseDate,
        is_recurring: expense.isRecurring,
        recurring_period: expense.recurringPeriod,
        recurring_start_date: expense.recurringStartDate,
        recurring_next_date: expense.recurringNextDate,
        recurring_end_date: expense.recurringEndDate,
        auto_renew: expense.autoRenew,
        payment_method: expense.paymentMethod,
        invoice_number: expense.invoiceNumber,
        receipt_file_url: expense.receiptFileUrl,
        receipt_file_name: expense.receiptFileName,
        receipt_drive_id: expense.receiptDriveId,
        notes: expense.notes,
        active: expense.active,
        user_id: user.user.id,
      };

      const { error } = await supabase
        .from('expenses')
        .insert(dbExpense);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "ההוצאה נוספה בהצלחה",
      });

      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת ההוצאה",
        variant: "destructive",
      });
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      // Map frontend types to database fields for updates
      const dbUpdates: any = {};
      Object.entries(updates).forEach(([key, value]) => {
        switch (key) {
          case 'expenseTypeId':
            dbUpdates.expense_type_id = value;
            break;
          case 'supplierId':
            dbUpdates.supplier_id = value;
            break;
          case 'categoryId':
            dbUpdates.category_id = value;
            break;
          case 'expenseDate':
            dbUpdates.expense_date = value;
            break;
          case 'isRecurring':
            dbUpdates.is_recurring = value;
            break;
          case 'recurringPeriod':
            dbUpdates.recurring_period = value;
            break;
          case 'recurringStartDate':
            dbUpdates.recurring_start_date = value;
            break;
          case 'recurringNextDate':
            dbUpdates.recurring_next_date = value;
            break;
          case 'recurringEndDate':
            dbUpdates.recurring_end_date = value;
            break;
          case 'autoRenew':
            dbUpdates.auto_renew = value;
            break;
          case 'paymentMethod':
            dbUpdates.payment_method = value;
            break;
          case 'invoiceNumber':
            dbUpdates.invoice_number = value;
            break;
          case 'receiptFileUrl':
            dbUpdates.receipt_file_url = value;
            break;
          case 'receiptFileName':
            dbUpdates.receipt_file_name = value;
            break;
          case 'receiptDriveId':
            dbUpdates.receipt_drive_id = value;
            break;
          default:
            dbUpdates[key] = value;
        }
      });

      const { error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "ההוצאה עודכנה בהצלחה",
      });

      await loadExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון ההוצאה",
        variant: "destructive",
      });
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "ההוצאה נמחקה בהצלחה",
      });

      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת ההוצאה",
        variant: "destructive",
      });
    }
  };

  const duplicateExpense = async (expense: Expense) => {
    const duplicated = {
      ...expense,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      userId: undefined,
      description: `${expense.description} (עותק)`,
    };
    delete duplicated.id;
    delete duplicated.createdAt;
    delete duplicated.updatedAt;
    delete duplicated.userId;

    await addExpense(duplicated);
  };

  const calculateStats = async (expenseType?: 'business' | 'personal') => {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      let query = supabase
        .from('expenses')
        .select(`
          amount,
          currency,
          is_recurring,
          category:expense_categories(name, color),
          expense_type:expense_types(name)
        `)
        .eq('active', true)
        .gte('expense_date', startOfMonth.toISOString().split('T')[0])
        .lte('expense_date', endOfMonth.toISOString().split('T')[0]);

      if (expenseType) {
        const { data: typeData } = await supabase
          .from('expense_types')
          .select('id')
          .eq('name', expenseType)
          .single();
        if (typeData) {
          query = query.eq('expense_type_id', typeData.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      const totalILS = data?.filter(e => e.currency === 'ILS').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalEUR = data?.filter(e => e.currency === 'EUR').reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const activeSubscriptions = data?.filter(e => e.is_recurring).length || 0;
      const amounts = data?.map(e => Number(e.amount)) || [];
      const highestExpense = amounts.length > 0 ? Math.max(...amounts) : 0;

      // Calculate category breakdown
      const categoryTotals: Record<string, { amount: number; color: string }> = {};
      data?.forEach(expense => {
        const categoryName = expense.category?.name || 'אחר';
        const categoryColor = expense.category?.color || '#6B7280';
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { amount: 0, color: categoryColor };
        }
        categoryTotals[categoryName].amount += Number(expense.amount);
      });

      const totalAmount = totalILS + totalEUR;
      const expensesByCategory = Object.entries(categoryTotals).map(([category, data]) => ({
        category,
        amount: data.amount,
        color: data.color,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
      }));

      const statsData: ExpenseStats = {
        totalCurrentMonth: { ILS: totalILS, EUR: totalEUR },
        activeSubscriptions,
        highestExpenseThisMonth: highestExpense,
        expensesByCategory,
      };

      setStats(statsData);
      return statsData;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  return {
    expenses,
    loading,
    stats,
    addExpense,
    updateExpense,
    deleteExpense,
    duplicateExpense,
    loadExpenses,
    calculateStats,
  };
};