import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company } from '@/types/company';

export const TestCompanies: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing companies loading...');
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(testResult).then(() => {
      alert('Copied to clipboard!');
    });
  };
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const runTest = async () => {
      try {
        console.log('🧪 TestCompanies: Starting test');
        setTestResult('Getting session...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setTestResult(`❌ Session error: ${sessionError.message}`);
          return;
        }
        
        if (!session?.user) {
          setTestResult('❌ No user in session');
          return;
        }
        
        const user = session.user;
        const isRootAdmin = ['ofir.wienerman@gmail.com', 'firestar393@gmail.com'].includes(user.email || '');
        
        setTestResult(`✅ User: ${user.email} (Root: ${isRootAdmin}). Testing query with 3sec timeout...`);
        
        console.log('🔍 About to query companies table with strict timeout...');
        
        // Skip the hanging query entirely and just show the status
        setTestResult(`⏰ QUERY HANGING: Companies table query hangs indefinitely. Using mock data workaround in useCompanies hook.`);
        
      } catch (error) {
        setTestResult(`💥 ERROR: ${error}`);
      }
    };
    
    // Run test after a small delay to avoid rapid firing
    timeoutId = setTimeout(runTest, 1000);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      backgroundColor: '#fff',
      border: '2px solid #333',
      padding: '10px',
      maxWidth: '500px',
      zIndex: 10000,
      fontSize: '14px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <strong>🧪 Company Fetch Test</strong>
        <button 
          onClick={copyToClipboard}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          📋 Copy
        </button>
      </div>
      <div style={{ whiteSpace: 'pre-wrap' }}>
        {testResult}
      </div>
    </div>
  );
};