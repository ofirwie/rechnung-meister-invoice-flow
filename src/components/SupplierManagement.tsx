import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, Save, X } from 'lucide-react';
import { useSupabaseSuppliers } from '@/hooks/useSupabaseSuppliers';
import type { Supplier } from '@/types/expense';

interface SupplierManagementProps {
  open: boolean;
  onClose: () => void;
}

const SupplierManagement = ({ open, onClose }: SupplierManagementProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    taxId: '',
    address: '',
    contactPerson: '',
    notes: '',
  });

  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier, loadSuppliers } = useSupabaseSuppliers();

  useEffect(() => {
    if (open) {
      loadSuppliers();
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SupplierManagement: Form submitted');
    console.log('Form data:', formData);
    console.log('Editing supplier:', editingSupplier);

    try {
      if (editingSupplier) {
        console.log('Updating existing supplier');
        await updateSupplier(editingSupplier.id, formData);
      } else {
        console.log('Adding new supplier');
        await addSupplier({ ...formData, active: true });
      }
      console.log('Supplier operation completed successfully');
      handleCloseForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      website: supplier.website || '',
      taxId: supplier.taxId || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      notes: supplier.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק ספק זה?')) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error('Error deleting supplier:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      website: '',
      taxId: '',
      address: '',
      contactPerson: '',
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            ניהול ספקים
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              ספק חדש
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingSupplier ? 'עריכת ספק' : 'ספק חדש'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">שם הספק *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">איש קשר</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">טלפון</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="website">אתר אינטרנט</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">מספר עוסק/חברה</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">כתובת</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">הערות</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    שמור
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseForm} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    ביטול
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">טוען ספקים...</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">אין ספקים להצגה</p>
            </div>
          ) : (
            suppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{supplier.name}</h3>
                      {supplier.contactPerson && (
                        <p className="text-sm text-muted-foreground">איש קשר: {supplier.contactPerson}</p>
                      )}
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {supplier.email && <p>אימייל: {supplier.email}</p>}
                        {supplier.phone && <p>טלפון: {supplier.phone}</p>}
                        {supplier.website && <p>אתר: {supplier.website}</p>}
                        {supplier.taxId && <p>מס׳ עוסק: {supplier.taxId}</p>}
                        {supplier.address && <p>כתובת: {supplier.address}</p>}
                      </div>
                      {supplier.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{supplier.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-700">
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierManagement;