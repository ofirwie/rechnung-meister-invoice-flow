import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface LogEntry {
  id: string;
  timestamp: string;
  step: string;
  message: string;
  renderCount: number;
  renderDelta: number;
}

const queryClient = new QueryClient();

const ComponentIsolationDiagnostic: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeComponents, setActiveComponents] = useState<string[]>([]);
  const renderCount = useRef(0);
  const lastRenderCount = useRef(0);

  // Track renders for this component
  renderCount.current += 1;
  const currentDelta = renderCount.current - lastRenderCount.current;

  const addLog = (step: string, message: string) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString() + `.${new Date().getMilliseconds()}`,
      step,
      message,
      renderCount: renderCount.current,
      renderDelta: currentDelta
    };
    
    setLogs(prev => [logEntry, ...prev]);
    console.log(`🔍 [${step}] ${message} (Render #${renderCount.current}, +${currentDelta})`);
    lastRenderCount.current = renderCount.current;
  };

  const clearAll = () => {
    setLogs([]);
    setActiveComponents([]);
    renderCount.current = 0;
    lastRenderCount.current = 0;
    addLog('SYSTEM', 'Reset - All components removed, logs cleared');
  };

  const copyLogs = async () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.step}: ${log.message} (Render #${log.renderCount}, +${log.renderDelta})`
    ).join('\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      toast.success('Logs copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy logs');
    }
  };

  // Component addition functions
  const addCompanyProvider = () => {
    if (!activeComponents.includes('CompanyProvider')) {
      setActiveComponents(prev => [...prev, 'CompanyProvider']);
      addLog('STEP 1', 'Added CompanyProvider - checking for render explosion...');
    }
  };

  const addQueryClient = () => {
    if (!activeComponents.includes('QueryClient')) {
      setActiveComponents(prev => [...prev, 'QueryClient']);
      addLog('STEP 2', 'Added QueryClient - monitoring render count...');
    }
  };

  const addBrowserRouter = () => {
    if (!activeComponents.includes('BrowserRouter')) {
      setActiveComponents(prev => [...prev, 'BrowserRouter']);
      addLog('STEP 3', 'Added BrowserRouter - watching for routing issues...');
    }
  };

  const addUseSession = () => {
    if (!activeComponents.includes('useSession')) {
      setActiveComponents(prev => [...prev, 'useSession']);
      addLog('STEP 4', 'Added useSession hook - checking session management...');
    }
  };

  const addUseCompanies = () => {
    if (!activeComponents.includes('useCompanies')) {
      setActiveComponents(prev => [...prev, 'useCompanies']);
      addLog('STEP 5', 'Added useCompanies hook - this might be the culprit...');
    }
  };

  const addGlobalDebugPanel = () => {
    if (!activeComponents.includes('GlobalDebugPanel')) {
      setActiveComponents(prev => [...prev, 'GlobalDebugPanel']);
      addLog('STEP 6', 'Added GlobalDebugPanel - checking debug system impact...');
    }
  };

  const addIndexPage = () => {
    if (!activeComponents.includes('IndexPage')) {
      setActiveComponents(prev => [...prev, 'IndexPage']);
      addLog('STEP 7', 'Added Index page - checking main app logic...');
    }
  };

  const addProtectedRoute = () => {
    if (!activeComponents.includes('ProtectedRoute')) {
      setActiveComponents(prev => [...prev, 'ProtectedRoute']);
      addLog('STEP 8', 'Added ProtectedRoute - checking auth wrapper...');
    }
  };

  const addNavigation = () => {
    if (!activeComponents.includes('Navigation')) {
      setActiveComponents(prev => [...prev, 'Navigation']);
      addLog('STEP 9', 'Added Navigation component - checking nav rendering...');
    }
  };

  const addFullApp = () => {
    if (!activeComponents.includes('FullApp')) {
      setActiveComponents(prev => [...prev, 'FullApp']);
      addLog('STEP 10', 'Added full App structure - this should show the problem...');
    }
  };

  // Log initial render
  useEffect(() => {
    addLog('SYSTEM', `ComponentIsolationDiagnostic mounted (render #${renderCount.current})`);
  }, []);

  // Mock components to simulate the real ones
  const MockCompanyProvider = ({ children }: { children: React.ReactNode }) => {
    const mockRenderCount = useRef(0);
    mockRenderCount.current += 1;
    
    useEffect(() => {
      addLog('CompanyProvider', `CompanyProvider rendered ${mockRenderCount.current} times`);
    });

    return activeComponents.includes('CompanyProvider') ? (
      <div className="border-2 border-blue-200 p-2 m-1">
        <div className="text-xs text-blue-600">CompanyProvider (renders: {mockRenderCount.current})</div>
        {children}
      </div>
    ) : <>{children}</>;
  };

  const MockQueryClientProvider = ({ children }: { children: React.ReactNode }) => {
    return activeComponents.includes('QueryClient') ? (
      <QueryClientProvider client={queryClient}>
        <div className="border-2 border-green-200 p-2 m-1">
          <div className="text-xs text-green-600">QueryClientProvider</div>
          {children}
        </div>
      </QueryClientProvider>
    ) : <>{children}</>;
  };

  const MockBrowserRouter = ({ children }: { children: React.ReactNode }) => {
    return activeComponents.includes('BrowserRouter') ? (
      <BrowserRouter>
        <div className="border-2 border-purple-200 p-2 m-1">
          <div className="text-xs text-purple-600">BrowserRouter</div>
          {children}
        </div>
      </BrowserRouter>
    ) : <>{children}</>;
  };

  const getRenderCountColor = (count: number) => {
    if (count < 10) return 'text-green-600 bg-green-100';
    if (count < 50) return 'text-yellow-600 bg-yellow-100';
    if (count < 100) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <MockQueryClientProvider>
      <MockBrowserRouter>
        <MockCompanyProvider>
          <div className="container mx-auto p-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🧪 Progressive Component Addition Diagnostic
                  <span className={`text-sm px-2 py-1 rounded ${getRenderCountColor(renderCount.current)}`}>
                    Render #{renderCount.current}
                  </span>
                  {renderCount.current > 50 && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </CardTitle>
                <div className="text-sm text-gray-600">
                  Add components progressively and watch render count to isolate the problem
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Control Buttons */}
                  <div className="flex gap-2 mb-4">
                    <Button onClick={copyLogs} variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy Logs
                    </Button>
                    <Button onClick={clearAll} variant="outline" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Reset All
                    </Button>
                  </div>

                  {/* Active Components Display */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Active Components ({activeComponents.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {activeComponents.map(comp => (
                        <span key={comp} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {comp}
                        </span>
                      ))}
                      {activeComponents.length === 0 && (
                        <span className="text-gray-500 text-xs">No components added yet</span>
                      )}
                    </div>
                  </div>

                  {/* Progressive Addition Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Button 
                      onClick={addCompanyProvider} 
                      size="sm" 
                      variant={activeComponents.includes('CompanyProvider') ? "default" : "outline"}
                    >
                      1. CompanyProvider
                    </Button>
                    <Button 
                      onClick={addQueryClient} 
                      size="sm"
                      variant={activeComponents.includes('QueryClient') ? "default" : "outline"}
                    >
                      2. QueryClient
                    </Button>
                    <Button 
                      onClick={addBrowserRouter} 
                      size="sm"
                      variant={activeComponents.includes('BrowserRouter') ? "default" : "outline"}
                    >
                      3. BrowserRouter
                    </Button>
                    <Button 
                      onClick={addUseSession} 
                      size="sm"
                      variant={activeComponents.includes('useSession') ? "default" : "outline"}
                    >
                      4. useSession
                    </Button>
                    <Button 
                      onClick={addUseCompanies} 
                      size="sm"
                      variant={activeComponents.includes('useCompanies') ? "default" : "outline"}
                    >
                      5. useCompanies
                    </Button>
                    <Button 
                      onClick={addGlobalDebugPanel} 
                      size="sm"
                      variant={activeComponents.includes('GlobalDebugPanel') ? "default" : "outline"}
                    >
                      6. DebugPanel
                    </Button>
                    <Button 
                      onClick={addIndexPage} 
                      size="sm"
                      variant={activeComponents.includes('IndexPage') ? "default" : "outline"}
                    >
                      7. Index Page
                    </Button>
                    <Button 
                      onClick={addProtectedRoute} 
                      size="sm"
                      variant={activeComponents.includes('ProtectedRoute') ? "default" : "outline"}
                    >
                      8. ProtectedRoute
                    </Button>
                    <Button 
                      onClick={addNavigation} 
                      size="sm"
                      variant={activeComponents.includes('Navigation') ? "default" : "outline"}
                    >
                      9. Navigation
                    </Button>
                    <Button 
                      onClick={addFullApp} 
                      size="sm"
                      variant={activeComponents.includes('FullApp') ? "default" : "outline"}
                    >
                      10. Full App
                    </Button>
                  </div>

                  {/* Render Count Warning */}
                  {renderCount.current > 20 && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="font-medium">High Render Count Detected!</span>
                      </div>
                      <div className="text-sm text-red-600 mt-1">
                        Current: {renderCount.current} renders. Normal should be 1-5 renders.
                        {renderCount.current > 100 && " This indicates an infinite render loop!"}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Component Visualization */}
            <Card>
              <CardHeader>
                <CardTitle>Component Structure Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg min-h-32">
                  {activeComponents.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                      No components added yet. Click buttons above to add components progressively.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm text-gray-700">Component tree will render here as you add components</div>
                      <div className="text-xs text-gray-500">
                        Watch the render count above - it should stay low (1-5) unless there's a render loop
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Logs Display */}
            <Card>
              <CardHeader>
                <CardTitle>
                  Diagnostic Logs ({logs.length} entries)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-gray-500">No logs yet. Add components to see diagnostic information.</div>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex items-center gap-2 text-xs">
                        <span className="text-blue-600 font-semibold">[{log.timestamp}]</span>
                        <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          {log.step}
                        </span>
                        <span className={`px-2 py-1 rounded ${getRenderCountColor(log.renderCount)}`}>
                          #{log.renderCount}
                        </span>
                        <span className="text-orange-600">+{log.renderDelta}</span>
                        <span className="text-gray-800">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </MockCompanyProvider>
      </MockBrowserRouter>
    </MockQueryClientProvider>
  );
};

export default ComponentIsolationDiagnostic;
