import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle2, Trash2, RefreshCw } from 'lucide-react';

export default function InvoiceMaintenancePage() {
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [totalInvoices, setTotalInvoices] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      checkForDuplicates();
    }
  };

  const checkForDuplicates = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setError('Not authenticated');
        return;
      }

      // Get all invoices for the user
      const { data: invoices, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      setTotalInvoices(invoices?.length || 0);

      // Find duplicates
      const invoiceMap = new Map();
      const duplicateList: any[] = [];

      invoices?.forEach(invoice => {
        if (invoiceMap.has(invoice.invoice_number)) {
          duplicateList.push(invoice);
        } else {
          invoiceMap.set(invoice.invoice_number, invoice);
        }
      });

      setDuplicates(duplicateList);
      
      if (duplicateList.length === 0) {
        setMessage('✅ No duplicate invoices found!');
      } else {
        setMessage(`⚠️ Found ${duplicateList.length} duplicate invoices`);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
      setError('Failed to check for duplicates');
    } finally {
      setLoading(false);
    }
  };

  const deleteDuplicate = async (invoiceId: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId)
        .eq('user_id', userId);

      if (error) throw error;

      setMessage('✅ Duplicate deleted successfully');
      checkForDuplicates(); // Refresh
    } catch (error) {
      console.error('Error deleting duplicate:', error);
      setError('Failed to delete duplicate');
    }
  };

  const deleteAllDuplicates = async () => {
    if (!confirm(`Are you sure you want to delete all ${duplicates.length} duplicate invoices?`)) {
      return;
    }

    setLoading(true);
    let successCount = 0;
    
    for (const dup of duplicates) {
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', dup.id)
          .eq('user_id', userId);

        if (!error) successCount++;
      } catch (error) {
        console.error('Error deleting duplicate:', error);
      }
    }

    setMessage(`✅ Deleted ${successCount} duplicate invoices`);
    checkForDuplicates(); // Refresh
  };

  const testCancellation = async () => {
    try {
      // Get a pending invoice to test cancellation
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending_approval')
        .limit(1);

      if (!invoices || invoices.length === 0) {
        setError('No pending invoices found to test cancellation');
        return;
      }

      const testInvoice = invoices[0];
      
      // Try to update status to cancelled
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('invoice_number', testInvoice.invoice_number)
        .eq('user_id', userId);

      if (error) {
        setError(`Cancellation failed: ${error.message}`);
        console.error('Cancellation error:', error);
      } else {
        setMessage('✅ Cancellation test successful!');
      }
    } catch (error) {
      console.error('Test cancellation error:', error);
      setError('Failed to test cancellation');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Invoice Maintenance</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {message && (
        <Alert className="mb-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-2xl font-bold">{totalInvoices}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duplicates Found</p>
              <p className="text-2xl font-bold text-orange-600">{duplicates.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Duplicate Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={checkForDuplicates} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Check for Duplicates
            </Button>

            {duplicates.length > 0 && (
              <>
                <Button 
                  onClick={deleteAllDuplicates} 
                  variant="destructive"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All Duplicates
                </Button>

                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {duplicates.map((dup) => (
                    <div key={dup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-mono text-sm">{dup.invoice_number}</p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(dup.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteDuplicate(dup.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Functions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testCancellation} variant="outline">
            Test Invoice Cancellation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
