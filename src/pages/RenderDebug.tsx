import React, { useState, useEffect } from 'react';
import InvoiceForm from '../components/InvoiceForm';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvoiceData } from '../types/invoice';
import { Client } from '../types/client';
import { Service } from '../types/service';
import { useSupabaseInvoices } from '../hooks/useSupabaseInvoices';
import { useLanguage } from '../hooks/useLanguage';
import { CompanyProvider } from '../contexts/CompanyContext';
import CompanySelector from '../components/CompanySelector';
import { AlertTriangle, Bug, RefreshCw, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const RenderDebug = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [debugStats, setDebugStats] = useState({
    pageRenders: 0,
    lastRenderTime: new Date().toISOString(),
    renderTriggers: [] as string[]
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const { saveInvoice } = useSupabaseInvoices();

  // Track page renders
  const renderCountRef = React.useRef(0);
  renderCountRef.current += 1;

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Only update debug stats once when user is authenticated, not on every render
      setDebugStats(prev => ({
        ...prev,
        renderTriggers: [...prev.renderTriggers, 'User authenticated - Debug mode active'].slice(-10)
      }));
    }
  }, [user]); // Only run when user changes, not on every render

  // Track renders only on user authentication, not continuously
  useEffect(() => {
    if (user) {
      setDebugStats(prev => ({
        ...prev,
        pageRenders: 1, // Start with 1 when user is authenticated
        lastRenderTime: new Date().toISOString()
      }));
    }
  }, [user]);

  const handleInvoiceGenerated = async (invoice: InvoiceData) => {
    try {
      await saveInvoice(invoice);
      console.log('✅ DEBUG: Invoice saved successfully to Supabase');
      setDebugStats(prev => ({
        ...prev,
        renderTriggers: [...prev.renderTriggers, 'Invoice generated successfully'].slice(-10)
      }));
    } catch (error) {
      console.error('❌ DEBUG: Failed to save invoice:', error);
      setDebugStats(prev => ({
        ...prev,
        renderTriggers: [...prev.renderTriggers, `Invoice save failed: ${error}`].slice(-10)
      }));
    }
  };

  const resetDebugStats = () => {
    renderCountRef.current = 0;
    setDebugStats({
      pageRenders: 0,
      lastRenderTime: new Date().toISOString(),
      renderTriggers: ['Debug stats reset']
    });
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Debug Environment...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-red-50 border border-red-300 rounded-lg p-6">
            <Bug className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-4">Authentication Required</h2>
            <p className="text-red-700 mb-4">
              The Render Debug environment requires authentication to access real Supabase data.
              Please login to continue.
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              Login to Continue
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full mt-2"
            >
              Back to Main App
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CompanyProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Debug Header */}
        <div className="bg-red-600 text-white p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="h-6 w-6" />
                <h1 className="text-xl font-bold">Render Debug Environment</h1>
                <Badge variant="secondary" className="bg-red-700 text-white">
                  DEVELOPMENT ONLY
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDebugStats}
                  className="text-red-600 border-white hover:bg-red-700 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset Stats
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-red-600 border-white hover:bg-red-700 hover:text-white"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Back to Main
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Stats Panel */}
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-yellow-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">Page Renders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-900">{debugStats.pageRenders}</div>
                  <div className="text-xs text-yellow-600">Current session</div>
                </CardContent>
              </Card>

              <Card className="border-yellow-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">Last Render</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs font-mono text-yellow-900">
                    {new Date(debugStats.lastRenderTime).toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-yellow-600">Latest update</div>
                </CardContent>
              </Card>

              <Card className="border-yellow-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">Client Selected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-yellow-900">
                    {selectedClient ? selectedClient.company_name || 'Yes' : 'None'}
                  </div>
                  <div className="text-xs text-yellow-600">Current state</div>
                </CardContent>
              </Card>

              <Card className="border-yellow-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-800">Service Selected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-yellow-900">
                    {selectedService ? selectedService.name || 'Yes' : 'None'}
                  </div>
                  <div className="text-xs text-yellow-600">Current state</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Recent Render Triggers */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Recent Render Triggers</h3>
            <div className="flex flex-wrap gap-2">
              {debugStats.renderTriggers.map((trigger, index) => (
                <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                  {trigger}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="max-w-6xl mx-auto">
            <CompanySelector 
              onManageCompanies={() => console.log('DEBUG: Manage companies clicked')}
              onManageUsers={() => console.log('DEBUG: Manage users clicked')}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-100 border-l-4 border-blue-500 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
              <div>
                <p className="text-blue-700 font-medium">Debug Environment Active</p>
                <p className="text-blue-600 text-sm">
                  This is a specialized version of the invoice page for debugging render issues. 
                  All functionality is identical to production with enhanced monitoring capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content - Invoice Form with Debug Monitoring */}
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Form - Debug Mode</h2>
            <p className="text-gray-600">
              The form below is identical to the production version but with enhanced debug monitoring.
              Watch the debug panel above for render statistics and triggers.
            </p>
          </div>

          <InvoiceForm 
            onInvoiceGenerated={handleInvoiceGenerated}
            selectedClient={selectedClient}
            selectedService={selectedService}
            onClientClear={() => {
              setSelectedClient(null);
              setDebugStats(prev => ({
                ...prev,
                renderTriggers: [...prev.renderTriggers, 'Client cleared'].slice(-10)
              }));
            }}
            onServiceClear={() => {
              setSelectedService(null);
              setDebugStats(prev => ({
                ...prev,
                renderTriggers: [...prev.renderTriggers, 'Service cleared'].slice(-10)
              }));
            }}
            onSelectClient={() => {
              console.log('DEBUG: Select client clicked');
              setDebugStats(prev => ({
                ...prev,
                renderTriggers: [...prev.renderTriggers, 'Select client clicked'].slice(-10)
              }));
            }}
            setCurrentView={(view) => {
              console.log('DEBUG: View changed to:', view);
              setDebugStats(prev => ({
                ...prev,
                renderTriggers: [...prev.renderTriggers, `View changed to ${view}`].slice(-10)
              }));
            }}
          />
        </div>

        {/* Debug Footer */}
        <div className="bg-gray-800 text-white p-4 mt-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">
                  🐛 Render Debug Environment | Monitor infinite render loops and performance issues
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  This environment helps identify and fix rendering problems in the invoice form
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-gray-400">
                  Authenticated: {user?.email}
                </div>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/auth');
                  }}
                  className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CompanyProvider>
  );
};

export default RenderDebug;
