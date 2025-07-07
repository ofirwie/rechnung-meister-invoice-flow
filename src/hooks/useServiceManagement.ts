import { useState } from 'react';
import { Service, ServiceFormData } from '../types/service';
import { useLocalStorage } from './useLocalStorage';

export function useServiceManagement() {
  const [services, setServices] = useLocalStorage<Service[]>('invoice-services', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    hourlyRate: 0,
    currency: 'EUR',
    category: ''
  });

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      hourlyRate: 0,
      currency: 'EUR',
      category: ''
    });
    setEditingService(null);
  };

  const handleInputChange = (field: keyof ServiceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      // Update existing service
      const updatedService: Service = {
        ...editingService,
        ...formData,
        updatedAt: new Date().toISOString()
      };
      setServices(prev => prev.map(service => 
        service.id === editingService.id ? updatedService : service
      ));
    } else {
      // Create new service
      const newService: Service = {
        id: Date.now().toString(),
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setServices(prev => [...prev, newService]);
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      hourlyRate: service.hourlyRate,
      currency: service.currency,
      category: service.category
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    setServices(prev => prev.filter(service => service.id !== serviceId));
  };

  const openAddDialog = () => {
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      hourlyRate: 0,
      currency: 'EUR',
      category: ''
    });
    setIsDialogOpen(true);
  };

  return {
    services,
    filteredServices,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    editingService,
    formData,
    resetForm,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    openAddDialog
  };
}