import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ExpenseCategory, ExpenseType } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';

export const useExpenseCategories = () => {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadExpenseTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('expense_types')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      // Map database fields to frontend types
      const mappedTypes = (data || []).map(type => ({
        ...type,
        name: type.name as 'business' | 'personal',
        createdAt: type.created_at,
      }));
      setExpenseTypes(mappedTypes);
    } catch (error) {
      console.error('Error loading expense types:', error);
    }
  };

  const loadCategories = async (expenseType?: 'business' | 'personal') => {
    try {
      setLoading(true);
      let query = supabase
        .from('expense_categories')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (expenseType) {
        const typeData = expenseTypes.find(t => t.name === expenseType);
        if (typeData) {
          query = query.eq('expense_type_id', typeData.id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map database fields to frontend types
      const mappedCategories = (data || []).map(category => ({
        ...category,
        expenseTypeId: category.expense_type_id,
        sortOrder: category.sort_order,
        createdAt: category.created_at,
      }));
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הקטגוריות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoriesByType = (expenseType: 'business' | 'personal') => {
    const typeData = expenseTypes.find(t => t.name === expenseType);
    if (!typeData) return [];
    
    return categories.filter(c => c.expenseTypeId === typeData.id);
  };

  const addCategory = async (category: Omit<ExpenseCategory, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .insert(category);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הקטגוריה נוספה בהצלחה",
      });

      await loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת הקטגוריה",
        variant: "destructive",
      });
    }
  };

  const updateCategory = async (id: string, updates: Partial<ExpenseCategory>) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הקטגוריה עודכנה בהצלחה",
      });

      await loadCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הקטגוריה",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expense_categories')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הקטגוריה נמחקה בהצלחה",
      });

      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הקטגוריה",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  useEffect(() => {
    if (expenseTypes.length > 0) {
      loadCategories();
    }
  }, [expenseTypes]);

  return {
    categories,
    expenseTypes,
    loading,
    getCategoriesByType,
    addCategory,
    updateCategory,
    deleteCategory,
    loadCategories,
  };
};