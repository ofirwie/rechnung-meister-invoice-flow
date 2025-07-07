import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { Service } from '../types/service';
import { translations } from '../utils/translations';
import { useServiceManagement } from '../hooks/useServiceManagement';
import ServiceForm from './ServiceForm';
import ServiceTable from './ServiceTable';

interface ServiceManagementProps {
  language: 'de' | 'en' | 'he' | 'fr';
  onServiceSelect?: (service: Service) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export default function ServiceManagement({ language, onServiceSelect, searchTerm: externalSearchTerm, onSearchChange }: ServiceManagementProps) {
  const t = translations[language];
  const isRTL = language === 'he';
  
  const {
    filteredServices,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    editingService,
    formData,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    openAddDialog
  } = useServiceManagement(externalSearchTerm, onSearchChange);

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">{t.serviceManagement}</h2>
        <Dialog open={isDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-corporate-blue hover:bg-corporate-blue-dark" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {t.addService}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
          <ServiceTable 
            language={language}
            services={filteredServices}
            onServiceSelect={onServiceSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}