/**
 * Comprehensive Debugging System
 * Professional debugging infrastructure for React applications
 */

import { debugConfig, isFeatureEnabled, shouldOutput, isDebugLevel } from '@/config/debug.config';

// Enhanced logging levels
export enum DebugLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

// Debug event types
export enum DebugEventType {
  RENDER = 'RENDER',
  STATE_CHANGE = 'STATE_CHANGE',
  CONTEXT_UPDATE = 'CONTEXT_UPDATE',
  PERFORMANCE = 'PERFORMANCE',
  MEMORY = 'MEMORY',
  ERROR = 'ERROR',
  USER_INTERACTION = 'USER_INTERACTION',
  NETWORK = 'NETWORK',
  COMPONENT_MOUNT = 'COMPONENT_MOUNT',
  COMPONENT_UNMOUNT = 'COMPONENT_UNMOUNT',
  HOOK_EXECUTION = 'HOOK_EXECUTION',
  CIRCULAR_DEPENDENCY = 'CIRCULAR_DEPENDENCY',
}

// Debug event interface
export interface DebugEvent {
  id: string;
  timestamp: number;
  type: DebugEventType;
  component?: string;
  message: string;
  data?: any;
  stack?: string;
  performance?: {
    renderTime?: number;
    memoryUsage?: number;
    renderCount?: number;
  };
  metadata?: {
    userId?: string;
    sessionId?: string;
    buildVersion?: string;
    environment?: string;
  };
}

// Central debug store
class DebugStore {
  private events: DebugEvent[] = [];
  private maxEvents = 10000;
  private renderCounts = new Map<string, number>();
  private performanceMarks = new Map<string, number>();
  private subscribers = new Set<(event: DebugEvent) => void>();

  // Event management
  addEvent(event: Omit<DebugEvent, 'id' | 'timestamp'>): DebugEvent {
    const fullEvent: DebugEvent = {
      ...event,
      id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      metadata: {
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId(),
        buildVersion: import.meta.env.VITE_APP_VERSION || 'unknown',
        environment: import.meta.env.MODE,
        ...event.metadata,
      }
    };

    // Add to store
    this.events.push(fullEvent);
    
    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Notify subscribers
    this.subscribers.forEach(callback => callback(fullEvent));

    // Save to localStorage if enabled
    if (shouldOutput('localStorage')) {
      this.saveToLocalStorage();
    }

    return fullEvent;
  }

  // Component render tracking
  trackRender(componentName: string, renderTime?: number): void {
    const currentCount = this.renderCounts.get(componentName) || 0;
    const newCount = currentCount + 1;
    this.renderCounts.set(componentName, newCount);

    // Check for render loop
    if (newCount > debugConfig.thresholds.maxRenderCount) {
      this.addEvent({
        type: DebugEventType.CIRCULAR_DEPENDENCY,
        component: componentName,
        message: `Potential render loop detected: ${componentName} has rendered ${newCount} times`,
        data: {
          renderCount: newCount,
          threshold: debugConfig.thresholds.maxRenderCount,
        }
      });
    }

    // Track render performance
    if (renderTime && renderTime > debugConfig.thresholds.maxRenderTime) {
      this.addEvent({
        type: DebugEventType.PERFORMANCE,
        component: componentName,
        message: `Slow render detected: ${renderTime}ms`,
        performance: {
          renderTime,
          renderCount: newCount,
        }
      });
    }

    this.addEvent({
      type: DebugEventType.RENDER,
      component: componentName,
      message: `Component rendered (#${newCount})`,
      performance: {
        renderTime,
        renderCount: newCount,
      }
    });
  }

  // Performance monitoring
  startPerformanceMark(markName: string): void {
    this.performanceMarks.set(markName, performance.now());
  }

  endPerformanceMark(markName: string, component?: string): number {
    const startTime = this.performanceMarks.get(markName);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.performanceMarks.delete(markName);

    this.addEvent({
      type: DebugEventType.PERFORMANCE,
      component,
      message: `Performance mark: ${markName} took ${duration.toFixed(2)}ms`,
      performance: {
        renderTime: duration,
      }
    });

    return duration;
  }

