import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '../hooks/useSession';
import { useCompanies } from '../hooks/useCompanies';
import { AlertCircle, Bug, Terminal, Trash2, Download, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warn' | 'error' | 'debug' | 'system';
  message: string;
  details?: any;
  source: string;
}

const DebugConsole = () => {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const { companies, loading: companiesLoading, error: companiesError } = useCompanies();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [systemStats, setSystemStats] = useState({
    memoryUsage: 0,
    renderCount: 0,
    errorCount: 0,
    warningCount: 0,
    lastUpdate: new Date().toISOString()
  });
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);

  const addLog = (type: LogEntry['type'], message: string, details?: any, source: string = 'System') => {
    if (!isMonitoring) return;
    
    const logEntry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
      source
    };

    setLogs(prev => {
      const newLogs = [...prev, logEntry].slice(-500); // Keep last 500 logs
      return newLogs;
    });

    // Update stats
    setSystemStats(prev => ({
      ...prev,
      errorCount: type === 'error' ? prev.errorCount + 1 : prev.errorCount,
      warningCount: type === 'warn' ? prev.warningCount + 1 : prev.warningCount,
      lastUpdate: new Date().toISOString()
    }));
  };

  // Monitor renders
  useEffect(() => {
    renderCountRef.current += 1;
    setSystemStats(prev => ({
      ...prev,
      renderCount: renderCountRef.current
    }));
    
    addLog('debug', `Component render #${renderCountRef.current}`, {
      user: user?.email,
      companiesLoading,
      companiesCount: companies?.length || 0
    }, 'DebugConsole');
  });

  // Monitor user authentication
  useEffect(() => {
    if (user) {
      addLog('system', `User authenticated: ${user.email}`, {
        userId: user.id,
        userMetadata: user.user_metadata
      }, 'Auth');
    } else if (!loading) {
      addLog('warn', 'User not authenticated', null, 'Auth');
    }
  }, [user, loading]);

  // Monitor companies loading
  useEffect(() => {
    if (companiesLoading) {
      addLog('info', 'Loading companies from Supabase...', null, 'Companies');
    } else if (companiesError) {
      addLog('error', 'Failed to load companies', companiesError, 'Companies');
    } else if (companies) {
      addLog('system', `Companies loaded successfully: ${companies.length} found`, {
        companies: companies.map(c => ({ id: c.id, name: c.name, active: c.active }))
      }, 'Companies');
    }
  }, [companies, companiesLoading, companiesError]);

  // Monitor memory usage
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memInfo = (performance as any).memory;
        setSystemStats(prev => ({
          ...prev,
          memoryUsage: Math.round(memInfo.usedJSHeapSize / 1024 / 1024)
        }));
      }
    };

    const interval = setInterval(checkMemory, 2000);
    return () => clearInterval(interval);
  }, []);

  // Monitor network requests
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0]?.toString() || 'Unknown URL';
      addLog('debug', `Network request: ${url}`, { method: args[1]?.method || 'GET' }, 'Network');
      
      try {
        const response = await originalFetch(...args);
        addLog('debug', `Network response: ${response.status} - ${url}`, {
          status: response.status,
          ok: response.ok
        }, 'Network');
        return response;
      } catch (error) {
        addLog('error', `Network error: ${url}`, error, 'Network');
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Monitor console errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      addLog('error', args.join(' '), args, 'Console');
      originalError(...args);
    };

    console.warn = (...args) => {
      addLog('warn', args.join(' '), args, 'Console');
      originalWarn(...args);
    };

    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('DEBUG:') || message.includes('🐛')) {
        addLog('debug', message, args, 'Console');
      }
      originalLog(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Test Supabase connection
  const testSupabaseConnection = async () => {
    addLog('info', 'Testing Supabase connection...', null, 'Test');
    
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog('error', 'Supabase session error', error, 'Test');
      } else {
        addLog('system', 'Supabase session check successful', {
          hasSession: !!data.session,
          user: data.session?.user?.email
        }, 'Test');
      }

      // Test database connection
      const { data: testData, error: dbError } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      if (dbError) {
        addLog('error', 'Database connection failed', dbError, 'Test');
      } else {
        addLog('system', 'Database connection successful', testData, 'Test');
      }
    } catch (error) {
      addLog('error', 'Connection test failed', error, 'Test');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setSystemStats(prev => ({
      ...prev,
      errorCount: 0,
      warningCount: 0,
      renderCount: 0
    }));
    renderCountRef.current = 0;
    addLog('system', 'Debug console cleared', null, 'System');
  };

  const exportLogs = () => {
    const logData = {
      exportTime: new Date().toISOString(),
      systemStats,
      logs: logs.map(log => ({
        ...log,
        details: JSON.stringify(log.details, null, 2)
      }))
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    addLog('system', 'Logs exported successfully', null, 'System');
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warn': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'debug': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'system': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Debug Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 font-mono">
      {/* Header */}
      <div className="bg-black border-b border-green-500 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-6 w-6" />
              <h1 className="text-xl font-bold">DEBUG CONSOLE</h1>
              <Badge variant="outline" className="bg-green-900 text-green-400 border-green-500">
                LIVE MONITORING
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`${isMonitoring ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'} border-current`}
              >
                {isMonitoring ? 'Monitoring ON' : 'Monitoring OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={testSupabaseConnection}
                className="text-blue-400 border-blue-400 hover:bg-blue-900"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                className="text-yellow-400 border-yellow-400 hover:bg-yellow-900"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                className="text-red-400 border-red-400 hover:bg-red-900"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-gray-400 border-gray-400 hover:bg-gray-800"
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{systemStats.renderCount}</div>
              <div className="text-xs text-gray-400">RENDERS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{systemStats.errorCount}</div>
              <div className="text-xs text-gray-400">ERRORS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{systemStats.warningCount}</div>
              <div className="text-xs text-gray-400">WARNINGS</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{systemStats.memoryUsage}MB</div>
              <div className="text-xs text-gray-400">MEMORY</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{logs.length}</div>
              <div className="text-xs text-gray-400">LOG ENTRIES</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-green-400">
                {user ? `✓ ${user.email}` : '✗ Not Auth'}
              </div>
              <div className="text-xs text-gray-400">AUTH STATUS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black border border-green-500 rounded-lg h-96 overflow-y-auto p-4">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Bug className="h-12 w-12 mx-auto mb-4" />
                <p>Debug console is ready. Monitoring system events...</p>
              </div>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 text-xs hover:bg-gray-800 p-1 rounded"
                  >
                    <span className="text-gray-500 w-20 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`w-16 text-center px-2 py-1 rounded text-xs font-semibold ${
                        log.type === 'error' ? 'bg-red-900 text-red-400' :
                        log.type === 'warn' ? 'bg-yellow-900 text-yellow-400' :
                        log.type === 'info' ? 'bg-blue-900 text-blue-400' :
                        log.type === 'system' ? 'bg-green-900 text-green-400' :
                        'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-gray-400 w-20 flex-shrink-0">
                      [{log.source}]
                    </span>
                    <div className="flex-1">
                      <div className="text-green-400">{log.message}</div>
                      {log.details && (
                        <div className="text-gray-500 text-xs mt-1 ml-4">
                          {JSON.stringify(log.details, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs text-gray-400">
            <span>🔍 Debug Console Active</span>
            <span className="mx-4">|</span>
            <span>Last Update: {new Date(systemStats.lastUpdate).toLocaleTimeString()}</span>
            <span className="mx-4">|</span>
            <span>Status: {isMonitoring ? '🟢 Monitoring' : '🔴 Paused'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugConsole;
