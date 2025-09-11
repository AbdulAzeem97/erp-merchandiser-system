import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Factory, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Filter,
  Calendar,
  Search,
  Bell,
  Settings,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  Award,
  FileText,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dashboardAPI, productsAPI, jobsAPI, authAPI } from '@/services/api';
import BackendStatusIndicator from '../BackendStatusIndicator';
import SmartSidebar from '../layout/SmartSidebar';

interface DashboardProps {
  onNavigateToProductForm: () => void;
  onNavigateToJobForm: (product?: any) => void;
  onNavigateToReports?: () => void;
  onNavigateToPrepressHOD?: () => void;
  onNavigateToPrepressDesigner?: () => void;
  onLogout?: () => void;
}

// Mock data for charts
const productionData = [
  { month: 'Jan', completed: 245, pending: 67, revenue: 125000 },
  { month: 'Feb', completed: 289, pending: 43, revenue: 145000 },
  { month: 'Mar', completed: 334, pending: 52, revenue: 167000 },
  { month: 'Apr', completed: 378, pending: 38, revenue: 189000 },
  { month: 'May', completed: 423, pending: 29, revenue: 211000 },
  { month: 'Jun', completed: 467, pending: 35, revenue: 234000 }
];

const departmentData = [
  { name: 'Printing', value: 35, color: '#3B82F6' },
  { name: 'Finishing', value: 25, color: '#10B981' },
  { name: 'Assembly', value: 20, color: '#F59E0B' },
  { name: 'Quality Control', value: 15, color: '#EF4444' },
  { name: 'Packaging', value: 5, color: '#8B5CF6' }
];

