import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  additional_info?: any;
}

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to last 1000 entries

      if (error) throw error;

      const formattedLogs: AuditLog[] = (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        action: log.action,
        table_name: log.table_name,
        record_id: log.record_id,
        old_values: log.old_values,
        new_values: log.new_values,
        ip_address: log.ip_address as string | null,
        user_agent: log.user_agent as string | null,
        created_at: log.created_at,
        additional_info: log.additional_info
      }));
      setAuditLogs(formattedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInvoiceAuditLogs = async (invoiceNumber: string) => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'invoices')
        .eq('record_id', invoiceNumber)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading invoice audit logs:', error);
      return [];
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return {
    auditLogs,
    loading,
    loadAuditLogs,
    getInvoiceAuditLogs
  };
}