/**
 * Simple render debugging hook
 * Tracks when and why components re-render
 */

import { useEffect, useRef } from 'react';

export const useRenderDebugger = (
  componentName: string, 
  props?: Record<string, any>
) => {
  const renderCount = useRef(0);
  const previousProps = useRef<Record<string, any>>({});
  
  renderCount.current += 1;
  
  const logPrefix = `🔄 [${componentName}]`;
  
  console.log(`${logPrefix} Render #${renderCount.current}`);
  
  // Check what props changed
  if (props) {
    Object.keys(props).forEach(key => {
      const current = props[key];
      const previous = previousProps.current[key];
      
      // Deep comparison for objects/arrays
      const currentStr = typeof current === 'object' 
        ? JSON.stringify(current) 
        : String(current);
      const previousStr = typeof previous === 'object' 
        ? JSON.stringify(previous) 
        : String(previous);
        
      if (currentStr !== previousStr) {
        console.log(`${logPrefix} PROP CHANGED: ${key}`, {
          previous,
          current,
          render: renderCount.current
        });
      }
    });
    
    previousProps.current = { ...props };
  }
  
  // Warn about potential render loops
  if (renderCount.current > 30) {
    console.warn(`${logPrefix} HIGH RENDER COUNT: ${renderCount.current}`);
  }
  
  if (renderCount.current > 100) {
    console.error(`${logPrefix} RENDER LOOP DETECTED: ${renderCount.current} renders!`);
  }
  
  return renderCount.current;
};

// Track state changes
export const useStateDebugger = <T>(
  state: T, 
  stateName: string, 
  componentName: string
) => {
  const previousState = useRef<T>(state);
  
  useEffect(() => {
    if (JSON.stringify(state) !== JSON.stringify(previousState.current)) {
      console.log(`📊 [${componentName}] STATE CHANGE: ${stateName}`, {
        previous: previousState.current,
        current: state,
        timestamp: new Date().toISOString()
      });
      previousState.current = state;
    }
  }, [state, stateName, componentName]);
};