export const AdvancedDashboardWithSidebar: React.FC<DashboardProps> = ({ 
  onNavigateToProductForm, 
  onNavigateToJobForm,
  onNavigateToReports,
  onNavigateToPrepressHOD,
  onNavigateToPrepressDesigner,
  onLogout 
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState('6M');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('production');
  const [currentView, setCurrentView] = useState('dashboard');
  
  // Get current user role
  const currentUser = authAPI.getCurrentUser();
  const userRole = currentUser?.role;
  const [productsSummary, setProductsSummary] = useState({
    totalProducts: 0,
    activeProducts: 0,
    recentProducts: []
  });

  const [dashboardData, setDashboardData] = useState({
    overallStats: null,
    jobStatusStats: null,
    recentActivity: null,
    monthlyTrends: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load dashboard data from API
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      console.log('✅ Authentication token found');
      
      const [overallStats, jobStatusStats, recentActivity, monthlyTrends, productsStats] = await Promise.all([
        dashboardAPI.getOverallStats(),
        dashboardAPI.getJobStatusStats(),
        dashboardAPI.getRecentActivity(),
        dashboardAPI.getMonthlyTrends(),
        productsAPI.getStats()
      ]);

      console.log('✅ Dashboard data loaded successfully:', {
        overallStats,
        jobStatusStats,
        recentActivity,
        monthlyTrends,
        productsStats
      });

      console.log('📊 Products Stats Data:', productsStats);
      console.log('📊 Recent Activity Data:', recentActivity);
      console.log('📊 Overall Stats Data:', overallStats);

      setDashboardData({
        overallStats: overallStats.data || overallStats,
        jobStatusStats: jobStatusStats.data || jobStatusStats,
        recentActivity: recentActivity.data || recentActivity || [],
        monthlyTrends: monthlyTrends.data || monthlyTrends
      });

      setProductsSummary({
        totalProducts: productsStats.data?.total || productsStats?.total || 0,
        activeProducts: productsStats.data?.active || productsStats?.active || 0,
        recentProducts: productsStats.data?.recent || productsStats?.recent || []
      });

      console.log('📊 Products Summary Set:', {
        totalProducts: productsStats.data?.total || productsStats?.total || 0,
        activeProducts: productsStats.data?.active || productsStats?.active || 0,
        recentProducts: productsStats.data?.recent || productsStats?.recent || []
      });

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      // Fallback to mock data if API fails
      setDashboardData({
        overallStats: { total_products: 150, total_jobs: 89, total_companies: 25, total_users: 12 },
        jobStatusStats: [
          { status: 'In Progress', count: 45 },
          { status: 'Completed', count: 32 },
          { status: 'Pending', count: 12 }
        ],
        recentActivity: [
          {
            type: 'job',
            identifier: 'JC-001234',
            product_code: 'BR-00-139-A',
            status: 'In Progress',
            created_at: '2024-01-15T10:30:00Z',
            due_date: '2024-01-20T00:00:00Z',
            priority: 'High',
            progress: 75,
            product_name: 'Sample Brand',
            company_name: 'JCP Brand'
          }
        ],
        monthlyTrends: []
      });

      setProductsSummary({
        totalProducts: 150,
        activeProducts: 120,
        recentProducts: [
          {
            id: '1',
            product_item_code: 'BR-00-139-A',
            brand: 'Sample Brand',
            product_type: 'Box',
            material_name: 'C1S',
            gsm: '250 g/m²',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            product_item_code: 'BR-00-140-B',
            brand: 'Sample Brand',
            product_type: 'Bag',
            material_name: 'Kraft',
            gsm: '200 g/m²',
            created_at: '2024-01-18T14:20:00Z'
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    // Handle navigation based on view
    switch (view) {
      case 'products':
        onNavigateToProductForm();
        break;
      case 'jobs':
        onNavigateToJobForm();
        break;
      case 'reports':
        onNavigateToReports?.();
        break;
      case 'prepressHOD':
        onNavigateToPrepressHOD?.();
        break;
      case 'prepressDesigner':
        onNavigateToPrepressDesigner?.();
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'quality check': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    if (!date || date === 'Invalid Date') return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <SmartSidebar 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        userRole={userRole}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`p-4 sm:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base">
                Welcome back, <span className="font-semibold text-blue-600">{currentUser?.first_name || 'User'}</span>! 
                Here's what's happening today.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <BackendStatusIndicator />
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/jobs'}
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
              >
                <Factory className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Job Lifecycle</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={isLoading}
                className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-blue-300 transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </motion.div>

          {/* Modern KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="will-change-transform"
            >
              <div className="modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-caption text-blue-600/80 mb-2">Total Products</p>
                      <p className="text-display-3 font-bold text-slate-900 mb-1">
                        {dashboardData.overallStats?.total_products || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="status-success">Active inventory</div>
                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                      </div>
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="will-change-transform"
            >
              <div className="modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-caption text-emerald-600/80 mb-2">Total Jobs</p>
                      <p className="text-display-3 font-bold text-slate-900 mb-1">
                        {dashboardData.overallStats?.total_jobs || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="status-info">Production orders</div>
                        <Factory className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <Factory className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="will-change-transform"
            >
              <div className="modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-caption text-purple-600/80 mb-2">Companies</p>
                      <p className="text-display-3 font-bold text-slate-900 mb-1">
                        {dashboardData.overallStats?.total_companies || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="status-info">Active clients</div>
                        <Users className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="will-change-transform"
            >
              <div className="modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/5 to-yellow-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-caption text-amber-600/80 mb-2">Active Users</p>
                      <p className="text-display-3 font-bold text-slate-900 mb-1">
                        {dashboardData.overallStats?.total_users || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="status-warning">Team members</div>
                        <Activity className="w-3 h-3 text-amber-600" />
                      </div>
                    </div>
                    <div className="h-16 w-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Production Trends */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="will-change-transform"
            >
              <div className="modern-card hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200/50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-heading-3 text-slate-900">Production Trends</h3>
                        <p className="text-body-small text-slate-600">Monthly performance overview</p>
                      </div>
                    </div>
                    <div className="status-success">+12.5%</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={productionData}>
                      <defs>
                        <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: 'none', 
                          borderRadius: '12px', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                        }} 
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="url(#completedGradient)"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pending" 
                        stackId="1" 
                        stroke="#F59E0B" 
                        fill="url(#pendingGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </div>
            </motion.div>

            {/* Department Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="will-change-transform"
            >
              <div className="modern-card hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50/50 border-b border-slate-200/50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <PieChartIcon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-heading-3 text-slate-900">Department Distribution</h3>
                        <p className="text-body-small text-slate-600">Workload across departments</p>
                      </div>
                    </div>
                    <div className="status-info">5 Departments</div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={departmentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          stroke="#fff"
                          strokeWidth={2}
                        >
                          {departmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' 
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      {departmentData.map((dept, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: dept.color }}
                            />
                            <span className="text-body-small font-medium text-slate-700">{dept.name}</span>
                          </div>
                          <span className="text-body-small font-semibold text-slate-900">{dept.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
          </div>

          {/* Modern Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Products */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="modern-card hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-200/30">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mr-4 shadow-lg">
                        <Package className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-heading-3 text-slate-900">Recent Products</h3>
                        <p className="text-body-small text-slate-600">Latest additions to inventory</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="btn-secondary-modern">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading products...
                  </div>
                ) : productsSummary.recentProducts?.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    No recent products found
                  </div>
                ) : (
                  <div className="table-modern">
                    <table className="w-full">
                      <thead className="table-header-modern">
                        <tr>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Product Code</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Brand</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Type</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Material</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">GSM</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsSummary.recentProducts.map((product: any, index: number) => (
                          <tr key={product.id || `product-${index}`} className="table-row-modern hover:scale-[1.01] transition-transform duration-150">
                            <td className="table-cell-modern font-medium text-slate-900">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span>{product.product_item_code}</span>
                              </div>
                            </td>
                            <td className="table-cell-modern text-slate-700">{product.brand}</td>
                            <td className="table-cell-modern">
                              <div className="status-indicator bg-indigo-100 text-indigo-800">{product.product_type}</div>
                            </td>
                            <td className="table-cell-modern text-slate-700">{product.material_name || 'N/A'}</td>
                            <td className="table-cell-modern">
                              <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium">{product.gsm} g/m²</span>
                            </td>
                            <td className="table-cell-modern text-slate-600">{formatDate(product.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              </div>
            </motion.div>

            {/* Recent Jobs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="modern-card hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50/50 border-b border-emerald-200/30">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mr-4 shadow-lg">
                        <Factory className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-heading-3 text-slate-900">Recent Jobs</h3>
                        <p className="text-body-small text-slate-600">Latest production orders</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="btn-secondary-modern">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading jobs...
                  </div>
                ) : (
                  <div className="table-modern overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead className="table-header-modern">
                        <tr>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Job ID</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Product Code</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Customer</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Status</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Progress</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Priority</th>
                          <th className="table-cell-modern text-left font-semibold text-slate-700">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.recentActivity?.map((job: any, index: number) => (
                          <tr key={job.id || `job-${index}`} className="table-row-modern hover:scale-[1.01] transition-transform duration-150 group">
                            <td className="table-cell-modern font-medium text-slate-900">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>{job.identifier}</span>
                              </div>
                            </td>
                            <td className="table-cell-modern text-slate-700">{job.product_code || 'N/A'}</td>
                            <td className="table-cell-modern text-slate-700">{job.company_name || job.customer || 'N/A'}</td>
                            <td className="table-cell-modern">
                              <div className={`status-indicator ${getStatusColor(job.status).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                {job.status}
                              </div>
                            </td>
                            <td className="table-cell-modern">
                              <div className="flex items-center space-x-3">
                                <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all duration-500 group-hover:shadow-sm" 
                                    style={{ width: `${job.progress || 0}%` }}
                                  />
                                </div>
                                <span className="text-body-small font-semibold text-slate-700 min-w-[40px]">{job.progress || 0}%</span>
                              </div>
                            </td>
                            <td className="table-cell-modern">
                              <div className={`status-indicator ${getPriorityColor(job.priority).replace('bg-', 'bg-').replace('text-', 'text-')}`}>
                                {job.priority}
                              </div>
                            </td>
                            <td className="table-cell-modern text-slate-600 font-mono text-xs">{formatDate(job.due_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboardWithSidebar;
