import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  timestamp: string;
  step: string;
  message: string;
  renderCount?: number;
  data?: any;
}

const RenderLoopDiagnostic: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const renderCount = useRef(0);

  // Track renders for this component
  renderCount.current += 1;

  const addLog = (step: string, message: string, data?: any) => {
    const logEntry: LogEntry = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: new Date().toLocaleTimeString() + `.${new Date().getMilliseconds()}`,
      step,
      message,
      renderCount: renderCount.current,
      data
    };
    
    setLogs(prev => [logEntry, ...prev]);
    console.log(`🔍 [${step}] ${message}`, data || '');
  };

  const clearLogs = () => {
    setLogs([]);
    renderCount.current = 0;
    setCurrentStep(0);
    addLog('SYSTEM', 'Logs cleared');
  };

  const copyLogs = async () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] ${log.step}: ${log.message}${log.renderCount ? ` (Render #${log.renderCount})` : ''}${log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : ''}`
    ).join('\n\n');
    
    try {
      await navigator.clipboard.writeText(logText);
      toast.success('Logs copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy logs');
    }
  };

  // Test functions
  const test1_HelloWorld = () => {
    addLog('STEP 1', 'Hello World - Basic React render test');
    addLog('STEP 1', `Component rendered ${renderCount.current} times so far`);
  };

  const test2_useState = () => {
    addLog('STEP 2', 'Testing useState hook');
    const [testState, setTestState] = useState(0);
    setTestState(prev => prev + 1);
    addLog('STEP 2', `useState test complete. State value: ${testState}`);
  };

  const test3_useEffect = () => {
    addLog('STEP 3', 'Testing useEffect hook');
    
    useEffect(() => {
      addLog('STEP 3', 'useEffect triggered');
      return () => addLog('STEP 3', 'useEffect cleanup');
    }, []);
  };

  const test4_CompanyContext = () => {
    addLog('STEP 4', 'Testing CompanyContext (isolated)');
    try {
      // Import and test CompanyContext
      import('@/contexts/CompanyContext').then(({ useCompany }) => {
        addLog('STEP 4', 'CompanyContext imported successfully');
        // Test context usage here
      });
    } catch (error) {
      addLog('STEP 4', `CompanyContext error: ${error}`, error);
    }
  };

  const test5_useCompanies = () => {
    addLog('STEP 5', 'Testing useCompanies hook');
    try {
      import('@/hooks/useCompanies').then(() => {
        addLog('STEP 5', 'useCompanies hook imported successfully');
      });
    } catch (error) {
      addLog('STEP 5', `useCompanies error: ${error}`, error);
    }
  };

  const test6_GlobalDebugPanel = () => {
    addLog('STEP 6', 'Testing GlobalDebugPanel');
    try {
      import('@/components/GlobalDebugPanel').then(() => {
        addLog('STEP 6', 'GlobalDebugPanel imported successfully');
      });
    } catch (error) {
      addLog('STEP 6', `GlobalDebugPanel error: ${error}`, error);
    }
  };

  const test7_CombinedHooks = () => {
    addLog('STEP 7', 'Testing combined hooks together');
    // This will test multiple hooks simultaneously
  };

  const test8_AppRender = () => {
    addLog('STEP 8', 'Testing App.tsx render behavior');
    addLog('STEP 8', 'Checking for render loops in main App component');
  };

  const test9_Navigation = () => {
    addLog('STEP 9', 'Testing Navigation and Router');
    addLog('STEP 9', `Current URL: ${window.location.href}`);
  };

  const test10_ProductionScenario = () => {
    addLog('STEP 10', 'Testing production scenario');
    addLog('STEP 10', 'Simulating real user flow');
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearLogs();
    
    const tests = [
      { name: 'Hello World', fn: test1_HelloWorld },
      { name: 'useState', fn: test2_useState },
      { name: 'useEffect', fn: test3_useEffect },
      { name: 'CompanyContext', fn: test4_CompanyContext },
      { name: 'useCompanies', fn: test5_useCompanies },
      { name: 'GlobalDebugPanel', fn: test6_GlobalDebugPanel },
      { name: 'Combined Hooks', fn: test7_CombinedHooks },
      { name: 'App Render', fn: test8_AppRender },
      { name: 'Navigation', fn: test9_Navigation },
      { name: 'Production Scenario', fn: test10_ProductionScenario },
    ];
    
    for (let i = 0; i < tests.length; i++) {
      setCurrentStep(i + 1);
      addLog('SYSTEM', `Running ${tests[i].name}...`);
      
      try {
        await tests[i].fn();
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between tests
      } catch (error) {
        addLog('ERROR', `Test ${tests[i].name} failed: ${error}`, error);
      }
    }
    
    setIsRunning(false);
    addLog('SYSTEM', 'All tests completed');
  };

  // Log initial render
  useEffect(() => {
    addLog('SYSTEM', `RenderLoopDiagnostic component rendered (render #${renderCount.current})`);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Render Loop Diagnostic Tool
            <span className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded">
              Render #{renderCount.current}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Control Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={runAllTests}
                disabled={isRunning}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Run All Tests {isRunning && `(Step ${currentStep}/10)`}
              </Button>
              <Button onClick={copyLogs} variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Logs
              </Button>
              <Button onClick={clearLogs} variant="outline" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear Logs
              </Button>
            </div>

            {/* Individual Test Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Button onClick={test1_HelloWorld} size="sm">1. Hello World</Button>
              <Button onClick={test2_useState} size="sm">2. useState</Button>
              <Button onClick={test3_useEffect} size="sm">3. useEffect</Button>
              <Button onClick={test4_CompanyContext} size="sm">4. CompanyContext</Button>
              <Button onClick={test5_useCompanies} size="sm">5. useCompanies</Button>
              <Button onClick={test6_GlobalDebugPanel} size="sm">6. DebugPanel</Button>
              <Button onClick={test7_CombinedHooks} size="sm">7. Combined</Button>
              <Button onClick={test8_AppRender} size="sm">8. App Render</Button>
              <Button onClick={test9_Navigation} size="sm">9. Navigation</Button>
              <Button onClick={test10_ProductionScenario} size="sm">10. Production</Button>
            </div>
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
          <div className="bg-gray-50 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm space-y-2">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click a button to run tests.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} className="border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-semibold">[{log.timestamp}]</span>
                    <span className="text-purple-600 bg-purple-100 px-2 py-1 rounded text-xs">
                      {log.step}
                    </span>
                    {log.renderCount && (
                      <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs">
                        Render #{log.renderCount}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-gray-800">{log.message}</div>
                  {log.data && (
                    <div className="mt-1 text-gray-600 text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RenderLoopDiagnostic;
