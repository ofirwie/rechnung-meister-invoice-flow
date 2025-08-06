/**
 * SIMPLE RENDER TRACKER - Immediate debugging tool
 * Shows exactly what's causing renders in real-time
 */

import React, { useEffect, useRef } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

const SimpleRenderTracker: React.FC = () => {
  const renderCount = useRef(0);
  const lastValues = useRef<any>({});
  
  // Get all context values
  const context = useCompany();
  const {
    selectedCompany,
    companies,
    userRole,
    permissions,
    loading,
    switchCompany,
    refreshCompanies,
    canAccess,
  } = context;

  // Track each render
  renderCount.current += 1;

  // Current values for comparison
  const currentValues = {
    selectedCompany: selectedCompany ? JSON.stringify(selectedCompany) : 'null',
    companies: companies ? JSON.stringify(companies) : 'null',
    userRole,
    permissions: permissions ? JSON.stringify(permissions) : 'null',
    loading,
    switchCompany: switchCompany.toString(),
    refreshCompanies: refreshCompanies.toString(),
    canAccess: canAccess.toString(),
  };

  useEffect(() => {
    console.log(`🔄 [RENDER #${renderCount.current}] CompanyContext Consumer re-rendered`);
    
    // Check what changed
    Object.keys(currentValues).forEach(key => {
      const current = currentValues[key as keyof typeof currentValues];
      const previous = lastValues.current[key];
      
      if (current !== previous) {
        console.log(`📝 [CHANGE] ${key} changed:`, {
          previous: previous || 'undefined',
          current,
          renderCount: renderCount.current
        });
      }
    });
    
    // Save current values for next comparison
    lastValues.current = { ...currentValues };
    
    // Render loop detection
    if (renderCount.current > 50) {
      console.error(`🚨 RENDER LOOP DETECTED: ${renderCount.current} renders!`);
      console.error('Current context values:', currentValues);
    }
  });

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid red',
      padding: '10px',
      zIndex: 9999,
      fontSize: '11px',
      maxWidth: '350px',
      maxHeight: '400px',
      overflow: 'auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 8px 0' }}>🐛 RENDER LOOP DEBUGGER</h3>
      <div><strong>Renders:</strong> <span style={{color: renderCount.current > 20 ? 'red' : 'green'}}>{renderCount.current}</span></div>
      <div><strong>Loading:</strong> {loading.toString()}</div>
      <div><strong>Selected Company:</strong> {selectedCompany?.name || 'null'}</div>
      <div><strong>Companies Count:</strong> {companies?.length || 0}</div>
      <div><strong>User Role:</strong> <span style={{color: userRole ? 'green' : 'orange'}}>{userRole || 'null'}</span></div>
      <div><strong>Permissions:</strong> <span style={{color: permissions ? 'green' : 'orange'}}>{permissions ? 'set' : 'null'}</span></div>
      
      <hr style={{ margin: '8px 0' }} />
      <div style={{ fontSize: '10px', color: '#666' }}>
        <div><strong>Functions recreated each render:</strong></div>
        <div>• switchCompany: {switchCompany.toString().substring(0, 30)}...</div>
        <div>• refreshCompanies: {refreshCompanies.toString().substring(0, 30)}...</div>
        <div>• canAccess: {canAccess.toString().substring(0, 30)}...</div>
      </div>
      
      {renderCount.current > 10 && (
        <div style={{ 
          color: 'red', 
          fontWeight: 'bold', 
          marginTop: '5px', 
          padding: '4px',
          backgroundColor: '#ffebee',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          🚨 RENDER LOOP DETECTED! 
          <br/>Check console for details!
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px' }}>
        <strong>💡 Press F12 to see console logs</strong>
      </div>
    </div>
  );
};

export default SimpleRenderTracker;
