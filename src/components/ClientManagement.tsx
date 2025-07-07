import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Client, ClientFormData } from '../types/client';
import { translations } from '../utils/translations';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface ClientManagementProps {
  language: 'de' | 'en' | 'he' | 'fr';
  onClientSelect?: (client: Client) => void;
}

export default function ClientManagement({ language, onClientSelect }: ClientManagementProps) {
  const t = translations[language];
  const isRTL = language === 'he';
  
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
  const [pasteText, setPasteText] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');

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
    setPasteText('');
  };

  const parseClientInfo = async (text: string) => {
    if (!text.trim()) return;

    // Basic regex parsing
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/;
    const phoneRegex = /[\+]?[\d\-\(\)\s]{10,}/;
    const companyNameRegex = /^([^\n]+)/;

    let parsedData: Partial<ClientFormData> = {};

    // Extract email
    const emailMatch = text.match(emailRegex);
    if (emailMatch) parsedData.email = emailMatch[0];

    // Extract phone
    const phoneMatch = text.match(phoneRegex);
    if (phoneMatch) parsedData.phone = phoneMatch[0].replace(/\s+/g, ' ').trim();

    // Use OpenAI if key is provided
    if (openAiKey && openAiKey.trim()) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Extract client information from the given text and return a JSON object with these fields: companyName, contactName, address, city, postalCode, email, phone, taxId. Only include fields that are clearly identifiable. Return only valid JSON.'
              },
              {
                role: 'user',
                content: text
              }
            ],
            temperature: 0.1,
            max_tokens: 500
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const aiResult = JSON.parse(data.choices[0].message.content);
          parsedData = { ...parsedData, ...aiResult };
        }
      } catch (error) {
        console.error('OpenAI parsing failed, using basic parsing:', error);
      }
    }

    // Basic parsing fallback
    if (!parsedData.companyName) {
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length > 0) parsedData.companyName = lines[0].trim();
    }

    // Update form data with parsed information
    setFormData(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(parsedData).filter(([_, value]) => value && value.toString().trim())
      )
    }));
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

  const ClientForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Smart Paste Section */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <Label htmlFor="pasteText">הדבק פרטי לקוח (Copy & Paste)</Label>
          <textarea
            id="pasteText"
            className="w-full h-24 p-2 border rounded-md resize-none mt-2"
            placeholder="הדבק כאן כתובת מייל, פרטי איש קשר או כל מידע על הלקוח..."
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => parseClientInfo(pasteText)}
            >
              נתח פרטים
            </Button>
            <Input
              type="password"
              placeholder="OpenAI API Key (אופציונלי)"
              value={openAiKey}
              onChange={(e) => setOpenAiKey(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="companyName">{t.clientCompany} *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactName">{t.contactName}</Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) => handleInputChange('contactName', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="email">{t.email}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="phone">{t.phone}</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="taxId">{t.taxId}</Label>
          <Input
            id="taxId"
            value={formData.taxId}
            onChange={(e) => handleInputChange('taxId', e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">{t.clientAddress} *</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">{t.clientCity} *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="postalCode">{t.postalCode}</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => handleInputChange('postalCode', e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
          {t.cancel}
        </Button>
        <Button type="submit" className="bg-corporate-blue hover:bg-corporate-blue-dark">
          {t.save}
        </Button>
      </div>
    </form>
  );

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-corporate-blue">{t.clientManagement}</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-corporate-blue hover:bg-corporate-blue-dark" onClick={resetForm}>
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
            <ClientForm />
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
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? t.noClients : t.noClients}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.clientCompany}</TableHead>
                  <TableHead>{t.contactName}</TableHead>
                  <TableHead>{t.clientCity}</TableHead>
                  <TableHead>{t.email}</TableHead>
                  <TableHead>{t.phone}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell 
                      className="font-medium"
                      onClick={() => onClientSelect?.(client)}
                    >
                      {client.companyName}
                    </TableCell>
                    <TableCell onClick={() => onClientSelect?.(client)}>
                      {client.contactName}
                    </TableCell>
                    <TableCell onClick={() => onClientSelect?.(client)}>
                      {client.city}, {client.country}
                    </TableCell>
                    <TableCell onClick={() => onClientSelect?.(client)}>
                      {client.email}
                    </TableCell>
                    <TableCell onClick={() => onClientSelect?.(client)}>
                      {client.phone}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}