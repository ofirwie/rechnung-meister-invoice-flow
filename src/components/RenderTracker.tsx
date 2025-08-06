import React, { useRef, useEffect } from 'react';

interface RenderTrackerProps {
  componentName: string;
  dependencies?: Record<string, any>;
  stateChanges?: Record<string, any>; 
  callbacks?: Record<string, any>;
}

// External storage - NOT React state to avoid render loops
const debugData = {
  logs: [] as any[],
  renderCounts: new Map<string, number>(),
  maxLogs: 1000
};

// Console logger that doesn't trigger renders
const logWithoutRerender = (type: string, component: string, message: string, details: any) => {
  const timestamp = new Date().toISOString();
  const renderCount = debugData.renderCounts.get(component) || 0;
  
  const log = {
    timestamp,
    type,
    component, 
    message,
    details: { ...details, renderCount }
  };
  
  // Store in external array (not React state!)
  debugData.logs.push(log);
  if (debugData.logs.length > debugData.maxLogs) {
    debugData.logs.shift();
  }
  
  // Console log with render count for real-time monitoring
  console.log(`[${timestamp}] ${type} - ${component}: ${message}`, {
    renderCount,
    details
  });
  
  // Alert if renders are getting out of control
  if (renderCount > 0 && renderCount % 100 === 0) {
    console.error(`🚨 RENDER LOOP DETECTED: ${component} has rendered ${renderCount} times!`);
  }
};

export const RenderTracker: React.FC<RenderTrackerProps> = ({
  componentName,
  dependencies = {},
  stateChanges = {},
  callbacks = {}
}) => {
  // Use refs to avoid triggering renders
  const previousDependencies = useRef<Record<string, any>>({});
  const previousStateChanges = useRef<Record<string, any>>({});
  const previousCallbacks = useRef<Record<string, any>>({});
  const isFirstRender = useRef(true);
  
  // Increment render count (external storage)
  const currentRenderCount = (debugData.renderCounts.get(componentName) || 0) + 1;
  debugData.renderCounts.set(componentName, currentRenderCount);
  
  // Track every single render
  logWithoutRerender(
    'RENDER', 
    componentName, 
    `Component rendered (#${currentRenderCount})`,
    {
      renderCount: currentRenderCount,
      isFirstRender: isFirstRender.current,
      timestamp: Date.now()
    }
  );
  
  // Track dependency changes
  useEffect(() => {
    if (!isFirstRender.current) {
      Object.keys(dependencies).forEach(key => {
        const current = dependencies[key];
        const previous = previousDependencies.current[key];
        
        if (JSON.stringify(current) !== JSON.stringify(previous)) {
          logWithoutRerender(
            'DEPENDENCY_CHANGE',
            componentName,
            `Dependency "${key}" changed`,
            {
              previous,
              current,
              key
            }
          );
        }
      });
    }
    previousDependencies.current = { ...dependencies };
  });
  
  // Track state changes  
  useEffect(() => {
    if (!isFirstRender.current) {
      Object.keys(stateChanges).forEach(key => {
        const current = stateChanges[key];
        const previous = previousStateChanges.current[key];
        
        if (JSON.stringify(current) !== JSON.stringify(previous)) {
          logWithoutRerender(
            'STATE_CHANGE',
            componentName,
            `State "${key}" changed`,
            {
              previous,
              current,
              key
            }
          );
        }
      });
    }
    previousStateChanges.current = { ...stateChanges };
  });
  
  // Track callback recreations
  useEffect(() => {
    if (!isFirstRender.current) {
      Object.keys(callbacks).forEach(key => {
        const current = callbacks[key];
        const previous = previousCallbacks.current[key];
        
        if (current !== previous && typeof current === 'function') {
          logWithoutRerender(
            'CALLBACK_RECREATE',
            componentName,
            `Callback "${key}" recreated`,
            {
              key,
              functionString: current.toString().slice(0, 100) + '...'
            }
          );
        }
      });
    }
    previousCallbacks.current = { ...callbacks };
    isFirstRender.current = false;
  });
  
  // This component renders NOTHING to avoid interference
  return null;
};

// Utility functions for debugging
(window as any).getDebugData = () => {
  console.table(Array.from(debugData.renderCounts.entries()).map(([component, count]) => ({
    Component: component,
    RenderCount: count
  })));
  
  return {
    renderCounts: Object.fromEntries(debugData.renderCounts),
    recentLogs: debugData.logs.slice(-50),
    totalLogs: debugData.logs.length
  };
};

(window as any).clearDebugData = () => {
  debugData.logs = [];
  debugData.renderCounts.clear();
  console.log('🧹 Debug data cleared');
};

(window as any).exportDebugLogs = () => {
  const logs = debugData.logs.map(log => 
    `[${log.timestamp}] ${log.type} - ${log.component}: ${log.message}\nDetails: ${JSON.stringify(log.details, null, 2)}\n`
  ).join('\n');
  
  console.log('📋 Debug logs exported to console. Copy the text below:');
  console.log('='.repeat(80));
  console.log(logs);
  console.log('='.repeat(80));
  
  return logs;
};

export default RenderTracker;
