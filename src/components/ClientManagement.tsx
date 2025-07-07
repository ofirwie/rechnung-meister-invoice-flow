import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { Client } from '../types/client';
import { translations } from '../utils/translations';
import { useClientManagement } from '../hooks/useClientManagement';
import ClientForm from './ClientForm';
import ClientTable from './ClientTable';

interface ClientManagementProps {
  language: 'de' | 'en' | 'he' | 'fr';
  onClientSelect?: (client: Client) => void;
}

export default function ClientManagement({ language, onClientSelect }: ClientManagementProps) {
  const t = translations[language];
  const isRTL = language === 'he';
  
  const {
    filteredClients,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    editingClient,
    formData,
    handleInputChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleClientSelect,
    openAddDialog,
    updateFormData
  } = useClientManagement(onClientSelect);

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">{t.clientManagement}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-corporate-blue hover:bg-corporate-blue-dark" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {t.addClient}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? t.editClient : t.addClient}
              </DialogTitle>
            </DialogHeader>
            <ClientForm 
              language={language}
              formData={formData}
              editingClient={editingClient}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              onUpdateFormData={updateFormData}
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

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          <ClientTable 
            language={language}
            clients={filteredClients}
            onClientSelect={handleClientSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}