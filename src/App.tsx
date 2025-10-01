import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HeadOfMerchandiserDashboard from "./components/dashboards/HeadOfMerchandiserDashboard";
import HeadOfProductionDashboard from "./components/dashboards/HeadOfProductionDashboard";
import { HodPrepressDashboard } from "./components/dashboards/HodPrepressDashboard";
import { DesignerDashboard as LegacyDesignerDashboard } from "./components/dashboards/DesignerDashboard";
import { AdminMonitoringDashboard } from "./components/dashboards/AdminMonitoringDashboard";
import { RealTimeJobLifecycleDashboard } from "./components/advanced/RealTimeJobLifecycleDashboard";
import HODPrepressDashboard from "./components/prepress/HODPrepressDashboard";
import DesignerWorkbench from "./components/prepress/DesignerWorkbench";
import ModernHODPrepressDashboard from "./components/prepress/ModernHODPrepressDashboard";
import ModernDesignerWorkbench from "./components/prepress/ModernDesignerWorkbench";
import DesignerDashboard from "./components/designer/DesignerDashboard";
import HODDesignerDashboard from "./components/hod/HODDesignerDashboard";
import QADashboard from "./components/qa/QADashboard";
import CTPDashboard from "./components/ctp/CTPDashboard";
import JobManagementDashboard from "./components/jobs/JobManagementDashboard";
import MerchandiserDashboard from "./components/dashboards/MerchandiserDashboard";
import JobManagementModule from "./components/modules/JobManagementModule";
import JobDashboard from "./components/advanced/JobDashboard";
import JobLifecycleTracker from "./components/advanced/JobLifecycleTracker";
import JobWorkflowVisualizer from "./components/advanced/JobWorkflowVisualizer";
import JobLifecycleDemo from "./pages/JobLifecycleDemo";
import PrepressDemo from "./pages/PrepressDemo";
import InventoryModule from "./components/modules/InventoryModule";
import ProductionDashboard from "./components/production/ProductionDashboard";
import { SocketProvider } from "./services/socketService.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SocketProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Role-specific dashboards */}
            <Route path="/merchandiser/head" element={<HeadOfMerchandiserDashboard />} />
            <Route path="/production/head" element={<HeadOfProductionDashboard />} />
            
            {/* New Enhanced Prepress Dashboards */}
            <Route path="/prepress/hod" element={<HodPrepressDashboard />} />
            <Route path="/prepress/designer" element={<LegacyDesignerDashboard />} />
            
            {/* Real-Time Job Lifecycle Dashboard */}
            <Route path="/jobs/lifecycle/realtime" element={<RealTimeJobLifecycleDashboard />} />
            
            {/* Admin Monitoring Dashboard */}
            <Route path="/admin/monitoring" element={<AdminMonitoringDashboard />} />
            
            {/* Legacy Prepress Dashboards */}
            <Route path="/prepress/hod/legacy" element={<HODPrepressDashboard />} />
            <Route path="/prepress/designer/legacy" element={<DesignerWorkbench />} />
            
            {/* Modern Prepress Dashboards */}
            <Route path="/prepress/hod/modern" element={<ModernHODPrepressDashboard />} />
            <Route path="/prepress/designer/modern" element={<ModernDesignerWorkbench />} />
            
            {/* New Job Assignment System */}
            <Route path="/designer/dashboard" element={<DesignerDashboard />} />
            <Route path="/hod/designer/dashboard" element={<HODDesignerDashboard />} />
            <Route path="/qa/dashboard" element={<QADashboard />} />
            <Route path="/ctp/dashboard" element={<CTPDashboard onLogout={() => {}} onNavigate={() => {}} />} />
            <Route path="/jobs/management" element={<JobManagementDashboard />} />
            <Route path="/merchandiser/dashboard" element={<MerchandiserDashboard />} />
            
            {/* Job Lifecycle Management Routes */}
            <Route path="/jobs" element={<JobManagementModule />} />
            <Route path="/jobs/dashboard" element={<JobDashboard />} />
            <Route path="/jobs/lifecycle" element={<JobLifecycleTracker />} />
            <Route path="/jobs/workflow" element={<JobWorkflowVisualizer stages={[]} />} />
            <Route path="/jobs/demo" element={<JobLifecycleDemo />} />
            <Route path="/prepress/demo" element={<PrepressDemo />} />
            
            {/* Inventory Management Routes */}
            <Route path="/inventory" element={<InventoryModule />} />
            <Route path="/inventory/dashboard" element={<InventoryModule />} />
            
            {/* Production System Routes */}
            <Route path="/production" element={<ProductionDashboard />} />
            <Route path="/production/dashboard" element={<ProductionDashboard />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
