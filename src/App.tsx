// 🚫 CRITICAL: NO LOCALHOST TESTING - USE DEPLOYED ENVIRONMENT ONLY
// 🐛 ALWAYS CREATE DEBUG SCREENS - NEVER GUESS PROBLEMS
// 🔧 CRITICAL FIX: Removed GlobalDebugPanel causing infinite render loop

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RenderLoopDiagnostic from "./pages/RenderLoopDiagnostic";
import ComponentIsolationDiagnostic from "./pages/ComponentIsolationDiagnostic";

const queryClient = new QueryClient();

const App = () => {
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
            <Route path="/debug-components" element={<ComponentIsolationDiagnostic />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
