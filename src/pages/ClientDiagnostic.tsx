import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '../hooks/useSession';
import { useSupabaseClients } from '../hooks/useSupabaseClients';
import { useCompany } from '../contexts/CompanyContext';
import { CheckCircle, XCircle, AlertTriangle, Bug, Database, Home, Download, RefreshCw } from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  error?: any;
  timestamp: string;
  recommendation?: string;
}

const ClientDiagnostic = () => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSession();
  const { selectedCompany, companies, loading: companyLoading } = useCompany();
  const { clients, loading: clientsLoading } = useSupabaseClients();
  
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({
    total: 10,
    passed: 0,
    failed: 0,
    warnings: 0,
    pending: 0
  });

  const addTestResult = (
    id: string,
    name: string,
    status: 'pending' | 'success' | 'warning' | 'error',
    message: string,
    details?: any,
    error?: any,
    recommendation?: string
  ) => {
    const result: TestResult = {
      id,
      name,
      status,
      message,
      details,
      error,
      timestamp: new Date().toISOString(),
      recommendation
    };

    setTestResults(prev => {
      const updated = prev.filter(r => r.id !== id);
      return [...updated, result];
    });
  };

  const updateSummary = () => {
    const passed = testResults.filter(r => r.status === 'success').length;
    const failed = testResults.filter(r => r.status === 'error').length;
    const warnings = testResults.filter(r => r.status === 'warning').length;
    const pending = testResults.filter(r => r.status === 'pending').length;
    
    setSummary({ total: 10, passed, failed, warnings, pending });
  };

  useEffect(() => {
    updateSummary();
  }, [testResults]);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🚀 Starting comprehensive client diagnostic...');

    // Test 1: Authentication Deep Dive
    await test1_AuthenticationDeepDive();
    
    // Test 2: Supabase Client Configuration
    await test2_SupabaseClientConfig();
    
    // Test 3: Company Context Analysis
    await test3_CompanyContextAnalysis();
    
    // Test 4: Client Table Direct Access
    await test4_ClientTableDirectAccess();
    
    // Test 5: RLS Policy Analysis
    await test5_RLSPolicyAnalysis();
    
    // Test 6: useSupabaseClients Hook Test
    await test6_UseSupabaseClientsHook();
    
    // Test 7: Network Layer Inspection
    await test7_NetworkLayerInspection();
    
    // Test 8: Database Schema Validation
    await test8_DatabaseSchemaValidation();
    
    // Test 9: User Permissions Deep Dive
    await test9_UserPermissionsDeepDive();
    
    // Test 10: End-to-End Client Loading
    await test10_EndToEndClientLoading();

    setIsRunning(false);
    console.log('✅ All diagnostic tests completed');
  };

  const test1_AuthenticationDeepDive = async () => {
    addTestResult('test1', '1. Authentication Deep Dive', 'pending', 'Testing authentication status...');
    
    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addTestResult('test1', '1. Authentication Deep Dive', 'error', 
          'Session error detected', { sessionError }, sessionError,
          'Check Supabase configuration and network connectivity');
        return;
      }
      
      if (!session) {
        addTestResult('test1', '1. Authentication Deep Dive', 'warning', 
          'No active session found', null, null,
          'User needs to log in to access client data');
        return;
      }

      // Check user details
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      const details = {
        hasSession: !!session,
        sessionUser: session.user?.email,
        userId: session.user?.id,
        emailConfirmed: session.user?.email_confirmed_at,
        accessToken: session.access_token ? 'Present' : 'Missing',
        refreshToken: session.refresh_token ? 'Present' : 'Missing',
        tokenExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'Unknown',
        userFromGet: user?.email,
        isOfir: session.user?.email === 'ofir.wienerman@gmail.com'
      };

      if (userError) {
        addTestResult('test1', '1. Authentication Deep Dive', 'warning', 
          'Session exists but user fetch failed', details, userError,
          'Session may be expired or invalid');
      } else {
        addTestResult('test1', '1. Authentication Deep Dive', 'success', 
          `Authenticated as ${session.user.email}`, details);
      }
    } catch (error) {
      addTestResult('test1', '1. Authentication Deep Dive', 'error', 
        'Authentication test failed', null, error,
        'Check Supabase client initialization');
    }
  };

  const test2_SupabaseClientConfig = async () => {
    addTestResult('test2', '2. Supabase Client Configuration', 'pending', 'Checking Supabase configuration...');
    
    try {
      const config = {
        supabaseUrl: 'https://lzhgyyihnsqwcbsdsdxs.supabase.co',
        hasApiKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        environment: import.meta.env.MODE,
        currentUrl: window.location.origin,
        isVercel: window.location.hostname.includes('vercel'),
        isLocalhost: window.location.hostname === 'localhost'
      };

      // Test basic connectivity
      const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        addTestResult('test2', '2. Supabase Client Configuration', 'success', 
          'Supabase client configured correctly', config);
      } else {
        addTestResult('test2', '2. Supabase Client Configuration', 'error', 
          `HTTP ${response.status}: ${response.statusText}`, config, null,
          'Check API keys and network connectivity');
      }
    } catch (error) {
      addTestResult('test2', '2. Supabase Client Configuration', 'error', 
        'Failed to test Supabase connectivity', null, error,
        'Check network connection and Supabase configuration');
    }
  };

  const test3_CompanyContextAnalysis = async () => {
    addTestResult('test3', '3. Company Context Analysis', 'pending', 'Analyzing company context...');
    
    try {
      const contextDetails = {
        selectedCompany: selectedCompany ? { id: selectedCompany.id, name: selectedCompany.name } : null,
        companiesCount: companies?.length || 0,
        companies: companies?.map(c => ({ id: c.id, name: c.name, active: c.active })) || [],
        companyLoading,
        userEmail: user?.email,
        isOfir: user?.email === 'ofir.wienerman@gmail.com'
      };

      if (companyLoading) {
        addTestResult('test3', '3. Company Context Analysis', 'pending', 
          'Companies still loading...', contextDetails);
        return;
      }

      if (!companies || companies.length === 0) {
        addTestResult('test3', '3. Company Context Analysis', 'error', 
          'No companies found for user', contextDetails, null,
          'Check if user has company access or create a company');
        return;
      }

      if (!selectedCompany) {
        addTestResult('test3', '3. Company Context Analysis', 'warning', 
          'Companies loaded but none selected', contextDetails, null,
          'Company auto-selection may have failed');
        return;
      }

      addTestResult('test3', '3. Company Context Analysis', 'success', 
        `Company context ready: ${selectedCompany.name}`, contextDetails);
    } catch (error) {
      addTestResult('test3', '3. Company Context Analysis', 'error', 
        'Company context analysis failed', null, error,
        'Check CompanyProvider and useCompanies hook');
    }
  };

  const test4_ClientTableDirectAccess = async () => {
    addTestResult('test4', '4. Client Table Direct Access', 'pending', 'Testing direct client table access...');
    
    try {
      // Test table existence with a simple count query
      const { data, error, count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      if (error) {
        addTestResult('test4', '4. Client Table Direct Access', 'error', 
          'Client table access failed', { error, sqlCode: error.code }, error,
          'Check RLS policies and table permissions');
        return;
      }

      // Test with user filtering
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userClients, error: userError } = await supabase
          .from('clients')
          .select('id, company_name, created_at')
          .eq('user_id', session.user.id)
          .limit(5);

        const details = {
          tableExists: true,
          totalRowsEstimate: count,
          userSpecificQuery: !userError,
          userClientsCount: userClients?.length || 0,
          userClients: userClients || [],
          userId: session.user.id
        };

        if (userError) {
          addTestResult('test4', '4. Client Table Direct Access', 'warning', 
            'Table exists but user filtering failed', details, userError,
            'RLS policies may be blocking user access');
        } else {
          addTestResult('test4', '4. Client Table Direct Access', 'success', 
            `Direct access successful: ${userClients?.length || 0} user clients found`, details);
        }
      } else {
        addTestResult('test4', '4. Client Table Direct Access', 'warning', 
          'Table accessible but no user context', { tableExists: true, totalRowsEstimate: count },
          null, 'User must be authenticated for filtered access');
      }
    } catch (error) {
      addTestResult('test4', '4. Client Table Direct Access', 'error', 
        'Table access test failed', null, error,
        'Check if clients table exists and user has basic access');
    }
  };

  const test5_RLSPolicyAnalysis = async () => {
    addTestResult('test5', '5. RLS Policy Analysis', 'pending', 'Analyzing Row Level Security policies...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        addTestResult('test5', '5. RLS Policy Analysis', 'warning', 
          'Cannot test RLS without authentication', null, null,
          'Authenticate first to test RLS policies');
        return;
      }

      // Test different access scenarios
      const tests = [];

      // Test 1: Select with user_id filter
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', session.user.id);
        tests.push({ name: 'user_id filter', success: !error, error, count: data?.length });
      } catch (e) {
        tests.push({ name: 'user_id filter', success: false, error: e });
      }

      // Test 2: Select without filter (should be blocked by RLS)
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id');
        tests.push({ name: 'no filter', success: !error, error, count: data?.length });
      } catch (e) {
        tests.push({ name: 'no filter', success: false, error: e });
      }

      // Test 3: Insert attempt
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            company_name: 'TEST_COMPANY_DELETE_ME',
            address: 'Test',
            city: 'Test',
            country: 'Test',
            user_id: session.user.id
          })
          .select();
        
        // Clean up test record if successful
        if (data && data.length > 0) {
          await supabase.from('clients').delete().eq('id', data[0].id);
        }
        
        tests.push({ name: 'insert test', success: !error, error });
      } catch (e) {
        tests.push({ name: 'insert test', success: false, error: e });
      }

      const details = {
        userId: session.user.id,
        userEmail: session.user.email,
        tests,
        recommendations: []
      };

      const successfulTests = tests.filter(t => t.success).length;
      
      if (successfulTests === 0) {
        addTestResult('test5', '5. RLS Policy Analysis', 'error', 
          'All RLS tests failed - no access granted', details, null,
          'RLS policies are blocking all access. Check policy configuration.');
      } else if (successfulTests < tests.length) {
        addTestResult('test5', '5. RLS Policy Analysis', 'warning', 
          `${successfulTests}/${tests.length} RLS tests passed`, details, null,
          'Some RLS policies working, others may need adjustment');
      } else {
        addTestResult('test5', '5. RLS Policy Analysis', 'success', 
          'All RLS tests passed', details);
      }
    } catch (error) {
      addTestResult('test5', '5. RLS Policy Analysis', 'error', 
        'RLS analysis failed', null, error,
        'Check database connection and authentication');
    }
  };

  const test6_UseSupabaseClientsHook = async () => {
    addTestResult('test6', '6. useSupabaseClients Hook Test', 'pending', 'Testing useSupabaseClients hook...');
    
    try {
      const hookDetails = {
        clientsLoading,
        clientsCount: clients?.length || 0,
        clients: clients?.slice(0, 3).map(c => ({ 
          id: c.id, 
          company_name: c.company_name,
          created_at: c.created_at 
        })) || [],
        selectedCompany: selectedCompany ? { id: selectedCompany.id, name: selectedCompany.name } : null
      };

      if (clientsLoading) {
        addTestResult('test6', '6. useSupabaseClients Hook Test', 'pending', 
          'Hook still loading...', hookDetails);
        return;
      }

      if (!clients || clients.length === 0) {
        addTestResult('test6', '6. useSupabaseClients Hook Test', 'warning', 
          'Hook loaded but no clients returned', hookDetails, null,
          'Either no clients exist or hook has filtering issues');
      } else {
        addTestResult('test6', '6. useSupabaseClients Hook Test', 'success', 
          `Hook working: ${clients.length} clients loaded`, hookDetails);
      }
    } catch (error) {
      addTestResult('test6', '6. useSupabaseClients Hook Test', 'error', 
        'Hook test failed', { clientsLoading, error }, error,
        'Check useSupabaseClients implementation');
    }
  };

  const test7_NetworkLayerInspection = async () => {
    addTestResult('test7', '7. Network Layer Inspection', 'pending', 'Inspecting network requests...');
    
    try {
      const startTime = performance.now();
      
      // Test direct API call
      const response = await fetch('https://lzhgyyihnsqwcbsdsdxs.supabase.co/rest/v1/clients?select=count', {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const networkDetails: any = {
        responseTime: `${responseTime}ms`,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      };

      if (response.ok) {
        const data = await response.text();
        networkDetails.responsePreview = data.substring(0, 200);
        
        addTestResult('test7', '7. Network Layer Inspection', 'success', 
          `Network connectivity good (${responseTime}ms)`, networkDetails);
      } else {
        addTestResult('test7', '7. Network Layer Inspection', 'error', 
          `HTTP ${response.status}: ${response.statusText}`, networkDetails, null,
          'Check API keys and Supabase service status');
      }
    } catch (error) {
      addTestResult('test7', '7. Network Layer Inspection', 'error', 
        'Network request failed', null, error,
        'Check internet connection and firewall settings');
    }
  };

  const test8_DatabaseSchemaValidation = async () => {
    addTestResult('test8', '8. Database Schema Validation', 'pending', 'Validating database schema...');
    
    try {
      // Check if we can describe the table structure (this might not work with RLS)
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        addTestResult('test8', '8. Database Schema Validation', 'warning', 
          'Table exists but empty or no permission', { error }, error,
          'Table structure cannot be validated - may be empty or restricted');
        return;
      }

      if (error) {
        addTestResult('test8', '8. Database Schema Validation', 'error', 
          'Schema validation failed', { error }, error,
          'Table may not exist or have incorrect structure');
        return;
      }

      const schemaDetails = {
        tableExists: true,
        sampleRecord: data && data.length > 0 ? Object.keys(data[0]) : [],
        hasUserIdColumn: data && data.length > 0 ? 'user_id' in data[0] : 'unknown',
        hasCompanyNameColumn: data && data.length > 0 ? 'company_name' in data[0] : 'unknown'
      };

      addTestResult('test8', '8. Database Schema Validation', 'success', 
        'Database schema appears valid', schemaDetails);
    } catch (error) {
      addTestResult('test8', '8. Database Schema Validation', 'error', 
        'Schema validation failed', null, error,
        'Check table existence and basic structure');
    }
  };

  const test9_UserPermissionsDeepDive = async () => {
    addTestResult('test9', '9. User Permissions Deep Dive', 'pending', 'Analyzing user permissions...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        addTestResult('test9', '9. User Permissions Deep Dive', 'warning', 
          'No user context for permissions check', null, null,
          'User must be authenticated');
        return;
      }

      const permissionDetails: any = {
        userId: session.user.id,
        userEmail: session.user.email,
        isOfir: session.user.email === 'ofir.wienerman@gmail.com',
        emailConfirmed: !!session.user.email_confirmed_at,
        userMetadata: session.user.user_metadata,
        appMetadata: session.user.app_metadata
      };

      // Check profile table
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        permissionDetails.profile = profile;
        permissionDetails.profileError = profileError;
      } catch (e) {
        permissionDetails.profileException = e;
      }

      // Check company memberships
      try {
        const { data: memberships, error: membershipError } = await supabase
          .from('company_users')
          .select('*')
          .eq('user_id', session.user.id);

        permissionDetails.memberships = memberships;
        permissionDetails.membershipError = membershipError;
      } catch (e) {
        permissionDetails.membershipException = e;
      }

      if (session.user.email === 'ofir.wienerman@gmail.com') {
        addTestResult('test9', '9. User Permissions Deep Dive', 'success', 
          'Root admin user - should have full access', permissionDetails);
      } else {
        addTestResult('test9', '9. User Permissions Deep Dive', 'success', 
          'User permissions analyzed', permissionDetails);
      }
    } catch (error) {
      addTestResult('test9', '9. User Permissions Deep Dive', 'error', 
        'Permissions analysis failed', null, error,
        'Check user authentication and profile setup');
    }
  };

  const test10_EndToEndClientLoading = async () => {
    addTestResult('test10', '10. End-to-End Client Loading', 'pending', 'Testing complete client loading flow...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        addTestResult('test10', '10. End-to-End Client Loading', 'error', 
          'Cannot test without authentication', null, null,
          'User must be logged in');
        return;
      }

      // Step 1: Query clients exactly like useSupabaseClients hook
      const { data: rawClients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const flowDetails = {
        step1_auth: { success: true, userId: session.user.id, email: session.user.email },
        step2_query: { 
          success: !clientsError, 
          error: clientsError,
          rawClientsCount: rawClients?.length || 0,
          rawClients: rawClients?.slice(0, 2) || []
        },
        step3_formatting: { success: false, formattedClients: [] },
        step4_state: { 
          hookClientsCount: clients?.length || 0,
          hookLoading: clientsLoading
        }
      };

      if (clientsError) {
        addTestResult('test10', '10. End-to-End Client Loading', 'error', 
          'Client query failed in end-to-end test', flowDetails, clientsError,
          'RLS policies or table access issues');
        return;
      }

      // Step 3: Format clients like the hook does
      try {
        const formattedClients = (rawClients || []).map(client => ({
          id: client.id,
          company_name: client.company_name,
          companyName: client.company_name,
          contact_name: client.contact_name,
          contactName: client.contact_name,
          address: client.address,
          city: client.city,
          country: client.country
        }));

        flowDetails.step3_formatting = { 
          success: true, 
          formattedClients: formattedClients.slice(0, 2) 
        };

        const summary = {
          endToEndSuccess: true,
          totalClients: rawClients.length,
          hookMatches: clients?.length === rawClients.length,
          allStepsSuccess: true
        };

        addTestResult('test10', '10. End-to-End Client Loading', 'success', 
          `Complete flow successful: ${rawClients.length} clients loaded`, 
          { ...flowDetails, summary });
      } catch (formatError) {
        (flowDetails.step3_formatting as any) = { success: false, error: formatError };
        addTestResult('test10', '10. End-to-End Client Loading', 'error', 
          'Client formatting failed', flowDetails, formatError,
          'Check client data structure and formatting logic');
      }
    } catch (error) {
      addTestResult('test10', '10. End-to-End Client Loading', 'error', 
        'End-to-end test failed', null, error,
        'Check complete client loading pipeline');
    }
  };

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary,
      userContext: {
        email: user?.email,
        isAuthenticated: !!user,
        selectedCompany: selectedCompany?.name,
        companiesCount: companies?.length
      },
      testResults: testResults.map(result => ({
        ...result,
        details: JSON.stringify(result.details, null, 2),
        error: result.error ? JSON.stringify(result.error, null, 2) : null
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'pending': return <div className="h-5 w-5 rounded-full bg-blue-300 animate-pulse" />;
      default: return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'pending': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Auto-run tests on page load
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bug className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🔍 Client Loading Diagnostic</h1>
                <p className="text-gray-600">Comprehensive analysis of client loading issues</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button onClick={exportResults} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
              <Button onClick={() => navigate('/')} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
              <div className="text-sm text-gray-600">Passed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
              <div className="text-sm text-gray-600">Warnings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        <div className="space-y-4">
          {testResults.map((result) => (
            <Card key={result.id} className={`border-2 ${getStatusColor(result.status)}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    {result.name}
                  </div>
                  <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                    {result.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{result.message}</p>
                
                {result.recommendation && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="text-sm font-semibold text-blue-800 mb-1">💡 Recommendation:</div>
                    <div className="text-sm text-blue-700">{result.recommendation}</div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mb-2">
                  Time: {new Date(result.timestamp).toLocaleTimeString()}
                </div>

                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm font-semibold cursor-pointer text-gray-700 hover:text-gray-900">
                      View Details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 rounded font-mono text-xs overflow-x-auto">
                      <pre>{JSON.stringify(result.details, null, 2)}</pre>
                    </div>
                  </details>
                )}

                {result.error && (
                  <details className="mt-2">
                    <summary className="text-sm font-semibold cursor-pointer text-red-700 hover:text-red-900">
                      View Error Details
                    </summary>
                    <div className="mt-2 p-3 bg-red-100 rounded font-mono text-xs overflow-x-auto">
                      <pre>{JSON.stringify(result.error, null, 2)}</pre>
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {testResults.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Click "Run All Tests" to start comprehensive diagnostic</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>🔧 This diagnostic tool runs 10 comprehensive tests to identify client loading issues</p>
        </div>
      </div>
    </div>
  );
};

export default ClientDiagnostic;
