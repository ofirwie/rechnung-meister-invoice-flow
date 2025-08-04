import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Database, User, Settings } from 'lucide-react';

const SupabaseTest = () => {
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState({
    connection: null,
    authentication: null,
    database: null,
    policies: null
  });
  const [isRunning, setIsRunning] = useState(false);
  const [details, setDetails] = useState<{
    connection?: string;
    authentication?: string;
    database?: string;
    policies?: string;
  }>({});

  const runTests = async () => {
    setIsRunning(true);
    setTestResults({ connection: null, authentication: null, database: null, policies: null });
    setDetails({});

    // Test 1: Basic Connection
    try {
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setTestResults(prev => ({ ...prev, connection: 'error' }));
        setDetails(prev => ({ ...prev, connection: error.message }));
      } else {
        setTestResults(prev => ({ ...prev, connection: 'success' }));
        setDetails(prev => ({ ...prev, connection: 'Successfully connected to Supabase' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, connection: 'error' }));
      setDetails(prev => ({ ...prev, connection: `Connection failed: ${error.message}` }));
    }

    // Test 2: Authentication Status
    try {
      console.log('Testing authentication...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setTestResults(prev => ({ ...prev, authentication: 'error' }));
        setDetails(prev => ({ ...prev, authentication: error.message }));
      } else if (session) {
        setTestResults(prev => ({ ...prev, authentication: 'success' }));
        setDetails(prev => ({ ...prev, authentication: `Authenticated as: ${session.user.email}` }));
      } else {
        setTestResults(prev => ({ ...prev, authentication: 'warning' }));
        setDetails(prev => ({ ...prev, authentication: 'Not authenticated (this is normal if not logged in)' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, authentication: 'error' }));
      setDetails(prev => ({ ...prev, authentication: `Auth test failed: ${error.message}` }));
    }

    // Test 3: Database Connection
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase
        .from('companies')
        .select('count')
        .limit(1);
      
      if (error) {
        setTestResults(prev => ({ ...prev, database: 'error' }));
        setDetails(prev => ({ ...prev, database: `Database error: ${error.message}` }));
      } else {
        setTestResults(prev => ({ ...prev, database: 'success' }));
        setDetails(prev => ({ ...prev, database: 'Database connection successful' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, database: 'error' }));
      setDetails(prev => ({ ...prev, database: `Database test failed: ${error.message}` }));
    }

    // Test 4: RLS Policies (if authenticated)
    try {
      console.log('Testing RLS policies...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name')
          .limit(5);
        
        if (error) {
          setTestResults(prev => ({ ...prev, policies: 'error' }));
          setDetails(prev => ({ ...prev, policies: `RLS Policy error: ${error.message}` }));
        } else {
          setTestResults(prev => ({ ...prev, policies: 'success' }));
          setDetails(prev => ({ ...prev, policies: `RLS working - found ${data?.length || 0} companies` }));
        }
      } else {
        setTestResults(prev => ({ ...prev, policies: 'warning' }));
        setDetails(prev => ({ ...prev, policies: 'Cannot test RLS policies - user not authenticated' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, policies: 'error' }));
      setDetails(prev => ({ ...prev, policies: `RLS test failed: ${error.message}` }));
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <div className="h-5 w-5 rounded-full bg-gray-300 animate-pulse" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Auto-run tests on page load
  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Supabase Connection Test</h1>
                <p className="text-gray-600">Verify Supabase connectivity on Vercel deployment</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRunning ? 'Running Tests...' : 'Run Tests Again'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')}
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Connection Test */}
          <Card className={`border-2 ${getStatusColor(testResults.connection)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(testResults.connection)}
                Supabase Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">Testing basic connectivity to Supabase servers</p>
              <div className="bg-white/50 p-3 rounded border text-xs font-mono">
                {details.connection || 'Waiting for test...'}
              </div>
            </CardContent>
          </Card>

          {/* Authentication Test */}
          <Card className={`border-2 ${getStatusColor(testResults.authentication)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(testResults.authentication)}
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">Checking current authentication session</p>
              <div className="bg-white/50 p-3 rounded border text-xs font-mono">
                {details.authentication || 'Waiting for test...'}
              </div>
            </CardContent>
          </Card>

          {/* Database Test */}
          <Card className={`border-2 ${getStatusColor(testResults.database)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(testResults.database)}
                Database Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">Testing database query execution</p>
              <div className="bg-white/50 p-3 rounded border text-xs font-mono">
                {details.database || 'Waiting for test...'}
              </div>
            </CardContent>
          </Card>

          {/* RLS Policies Test */}
          <Card className={`border-2 ${getStatusColor(testResults.policies)}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(testResults.policies)}
                RLS Policies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">Testing Row Level Security permissions</p>
              <div className="bg-white/50 p-3 rounded border text-xs font-mono">
                {details.policies || 'Waiting for test...'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Current Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Supabase URL:</h4>
                <div className="bg-gray-100 p-2 rounded font-mono text-sm">
                  https://lzhgyyihnsqwcbsdsdxs.supabase.co
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">API Key:</h4>
                <div className="bg-gray-100 p-2 rounded font-mono text-sm">
                  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Environment:</h4>
                <Badge variant="outline">
                  {window.location.hostname.includes('vercel') ? 'Vercel Production' : 
                   window.location.hostname === 'localhost' ? 'Local Development' : 'Unknown'}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Current URL:</h4>
                <div className="bg-gray-100 p-2 rounded font-mono text-sm break-all">
                  {window.location.origin}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-6">
          <p>🔍 This page helps diagnose Supabase connectivity issues on your Vercel deployment</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTest;
