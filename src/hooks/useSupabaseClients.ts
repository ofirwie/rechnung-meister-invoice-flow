import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientFormData } from '../types/client';
import { toast } from 'sonner';
import { useCompany } from '../contexts/SimpleCompanyContext';

export function useSupabaseClients(onClientSelect?: (client: Client) => void) {
  const { selectedCompany } = useCompany();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ClientFormData>({
    companyName: '',
    contactName: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Israel',
    email: '',
    phone: '',
    taxId: '',
    businessLicense: '',
    companyRegistration: ''
  });

  // Load clients from Supabase
  const loadClients = async () => {
    try {
      console.log('🔍 Loading clients...');
      
      // Check if user is authenticated first
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.error('❌ Auth error:', authError);
        throw authError;
      }
      
      if (!session?.user) {
        console.log('⚠️ No authenticated user - clients will be empty');
        setClients([]);
        return;
      }
      
      console.log('🔑 Fetching clients for user:', session.user.email);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)  // Filter by current user for RLS compliance
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const formattedClients: Client[] = data.map(client => {
        const formatted = {
          id: client.id,
          company_name: client.company_name,
          companyName: client.company_name,
          contact_name: client.contact_name,
          contactName: client.contact_name,
          address: client.address,
          city: client.city,
          postal_code: client.postal_code,
          postalCode: client.postal_code,
          country: client.country,
          email: client.email,
          phone: client.phone,
          tax_id: client.tax_id,
          taxId: client.tax_id,
          business_license: client.business_license,
          businessLicense: client.business_license,
          company_registration: client.company_registration,
          companyRegistration: client.company_registration,
          created_at: client.created_at,
          createdAt: client.created_at,
          updated_at: client.updated_at,
          updatedAt: client.updated_at
        };
        
        // Debug log for SHALAM client to check data completeness
        if (client.company_name?.includes('SHALAM')) {
          console.log('🔍 [DEBUG] SHALAM client raw data from DB:', JSON.stringify(client, null, 2));
          console.log('🔍 [DEBUG] SHALAM client formatted:', JSON.stringify(formatted, null, 2));
          console.log('🔍 [DEBUG] SHALAM client fields check:', {
            hasAddress: !!client.address,
            hasEmail: !!client.email,
            hasCity: !!client.city,
            hasPhone: !!client.phone,
            hasPostalCode: !!client.postal_code
          });
        }
        
        return formatted;
      });

      setClients(formattedClients);
      console.log('✅ Clients loaded successfully:', formattedClients.length);
    } catch (error) {
      console.error('❌ Error loading clients:', error);
      toast.error('Failed to load clients. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [selectedCompany]); // Reload clients when company changes

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactName: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'Israel',
      email: '',
      phone: '',
      taxId: '',
      businessLicense: '',
      companyRegistration: ''
    });
    setEditingClient(null);
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('💾 Saving client...', editingClient ? 'updating' : 'creating');
      
      // Get current user for RLS compliance
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('You must be logged in to save clients');
      }
      
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            company_name: formData.companyName,
            contact_name: formData.contactName,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            country: formData.country,
            email: formData.email,
            phone: formData.phone,
            tax_id: formData.taxId,
            business_license: formData.businessLicense,
            company_registration: formData.companyRegistration
          })
          .eq('id', editingClient.id);
          
        if (error) throw error;
      } else {
        // Create new client with user_id and company_id for RLS
        const { error } = await supabase
          .from('clients')
          .insert({
            company_name: formData.companyName,
            contact_name: formData.contactName,
            address: formData.address,
            city: formData.city,
            postal_code: formData.postalCode,
            country: formData.country,
            email: formData.email,
            phone: formData.phone,
            tax_id: formData.taxId,
            business_license: formData.businessLicense,
            company_registration: formData.companyRegistration,
            user_id: session.user.id // IMPORTANT: Include user_id for RLS
            // company_id: selectedCompany.id // TODO: Add once company_id column exists
          });
          
        if (error) throw error;
      }
      
      console.log('✅ Client saved successfully');
      toast.success(editingClient ? 'Client updated successfully!' : 'Client created successfully!');
      await loadClients(); // Reload clients
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('❌ Error saving client:', error);
      toast.error(editingClient ? 'Failed to update client' : 'Failed to create client');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.company_name,
      contactName: client.contact_name || '',
      address: client.address,
      city: client.city,
      postalCode: client.postalCode || '',
      country: client.country,
      email: client.email || '',
      phone: client.phone || '',
      taxId: client.taxId || '',
      businessLicense: client.businessLicense || '',
      companyRegistration: client.companyRegistration || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (clientId: string) => {
    try {
      console.log('🗑️ Deleting client:', clientId);
      
      // Get current user for RLS compliance
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session?.user) {
        throw new Error('You must be logged in to delete clients');
      }
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)
        .eq('user_id', session.user.id); // Only delete user's own clients

      if (error) throw error;
      
      console.log('✅ Client deleted successfully');
      toast.success('Client deleted successfully!');
      await loadClients(); // Reload clients
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleClientSelect = (client: Client) => {
    console.log('🔍 [useSupabaseClients] handleClientSelect called with:', client.company_name, client);
    console.log('🔍 [useSupabaseClients] onClientSelect callback exists:', !!onClientSelect);
    onClientSelect?.(client);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const updateFormData = (data: Partial<ClientFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  return {
    clients,
    filteredClients,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    editingClient,
    formData,
    loading,
    resetForm,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleClientSelect,
    openAddDialog,
    updateFormData,
    loadClients
  };
}
