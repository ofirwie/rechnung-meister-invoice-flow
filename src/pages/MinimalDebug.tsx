import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function MinimalDebug() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasics = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      addResult('🚀 Starting basic tests...');
      
      // Test 1: Supabase client check
      addResult('📦 Testing Supabase client...');
      if (supabase) {
        addResult('✅ Supabase client loaded successfully');
      } else {
        addResult('❌ Supabase client failed to load');
        return;
      }
      
      // Test 2: Auth check
      addResult('🔐 Testing authentication...');
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        addResult(`❌ Auth error: ${authError.message}`);
        return;
      }
      if (!session?.user) {
        addResult('⚠️ No user session - please login first');
        return;
      }
      addResult(`✅ User authenticated: ${session.user.email}`);
      
      // Test 3: Database connection
      addResult('🗄️ Testing database connection...');
      const { data, error: dbError } = await supabase
        .from('clients')
        .select('count')
        .eq('user_id', session.user.id)
        .single();
      
      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
        addResult(`❌ Database error: ${dbError.message}`);
        addResult(`🔍 Error code: ${dbError.code}`);
        addResult(`🔍 Error details: ${dbError.details}`);
        addResult(`🔍 Error hint: ${dbError.hint}`);
      } else {
        addResult('✅ Database connection working');
      }
      
      // Test 4: Simple query
      addResult('📊 Testing simple clients query...');
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('user_id', session.user.id)
        .limit(5);
        
      if (clientsError) {
        addResult(`❌ Clients query failed: ${clientsError.message}`);
      } else {
        addResult(`✅ Clients query successful: found ${clients.length} clients`);
      }
      
      addResult('🎉 Basic tests completed!');
      
    } catch (error: any) {
      addResult(`💥 Unexpected error: ${error.message}`);
      console.error('Debug test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        border: '2px solid #e0e0e0',
        marginBottom: '20px'
      }}>
        <h1 style={{ color: '#d32f2f', marginBottom: '10px' }}>
          🚨 MINIMAL WHITE SCREEN DEBUG
        </h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Ultra-simple debug tool - no complex TypeScript, just basic testing
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={testBasics}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#ccc' : '#1976d2',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginRight: '10px'
            }}
          >
            {loading ? 'Running Tests...' : 'RUN BASIC TESTS'}
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#666',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to App
          </button>
        </div>
      </div>
      
      {results.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '2px solid #e0e0e0'
        }}>
          <h2 style={{ marginBottom: '15px', color: '#333' }}>
            🔍 Test Results ({results.length} messages)
          </h2>
          
          <div style={{
            backgroundColor: '#f8f8f8',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {results.map((result, index) => (
              <div key={index} style={{ 
                marginBottom: '8px',
                lineHeight: '1.4',
                color: result.includes('❌') ? '#d32f2f' : 
                      result.includes('✅') ? '#2e7d32' :
                      result.includes('⚠️') ? '#f57c00' : '#333'
              }}>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #2196f3',
        marginTop: '20px'
      }}>
        <h3 style={{ color: '#1565c0', marginBottom: '10px' }}>
          🎯 What This Tests:
        </h3>
        <ul style={{ color: '#666', lineHeight: '1.6' }}>
          <li><strong>Supabase Import:</strong> Can we load the Supabase client?</li>
          <li><strong>Authentication:</strong> Is the user properly logged in?</li>
          <li><strong>Database Connection:</strong> Can we connect to the database?</li>
          <li><strong>Query Execution:</strong> Can we run a basic query?</li>
        </ul>
        <p style={{ color: '#1565c0', marginTop: '10px', fontWeight: 'bold' }}>
          If any test fails, that's likely your white screen cause!
        </p>
      </div>
    </div>
  );
}
