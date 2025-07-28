import { useState } from 'react';
import { Client, ClientFormData } from '../types/client';
import { useLocalStorage } from './useLocalStorage';

export function useClientManagement(onClientSelect?: (client: Client) => void) {
  const [clients, setClients] = useLocalStorage<Client[]>('invoice-clients', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      // Update existing client
      const updatedClient: Client = {
        ...editingClient,
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
        updated_at: new Date().toISOString(),
      };
      setClients(prev => prev.map(client => 
        client.id === editingClient.id ? updatedClient : client
      ));
    } else {
      // Create new client
      const newClient: Client = {
        id: Date.now().toString(),
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
        
        created_at: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updatedAt: new Date().toISOString()
        
      };
      setClients(prev => [...prev, newClient]);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.company_name,
      contactName: client.contact_name || '',
      address: client.address,
      city: client.city,
      postalCode: client.postal_code || '',
      country: client.country,
      email: client.email || '',
      phone: client.phone || '',
      taxId: client.tax_id || '',
      businessLicense: client.business_license || '',
      companyRegistration: client.company_registration || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (clientId: string) => {
    setClients(prev => prev.filter(client => client.id !== clientId));
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
    resetForm,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleClientSelect,
    openAddDialog,
    updateFormData
  };
}