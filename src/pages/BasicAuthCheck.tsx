import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const BasicAuthCheck = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setUser(session?.user || null);
      setLoading(false);
    } catch (err) {
      setError('Failed to check authentication');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>🔍 Checking authentication...</h2>
        <div style={{ marginTop: '20px' }}>Please wait...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        color: 'red'
      }}>
        <h2>❌ Authentication Error</h2>
        <div style={{ marginTop: '20px' }}>Error: {error}</div>
        <button 
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h2>🔐 Not Logged In</h2>
        <div style={{ 
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '5px'
        }}>
          <p><strong>You need to log in to access this page.</strong></p>
          <p>Current status: No active session found</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>✅ Authentication Successful</h2>
      <div style={{ 
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#d1f2eb',
        border: '1px solid #52c41a',
        borderRadius: '5px'
      }}>
        <p><strong>You are logged in!</strong></p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
        <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}</p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>🎯 Basic Auth Check Complete</h3>
        <ul style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
          <li>✅ Supabase connection working</li>
          <li>✅ User session active</li>
          <li>✅ Authentication verified</li>
          <li>✅ Basic user data accessible</li>
        </ul>
      </div>

      <button 
        onClick={() => navigate('/')}
        style={{
          marginTop: '30px',
          padding: '12px 24px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Back to Home
      </button>
    </div>
  );
};

export default BasicAuthCheck;
