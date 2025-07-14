import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const SimpleDebug: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDebug = async () => {
    try {
      setLogs([]);
      setIsRunning(true);
      
      addLog('🔍 Starting debug...');
      
      // Test 1: Basic auth
      addLog('📝 Testing auth...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        addLog(`❌ Auth error: ${authError.message}`);
      } else if (!user) {
        addLog('❌ No user found');
      } else {
        addLog(`✅ User found: ${user.email} (ID: ${user.id})`);
      }

      // Test 2: Basic companies query
      addLog('📝 Testing companies query...');
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*');
      
      if (companiesError) {
        addLog(`❌ Companies error: ${companiesError.message}`);
      } else {
        addLog(`✅ Companies found: ${companies?.length || 0}`);
        if (companies && companies.length > 0) {
          companies.forEach((c, i) => {
            addLog(`   ${i+1}. ${c.name} (Active: ${c.active})`);
          });
        }
      }

      // Test 3: Check memberships if user exists
      if (user) {
        addLog('📝 Testing company memberships...');
        const { data: memberships, error: membershipsError } = await supabase
          .from('company_users')
          .select('*')
          .eq('user_id', user.id);
        
        if (membershipsError) {
          addLog(`❌ Memberships error: ${membershipsError.message}`);
        } else {
          addLog(`✅ Memberships found: ${memberships?.length || 0}`);
          if (memberships && memberships.length > 0) {
            memberships.forEach((m, i) => {
              addLog(`   ${i+1}. Company: ${m.company_id}, Role: ${m.role}, Active: ${m.active}`);
            });
          }
        }
      }

      addLog('🎉 Debug complete!');
      
    } catch (error) {
      addLog(`💥 Unexpected error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 Simple Debug</h1>
      <button 
        onClick={runDebug} 
        disabled={isRunning}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: isRunning ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isRunning ? 'not-allowed' : 'pointer'
        }}
      >
        {isRunning ? 'Running...' : 'Run Debug'}
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Logs:</h3>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          minHeight: '200px',
          backgroundColor: '#f9f9f9',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          {logs.length === 0 ? 'Click "Run Debug" to start...' : logs.join('\n')}
        </div>
      </div>
    </div>
  );
};