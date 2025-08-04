import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Minimize2, Maximize2, X, Download } from 'lucide-react';
import { toast } from 'sonner';

interface RenderLogEntry {
  id: number;
  timestamp: string;
  renderCount: number;
  trigger: string;
  details: any;
  stackTrace?: string;
}

interface StateSnapshot {
  formData?: any;
  selectedClient?: any;
  selectedService?: any;
  language?: string;
  [key: string]: any;
}

interface RenderDebugPanelProps {
  renderCount: number;
  currentState: StateSnapshot;
  triggerSource?: string;
  additionalData?: any;
  onClose?: () => void;
}

export const RenderDebugPanel: React.FC<RenderDebugPanelProps> = ({
  renderCount,
  currentState,
  triggerSource = 'unknown',
  additionalData = {},
  onClose
}) => {
  const [logs, setLogs] = useState<RenderLogEntry[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [renderRate, setRenderRate] = useState(0);
  const [maxRenders, setMaxRenders] = useState(0);
  
  const lastRenderTime = useRef(Date.now());
  const renderTimes = useRef<number[]>([]);
  const logIdCounter = useRef(0);

  // Calculate render rate
  useEffect(() => {
    if (!isEnabled) return;

    const now = Date.now();
    renderTimes.current.push(now);
    
    // Keep only last 10 seconds of render times
    const tenSecondsAgo = now - 10000;
    renderTimes.current = renderTimes.current.filter(time => time > tenSecondsAgo);
    
    setRenderRate(renderTimes.current.length / 10);
    
    if (renderCount > maxRenders) {
      setMaxRenders(renderCount);
    }
  }, [renderCount, isEnabled, maxRenders]);

  // Log render events
  useEffect(() => {
    if (!isEnabled) return;

    const newLogEntry: RenderLogEntry = {
      id: ++logIdCounter.current,
      timestamp: new Date().toISOString(),
      renderCount,
      trigger: triggerSource,
      details: {
        state: currentState,
        additional: additionalData,
        timeSinceLastRender: Date.now() - lastRenderTime.current
      }
    };

    setLogs(prev => {
      const updated = [newLogEntry, ...prev];
      // Keep only last 100 logs for performance
      return updated.slice(0, 100);
    });

    lastRenderTime.current = Date.now();
  }, [renderCount, triggerSource, currentState, additionalData, isEnabled]);

  const getRenderStatusColor = useCallback(() => {
    if (renderCount < 10) return 'bg-green-500';
    if (renderCount < 50) return 'bg-yellow-500';
    if (renderCount < 100) return 'bg-orange-500';
    return 'bg-red-500';
  }, [renderCount]);

  const getRenderStatusText = useCallback(() => {
    if (renderCount < 10) return 'Normal';
    if (renderCount < 50) return 'High';
    if (renderCount < 100) return 'Critical';
    return 'INFINITE';
  }, [renderCount]);

  const generateDebugReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRenders: renderCount,
        maxRenders: maxRenders,
        currentRenderRate: renderRate.toFixed(2) + '/sec',
        status: getRenderStatusText(),
        mostFrequentTriggers: getMostFrequentTriggers()
      },
      currentState: currentState,
      recentLogs: logs.slice(0, 20).map(log => ({
        timestamp: log.timestamp,
        renderCount: log.renderCount,
        trigger: log.trigger,
        timeSinceLastRender: log.details.timeSinceLastRender + 'ms'
      })),
      stateAnalysis: analyzeStateChanges(),
      recommendations: generateRecommendations()
    };

    return JSON.stringify(report, null, 2);
  }, [renderCount, maxRenders, renderRate, currentState, logs]);

  const getMostFrequentTriggers = useCallback(() => {
    const triggerCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      triggerCounts[log.trigger] = (triggerCounts[log.trigger] || 0) + 1;
    });
    
    return Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([trigger, count]) => ({ trigger, count }));
  }, [logs]);

  const analyzeStateChanges = useCallback(() => {
    const stateKeys = Object.keys(currentState);
    const analysis: { [key: string]: any } = {};
    
    stateKeys.forEach(key => {
      const values = logs.slice(0, 10).map(log => log.details.state[key]);
      const uniqueValues = [...new Set(values.map(v => JSON.stringify(v)))];
      analysis[key] = {
        recentValues: uniqueValues.length,
        isChangingFrequently: uniqueValues.length > 5,
        currentValue: currentState[key]
      };
    });
    
    return analysis;
  }, [currentState, logs]);

  const generateRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (renderCount > 100) {
      recommendations.push('CRITICAL: Infinite render loop detected. Check useEffect dependencies.');
    }
    
    if (renderRate > 5) {
      recommendations.push('HIGH: Very high render rate. Look for state updates in render cycle.');
    }
    
    const frequentTriggers = getMostFrequentTriggers();
    if (frequentTriggers.length > 0 && frequentTriggers[0].count > 20) {
      recommendations.push(`FOCUS: "${frequentTriggers[0].trigger}" is triggering most renders (${frequentTriggers[0].count} times)`);
    }
    
    const stateAnalysis = analyzeStateChanges();
    Object.entries(stateAnalysis).forEach(([key, analysis]: [string, any]) => {
      if (analysis.isChangingFrequently) {
        recommendations.push(`STATE: "${key}" is changing very frequently - check for unnecessary updates`);
      }
    });
    
    return recommendations;
  }, [renderCount, renderRate, getMostFrequentTriggers, analyzeStateChanges]);

  const copyDebugReport = useCallback(async () => {
    try {
      const report = generateDebugReport();
      await navigator.clipboard.writeText(report);
      toast.success('Debug report copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy debug report:', error);
      toast.error('Failed to copy debug report');
    }
  }, [generateDebugReport]);

  const downloadDebugReport = useCallback(() => {
    const report = generateDebugReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Debug report downloaded!');
  }, [generateDebugReport]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    renderTimes.current = [];
    setRenderRate(0);
    toast.info('Debug logs cleared');
  }, []);

  if (!isEnabled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEnabled(true)}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Enable Debug
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-64 bg-white shadow-lg border-2">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRenderStatusColor()}`} />
                <span className="text-sm font-medium">
                  Renders: {renderCount}
                </span>
                <Badge variant={renderCount > 50 ? 'destructive' : renderCount > 10 ? 'secondary' : 'default'}>
                  {getRenderStatusText()}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(false)}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <Card className="bg-white shadow-xl border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${getRenderStatusColor()}`} />
              Render Debug Panel
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <Minimize2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEnabled(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium">Current Renders</div>
              <div className="text-lg font-bold">{renderCount}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium">Render Rate</div>
              <div className="text-lg font-bold">{renderRate.toFixed(1)}/sec</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium">Status</div>
              <Badge variant={renderCount > 50 ? 'destructive' : renderCount > 10 ? 'secondary' : 'default'}>
                {getRenderStatusText()}
              </Badge>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="font-medium">Max Seen</div>
              <div className="text-lg font-bold">{maxRenders}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyDebugReport}
              className="flex-1"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy Log
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadDebugReport}
            >
              <Download className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearLogs}
            >
              Clear
            </Button>
          </div>

          {/* Recommendations */}
          {generateRecommendations().length > 0 && (
            <div className="bg-red-50 border border-red-200 p-2 rounded">
              <div className="font-medium text-red-800 text-sm mb-1">Issues Detected:</div>
              {generateRecommendations().map((rec, index) => (
                <div key={index} className="text-xs text-red-700 mb-1">
                  • {rec}
                </div>
              ))}
            </div>
          )}

          {/* Top Triggers */}
          <div>
            <div className="font-medium text-sm mb-2">Top Render Triggers:</div>
            <div className="space-y-1">
              {getMostFrequentTriggers().slice(0, 3).map(({ trigger, count }, index) => (
                <div key={index} className="flex justify-between text-xs bg-gray-50 p-1 rounded">
                  <span>{trigger}</span>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Render Log */}
          <div>
            <div className="font-medium text-sm mb-2">Recent Renders:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {logs.slice(0, 10).map(log => (
                <div key={log.id} className="text-xs bg-gray-50 p-1 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">#{log.renderCount}</span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Trigger: {log.trigger}
                  </div>
                  {log.details.timeSinceLastRender < 100 && (
                    <div className="text-red-600 font-medium">
                      ⚠️ {log.details.timeSinceLastRender}ms gap
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
