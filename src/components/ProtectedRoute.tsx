import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useSession();
  const [debugInfo, setDebugInfo] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  // Debug logging and timeout
  useEffect(() => {
    console.log('🔒 ProtectedRoute: loading =', loading, 'user =', user?.email || 'null');
    setDebugInfo(`Loading: ${loading}, User: ${user?.email || 'null'}, Time: ${new Date().toLocaleTimeString()}`);
    
    // If loading takes more than 10 seconds, show debug info
    const debugTimer = setTimeout(() => {
      if (loading) {
        console.warn('🚨 ProtectedRoute: Loading taking too long, showing debug info');
        setShowDebug(true);
      }
    }, 10000);

    return () => clearTimeout(debugTimer);
  }, [loading, user]);

  // Show enhanced loading screen with better visibility and debug info
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700 font-medium">Loading Authentication...</p>
          <p className="mt-2 text-sm text-gray-500">{debugInfo}</p>
          
          {showDebug && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left max-w-md mx-auto">
              <h3 className="font-semibold text-yellow-800 mb-2">🔧 Debug Info:</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Loading state: {loading ? 'true' : 'false'}</li>
                <li>• User: {user?.email || 'null'}</li>
                <li>• Time elapsed: over 10 seconds</li>
                <li>• Check browser console for errors</li>
              </ul>
              <button 
                onClick={() => window.location.href = '/auth'}
                className="mt-3 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Force Redirect to Auth
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!user) {
    console.log('🔒 ProtectedRoute: No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // If authenticated, render the protected component
  console.log('🔒 ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;
