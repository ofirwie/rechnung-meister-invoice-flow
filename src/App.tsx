// 🚫 CRITICAL: NO LOCALHOST TESTING - USE DEPLOYED ENVIRONMENT ONLY
// 🐛 ALWAYS CREATE DEBUG SCREENS - NEVER GUESS PROBLEMS

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RenderLoopDiagnostic from "./pages/RenderLoopDiagnostic";
import { GlobalDebugPanel, useGlobalDebugPanel } from './components/GlobalDebugPanel';

const queryClient = new QueryClient();

const App = () => {
  const debugPanel = useGlobalDebugPanel();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/debug-render-loop" element={<RenderLoopDiagnostic />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        
        {/* Global Debug Panel - Toggle with Ctrl+Shift+D */}
        <GlobalDebugPanel 
          isVisible={debugPanel.isVisible} 
          onToggle={debugPanel.toggle} 
        />
        
        {/* Debug Panel Toggle Button (floating) */}
        {!debugPanel.isVisible && (
          <button
            onClick={debugPanel.show}
            className="fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 z-50 transition-colors"
            title="Open Debug Panel (Ctrl+Shift+D)"
          >
            🐛
          </button>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
