import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Package, 
  ClipboardCheck, 
  TrendingUp,
  ShoppingCart,
  BarChart3,
  AlertTriangle,
  Settings,
  RefreshCw
} from 'lucide-react';
import InventoryDashboard from '../inventory/InventoryDashboard';
import JobAcceptanceInterface from '../inventory/JobAcceptanceInterface';
import StockManagement from '../inventory/StockManagement';
import PurchaseRequestManagement from '../inventory/PurchaseRequestManagement';

interface InventoryModuleProps {
  className?: string;
}

export default function InventoryModule({ className = '' }: InventoryModuleProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertsCount, setAlertsCount] = useState(5); // This would come from real data
  const [pendingJobsCount, setPendingJobsCount] = useState(8); // This would come from real data
  const [pendingRequestsCount, setPendingRequestsCount] = useState(3); // This would come from real data

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="h-4 w-4" />,
      component: <InventoryDashboard />
    },
    {
      id: 'job-acceptance',
      label: 'Job Acceptance',
      icon: <ClipboardCheck className="h-4 w-4" />,
      badge: pendingJobsCount > 0 ? pendingJobsCount.toString() : undefined,
      component: <JobAcceptanceInterface />
    },
    {
      id: 'stock-management',
      label: 'Stock Management',
      icon: <Package className="h-4 w-4" />,
      badge: alertsCount > 0 ? alertsCount.toString() : undefined,
      component: <StockManagement />
    },
    {
      id: 'purchase-requests',
      label: 'Purchase Requests',
      icon: <ShoppingCart className="h-4 w-4" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount.toString() : undefined,
      component: <PurchaseRequestManagement />
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: <TrendingUp className="h-4 w-4" />,
      component: <InventoryReports />
    }
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                <p className="text-sm text-gray-600">Smart inventory control with job-based material allocation</p>
              </div>
            </div>
            
            {/* Quick Status Indicators */}
            <div className="hidden lg:flex items-center space-x-4 ml-8">
              {alertsCount > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-red-50 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">{alertsCount} Alerts</span>
                </div>
              )}
              
              {pendingJobsCount > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-50 rounded-full">
                  <ClipboardCheck className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">{pendingJobsCount} Pending Jobs</span>
                </div>
              )}
              
              {pendingRequestsCount > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">{pendingRequestsCount} Purchase Requests</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-lg border p-1">
            <TabsList className="grid w-full grid-cols-5 bg-transparent">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="relative flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <div className="bg-white rounded-lg border">
                <div className="p-6">
                  {tab.component}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// Placeholder component for Reports & Analytics
function InventoryReports() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">Comprehensive inventory insights and reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stock Valuation Report */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Stock Valuation</h3>
              <p className="text-sm text-muted-foreground">Current inventory value analysis</p>
            </div>
          </div>
          <Button className="w-full">Generate Report</Button>
        </div>

        {/* Movement Analysis */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">Movement Analysis</h3>
              <p className="text-sm text-muted-foreground">Stock in/out trends and patterns</p>
            </div>
          </div>
          <Button className="w-full">Generate Report</Button>
        </div>

        {/* Procurement Analytics */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <ShoppingCart className="h-8 w-8 text-purple-500" />
            <div>
              <h3 className="text-lg font-semibold">Procurement Analytics</h3>
              <p className="text-sm text-muted-foreground">Purchase patterns and supplier performance</p>
            </div>
          </div>
          <Button className="w-full">Generate Report</Button>
        </div>

        {/* Job Material Efficiency */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardCheck className="h-8 w-8 text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold">Job Efficiency</h3>
              <p className="text-sm text-muted-foreground">Material allocation vs actual usage</p>
            </div>
          </div>
          <Button className="w-full">Generate Report</Button>
        </div>

        {/* ABC Analysis */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold">ABC Analysis</h3>
              <p className="text-sm text-muted-foreground">Material classification by value/usage</p>
            </div>
          </div>
          <Button className="w-full">Generate Report</Button>
        </div>

        {/* Custom Reports */}
        <div className="p-6 border rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="h-8 w-8 text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold">Custom Reports</h3>
              <p className="text-sm text-muted-foreground">Build your own inventory reports</p>
            </div>
          </div>
          <Button className="w-full" variant="outline">Configure</Button>
        </div>
      </div>
    </div>
  );
}
