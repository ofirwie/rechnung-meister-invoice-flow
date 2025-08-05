import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDebugLogger } from '../hooks/useDebugLogger';

interface StateDebuggerProps {
  currentView: string;
  selectedClient: any;
  renderCount: number;
}

export function StateDebugger({ currentView, selectedClient, renderCount }: StateDebuggerProps) {
  const { allLogs } = useDebugLogger({ component: 'StateDebugger' });
  const [isVisible, setIsVisible] = useState(false);
  const [lastStateChanges, setLastStateChanges] = useState<any[]>([]);

  // Track the last 10 state changes
  useEffect(() => {
    const stateChangeLogs = allLogs
      .filter(log => 
        log.component === 'Index' && 
        (log.action.includes('change') || log.action.includes('clear'))
      )
      .slice(0, 10);
    
    setLastStateChanges(stateChangeLogs);
  }, [allLogs]);

  if (!isVisible) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <Button 
          size="sm" 
          onClick={() => setIsVisible(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          📊 State Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-96">
      <Card className="bg-white shadow-lg border-2 border-purple-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">🔍 State Debug Monitor</CardTitle>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsVisible(false)}
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {/* Current State */}
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-semibold text-blue-800">Current State:</div>
            <div className="space-y-1">
              <div>View: <Badge variant="outline">{currentView}</Badge></div>
              <div>Client: <Badge variant={selectedClient ? "default" : "destructive"}>
                {selectedClient?.company_name || 'None'}
              </Badge></div>
              <div>Renders: <Badge variant="secondary">{renderCount}</Badge></div>
            </div>
          </div>

          {/* Recent State Changes */}
          <div className="bg-yellow-50 p-2 rounded">
            <div className="font-semibold text-yellow-800 mb-1">Recent Changes:</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {lastStateChanges.map((log, index) => (
                <div key={log.id} className="text-xs">
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Badge>
                    <span className={`font-medium ${
                      log.action.includes('clear') ? 'text-red-600' : 
                      log.action.includes('change') ? 'text-blue-600' : 'text-gray-600'
                    }`}>
                      {log.action}
                    </span>
                  </div>
                  <div className="text-gray-600 ml-1 truncate">
                    {log.message}
                  </div>
                </div>
              ))}
              {lastStateChanges.length === 0 && (
                <div className="text-gray-500 italic">No state changes yet</div>
              )}
            </div>
          </div>

          {/* Warning Indicators */}
          {selectedClient === null && (
            <div className="bg-red-50 p-2 rounded">
              <div className="font-semibold text-red-800">⚠️ Client is NULL</div>
              <div className="text-red-600">Check logs for when it was cleared</div>
            </div>
          )}

          {renderCount > 20 && (
            <div className="bg-orange-50 p-2 rounded">
              <div className="font-semibold text-orange-800">🔄 High Render Count</div>
              <div className="text-orange-600">Possible re-render loop</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
