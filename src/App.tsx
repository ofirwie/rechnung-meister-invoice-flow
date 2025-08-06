// 🚫 CRITICAL: NO LOCALHOST TESTING - USE DEPLOYED ENVIRONMENT ONLY
// 🐛 ALWAYS CREATE DEBUG SCREENS - NEVER GUESS PROBLEMS
// 🔧 CRITICAL FIX: Removed GlobalDebugPanel causing infinite render loop

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CompanyProvider } from "./contexts/SimpleCompanyContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RenderLoopDiagnostic from "./pages/RenderLoopDiagnostic";
import ComponentIsolationDiagnostic from "./pages/ComponentIsolationDiagnostic";
import ClientSelectionDiagnostic from "./pages/ClientSelectionDiagnostic";
import DatabaseDiagnostic from "./pages/DatabaseDiagnostic";
import WhiteScreenDiagnostic from "./pages/WhiteScreenDiagnostic";
import SimpleWhiteScreenDebug from "./pages/SimpleWhiteScreenDebug";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <CompanyProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/debug-render-loop" element={<RenderLoopDiagnostic />} />
              <Route path="/debug-components" element={<ComponentIsolationDiagnostic />} />
              <Route path="/debug-clients" element={<ClientSelectionDiagnostic />} />
              <Route path="/debug-database" element={<DatabaseDiagnostic />} />
              <Route path="/debug-white-screen" element={<WhiteScreenDiagnostic />} />
              <Route path="/debug-simple" element={<SimpleWhiteScreenDebug />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CompanyProvider>
    </QueryClientProvider>
  );
};

export default App;
