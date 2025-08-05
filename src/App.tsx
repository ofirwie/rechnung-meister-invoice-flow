import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RenderDebug from "./pages/RenderDebug";
import DebugConsole from "./pages/DebugConsole";
import SupabaseTest from "./pages/SupabaseTest";
import { DebugScreen } from "./components/DebugScreen";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/auth" element={<Auth />} />
          <Route path="/debug" element={
            <ProtectedRoute>
              <DebugScreen />
            </ProtectedRoute>
          } />
          <Route path="/render-debug" element={
            <ProtectedRoute>
              <RenderDebug />
            </ProtectedRoute>
          } />
          <Route path="/debug-console" element={
            <ProtectedRoute>
              <DebugConsole />
            </ProtectedRoute>
          } />
          <Route path="/supabase-test" element={<SupabaseTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
