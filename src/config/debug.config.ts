/**
 * Centralized Debugging Configuration
 * Controls all debugging features across the application
 */

export interface DebugConfig {
  // Global debug settings
  enabled: boolean;
  level: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  // Feature-specific debugging
  features: {
    renderTracking: boolean;
    stateChanges: boolean;
    contextUpdates: boolean;
    performanceMonitoring: boolean;
    memoryTracking: boolean;
    componentInspection: boolean;
    errorBoundaries: boolean;
    networkRequests: boolean;
    userInteractions: boolean;
  };
  
  // Output configuration
  output: {
    console: boolean;
    localStorage: boolean;
    dashboard: boolean;
    exportable: boolean;
    realTime: boolean;
  };
  
  // Performance thresholds
  thresholds: {
    maxRenderCount: number;
    maxRenderTime: number;
    maxMemoryUsage: number;
    maxStateUpdateFrequency: number;
  };
  
  // Dashboard settings
  dashboard: {
    enabled: boolean;
    route: string;
    autoOpen: boolean;
    persistent: boolean;
  };
}

// Environment-based configuration
const getEnvironmentConfig = (): Partial<DebugConfig> => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  // Development settings
  if (isDevelopment) {
    return {
      enabled: true,
      level: 'debug',
      features: {
        renderTracking: true,
        stateChanges: true,
        contextUpdates: true,
        performanceMonitoring: true,
        memoryTracking: true,
        componentInspection: true,
        errorBoundaries: true,
        networkRequests: true,
        userInteractions: false, // Can be noisy
      },
      output: {
        console: true,
        localStorage: true,
        dashboard: true,
        exportable: true,
        realTime: true,
      },
      dashboard: {
        enabled: true,
        route: '/debug-dashboard',
        autoOpen: false,
        persistent: true,
      }
    };
  }
  
  // Production settings (minimal debugging)
  if (isProduction) {
    return {
      enabled: false,
      level: 'error',
      features: {
        renderTracking: false,
        stateChanges: false,
        contextUpdates: false,
        performanceMonitoring: false,
        memoryTracking: false,
        componentInspection: false,
        errorBoundaries: true, // Keep error boundaries in production
        networkRequests: false,
        userInteractions: false,
      },
      output: {
        console: false,
        localStorage: false,
        dashboard: false,
        exportable: false,
        realTime: false,
      },
      dashboard: {
        enabled: false,
        route: '/debug-dashboard',
        autoOpen: false,
        persistent: false,
      }
    };
  }
  
  return {};
};

// Override configuration via environment variables
const getEnvironmentOverrides = (): Partial<DebugConfig> => {
  const overrides: Partial<DebugConfig> = {};
  
  // Check for environment variable overrides
  if (import.meta.env.VITE_DEBUG_ENABLED !== undefined) {
    overrides.enabled = import.meta.env.VITE_DEBUG_ENABLED === 'true';
  }
  
  if (import.meta.env.VITE_DEBUG_LEVEL) {
    overrides.level = import.meta.env.VITE_DEBUG_LEVEL as DebugConfig['level'];
  }
  
  if (import.meta.env.VITE_DEBUG_DASHBOARD_ENABLED !== undefined) {
    overrides.dashboard = {
      ...overrides.dashboard,
      enabled: import.meta.env.VITE_DEBUG_DASHBOARD_ENABLED === 'true'
    };
  }
  
  return overrides;
};

// Default configuration
const defaultConfig: DebugConfig = {
  enabled: false,
  level: 'off',
  features: {
    renderTracking: false,
    stateChanges: false,
    contextUpdates: false,
    performanceMonitoring: false,
    memoryTracking: false,
    componentInspection: false,
    errorBoundaries: true,
    networkRequests: false,
    userInteractions: false,
  },
  output: {
    console: false,
    localStorage: false,
    dashboard: false,
    exportable: false,
    realTime: false,
  },
  thresholds: {
    maxRenderCount: 50,
    maxRenderTime: 16, // 16ms for 60fps
    maxMemoryUsage: 100, // MB
    maxStateUpdateFrequency: 10, // updates per second
  },
  dashboard: {
    enabled: false,
    route: '/debug-dashboard',
    autoOpen: false,
    persistent: false,
  }
};

// Merge configurations
export const debugConfig: DebugConfig = {
  ...defaultConfig,
  ...getEnvironmentConfig(),
  ...getEnvironmentOverrides(),
};

// Runtime configuration updates
export const updateDebugConfig = (updates: Partial<DebugConfig>): void => {
  Object.assign(debugConfig, updates);
  
  // Save to localStorage for persistence
  if (debugConfig.dashboard.persistent) {
    localStorage.setItem('debug-config', JSON.stringify(debugConfig));
  }
  
  console.log('🔧 Debug configuration updated:', updates);
};

// Load saved configuration
export const loadSavedConfig = (): void => {
  try {
    const saved = localStorage.getItem('debug-config');
    if (saved && debugConfig.dashboard.persistent) {
      const savedConfig = JSON.parse(saved) as Partial<DebugConfig>;
      Object.assign(debugConfig, savedConfig);
      console.log('🔧 Loaded saved debug configuration');
    }
  } catch (error) {
    console.error('❌ Failed to load saved debug configuration:', error);
  }
};

// Initialize configuration on load
loadSavedConfig();

// Export debug level check functions for performance
export const isDebugLevel = (level: DebugConfig['level']): boolean => {
  const levels = ['off', 'error', 'warn', 'info', 'debug', 'trace'];
  const currentIndex = levels.indexOf(debugConfig.level);
  const checkIndex = levels.indexOf(level);
  return currentIndex >= checkIndex && debugConfig.enabled;
};

export const isFeatureEnabled = (feature: keyof DebugConfig['features']): boolean => {
  return debugConfig.enabled && debugConfig.features[feature];
};

export const shouldOutput = (output: keyof DebugConfig['output']): boolean => {
  return debugConfig.enabled && debugConfig.output[output];
};
