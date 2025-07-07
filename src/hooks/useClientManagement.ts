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
    taxId: ''
  });

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
      taxId: ''
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
        ...formData,
        updatedAt: new Date().toISOString()
      };
      setClients(prev => prev.map(client => 
        client.id === editingClient.id ? updatedClient : client
      ));
    } else {
      // Create new client
      const newClient: Client = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
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
      companyName: client.companyName,
      contactName: client.contactName || '',
      address: client.address,
      city: client.city,
      postalCode: client.postalCode || '',
      country: client.country,
      email: client.email || '',
      phone: client.phone || '',
      taxId: client.taxId || ''
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