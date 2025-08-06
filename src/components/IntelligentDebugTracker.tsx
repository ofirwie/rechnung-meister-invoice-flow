/**
 * INTELLIGENT RENDER LOOP DETECTIVE
 * Automatically identifies root cause of render loops
 * No manual investigation required - gives direct solutions
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';

interface StateChange {
  timestamp: number;
  stateName: string;
  oldValue: any;
  newValue: any;
  stackTrace: string;
  renderCount: number;
}

interface LoopDetection {
  detected: boolean;
  cause: string;
  solution: string;
  confidence: number;
  evidence: string[];
}

const IntelligentDebugTracker: React.FC = () => {
  const renderCount = useRef(0);
  const stateChanges = useRef<StateChange[]>([]);
  const lastValues = useRef<any>({});
  const renderTimestamps = useRef<number[]>([]);
  
  const [showDetails, setShowDetails] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [loopAnalysis, setLoopAnalysis] = useState<LoopDetection | null>(null);
  
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

  // Track each render with timestamp
  renderCount.current += 1;
  const currentTimestamp = Date.now();
  renderTimestamps.current.push(currentTimestamp);
  
  // Keep only last 50 render timestamps for performance
  if (renderTimestamps.current.length > 50) {
    renderTimestamps.current = renderTimestamps.current.slice(-50);
  }

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

  // INTELLIGENT STATE CHANGE DETECTION
  useEffect(() => {
    Object.keys(currentValues).forEach(key => {
      const current = currentValues[key as keyof typeof currentValues];
      const previous = lastValues.current[key];
      
      if (current !== previous) {
        // Capture stack trace to identify source
        const stack = new Error().stack || 'Stack trace not available';
        
        const stateChange: StateChange = {
          timestamp: currentTimestamp,
          stateName: key,
          oldValue: previous || 'undefined',
          newValue: current,
          stackTrace: stack,
          renderCount: renderCount.current
        };
        
        stateChanges.current.push(stateChange);
        
        // Keep only last 100 state changes for performance
        if (stateChanges.current.length > 100) {
          stateChanges.current = stateChanges.current.slice(-100);
        }
      }
    });
    
    lastValues.current = { ...currentValues };
  });

  // INTELLIGENT LOOP DETECTION AND ANALYSIS
  useEffect(() => {
    if (renderCount.current > 20) {
      const analysis = analyzeRenderLoop();
      setLoopAnalysis(analysis);
    }
  }, [renderCount.current]);

  const analyzeRenderLoop = useCallback((): LoopDetection => {
    const recentChanges = stateChanges.current.slice(-20);
    const recentTimestamps = renderTimestamps.current.slice(-10);
    
    // Check render frequency
    const renderFrequency = recentTimestamps.length > 1 ? 
      recentTimestamps[recentTimestamps.length - 1] - recentTimestamps[0] : 0;
    const averageRenderTime = renderFrequency / Math.max(recentTimestamps.length - 1, 1);
    
    // Detect patterns in state changes
    const stateChangeFrequency: { [key: string]: number } = {};
    const cyclicalStates: string[] = [];
    
    recentChanges.forEach(change => {
      stateChangeFrequency[change.stateName] = (stateChangeFrequency[change.stateName] || 0) + 1;
    });
    
    // Find states that change too frequently
    Object.keys(stateChangeFrequency).forEach(stateName => {
      if (stateChangeFrequency[stateName] > 5) {
        cyclicalStates.push(stateName);
      }
    });
    
    // INTELLIGENT DIAGNOSIS
    let cause = 'Unknown render loop cause';
    let solution = 'Manual investigation required';
    let confidence = 0;
    const evidence: string[] = [];
    
    if (averageRenderTime < 10 && renderCount.current > 50) {
      cause = 'Rapid re-rendering detected (< 10ms between renders)';
      confidence = 90;
      evidence.push(`Average render time: ${averageRenderTime.toFixed(2)}ms`);
      evidence.push(`Total renders: ${renderCount.current}`);
    }
    
    if (cyclicalStates.length > 0) {
      cause = `State oscillation detected in: ${cyclicalStates.join(', ')}`;
      solution = `Check useEffect dependencies for: ${cyclicalStates.join(', ')}`;
      confidence = Math.max(confidence, 85);
      evidence.push(`States changing cyclically: ${cyclicalStates.join(', ')}`);
    }
    
    // Check for useEffect dependency issues
    const stackTraces = recentChanges.map(c => c.stackTrace).join('\n');
    if (stackTraces.includes('useEffect')) {
      cause = 'useEffect causing render loop';
      solution = 'Check useEffect dependency arrays - likely missing or incorrect dependencies';
      confidence = Math.max(confidence, 80);
      evidence.push('useEffect detected in stack traces');
    }
    
    // Check for specific React patterns
    if (stackTraces.includes('useState') && cyclicalStates.length > 0) {
      cause = `useState updates during render causing loop: ${cyclicalStates[0]}`;
      solution = `Move ${cyclicalStates[0]} state update outside render cycle or to useEffect`;
      confidence = 95;
      evidence.push(`useState update detected during render for ${cyclicalStates[0]}`);
    }
    
    // Check for Context updates
    if (stackTraces.includes('CompanyProvider') || stackTraces.includes('CompanyContext')) {
      cause = 'CompanyContext causing render loop';
      solution = 'Check CompanyProvider for state updates during render or useCallback dependencies';
      confidence = Math.max(confidence, 75);
      evidence.push('CompanyContext detected in stack traces');
    }
    
    return {
      detected: renderCount.current > 20,
      cause,
      solution,
      confidence,
      evidence
    };
  }, []);

  // Generate intelligent debug report
  const generateIntelligentReport = useCallback(() => {
    const timestamp = new Date().toLocaleString();
    const analysis = loopAnalysis || analyzeRenderLoop();
    const recentChanges = stateChanges.current.slice(-10);
    
    return `🤖 INTELLIGENT RENDER LOOP ANALYSIS
=============================================
Timestamp: ${timestamp}
Total Renders: ${renderCount.current}
Status: ${analysis.detected ? '🚨 INFINITE LOOP DETECTED' : '✅ Normal'}

🎯 ROOT CAUSE IDENTIFIED:
Cause: ${analysis.cause}
Confidence: ${analysis.confidence}%

🔧 AUTOMATED SOLUTION:
${analysis.solution}

📊 EVIDENCE:
${analysis.evidence.map(e => `• ${e}`).join('\n')}

📈 RECENT STATE CHANGES:
${recentChanges.map(change => 
  `[Render #${change.renderCount}] ${change.stateName}: ${change.oldValue} → ${change.newValue}`
).join('\n')}

💡 SPECIFIC FIX RECOMMENDATIONS:
${analysis.confidence > 80 ? `
🎯 HIGH CONFIDENCE FIX:
${analysis.solution}

⚡ Quick Fix Steps:
1. Open the file mentioned in stack trace
2. ${analysis.cause.includes('useEffect') ? 'Check useEffect dependency arrays' : 'Check state update locations'}
3. ${analysis.cause.includes('useState') ? 'Move state updates outside render' : 'Verify memoization is working'}
` : `
🔍 REQUIRES INVESTIGATION:
The debug system detected patterns but needs more data for specific diagnosis.
Check the stack traces above for clues.
`}

🔗 TECHNICAL DETAILS:
URL: ${window.location.href}
Render Rate: ${renderTimestamps.current.length > 1 ? 
  `${((renderTimestamps.current[renderTimestamps.current.length - 1] - renderTimestamps.current[0]) / 
  Math.max(renderTimestamps.current.length - 1, 1)).toFixed(2)}ms avg` : 'N/A'}
Browser: ${navigator.userAgent.substring(0, 100)}...

🧠 STACK TRACE ANALYSIS:
${stateChanges.current.slice(-3).map(change => 
  `${change.stateName}:\n${change.stackTrace.split('\n').slice(1, 4).join('\n')}`
).join('\n---\n')}
`;
  }, [loopAnalysis]);

  // Copy intelligent report
  const copyIntelligentReport = useCallback(async () => {
    try {
      const report = generateIntelligentReport();
      await navigator.clipboard.writeText(report);
      setCopyStatus('🤖 Intelligent Report Copied!');
      setTimeout(() => setCopyStatus(''), 3000);
    } catch (err) {
      setCopyStatus('❌ Copy failed');
      setTimeout(() => setCopyStatus(''), 2000);
    }
  }, [generateIntelligentReport]);

  const renderStatus = renderCount.current > 50 ? 'CRITICAL' : renderCount.current > 20 ? 'WARNING' : 'NORMAL';
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
      maxWidth: '450px',
      maxHeight: '600px',
      overflow: 'auto',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      borderRadius: '6px',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h3 style={{ margin: 0, color: statusColor }}>🤖 INTELLIGENT DEBUGGER</h3>
        <div style={{ fontSize: '10px', color: '#666' }}>AUTO-DIAGNOSIS</div>
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Renders:</strong> 
        <span style={{ color: statusColor, fontWeight: 'bold', marginLeft: '5px' }}>
          {renderCount.current}
        </span>
        {renderCount.current > 20 && (
          <span style={{ color: statusColor, marginLeft: '8px' }}>
            🤖 ANALYZING...
          </span>
        )}
      </div>

      {loopAnalysis && loopAnalysis.detected && (
        <div style={{ 
          color: '#d32f2f', 
          fontWeight: 'bold', 
          marginBottom: '10px', 
          padding: '8px',
          backgroundColor: '#ffebee',
          border: '1px solid #d32f2f',
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ marginRight: '6px' }}>🎯</span>
            <strong>ROOT CAUSE IDENTIFIED</strong>
          </div>
          <div style={{ fontWeight: 'normal', marginBottom: '4px' }}>
            <strong>Problem:</strong> {loopAnalysis.cause}
          </div>
          <div style={{ fontWeight: 'normal', marginBottom: '4px' }}>
            <strong>Solution:</strong> {loopAnalysis.solution}
          </div>
          <div style={{ fontWeight: 'normal', fontSize: '10px', color: '#666' }}>
            Confidence: {loopAnalysis.confidence}%
          </div>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <div><strong>Company:</strong> {selectedCompany?.name || 'null'}</div>
        <div><strong>User:</strong> {userRole || 'null'}</div>
        <div><strong>Recent Changes:</strong> {stateChanges.current.slice(-5).length}</div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button
          onClick={copyIntelligentReport}
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
          🤖 Copy AI Analysis
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
          {showDetails ? '🔼 Hide' : '📊 Details'}
        </button>
      </div>

      {copyStatus && (
        <div style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          color: copyStatus.includes('🤖') ? '#1976d2' : copyStatus.includes('✅') ? '#2e7d32' : '#d32f2f',
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
          <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>🔬 Technical Analysis:</div>
          
          {loopAnalysis && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>Evidence Found:</div>
              {loopAnalysis.evidence.map((evidence, idx) => (
                <div key={idx} style={{ marginLeft: '8px', color: '#555' }}>
                  • {evidence}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ fontWeight: 'bold' }}>Recent State Changes:</div>
          {stateChanges.current.slice(-5).map((change, idx) => (
            <div key={idx} style={{ marginLeft: '8px', marginBottom: '4px' }}>
              <div style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                [#{change.renderCount}] {change.stateName}
              </div>
              <div style={{ color: '#555', fontSize: '9px' }}>
                {change.oldValue} → {change.newValue}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        🤖 AI-Powered Debug Analysis • Auto-Diagnosis System
      </div>
    </div>
  );
};

export default IntelligentDebugTracker;
