import { useState, useEffect, useRef, useCallback } from 'react';

export type LogLevel = 'trace' | 'info' | 'warn' | 'error';

export interface DebugLog {
  id: string;
  timestamp: string;
  component: string;
  action: string;
  level: LogLevel;
  message: string;
  context?: any;
  stack_trace?: string;
  url: string;
  user_agent: string;
}

export interface UseDebugLoggerOptions {
  component: string;
  maxLogs?: number;
  enableConsole?: boolean;
}

// Generate unique session ID for this browser session
const SESSION_ID = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

// Global logs store
const globalLogs: DebugLog[] = [];
const globalLogSubscribers = new Set<(logs: DebugLog[]) => void>();

function notifySubscribers() {
  globalLogSubscribers.forEach(callback => callback([...globalLogs]));
}

export function useDebugLogger({
  component,
  maxLogs = 1000,
  enableConsole = true,
}: UseDebugLoggerOptions) {
  const [logs, setLogs] = useState<DebugLog[]>([]);

  // Subscribe to global logs updates
  useEffect(() => {
    const updateCallback = (newLogs: DebugLog[]) => {
      setLogs(newLogs.filter(log => log.component === component));
    };
    
    globalLogSubscribers.add(updateCallback);
    updateCallback(globalLogs); // Initial load
    
    return () => {
      globalLogSubscribers.delete(updateCallback);
    };
  }, [component]);

  const log = useCallback(async (
    level: LogLevel,
    action: string,
    message: string,
    context?: any,
    error?: Error
  ) => {
    const timestamp = new Date().toISOString();
    
    const logEntry: DebugLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp,
      component,
      action,
      level,
      message,
      context: context ? JSON.parse(JSON.stringify(context)) : undefined,
      stack_trace: error?.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    // Add to global logs
    globalLogs.unshift(logEntry);
    
    // Keep only maxLogs
    if (globalLogs.length > maxLogs) {
      globalLogs.splice(maxLogs);
    }
    
    // Notify all subscribers
    notifySubscribers();

    // Console logging with nice formatting
    if (enableConsole) {
      const emoji = {
        trace: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌'
      }[level];

      const style = {
        trace: 'color: #6b7280',
        info: 'color: #3b82f6',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444; font-weight: bold'
      }[level];

      console.log(
        `%c${emoji} [${component}] ${action}: ${message}`,
        style,
        context || ''
      );

      if (error) {
        console.error('Stack trace:', error);
      }
    }
  }, [component, maxLogs, enableConsole]);

  // Convenience methods for different log levels
  const trace = useCallback((action: string, message: string, context?: any) => 
    log('trace', action, message, context), [log]);
  
  const info = useCallback((action: string, message: string, context?: any) => 
    log('info', action, message, context), [log]);
  
  const warn = useCallback((action: string, message: string, context?: any) => 
    log('warn', action, message, context), [log]);
  
  const error = useCallback((action: string, message: string, context?: any, err?: Error) => 
    log('error', action, message, context, err), [log]);

  // Clear logs
  const clearLogs = useCallback(() => {
    globalLogs.length = 0;
    notifySubscribers();
  }, []);

  // Export logs
  const exportLogs = useCallback(() => {
    const dataStr = JSON.stringify(globalLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${component}-${SESSION_ID}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [component]);

  // Copy logs to clipboard
  const copyLogs = useCallback(async (format: 'json' | 'text' = 'text') => {
    try {
      let content: string;
      
      if (format === 'json') {
        content = JSON.stringify(globalLogs, null, 2);
      } else {
        content = globalLogs
          .map(log => 
            `[${log.timestamp}] ${log.level.toUpperCase()} [${log.component}] ${log.action}: ${log.message}` + 
            (log.context ? `\nContext: ${JSON.stringify(log.context, null, 2)}` : '') +
            (log.stack_trace ? `\nStack: ${log.stack_trace}` : '')
          )
          .join('\n\n');
      }
      
      await navigator.clipboard.writeText(content);
      info('clipboard', `Copied ${globalLogs.length} logs to clipboard (${format} format)`);
    } catch (err) {
      error('clipboard', 'Failed to copy logs to clipboard', { error: err });
    }
  }, [info, error]);

  return {
    logs,
    allLogs: globalLogs,
    sessionId: SESSION_ID,
    
    // Logging methods
    log,
    trace,
    info,
    warn,
    error,
    
    // Utility methods
    clearLogs,
    exportLogs,
    copyLogs,
  };
}

// Global debug logger instance for quick logging
export const globalDebugLogger = {
  sessionId: SESSION_ID,
  
  log(
    component: string,
    level: LogLevel,
    action: string,
    message: string,
    context?: any,
    error?: Error
  ) {
    const timestamp = new Date().toISOString();
    
    const logEntry: DebugLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp,
      component,
      action,
      level,
      message,
      context: context ? JSON.parse(JSON.stringify(context)) : undefined,
      stack_trace: error?.stack,
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    // Add to global logs
    globalLogs.unshift(logEntry);
    
    // Keep only 1000 logs
    if (globalLogs.length > 1000) {
      globalLogs.splice(1000);
    }
    
    // Notify all subscribers
    notifySubscribers();

    const emoji = {
      trace: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌'
    }[level];

    console.log(
      `${emoji} [${component}] ${action}: ${message}`,
      context || ''
    );

    if (error) {
      console.error('Stack trace:', error);
    }
  }
};
