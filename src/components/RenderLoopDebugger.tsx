import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebugLog {
  timestamp: string;
  type: 'STATE_CHANGE' | 'USEEFFECT_FIRE' | 'CALLBACK_RECREATE' | 'CIRCULAR_CHAIN';
  component: string;
  message: string;
  details: Record<string, any>;
}

interface RenderLoopDebuggerProps {
  componentName: string;
  dependencies?: Record<string, any>;
  stateChanges?: Record<string, any>;
  callbacks?: Record<string, any>;
}

export const RenderLoopDebugger: React.FC<RenderLoopDebuggerProps> = ({
  componentName,
  dependencies = {},
  stateChanges = {},
  callbacks = {}
}) => {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const previousDependencies = useRef<Record<string, any>>({});
  const previousStateChanges = useRef<Record<string, any>>({});
  const previousCallbacks = useRef<Record<string, any>>({});
  const renderCount = useRef(0);

  // Track dependency changes
  useEffect(() => {
    renderCount.current++;
    const now = new Date().toISOString();

    // Check for dependency changes
    Object.keys(dependencies).forEach(key => {
      const current = dependencies[key];
      const previous = previousDependencies.current[key];
      
      if (JSON.stringify(current) !== JSON.stringify(previous)) {
        const log: DebugLog = {
          timestamp: now,
          type: 'STATE_CHANGE',
          component: componentName,
          message: `Dependency "${key}" changed`,
          details: {
            previous: previous,
            current: current,
            renderCount: renderCount.current
          }
        };
        setLogs(prev => [...prev.slice(-49), log]); // Keep last 50 logs
      }
    });

    previousDependencies.current = { ...dependencies };
  }, [dependencies, componentName]);

  // Track state changes
  useEffect(() => {
    const now = new Date().toISOString();

    Object.keys(stateChanges).forEach(key => {
      const current = stateChanges[key];
      const previous = previousStateChanges.current[key];
      
      if (JSON.stringify(current) !== JSON.stringify(previous)) {
        const log: DebugLog = {
          timestamp: now,
          type: 'STATE_CHANGE',
          component: componentName,
          message: `State "${key}" changed`,
          details: {
            previous: previous,
            current: current,
            renderCount: renderCount.current
          }
        };
        setLogs(prev => [...prev.slice(-49), log]);
      }
    });

    previousStateChanges.current = { ...stateChanges };
  }, [stateChanges, componentName]);

  // Track callback recreations
  useEffect(() => {
    const now = new Date().toISOString();

    Object.keys(callbacks).forEach(key => {
      const current = callbacks[key];
      const previous = previousCallbacks.current[key];
      
      if (current !== previous && typeof current === 'function') {
        const log: DebugLog = {
          timestamp: now,
          type: 'CALLBACK_RECREATE',
          component: componentName,
          message: `Callback "${key}" recreated`,
          details: {
            renderCount: renderCount.current,
            functionString: current.toString().slice(0, 100) + '...'
          }
        };
        setLogs(prev => [...prev.slice(-49), log]);
      }
    });

    previousCallbacks.current = { ...callbacks };
  }, [callbacks, componentName]);

  // Detect circular patterns
  useEffect(() => {
    const recentLogs = logs.slice(-10);
    const stateChangeLogs = recentLogs.filter(log => log.type === 'STATE_CHANGE');
    const callbackLogs = recentLogs.filter(log => log.type === 'CALLBACK_RECREATE');

    if (stateChangeLogs.length > 3 && callbackLogs.length > 3) {
      // Check if same state/callback is changing repeatedly
      const repeatedStates = stateChangeLogs.reduce((acc, log) => {
        acc[log.message] = (acc[log.message] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.keys(repeatedStates).forEach(stateChange => {
        if (repeatedStates[stateChange] > 2) {
          const log: DebugLog = {
            timestamp: new Date().toISOString(),
            type: 'CIRCULAR_CHAIN',
            component: componentName,
            message: `Circular dependency detected: ${stateChange}`,
            details: {
              occurrences: repeatedStates[stateChange],
              recentLogs: recentLogs.map(l => l.message),
              renderCount: renderCount.current
            }
          };
          setLogs(prev => [...prev.slice(-49), log]);
        }
      });
    }
  }, [logs, componentName]);

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] ${log.type} - ${log.component}: ${log.message}\nDetails: ${JSON.stringify(log.details, null, 2)}\n`
    ).join('\n');
    
    navigator.clipboard.writeText(logsText);
    alert('Debug logs copied to clipboard!');
  };

  const getLogsByType = (type: DebugLog['type']) => {
    return logs.filter(log => log.type === type);
  };

  const formatLogDetails = (details: Record<string, any>) => {
    return JSON.stringify(details, null, 2);
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button onClick={() => setIsVisible(true)} variant="destructive" size="sm">
          🐛 Debug Render Loop
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>🐛 Render Loop Debugger - {componentName}</CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportLogs} size="sm">Export All</Button>
                <Button onClick={clearLogs} variant="outline" size="sm">Clear</Button>
                <Button onClick={() => setIsVisible(false)} variant="ghost" size="sm">✕</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Render Count: {renderCount.current} | Total Logs: {logs.length} | 
                Showing: {Math.min(logs.length, 50)} recent entries
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* State Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 State Changes ({getLogsByType('STATE_CHANGE').length})</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-48 text-xs font-mono bg-gray-100 p-2 rounded border"
                  value={getLogsByType('STATE_CHANGE').slice(-10).map(log => 
                    `[${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}\n${formatLogDetails(log.details)}\n`
                  ).join('\n')}
                  readOnly
                />
                <Button 
                  onClick={() => navigator.clipboard.writeText(getLogsByType('STATE_CHANGE').map(log => 
                    `${log.timestamp} - ${log.message}: ${JSON.stringify(log.details)}`
                  ).join('\n'))}
                  size="sm" 
                  className="mt-2"
                >
                  📋 Copy State Changes
                </Button>
              </CardContent>
            </Card>

            {/* Callback Recreations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🔄 Callback Recreations ({getLogsByType('CALLBACK_RECREATE').length})</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-48 text-xs font-mono bg-gray-100 p-2 rounded border"
                  value={getLogsByType('CALLBACK_RECREATE').slice(-10).map(log => 
                    `[${log.timestamp.split('T')[1].split('.')[0]}] ${log.message}\n${formatLogDetails(log.details)}\n`
                  ).join('\n')}
                  readOnly
                />
                <Button 
                  onClick={() => navigator.clipboard.writeText(getLogsByType('CALLBACK_RECREATE').map(log => 
                    `${log.timestamp} - ${log.message}: ${JSON.stringify(log.details)}`
                  ).join('\n'))}
                  size="sm" 
                  className="mt-2"
                >
                  📋 Copy Callback Changes
                </Button>
              </CardContent>
            </Card>

            {/* Circular Chains */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🌀 Circular Dependencies ({getLogsByType('CIRCULAR_CHAIN').length})</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-48 text-xs font-mono bg-red-50 p-2 rounded border border-red-300"
                  value={getLogsByType('CIRCULAR_CHAIN').map(log => 
                    `[${log.timestamp.split('T')[1].split('.')[0]}] ⚠️ ${log.message}\n${formatLogDetails(log.details)}\n`
                  ).join('\n')}
                  readOnly
                />
                <Button 
                  onClick={() => navigator.clipboard.writeText(getLogsByType('CIRCULAR_CHAIN').map(log => 
                    `${log.timestamp} - ${log.message}: ${JSON.stringify(log.details)}`
                  ).join('\n'))}
                  size="sm" 
                  className="mt-2"
                  variant="destructive"
                >
                  📋 Copy Circular Chains
                </Button>
              </CardContent>
            </Card>

            {/* All Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Recent Activity (Last 20)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-48 text-xs font-mono bg-gray-50 p-2 rounded border"
                  value={logs.slice(-20).map(log => 
                    `[${log.timestamp.split('T')[1].split('.')[0]}] ${log.type}: ${log.message}`
                  ).join('\n')}
                  readOnly
                />
                <Button 
                  onClick={() => navigator.clipboard.writeText(logs.slice(-20).map(log => 
                    `${log.timestamp} - ${log.type}: ${log.message} | ${JSON.stringify(log.details)}`
                  ).join('\n'))}
                  size="sm" 
                  className="mt-2"
                >
                  📋 Copy Recent Activity
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RenderLoopDebugger;
