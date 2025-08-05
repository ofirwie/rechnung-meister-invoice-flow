import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ClientLoadingTest = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    runClientLoadingTests();
  }, []);

  const addResult = (test, status, message, details = null) => {
    setResults(prev => [...prev, {
      test,
      status, // 'success', 'error', 'warning'
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runClientLoadingTests = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Check Authentication
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        addResult('Authentication', 'error', 'Auth error: ' + error.message, error);
        setLoading(false);
        return;
      }
      if (!session) {
        addResult('Authentication', 'error', 'No active session - must be logged in', null);
        setLoading(false);
        return;
      }
      addResult('Authentication', 'success', `Logged in as ${session.user.email}`, {
        userId: session.user.id,
        email: session.user.email
      });
    } catch (err) {
      addResult('Authentication', 'error', 'Auth check failed', err);
      setLoading(false);
      return;
    }

    // Test 2: Direct Client Table Query
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(5);

      if (error) {
        addResult('Direct Client Query', 'error', `Query failed: ${error.message}`, {
          error,
          code: error.code,
          hint: error.hint
        });
      } else {
        addResult('Direct Client Query', 'success', `Found ${clients?.length || 0} clients`, {
          clientCount: clients?.length || 0,
          sampleClient: clients?.[0] || null
        });
      }
    } catch (err) {
      addResult('Direct Client Query', 'error', 'Query exception', err);
    }

    // Test 3: Table Permissions Test
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('count', { count: 'exact', head: true });

      if (error) {
        addResult('Table Permissions', 'error', `Permission denied: ${error.message}`, error);
      } else {
        addResult('Table Permissions', 'success', 'Table accessible', { totalRows: data });
      }
    } catch (err) {
      addResult('Table Permissions', 'error', 'Permission test failed', err);
    }

    // Test 4: Company Context Check
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .limit(5);

      if (error) {
        addResult('Company Check', 'error', `Company query failed: ${error.message}`, error);
      } else {
        addResult('Company Check', 'success', `Found ${companies?.length || 0} companies`, {
          companyCount: companies?.length || 0,
          companies: companies?.map(c => ({ id: c.id, name: c.name })) || []
        });
      }
    } catch (err) {
      addResult('Company Check', 'error', 'Company test failed', err);
    }

    // Test 5: RLS Policy Test
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Test insert (should work for own user_id)
      const testClient = {
        company_name: 'TEST_DELETE_ME',
        address: 'Test Address',
        city: 'Test City', 
        country: 'Test Country',
        user_id: session.user.id
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('clients')
        .insert(testClient)
        .select()
        .single();

      if (insertError) {
        addResult('RLS Insert Test', 'error', `Insert failed: ${insertError.message}`, insertError);
      } else {
        addResult('RLS Insert Test', 'success', 'Insert successful', insertResult);
        
        // Clean up test record
        await supabase.from('clients').delete().eq('id', insertResult.id);
        addResult('RLS Cleanup', 'success', 'Test record deleted', null);
      }
    } catch (err) {
      addResult('RLS Insert Test', 'error', 'RLS test failed', err);
    }

    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#d1f2eb';
      case 'error': return '#fadbd8';
      case 'warning': return '#fcf3cf';
      default: return '#f8f9fa';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>🔍 Client Loading Diagnostic</h1>
      <p>Testing why clients aren't loading properly...</p>

      <button 
        onClick={() => navigate('/')}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Back to Home
      </button>

      {loading && (
        <div style={{ 
          padding: '20px',
          backgroundColor: '#e1f5fe',
          border: '1px solid #4fc3f7',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h3>🔄 Running Tests...</h3>
          <p>Please wait while we diagnose the client loading issues...</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              marginBottom: '15px',
              padding: '15px',
              backgroundColor: getStatusColor(result.status),
              border: `1px solid ${result.status === 'success' ? '#52c41a' : result.status === 'error' ? '#f5222d' : '#faad14'}`,
              borderRadius: '5px'
            }}
          >
            <h3 style={{ margin: '0 0 10px 0' }}>
              {getStatusIcon(result.status)} {result.test}
            </h3>
            <p style={{ margin: '0 0 10px 0' }}><strong>{result.message}</strong></p>
            <small style={{ color: '#666' }}>Time: {result.timestamp}</small>
            
            {result.details && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  View Details
                </summary>
                <pre style={{ 
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '3px',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {!loading && results.length === 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <p>No test results yet. Click "Run Tests" to start diagnosis.</p>
        </div>
      )}

      <button 
        onClick={runClientLoadingTests}
        disabled={loading}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          backgroundColor: loading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        {loading ? '🔄 Running Tests...' : '🚀 Run Tests Again'}
      </button>
    </div>
  );
};

export default ClientLoadingTest;
