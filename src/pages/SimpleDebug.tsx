import React from 'react';

export default function SimpleDebug() {
  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: 'red', fontSize: '32px' }}>
        🚨 SIMPLE DEBUG WORKING!
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        marginTop: '20px',
        border: '2px solid #333'
      }}>
        <h2>✅ This route is working!</h2>
        <p>If you can see this, the routing system is functional.</p>
        <p>Route: <code>/simple-debug</code></p>
        <p>Time: {new Date().toLocaleString()}</p>
      </div>
      
      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '15px',
        marginTop: '20px',
        border: '2px solid green'
      }}>
        <h3>🎯 Next Steps:</h3>
        <ul>
          <li>This proves routing works</li>
          <li>The 404 on /debug-minimal might be a production build issue</li>
          <li>Try this simpler route first</li>
        </ul>
      </div>
      
      <button
        onClick={() => window.location.href = '/'}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '5px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
