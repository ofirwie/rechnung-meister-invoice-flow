import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Download, Trash2, Search, Filter, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebugLogger, DebugLog, LogLevel } from '../hooks/useDebugLogger';
import { toast } from 'sonner';

interface GlobalDebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function GlobalDebugPanel({ isVisible, onToggle }: GlobalDebugPanelProps) {
  const { allLogs, clearLogs, exportLogs, copyLogs } = useDebugLogger({ component: 'GlobalDebugPanel' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [showContext, setShowContext] = useState(true);

  // Get unique components and levels from logs
  const components = useMemo(() => {
    const unique = new Set(allLogs.map(log => log.component));
    return Array.from(unique).sort();
  }, [allLogs]);

  const levels: (LogLevel | 'all')[] = ['all', 'trace', 'info', 'warn', 'error'];

  // Filter logs based on search and filters
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          log.message.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.component.toLowerCase().includes(searchLower) ||
          (log.context && JSON.stringify(log.context).toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Component filter
      if (selectedComponent !== 'all' && log.component !== selectedComponent) {
        return false;
      }

      // Level filter
      if (selectedLevel !== 'all' && log.level !== selectedLevel) {
        return false;
      }

      return true;
    });
  }, [allLogs, searchTerm, selectedComponent, selectedLevel]);

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const copyLogToClipboard = async (log: DebugLog) => {
    const content = `[${log.timestamp}] ${log.level.toUpperCase()} [${log.component}] ${log.action}: ${log.message}` + 
      (log.context ? `\nContext: ${JSON.stringify(log.context, null, 2)}` : '') +
      (log.stack_trace ? `\nStack: ${log.stack_trace}` : '');
    
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Log copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy log');
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'trace': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'info': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'warn': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'error': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getLevelEmoji = (level: LogLevel) => {
    switch (level) {
      case 'trace': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onToggle()}
    >
      <Card className="w-full max-w-6xl h-[90vh] flex flex-col bg-white shadow-2xl">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              🐛 Global Debug Panel
              <Badge variant="outline">{filteredLogs.length} logs</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContext(!showContext)}
                className="gap-1"
              >
                {showContext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showContext ? 'Hide' : 'Show'} Context
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyLogs('text')}
                className="gap-1"
              >
                <Copy className="h-4 w-4" />
                Copy All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportLogs}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
                className="gap-1 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search logs, actions, messages, context..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedComponent} onValueChange={setSelectedComponent}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by component" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Components</SelectItem>
                {components.map(component => (
                  <SelectItem key={component} value={component}>{component}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as LogLevel | 'all')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>
                    {level === 'all' ? 'All Levels' : level.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="h-full overflow-auto p-4 space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {searchTerm || selectedComponent !== 'all' || selectedLevel !== 'all' 
                  ? 'No logs match your filters' 
                  : 'No logs yet. Interact with the application to see debug information.'}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                const hasContext = log.context || log.stack_trace;
                
                return (
                  <div
                    key={log.id}
                    className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{getLevelEmoji(log.level)}</span>
                          <Badge className={`text-xs ${getLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.component}
                          </Badge>
                          <span className="text-xs text-gray-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{log.action}</span>
                          <span className="text-gray-600">{log.message}</span>
                        </div>

                        {showContext && hasContext && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLogExpansion(log.id)}
                              className="h-6 px-2 text-xs gap-1"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              {log.context ? 'Context' : ''} {log.stack_trace ? 'Stack' : ''}
                            </Button>
                            
                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                {log.context && (
                                  <div className="bg-white p-3 rounded border text-xs">
                                    <div className="font-semibold text-gray-700 mb-1">Context:</div>
                                    <pre className="whitespace-pre-wrap text-gray-600 overflow-x-auto">
                                      {JSON.stringify(log.context, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                {log.stack_trace && (
                                  <div className="bg-red-50 p-3 rounded border text-xs">
                                    <div className="font-semibold text-red-700 mb-1">Stack Trace:</div>
                                    <pre className="whitespace-pre-wrap text-red-600 overflow-x-auto font-mono">
                                      {log.stack_trace}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLogToClipboard(log)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                        title="Copy this log"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to manage debug panel visibility with keyboard shortcut
export function useGlobalDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle with Ctrl+Shift+D (or Cmd+Shift+D on Mac)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isVisible,
    toggle: () => setIsVisible(prev => !prev),
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
  };
}
