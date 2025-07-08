import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientFormData } from '../types/client';

export function useSupabaseClients(onClientSelect?: (client: Client) => void) {
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedClients: Client[] = data.map(client => ({
        id: client.id,
        companyName: client.company_name,
        contactName: client.contact_name,
        address: client.address,
        city: client.city,
        postalCode: client.postal_code,
        country: client.country,
        email: client.email,
        phone: client.phone,
        taxId: client.tax_id,
        businessLicense: client.business_license,
        companyRegistration: client.company_registration,
        createdAt: client.created_at,
        updatedAt: client.updated_at
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        // Create new client
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
            company_registration: formData.companyRegistration
          });

        if (error) throw error;
      }
      
      await loadClients(); // Reload clients
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      contactName: client.contactName || '',
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
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      
      await loadClients(); // Reload clients
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleClientSelect = (client: Client) => {
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