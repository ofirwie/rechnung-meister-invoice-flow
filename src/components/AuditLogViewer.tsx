import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Eye } from 'lucide-react';
import { useAuditLogs, AuditLog } from '../hooks/useAuditLogs';
import { formatGermanDate } from '../utils/formatters';

interface AuditLogViewerProps {
  language: 'de' | 'en';
}

export default function AuditLogViewer({ language }: AuditLogViewerProps) {
  const { auditLogs, loading } = useAuditLogs();

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'update':
        return 'bg-yellow-100 text-yellow-800';
      case 'insert':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (action: string) => {
    switch (action.toLowerCase()) {
      case 'delete':
        return language === 'de' ? 'Gelöscht' : 'Deleted';
      case 'update':
        return language === 'de' ? 'Aktualisiert' : 'Updated';
      case 'insert':
        return language === 'de' ? 'Erstellt' : 'Created';
      default:
        return action;
    }
  };

  const formatTableName = (tableName: string) => {
    switch (tableName) {
      case 'invoices':
        return language === 'de' ? 'Rechnungen' : 'Invoices';
      default:
        return tableName;
    }
  };

  const isDeletionAction = (log: AuditLog) => {
    return log.action.toLowerCase() === 'delete' || 
           (log.action.toLowerCase() === 'update' && 
            log.new_values && 
            log.new_values.deleted_at !== null);
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        {language === 'de' ? 'Lade Audit-Logs...' : 'Loading audit logs...'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-corporate-blue">
          {language === 'de' ? 'Audit-Protokoll' : 'Audit Log'}
        </h2>
      </div>

      {/* Warning for deletions */}
      {auditLogs.some(isDeletionAction) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-red-800">
                {language === 'de' ? 'Kritische Aktionen erkannt' : 'Critical Actions Detected'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              {language === 'de' 
                ? 'Löschungen von Rechnungen wurden erkannt. Diese Aktionen sind kritisch und müssen überwacht werden.'
                : 'Invoice deletions have been detected. These actions are critical and must be monitored.'}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {language === 'de' ? 'Keine Audit-Logs verfügbar' : 'No audit logs available'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'de' ? 'Zeitstempel' : 'Timestamp'}</TableHead>
                  <TableHead>{language === 'de' ? 'Aktion' : 'Action'}</TableHead>
                  <TableHead>{language === 'de' ? 'Tabelle' : 'Table'}</TableHead>
                  <TableHead>{language === 'de' ? 'Datensatz ID' : 'Record ID'}</TableHead>
                  <TableHead>{language === 'de' ? 'Benutzer ID' : 'User ID'}</TableHead>
                  <TableHead>{language === 'de' ? 'Details' : 'Details'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className={`hover:bg-muted/50 ${isDeletionAction(log) ? 'bg-red-50 border-l-4 border-l-red-500' : ''}`}
                  >
                    <TableCell className="font-medium">
                      {formatGermanDate(log.created_at.split('T')[0])} {log.created_at.split('T')[1]?.split('.')[0]}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {getActionText(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatTableName(log.table_name)}</TableCell>
                    <TableCell className="font-mono">{log.record_id}</TableCell>
                    <TableCell className="font-mono text-sm">{log.user_id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      {isDeletionAction(log) && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {language === 'de' ? 'KRITISCH' : 'CRITICAL'}
                          </span>
                        </div>
                      )}
                      {log.old_values && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            <Eye className="w-3 h-3 inline mr-1" />
                            {language === 'de' ? 'Alte Werte' : 'Old Values'}
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(log.old_values, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.new_values && (
                        <details className="mt-1">
                          <summary className="cursor-pointer text-sm text-green-600 hover:text-green-800">
                            <Eye className="w-3 h-3 inline mr-1" />
                            {language === 'de' ? 'Neue Werte' : 'New Values'}
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32">
                            {JSON.stringify(log.new_values, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {auditLogs.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {auditLogs.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Gesamt Aktionen' : 'Total Actions'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {auditLogs.filter(log => isDeletionAction(log)).length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Löschungen' : 'Deletions'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {auditLogs.filter(log => log.action.toLowerCase() === 'update').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Änderungen' : 'Updates'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {auditLogs.filter(log => log.action.toLowerCase() === 'insert').length}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'de' ? 'Erstellungen' : 'Creations'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}