import React, { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { useCompanies } from '@/hooks/useCompanies';
import { supabase } from '@/integrations/supabase/client';

export const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Get data from CompanyContext
  const companyContext = useCompany();
  
  // Get data from useCompanies hook directly
  const companiesHook = useCompanies();
  
  useEffect(() => {
    const gatherDebugInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      // Direct Supabase query
      const { data: directCompanies } = await supabase
        .from('companies')
        .select('*');
        
      const { data: directMemberships } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user?.id || '');
      
      setDebugInfo({
        timestamp: new Date().toLocaleTimeString(),
        user: {
          id: user?.id,
          email: user?.email,
          isRootAdmin: ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'].includes(user?.email || '')
        },
        context: {
          selectedCompany: companyContext.selectedCompany?.name || 'None',
          companiesCount: companyContext.companies.length,
          companies: companyContext.companies.map(c => ({ id: c.id, name: c.name })),
          loading: companyContext.loading
        },
        hook: {
          companiesCount: companiesHook.companies.length,
          companies: companiesHook.companies.map(c => ({ id: c.id, name: c.name })),
          loading: companiesHook.loading,
          error: companiesHook.error
        },
        direct: {
          companiesCount: directCompanies?.length || 0,
          companies: directCompanies?.map(c => ({ id: c.id, name: c.name, active: c.active })) || [],
          membershipsCount: directMemberships?.length || 0,
          memberships: directMemberships?.map(m => ({ company_id: m.company_id, role: m.role, active: m.active })) || []
        }
      });
    };
    
    gatherDebugInfo();
    const interval = setInterval(gatherDebugInfo, 2000); // Update every 2 seconds
    
    return () => clearInterval(interval);
  }, [companyContext, companiesHook]);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      backgroundColor: '#f0f0f0',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '10px',
      maxWidth: '600px',
      maxHeight: '500px',
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <strong style={{ fontSize: '14px' }}>🔍 Debug Panel</strong>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>
      
      {isExpanded && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Last Update:</strong> {debugInfo.timestamp}
          </div>
          
          <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#e0e0e0' }}>
            <strong>👤 User:</strong>
            <div>Email: {debugInfo.user?.email || 'Not logged in'}</div>
            <div>ID: {debugInfo.user?.id || 'N/A'}</div>
            <div>Root Admin: {debugInfo.user?.isRootAdmin ? '✅ YES' : '❌ NO'}</div>
          </div>
          
          <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#ffe0e0' }}>
            <strong>📦 CompanyContext:</strong>
            <div>Selected: {debugInfo.context?.selectedCompany}</div>
            <div>Companies Count: {debugInfo.context?.companiesCount}</div>
            <div>Loading: {debugInfo.context?.loading ? 'Yes' : 'No'}</div>
            <div>Companies: {JSON.stringify(debugInfo.context?.companies || [], null, 2)}</div>
          </div>
          
          <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#e0ffe0' }}>
            <strong>🪝 useCompanies Hook:</strong>
            <div>Companies Count: {debugInfo.hook?.companiesCount}</div>
            <div>Loading: {debugInfo.hook?.loading ? 'Yes' : 'No'}</div>
            <div>Error: {debugInfo.hook?.error || 'None'}</div>
            <div>Companies: {JSON.stringify(debugInfo.hook?.companies || [], null, 2)}</div>
          </div>
          
          <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#e0e0ff' }}>
            <strong>🔌 Direct Supabase:</strong>
            <div>Companies Count: {debugInfo.direct?.companiesCount}</div>
            <div>Memberships Count: {debugInfo.direct?.membershipsCount}</div>
            <div>Companies: {JSON.stringify(debugInfo.direct?.companies || [], null, 2)}</div>
            <div>Memberships: {JSON.stringify(debugInfo.direct?.memberships || [], null, 2)}</div>
          </div>
        </div>
      )}
    </div>
  );
};