  // Memory tracking
  trackMemoryUsage(component?: string): void {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      const usedMB = memInfo.usedJSHeapSize / 1024 / 1024;

      if (usedMB > debugConfig.thresholds.maxMemoryUsage) {
        this.addEvent({
          type: DebugEventType.MEMORY,
          component,
          message: `High memory usage detected: ${usedMB.toFixed(2)}MB`,
          performance: {
            memoryUsage: usedMB,
          }
        });
      }
    }
  }

  // State change tracking
  trackStateChange(component: string, stateName: string, previousValue: any, newValue: any): void {
    this.addEvent({
      type: DebugEventType.STATE_CHANGE,
      component,
      message: `State "${stateName}" changed`,
      data: {
        stateName,
        previous: this.safeSerialize(previousValue),
        current: this.safeSerialize(newValue),
      }
    });
  }

  // Context update tracking
  trackContextUpdate(contextName: string, previousValue: any, newValue: any): void {
    this.addEvent({
      type: DebugEventType.CONTEXT_UPDATE,
      component: contextName,
      message: `Context "${contextName}" updated`,
      data: {
        previous: this.safeSerialize(previousValue),
        current: this.safeSerialize(newValue),
      }
    });
  }

  // Error tracking
  trackError(error: Error, component?: string, additionalInfo?: any): void {
    this.addEvent({
      type: DebugEventType.ERROR,
      component,
      message: `Error: ${error.message}`,
      data: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        additionalInfo: this.safeSerialize(additionalInfo),
      },
      stack: error.stack,
    });
  }

  // Data retrieval methods
  getEvents(filter?: {
    type?: DebugEventType;
    component?: string;
    since?: number;
    limit?: number;
  }): DebugEvent[] {
    let filtered = this.events;

    if (filter?.type) {
      filtered = filtered.filter(event => event.type === filter.type);
    }

    if (filter?.component) {
      filtered = filtered.filter(event => event.component === filter.component);
    }

    if (filter?.since) {
      filtered = filtered.filter(event => event.timestamp >= filter.since);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  getRenderCounts(): Map<string, number> {
    return new Map(this.renderCounts);
  }

  getComponentStats(componentName: string): {
    renderCount: number;
    lastRender: number;
    avgRenderTime: number;
  } {
    const renders = this.getEvents({
      type: DebugEventType.RENDER,
      component: componentName,
    });

    const renderTimes = renders
      .map(event => event.performance?.renderTime)
      .filter(time => typeof time === 'number') as number[];

    return {
      renderCount: this.renderCounts.get(componentName) || 0,
      lastRender: renders.length > 0 ? renders[renders.length - 1].timestamp : 0,
      avgRenderTime: renderTimes.length > 0 
        ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length
        : 0,
    };
  }

  // Subscription management
  subscribe(callback: (event: DebugEvent) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Data export
  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    return JSON.stringify(this.events, null, 2);
  }

  // Clear data
  clear(): void {
    this.events = [];
    this.renderCounts.clear();
    this.performanceMarks.clear();
    localStorage.removeItem('debug-events');
  }

  // Utility methods
  private safeSerialize(obj: any): any {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return '[Unserializable Object]';
    }
  }

  private getCurrentUserId(): string {
    // You can implement user ID retrieval here
    return 'anonymous';
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('debug-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('debug-session-id', sessionId);
    }
    return sessionId;
  }

  private saveToLocalStorage(): void {
    try {
      // Save only the last 1000 events to localStorage
      const eventsToSave = this.events.slice(-1000);
      localStorage.setItem('debug-events', JSON.stringify(eventsToSave));
    } catch (error) {
      console.warn('Failed to save debug events to localStorage:', error);
    }
  }

  private exportToCSV(): string {
    const headers = ['ID', 'Timestamp', 'Type', 'Component', 'Message', 'Data'];
    const rows = this.events.map(event => [
      event.id,
      new Date(event.timestamp).toISOString(),
      event.type,
      event.component || '',
      event.message,
      JSON.stringify(event.data || {}),
    ]);

    return [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
  }
}

// Singleton debug store
export const debugStore = new DebugStore();

// High-level debugging API
export const debug = {
  // Logging methods
  log: (message: string, data?: any, component?: string) => {
    if (isDebugLevel('debug')) {
      debugStore.addEvent({
        type: DebugEventType.DEBUG,
        component,
        message,
        data,
      });
      
      if (shouldOutput('console')) {
        console.log(`[DEBUG] ${component ? `[${component}] ` : ''}${message}`, data);
      }
    }
  },

  info: (message: string, data?: any, component?: string) => {
    if (isDebugLevel('info')) {
      debugStore.addEvent({
        type: DebugEventType.INFO,
        component,
        message,
        data,
      });
      
      if (shouldOutput('console')) {
        console.info(`[INFO] ${component ? `[${component}] ` : ''}${message}`, data);
      }
    }
  },

  warn: (message: string, data?: any, component?: string) => {
    if (isDebugLevel('warn')) {
      debugStore.addEvent({
        type: DebugEventType.WARN,
        component,
        message,
        data,
      });
      
      if (shouldOutput('console')) {
        console.warn(`[WARN] ${component ? `[${component}] ` : ''}${message}`, data);
      }
    }
  },

  error: (message: string, error?: Error | any, component?: string) => {
    if (isDebugLevel('error')) {
      debugStore.trackError(
        error instanceof Error ? error : new Error(message), 
        component, 
        error instanceof Error ? undefined : error
      );
      
      if (shouldOutput('console')) {
        console.error(`[ERROR] ${component ? `[${component}] ` : ''}${message}`, error);
      }
    }
  },

  // Performance tracking
  time: (label: string) => debugStore.startPerformanceMark(label),
  timeEnd: (label: string, component?: string) => debugStore.endPerformanceMark(label, component),

  // Component tracking
  trackRender: (component: string, renderTime?: number) => {
    if (isFeatureEnabled('renderTracking')) {
      debugStore.trackRender(component, renderTime);
    }
  },

  trackState: (component: string, stateName: string, previous: any, current: any) => {
    if (isFeatureEnabled('stateChanges')) {
      debugStore.trackStateChange(component, stateName, previous, current);
    }
  },

  trackContext: (contextName: string, previous: any, current: any) => {
    if (isFeatureEnabled('contextUpdates')) {
      debugStore.trackContextUpdate(contextName, previous, current);
    }
  },

  // Memory tracking
  checkMemory: (component?: string) => {
    if (isFeatureEnabled('memoryTracking')) {
      debugStore.trackMemoryUsage(component);
    }
  },

  // Data access
  getEvents: debugStore.getEvents.bind(debugStore),
  getRenderCounts: debugStore.getRenderCounts.bind(debugStore),
  getComponentStats: debugStore.getComponentStats.bind(debugStore),
  subscribe: debugStore.subscribe.bind(debugStore),
  export: debugStore.exportData.bind(debugStore),
  clear: debugStore.clear.bind(debugStore),
};

// Auto-initialize memory monitoring
if (isFeatureEnabled('memoryTracking')) {
  setInterval(() => debug.checkMemory('Global'), 5000);
}

// Global error handler
window.addEventListener('error', (event) => {
  debug.error('Global error caught', event.error, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
  debug.error('Unhandled promise rejection', event.reason, 'Global');
});

// Export the store for advanced usage
export { debugStore };
