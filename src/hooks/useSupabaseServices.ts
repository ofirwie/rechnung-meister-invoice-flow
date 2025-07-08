import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '../types/service';

export function useSupabaseServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Load services from Supabase
  const loadServices = async () => {
    try {
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
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const addService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from('services')
        .insert({
          name: service.name,
          description: service.description,
          default_rate: service.hourlyRate,
          currency: service.currency
        });

      if (error) throw error;
      
      await loadServices(); // Reload services
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
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
      
      await loadServices(); // Reload services
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadServices(); // Reload services
    } catch (error) {
      console.error('Error deleting service:', error);
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