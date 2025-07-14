import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { useSupabaseExpenses } from '@/hooks/useSupabaseExpenses';
import { useSupabaseSuppliers } from '@/hooks/useSupabaseSuppliers';
import { useExpenseCategories } from '@/hooks/useExpenseCategories';
import type { Expense } from '@/types/expense';

interface ExpenseFormProps {
  expense?: Expense | null;
  onClose: () => void;
  onSave: () => void;
  defaultExpenseType?: 'business' | 'personal';
}

const ExpenseForm = ({ expense, onClose, onSave, defaultExpenseType = 'business' }: ExpenseFormProps) => {
  const { addExpense, updateExpense } = useSupabaseExpenses();
  const { suppliers, addSupplier } = useSupabaseSuppliers();
  const { getCategoriesByType, expenseTypes } = useExpenseCategories();

  const [formData, setFormData] = useState({
    expenseType: defaultExpenseType,
    supplierId: '',
    description: '',
    amount: '',
    currency: 'ILS' as 'ILS' | 'EUR',
    expenseDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    isRecurring: false,
    recurringPeriod: 'monthly' as 'monthly' | 'yearly' | 'quarterly' | 'weekly',
    recurringStartDate: new Date().toISOString().split('T')[0],
    recurringEndDate: '',
    autoRenew: true,
    paymentMethod: 'credit_card',
    invoiceNumber: '',
    notes: '',
    receiptFile: null as File | null,
    receiptFileUrl: '',
    receiptFileName: '',
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with expense data if editing
  useEffect(() => {
    if (expense) {
      const expenseTypeData = expenseTypes.find(t => t.id === expense.expenseTypeId);
      setFormData({
        expenseType: expenseTypeData?.name as 'business' | 'personal' || 'business',
        supplierId: expense.supplierId || '',
        description: expense.description,
        amount: expense.amount.toString(),
        currency: expense.currency,
        expenseDate: expense.expenseDate,
        categoryId: expense.categoryId || '',
        isRecurring: expense.isRecurring,
        recurringPeriod: expense.recurringPeriod || 'monthly',
        recurringStartDate: expense.recurringStartDate || expense.expenseDate,
        recurringEndDate: expense.recurringEndDate || '',
        autoRenew: expense.autoRenew,
        paymentMethod: expense.paymentMethod,
        invoiceNumber: expense.invoiceNumber || '',
        notes: expense.notes || '',
        receiptFile: null,
        receiptFileUrl: expense.receiptFileUrl || '',
        receiptFileName: expense.receiptFileName || '',
      });
    }
  }, [expense, expenseTypes]);

  const currentCategories = getCategoriesByType(formData.expenseType);
  const currentSuppliers = suppliers.filter(s => s.active);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'תיאור הוא שדה חובה';
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = 'סכום חייב להיות גדול מ-0';
    }

    if (!formData.expenseDate) {
      newErrors.expenseDate = 'תאריך הוא שדה חובה';
    }

    if (new Date(formData.expenseDate) > new Date()) {
      newErrors.expenseDate = 'תאריך לא יכול להיות עתידי';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'ספק הוא שדה חובה';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'קטגוריה היא שדה חובה';
    }

    if (formData.isRecurring && !formData.recurringStartDate) {
      newErrors.recurringStartDate = 'תאריך התחלה נדרש למנוי';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ExpenseForm: Form submitted');
    console.log('Form data:', formData);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setLoading(true);
    try {
      const expenseTypeData = expenseTypes.find(t => t.name === formData.expenseType);
      if (!expenseTypeData) {
        console.error('Expense type not found:', formData.expenseType);
        throw new Error('Expense type not found');
      }

      console.log('Expense type found:', expenseTypeData);

      const expenseData = {
        expenseTypeId: expenseTypeData.id,
        supplierId: formData.supplierId,
        categoryId: formData.categoryId,
        description: formData.description,
        amount: Number(formData.amount),
        currency: formData.currency,
        expenseDate: formData.expenseDate,
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
        recurringStartDate: formData.isRecurring ? formData.recurringStartDate : undefined,
        recurringNextDate: formData.isRecurring ? calculateNextDate() : undefined,
        recurringEndDate: formData.recurringEndDate || undefined,
        autoRenew: formData.autoRenew,
        paymentMethod: formData.paymentMethod,
        invoiceNumber: formData.invoiceNumber,
        notes: formData.notes,
        receiptFileUrl: formData.receiptFileUrl,
        receiptFileName: formData.receiptFileName,
        active: true,
      };

      console.log('Expense data prepared:', expenseData);

      if (expense) {
        console.log('Updating existing expense');
        await updateExpense(expense.id, expenseData);
      } else {
        console.log('Adding new expense');
        await addExpense(expenseData);
      }

      console.log('Expense operation completed successfully');
      onSave();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextDate = () => {
    const startDate = new Date(formData.recurringStartDate);
    switch (formData.recurringPeriod) {
      case 'weekly':
        startDate.setDate(startDate.getDate() + 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() + 1);
        break;
      case 'quarterly':
        startDate.setMonth(startDate.getMonth() + 3);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() + 1);
        break;
    }
    return startDate.toISOString().split('T')[0];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simple file validation
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, receiptFile: 'גודל הקובץ לא יכול להיות גדול מ-10MB' }));
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, receiptFile: 'סוג קובץ לא נתמך. השתמש ב-PDF, JPG או PNG' }));
        return;
      }

      setFormData(prev => ({ 
        ...prev, 
        receiptFile: file,
        receiptFileName: file.name 
      }));
      setErrors(prev => ({ ...prev, receiptFile: '' }));
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'עריכת הוצאה' : 'הוצאה חדשה'}
          </DialogTitle>
          <DialogDescription>
            מלא את פרטי ההוצאה. שדות עם * הם חובה.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Expense Type */}
          <Card>
            <CardContent className="pt-4">
              <Label className="text-base font-medium">סוג הוצאה *</Label>
              <RadioGroup 
                value={formData.expenseType} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  expenseType: value as 'business' | 'personal',
                  categoryId: '' // Reset category when changing type
                }))}
                className="flex gap-6 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="business" id="business" />
                  <Label htmlFor="business" className="flex items-center gap-2">
                    📊 עסקי
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal" className="flex items-center gap-2">
                    🏠 אישי/משפחה
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expenseDate">תאריך ההוצאה *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.expenseDate && <p className="text-sm text-destructive mt-1">{errors.expenseDate}</p>}
                </div>

                <div>
                  <Label htmlFor="supplierId">ספק *</Label>
                  <Select value={formData.supplierId} onValueChange={(value) => setFormData(prev => ({ ...prev, supplierId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר ספק" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentSuppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.supplierId && <p className="text-sm text-destructive mt-1">{errors.supplierId}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="description">תיאור ההוצאה *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור מפורט של ההוצאה..."
                  maxLength={255}
                />
                {errors.description && <p className="text-sm text-destructive mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount">סכום *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                  {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <Label htmlFor="currency">מטבע *</Label>
                  <Select value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as 'ILS' | 'EUR' }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ILS">שח (₪)</SelectItem>
                      <SelectItem value="EUR">יורו (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoryId">קטגוריה *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-destructive mt-1">{errors.categoryId}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recurring Section */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))}
                />
                <Label htmlFor="isRecurring" className="text-base font-medium">
                  זהו מנוי חוזר
                </Label>
              </div>

              {formData.isRecurring && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurringPeriod">תדירות *</Label>
                      <Select value={formData.recurringPeriod} onValueChange={(value) => setFormData(prev => ({ ...prev, recurringPeriod: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">שבועי</SelectItem>
                          <SelectItem value="monthly">חודשי</SelectItem>
                          <SelectItem value="quarterly">רבעוני</SelectItem>
                          <SelectItem value="yearly">שנתי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="recurringStartDate">תאריך התחלה *</Label>
                      <Input
                        id="recurringStartDate"
                        type="date"
                        value={formData.recurringStartDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurringStartDate: e.target.value }))}
                      />
                      {errors.recurringStartDate && <p className="text-sm text-destructive mt-1">{errors.recurringStartDate}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurringEndDate">תאריך סיום (אופציונלי)</Label>
                      <Input
                        id="recurringEndDate"
                        type="date"
                        value={formData.recurringEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                        min={formData.recurringStartDate}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoRenew"
                        checked={formData.autoRenew}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoRenew: checked }))}
                      />
                      <Label htmlFor="autoRenew">חידוש אוטומטי</Label>
                    </div>
                  </div>

                  {formData.recurringStartDate && (
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm">
                        <strong>חיוב הבא:</strong> {calculateNextDate()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentMethod">אמצעי תשלום</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credit_card">כרטיס אשראי</SelectItem>
                      <SelectItem value="bank_transfer">העברה בנקאית</SelectItem>
                      <SelectItem value="cash">מזומן</SelectItem>
                      <SelectItem value="check">המחאה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="invoiceNumber">מספר חשבונית/הזמנה</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="אופציונלי"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <Label>קובץ (קבלה/חשבונית)</Label>
              
              {!formData.receiptFileUrl && !formData.receiptFile && (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-primary">
                          גרור קובץ לכאן או לחץ לבחירה
                        </span>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                      />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      PDF, JPG, PNG (עד 10MB)
                    </p>
                  </div>
                </div>
              )}

              {(formData.receiptFileUrl || formData.receiptFile) && (
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">
                      {formData.receiptFileName || formData.receiptFile?.name}
                    </p>
                    {formData.receiptFile && (
                      <p className="text-xs text-muted-foreground">
                        {(formData.receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {formData.receiptFileUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(formData.receiptFileUrl, '_blank')}
                      >
                        View
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        receiptFile: null, 
                        receiptFileUrl: '', 
                        receiptFileName: '' 
                      }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {errors.receiptFile && <p className="text-sm text-destructive">{errors.receiptFile}</p>}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-4">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות נוספות על ההוצאה..."
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.notes.length}/500
              </p>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {expense ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseForm;