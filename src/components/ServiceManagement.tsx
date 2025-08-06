import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { Service, ServiceFormData } from '../types/service';
import { translations } from '../utils/translations';
import { useSupabaseServices } from '../hooks/useSupabaseServices';
import { useLanguage } from '../hooks/useLanguage';
import ServiceForm from './ServiceForm';
import ServiceTable from './ServiceTable';
import { ServiceDebugInfo } from './ServiceDebugInfo';
import { useCompany } from '../contexts/SimpleCompanyContext';

interface ServiceManagementProps {
  onServiceSelect?: (service: Service) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export default function ServiceManagement({ onServiceSelect, searchTerm: externalSearchTerm, onSearchChange }: ServiceManagementProps) {
  const { language, t, isRTL } = useLanguage();
  const { selectedCompany } = useCompany();
  
  const {
    services,
    loading,
    addService,
    updateService,
    deleteService
  } = useSupabaseServices();
  
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    hourlyRate: 0,
    currency: (selectedCompany?.default_currency as 'EUR' | 'ILS') || 'EUR',
    category: 'General'
  });

  useEffect(() => {
    if (externalSearchTerm !== undefined) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      hourlyRate: 0,
      currency: (selectedCompany?.default_currency as 'EUR' | 'ILS') || 'EUR',
      category: 'General'
    });
    setEditingService(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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

  const handleDelete = async (serviceId: string) => {
    await deleteService(serviceId);
  };

  const handleInputChange = (field: keyof ServiceFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 Service form submitted:', formData);
    console.log('Editing service:', editingService?.id || 'new service');
    
    if (editingService) {
      await updateService(editingService.id, formData);
    } else {
      await addService({
        name: formData.name,
        description: formData.description,
        default_rate: formData.hourlyRate,
        hourlyRate: formData.hourlyRate,
        currency: formData.currency,
        category: formData.category,
        isActive: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">{t.serviceManagement}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-corporate-blue hover:bg-corporate-blue-dark" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {t.addService}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? t.editService : t.addService}
              </DialogTitle>
            </DialogHeader>
            <ServiceForm 
              language={language}
              formData={formData}
              editingService={editingService}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading services...
            </div>
          ) : (
            <ServiceTable 
              language={language}
              services={filteredServices}
              onServiceSelect={onServiceSelect}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Debug Info - Remove this after fixing the issue */}
      <ServiceDebugInfo />
    </div>
  );
}
