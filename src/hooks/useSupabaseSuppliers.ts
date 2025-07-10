import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Supplier } from '@/types/expense';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      // Map database fields to frontend types
      const mappedSuppliers = (data || []).map(supplier => ({
        ...supplier,
        userId: supplier.user_id,
        createdAt: supplier.created_at,
        updatedAt: supplier.updated_at,
        taxId: supplier.tax_id,
        contactPerson: supplier.contact_person,
      }));
      setSuppliers(mappedSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בטעינת הספקים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Map frontend types to database fields
      const dbSupplier = {
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        website: supplier.website,
        tax_id: supplier.taxId,
        address: supplier.address,
        contact_person: supplier.contactPerson,
        notes: supplier.notes,
        active: supplier.active,
        user_id: user.user.id,
      };

      const { error } = await supabase
        .from('suppliers')
        .insert(dbSupplier);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הספק נוסף בהצלחה",
      });

      await loadSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בהוספת הספק",
        variant: "destructive",
      });
    }
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הספק עודכן בהצלחה",
      });

      await loadSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בעדכון הספק",
        variant: "destructive",
      });
    }
  };

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הספק נמחק בהצלחה",
      });

      await loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה במחיקת הספק",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    loadSuppliers,
  };
};