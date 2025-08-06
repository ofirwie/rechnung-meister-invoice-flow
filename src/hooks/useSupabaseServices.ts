import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '../types/service';
import { toast } from 'sonner';
import { useCompany } from '../contexts/SimpleCompanyContext';

export function useSupabaseServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedCompany } = useCompany();

  // Load services from Supabase
  const loadServices = async () => {
    try {
      console.log('🔍 Loading services for company:', selectedCompany?.id);
      
      if (!selectedCompany) {
        console.log('⚠️ No company selected, skipping services load');
        setServices([]);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('company_id', selectedCompany.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const formattedServices: Service[] = data.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        default_rate: service.default_rate,
        hourlyRate: service.default_rate,
        currency: service.currency as 'EUR' | 'ILS',
        category: 'General', // Default category
        isActive: true, // Default active
        created_at: service.created_at,
        createdAt: service.created_at,
        updated_at: service.updated_at,
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
    if (selectedCompany) {
      loadServices();
    } else {
      setServices([]);
      setLoading(false);
    }
  }, [selectedCompany]);

  const addService = async (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (!selectedCompany) {
        toast.error('Please select a company first');
        return;
      }
      
      console.log('💾 Adding service...', service.name);
      
      // First check if we're authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication error:', authError);
        toast.error('You must be logged in to add services');
        return;
      }
      
      const { error } = await supabase
        .from('services')
        .insert({
          name: service.name,
          description: service.description,
          default_rate: service.hourlyRate,
          currency: service.currency,
          company_id: selectedCompany.id,
          user_id: user.id // Still include user_id for backward compatibility
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
      if (!selectedCompany) {
        toast.error('Please select a company first');
        return;
      }
      
      console.log('💾 Updating service...', id);
      
      const { error } = await supabase
        .from('services')
        .update({
          name: updates.name,
          description: updates.description,
          default_rate: updates.hourlyRate,
          currency: updates.currency
        })
        .eq('id', id)
        .eq('company_id', selectedCompany.id); // Ensure we only update services for this company

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
      if (!selectedCompany) {
        toast.error('Please select a company first');
        return;
      }
      
      console.log('🗑️ Deleting service...', id);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('company_id', selectedCompany.id); // Ensure we only delete services for this company

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
