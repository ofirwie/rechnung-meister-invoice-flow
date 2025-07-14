import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '../types/service';
import { toast } from 'sonner';

export function useSupabaseServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Load services from Supabase
  const loadServices = async () => {
    try {
      console.log('🔍 Loading services...');
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const formattedServices: Service[] = data.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        hourlyRate: service.default_rate,
        currency: service.currency as 'EUR' | 'ILS',
        category: 'General', // Default category
        isActive: true, // Default active
        createdAt: service.created_at,
        updatedAt: service.updated_at
      }));

      setServices(formattedServices);
      console.log('✅ Services loaded successfully:', formattedServices.length);
    } catch (error) {
      console.error('❌ Error loading services:', error);
      toast.error('Failed to load services. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const addService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('💾 Adding service...', service.name);
      
      const { error } = await supabase
        .from('services')
        .insert({
          name: service.name,
          description: service.description,
          default_rate: service.hourlyRate,
          currency: service.currency
        });

      if (error) throw error;
      
      console.log('✅ Service added successfully');
      toast.success('Service created successfully!');
      await loadServices(); // Reload services
    } catch (error) {
      console.error('❌ Error adding service:', error);
      toast.error('Failed to create service');
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      console.log('💾 Updating service...', id);
      
      const { error } = await supabase
        .from('services')
        .update({
          name: updates.name,
          description: updates.description,
          default_rate: updates.hourlyRate,
          currency: updates.currency
        })
        .eq('id', id);

      if (error) throw error;
      
      console.log('✅ Service updated successfully');
      toast.success('Service updated successfully!');
      await loadServices(); // Reload services
    } catch (error) {
      console.error('❌ Error updating service:', error);
      toast.error('Failed to update service');
    }
  };

  const deleteService = async (id: string) => {
    try {
      console.log('🗑️ Deleting service...', id);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('✅ Service deleted successfully');
      toast.success('Service deleted successfully!');
      await loadServices(); // Reload services
    } catch (error) {
      console.error('❌ Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  return {
    services,
    loading,
    addService,
    updateService,
    deleteService,
    loadServices
  };
}