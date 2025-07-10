export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  taxId?: string;
  address?: string;
  contactPerson?: string;
  notes?: string;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseType {
  id: string;
  name: 'business' | 'personal';
  description: string;
  color: string;
  active: boolean;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  expenseTypeId: string;
  name: string;
  description?: string;
  color: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseTypeId: string;
  supplierId?: string;
  categoryId?: string;
  description: string;
  amount: number;
  currency: 'ILS' | 'EUR';
  expenseDate: string;
  isRecurring: boolean;
  recurringPeriod?: 'monthly' | 'yearly' | 'quarterly' | 'weekly';
  recurringStartDate?: string;
  recurringNextDate?: string;
  recurringEndDate?: string;
  autoRenew: boolean;
  paymentMethod: string;
  invoiceNumber?: string;
  receiptFileUrl?: string;
  receiptFileName?: string;
  receiptDriveId?: string;
  notes?: string;
  active: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields
  supplier?: Supplier;
  category?: ExpenseCategory;
  expenseType?: ExpenseType;
}

export interface ExpenseStats {
  totalCurrentMonth: { ILS: number; EUR: number };
  activeSubscriptions: number;
  highestExpenseThisMonth: number;
  expensesByCategory: Array<{ 
    category: string; 
    amount: number; 
    color: string; 
    percentage: number;
  }>;
}

export interface ExpenseFilters {
  searchTerm: string;
  dateFrom?: string;
  dateTo?: string;
  suppliers: string[];
  categories: string[];
  currencies: ('ILS' | 'EUR')[];
  expenseType: 'business' | 'personal' | 'all';
  isRecurring: 'true' | 'false' | 'all';
  minAmount?: number;
  maxAmount?: number;
}

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}