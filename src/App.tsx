// DIAGNOSTIC MODE - Minimal routing to enable database testing
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import SupabaseTest from './pages/SupabaseTest';
import BasicAuthCheck from './pages/BasicAuthCheck';
import ClientLoadingTest from './pages/ClientLoadingTest';

function HomePage() {
  const navigate = useNavigate();
  
  return (
    <div style={{
      padding: '40px',
      color: 'black',
      backgroundColor: 'white',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1 style={{color: 'green', fontSize: '2em'}}>🎉 REACT IS WORKING!</h1>
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f8f0',
        border: '2px solid green',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>Database Diagnostic Mode Active</h2>
        <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
        <p><strong>Status:</strong> React + Basic Routing working</p>
        <p><strong>Next Step:</strong> Run Supabase connectivity tests</p>
      </div>
      
      <div style={{marginTop: '30px'}}>
        <h3>Quick Tests:</h3>
        <ul>
          <li>✅ HTML loads</li>
          <li>✅ JavaScript executes</li>
          <li>✅ React renders</li>
          <li>✅ React Router works</li>
          <li>🔍 Ready for database diagnostics</li>
        </ul>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e1f5fe',
        border: '1px solid #4fc3f7',
        borderRadius: '5px'
      }}>
        <h3 style={{color: '#0277bd'}}>🔍 Database Diagnostics Available</h3>
        <p>Click the button below to run comprehensive Supabase connectivity tests:</p>
        <button
          onClick={() => navigate('/supabase-test')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          🚀 Run Database Tests
        </button>
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px'
      }}>
        <p><strong>What was fixed:</strong> The original App.tsx had complex imports causing crashes.</p>
        <p><strong>Current status:</strong> Minimal routing added to enable database diagnostics.</p>
        <p><strong>Next:</strong> Identify and fix database connectivity issues.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/supabase-test" element={<SupabaseTest />} />
        <Route path="/client-diagnostic" element={<BasicAuthCheck />} />
        <Route path="/client-loading-test" element={<ClientLoadingTest />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
