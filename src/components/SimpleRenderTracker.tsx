/**
 * USER-FRIENDLY RENDER DEBUGGER
 * Professional debug interface with copy functionality
 * NO console references - everything visible in UI
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

const SimpleRenderTracker: React.FC = () => {
  const renderCount = useRef(0);
  const lastValues = useRef<any>({});
  const [showDetails, setShowDetails] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  
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

  // Analyze function stability
  const functionAnalysis = {
    switchCompany: lastValues.current.switchCompany !== currentValues.switchCompany,
    refreshCompanies: lastValues.current.refreshCompanies !== currentValues.refreshCompanies,
    canAccess: lastValues.current.canAccess !== currentValues.canAccess,
  };

  // Generate comprehensive debug report
  const generateDebugReport = useCallback(() => {
    const timestamp = new Date().toLocaleString();
    const url = window.location.href;
    const userAgent = navigator.userAgent;
    
    const stableCount = Object.values(functionAnalysis).filter(changed => !changed).length;
    const unstableCount = Object.values(functionAnalysis).filter(changed => changed).length;
    
    return `🐛 RENDER DEBUG REPORT
Timestamp: ${timestamp}
Render Count: ${renderCount.current}
Status: ${renderCount.current > 10 ? '⚠️ RENDER LOOP DETECTED' : '✅ Normal'}

📊 CURRENT STATE:
Company: ${selectedCompany?.name || 'null'}
User Role: ${userRole || 'null'}
Permissions: ${permissions ? 'set' : 'null'}
Loading: ${loading}
Companies: ${companies?.length || 0}

🔧 FUNCTION STABILITY ANALYSIS:
${Object.entries(functionAnalysis).map(([name, isUnstable]) => 
  `${isUnstable ? '⚠️' : '✅'} ${name}: ${isUnstable ? 'RECREATED EACH RENDER' : 'stable'}`
).join('\n')}

📈 STABILITY SCORE:
Stable Functions: ${stableCount}/3
Unstable Functions: ${unstableCount}/3

💡 ANALYSIS:
${unstableCount > 0 ? `Functions being recreated: ${Object.entries(functionAnalysis)
  .filter(([_, isUnstable]) => isUnstable)
  .map(([name]) => name)
  .join(', ')}

This is likely causing the render loop. Check dependency arrays in useCallback/useMemo.` : 'All functions are stable - render loop may be caused by state changes.'}

🔗 DEBUG INFO:
URL: ${url}
Browser: ${userAgent.substring(0, 100)}...
`;
  }, [selectedCompany, userRole, permissions, loading, companies, functionAnalysis]);

  // Copy debug report to clipboard
  const copyDebugReport = useCallback(async () => {
    try {
      const report = generateDebugReport();
      await navigator.clipboard.writeText(report);
      setCopyStatus('✅ Copied!');
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (err) {
      setCopyStatus('❌ Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  }, [generateDebugReport]);

  useEffect(() => {
    // Still log to console for developers, but don't reference it in UI
    console.log(`🔄 [RENDER #${renderCount.current}] CompanyContext Consumer re-rendered`);
    
    // Check what changed (for developer console only)
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
    
    // Developer console warnings (not referenced in UI)
    if (renderCount.current > 50) {
      console.error(`🚨 RENDER LOOP DETECTED: ${renderCount.current} renders!`);
      console.error('Current context values:', currentValues);
    }
  });

  const renderStatus = renderCount.current > 15 ? 'CRITICAL' : renderCount.current > 10 ? 'WARNING' : 'NORMAL';
  const statusColor = renderStatus === 'CRITICAL' ? '#d32f2f' : renderStatus === 'WARNING' ? '#f57c00' : '#2e7d32';

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: `2px solid ${statusColor}`,
      padding: '12px',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '500px',
      overflow: 'auto',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
      borderRadius: '6px',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: statusColor }}>🐛 RENDER DEBUGGER</h3>
        <div style={{ fontSize: '10px', color: '#666' }}>{renderStatus}</div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Renders:</strong> 
        <span style={{ color: statusColor, fontWeight: 'bold', marginLeft: '5px' }}>
          {renderCount.current}
        </span>
        {renderCount.current > 10 && (
          <span style={{ color: statusColor, marginLeft: '8px' }}>
            {renderStatus === 'CRITICAL' ? '🚨 LOOP DETECTED' : '⚠️ HIGH COUNT'}
          </span>
        )}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Company:</strong> {selectedCompany?.name || 'null'}</div>
        <div><strong>User:</strong> {userRole || 'null'} {permissions ? '(permissions set)' : '(no permissions)'}</div>
        <div><strong>Loading:</strong> {loading.toString()}</div>
        <div><strong>Companies:</strong> {companies?.length || 0}</div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔧 Function Stability:</div>
        {Object.entries(functionAnalysis).map(([name, isUnstable]) => (
          <div key={name} style={{ fontSize: '11px', marginLeft: '8px' }}>
            <span style={{ color: isUnstable ? '#d32f2f' : '#2e7d32' }}>
              {isUnstable ? '⚠️' : '✅'}
            </span>
            <span style={{ marginLeft: '4px' }}>
              {name}: {isUnstable ? 'RECREATED' : 'stable'}
            </span>
          </div>
        ))}
      </div>

      {renderCount.current > 10 && (
        <div style={{ 
          color: '#d32f2f', 
          fontWeight: 'bold', 
          marginBottom: '10px', 
          padding: '6px',
          backgroundColor: '#ffebee',
          border: '1px solid #d32f2f',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          {renderStatus === 'CRITICAL' ? '🚨 RENDER LOOP DETECTED!' : '⚠️ High render count detected'}
          <br/>
          <span style={{ fontWeight: 'normal' }}>
            Likely cause: {Object.entries(functionAnalysis)
              .filter(([_, isUnstable]) => isUnstable)
              .map(([name]) => name)
              .join(', ') || 'State dependency issues'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          onClick={copyDebugReport}
          style={{
            background: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          📋 Copy Debug Report
        </button>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: '#424242',
            color: 'white',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          {showDetails ? '🔼 Hide' : '🔍 Details'}
        </button>
      </div>

      {copyStatus && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          color: copyStatus.includes('✅') ? '#2e7d32' : '#d32f2f',
          fontWeight: 'bold'
        }}>
          {copyStatus}
        </div>
      )}

      {showDetails && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          background: '#f5f5f5', 
          borderRadius: '4px',
          fontSize: '10px',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>🔍 Function Details:</div>
          {Object.entries(functionAnalysis).map(([name, isUnstable]) => (
            <div key={name} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 'bold' }}>{name}:</div>
              <div style={{ marginLeft: '8px', wordBreak: 'break-all' }}>
                {String(currentValues[name as keyof typeof currentValues]).substring(0, 100)}...
              </div>
              <div style={{ marginLeft: '8px', color: isUnstable ? '#d32f2f' : '#2e7d32' }}>
                Status: {isUnstable ? 'Recreated this render' : 'Stable'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        Professional Debug Interface • No Console Required
      </div>
    </div>
  );
};

export default SimpleRenderTracker;
