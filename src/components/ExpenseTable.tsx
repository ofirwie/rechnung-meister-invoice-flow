import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Edit, 
  Trash2, 
  Copy, 
  FileText, 
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Expense } from '@/types/expense';
import { useSupabaseExpenses } from '@/hooks/useSupabaseExpenses';

interface ExpenseTableProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
}

const ExpenseTable = ({ expenses, loading, onEdit }: ExpenseTableProps) => {
  const { deleteExpense, duplicateExpense } = useSupabaseExpenses();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteExpense(id);
    setDeletingId(null);
  };

  const handleDuplicate = async (expense: Expense) => {
    await duplicateExpense(expense);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatCurrency = (amount: number, currency: 'ILS' | 'EUR') => {
    const symbol = currency === 'ILS' ? '₪' : '€';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const getRecurringBadge = (expense: Expense) => {
    if (!expense.isRecurring) return null;
    
    const periodLabels = {
      monthly: 'חודשי',
      quarterly: 'רבעוני', 
      yearly: 'שנתי',
      weekly: 'שבועי'
    };

    return (
      <Badge variant="outline" className="text-xs">
        {periodLabels[expense.recurringPeriod as keyof typeof periodLabels] || 'מנוי'}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין הוצאות להצגה</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>תאריך</TableHead>
              <TableHead>ספק</TableHead>
              <TableHead>תיאור</TableHead>
              <TableHead>קטגוריה</TableHead>
              <TableHead>סכום</TableHead>
              <TableHead>מטבע</TableHead>
              <TableHead>מנוי</TableHead>
              <TableHead>קובץ</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  {formatDate(expense.expenseDate)}
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {expense.supplier?.name || 'ללא ספק'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[200px] truncate" title={expense.description}>
                    {expense.description}
                  </div>
                  {expense.notes && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={expense.notes}>
                      {expense.notes}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {expense.category && (
                    <Badge 
                      variant="outline" 
                      style={{ borderColor: expense.category.color, color: expense.category.color }}
                    >
                      {expense.category.name}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(expense.amount, expense.currency)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {expense.currency}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getRecurringBadge(expense)}
                </TableCell>
                <TableCell>
                  {expense.receiptFileUrl ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(expense.receiptFileUrl, '_blank')}
                      className="p-1"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Edit className="w-4 h-4 mr-2" />
                        עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(expense)}>
                        <Copy className="w-4 h-4 mr-2" />
                        שכפול
                      </DropdownMenuItem>
                      {expense.receiptFileUrl && (
                        <DropdownMenuItem onClick={() => window.open(expense.receiptFileUrl, '_blank')}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View בקובץ
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Summary Footer */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span>סה״כ בעמוד זה: {expenses.length} הוצאות</span>
            <div className="flex gap-4">
              <span>
                ₪{expenses.filter(e => e.currency === 'ILS').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </span>
              <span>
                €{expenses.filter(e => e.currency === 'EUR').reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseTable;