import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import StoreLoginPage from "./pages/StoreLoginPage";
import StoreDashboard from "./pages/StoreDashboard";
import DebugPage from "./pages/DebugPage";
import TestAssignOrderPage from "./pages/TestAssignOrderPage";
import QuickDiagnostic from "./pages/QuickDiagnostic";
import DataDiagnostic from "./pages/DataDiagnostic";
import TestEdgeFunctions from "./pages/TestEdgeFunctions";
import SimpleEdgeTest from "./pages/SimpleEdgeTest";
import ArabicTextTestPage from "./pages/ArabicTextTestPage";
import TestStoreCreator from "./pages/TestStoreCreator";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/home-space-stars94" element={<Index />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-aa-smn-justme9003" element={<AdminDashboard />} />
          <Route path="/store-login-space9003" element={<StoreLoginPage />} />
          <Route path="/store-dashboard" element={<StoreDashboard />} />
          <Route path="/debug-data" element={<DebugPage />} />
          <Route path="/test-assign-order" element={<TestAssignOrderPage />} />
          <Route path="/test-edge-functions" element={<TestEdgeFunctions />} />
          <Route path="/simple-edge-test" element={<SimpleEdgeTest />} />
          <Route path="/quick-diagnostic" element={<QuickDiagnostic />} />
          <Route path="/data-diagnostic" element={<DataDiagnostic />} />
          <Route path="/arabic-text-test" element={<ArabicTextTestPage />} />
          <Route path="/test-store-creator" element={<TestStoreCreator />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
