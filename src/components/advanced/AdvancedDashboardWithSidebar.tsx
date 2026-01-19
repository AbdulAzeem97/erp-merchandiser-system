import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
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
  Activity,
  Zap,
  Target,
  Award,
  FileText,
  LogOut,
  RefreshCw,
  Crown,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dashboardAPI, productsAPI, jobsAPI, authAPI } from '@/services/api';
import BackendStatusIndicator from '../BackendStatusIndicator';
import SmartSidebar from '../layout/SmartSidebar';
import { JobManagementTable } from '../JobManagementTable';
import { ProductManagementTable } from '../ProductManagementTable';
import { JobReport } from '../reports/JobReport';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeSelector } from '../director/ThemeSelector';
import { TeamAnalytics } from '../director/TeamAnalytics';

interface DashboardProps {
  onNavigateToProductForm: () => void;
  onNavigateToJobForm: (product?: any) => void;
  onNavigateToReports?: () => void;
  onNavigateToPrepressHOD?: () => void;
  onNavigateToPrepressDesigner?: () => void;
  onLogout?: () => void;
  onCreateProduct?: () => void;
}


export const AdvancedDashboardWithSidebar: React.FC<DashboardProps> = ({ 
  onNavigateToProductForm, 
  onNavigateToJobForm,
  onNavigateToReports,
  onCreateProduct,
  onNavigateToPrepressHOD,
  onNavigateToPrepressDesigner,
  onLogout 
}) => {
  // CRITICAL: Check user role BEFORE any hooks or state - must be first thing
  const currentUser = authAPI.getCurrentUser();
  const userRole = currentUser?.role || currentUser?.Role;
  
  // CRITICAL: Immediate redirect for Offset Printing roles - MUST happen before ANY rendering
  if (userRole === 'HOD_OFFSET' || userRole === 'OFFSET_OPERATOR') {
    console.log('🖨️ CRITICAL: Redirecting HOD_OFFSET user - preventing all rendering');
    // Use replace to prevent back button issues and force immediate redirect
    window.location.replace('/offset-printing/dashboard');
    // Return null immediately - this should prevent all rendering
    return null;
  }
  
  console.log('🔍 AdvancedDashboardWithSidebar - Current user:', currentUser);
  console.log('🔍 AdvancedDashboardWithSidebar - User role:', userRole);
  console.log('🔍 AdvancedDashboardWithSidebar - Role type:', typeof userRole);
  console.log('🔍 AdvancedDashboardWithSidebar - Is Director?', userRole === 'DIRECTOR');
  console.log('🔍 AdvancedDashboardWithSidebar - Role comparison:', `"${userRole}" === "DIRECTOR"`);
  console.log('🎨 ThemeSelector should be visible to all users');
  console.log('📊 Team Analytics tab should be visible for DIRECTOR:', userRole === 'DIRECTOR');
  console.log('✅ ThemeSelector component imported:', typeof ThemeSelector !== 'undefined');
  console.log('✅ TeamAnalytics component imported:', typeof TeamAnalytics !== 'undefined');
  
  const [activeTimeframe, setActiveTimeframe] = useState('6M');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('production');
  const [currentView, setCurrentView] = useState('dashboard');
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

  // Premium styling for Director role
  const isDirector = userRole === 'DIRECTOR' || userRole === 'director' || userRole?.toUpperCase() === 'DIRECTOR';
  console.log('🎨 Premium Director Styling - isDirector:', isDirector);
  console.log('🎨 Premium Director Styling - userRole:', userRole);
  const dashboardBgClass = isDirector 
    ? 'min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50/40 to-orange-50/30 relative overflow-hidden'
    : 'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50';
  
  return (
    <div className={dashboardBgClass}>
      {isDirector && (
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      )}
      <SmartSidebar 
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        userRole={userRole}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`p-4 sm:p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70'} relative z-10`}>
        <div className="w-full">
          {/* Modern Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className={`text-3xl sm:text-4xl font-bold bg-clip-text text-transparent ${
                  isDirector 
                    ? 'bg-gradient-to-r from-amber-700 via-yellow-600 to-orange-600' 
                    : 'bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900'
                }`}>
                  Dashboard
                </h1>
                {isDirector && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-full shadow-lg border-2 border-amber-500">
                    <Crown className="w-4 h-4 text-amber-900" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Director</span>
                    <Sparkles className="w-3 h-3 text-amber-900 animate-pulse" />
                  </div>
                )}
              </div>
              {isDirector && (
                <div className="mb-2">
                  <h2 className={`text-2xl sm:text-3xl font-bold ${
                    isDirector 
                      ? 'bg-gradient-to-r from-amber-800 via-yellow-700 to-orange-700 bg-clip-text text-transparent' 
                      : ''
                  }`}>
                    MR SHAHID AAZMI
                  </h2>
                </div>
              )}
              <p className={`mt-2 text-sm sm:text-base ${
                isDirector 
                  ? 'text-amber-900/80' 
                  : 'text-gray-600'
              }`}>
                {isDirector ? (
                  <>
                    Welcome, <span className="font-bold text-amber-700">MR SHAHID AAZMI</span>! 
                    <span className="ml-2">Executive overview of your organization.</span>
                  </>
                ) : (
                  <>
                    Welcome back, <span className="font-semibold text-blue-600">{currentUser?.first_name || 'User'}</span>! 
                    Here's what's happening today.
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <BackendStatusIndicator />
              <ThemeSelector />
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
              <div className={`modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative ${
                isDirector ? 'border-2 border-amber-400/50 shadow-xl shadow-amber-200/20' : ''
              }`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDirector 
                    ? 'bg-gradient-to-br from-amber-400/10 to-yellow-400/15' 
                    : 'bg-gradient-to-br from-blue-600/5 to-indigo-600/10'
                }`}></div>
                <CardContent className={`p-6 relative z-10 ${
                  isDirector ? 'bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/20' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-caption mb-2 ${
                        isDirector ? 'text-amber-700/90 font-semibold' : 'text-blue-600/80'
                      }`}>Total Products</p>
                      <p className={`text-display-3 font-bold mb-1 ${
                        isDirector ? 'text-amber-900' : 'text-slate-900'
                      }`}>
                        {dashboardData.overallStats?.total_products || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className={isDirector ? 'status-warning' : 'status-success'}>Active inventory</div>
                        <TrendingUp className={`w-3 h-3 ${
                          isDirector ? 'text-amber-600' : 'text-emerald-600'
                        }`} />
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg ${
                      isDirector 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                        : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    }`}>
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
              <div className={`modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative ${
                isDirector ? 'border-2 border-amber-400/50 shadow-xl shadow-amber-200/20' : ''
              }`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDirector 
                    ? 'bg-gradient-to-br from-amber-400/10 to-yellow-400/15' 
                    : 'bg-gradient-to-br from-emerald-600/5 to-green-600/10'
                }`}></div>
                <CardContent className={`p-6 relative z-10 ${
                  isDirector ? 'bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/20' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-caption mb-2 ${
                        isDirector ? 'text-amber-700/90 font-semibold' : 'text-emerald-600/80'
                      }`}>Total Jobs</p>
                      <p className={`text-display-3 font-bold mb-1 ${
                        isDirector ? 'text-amber-900' : 'text-slate-900'
                      }`}>
                        {dashboardData.overallStats?.total_jobs || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className={isDirector ? 'status-warning' : 'status-info'}>Production orders</div>
                        <Factory className={`w-3 h-3 ${
                          isDirector ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg ${
                      isDirector 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                        : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    }`}>
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
              <div className={`modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative ${
                isDirector ? 'border-2 border-amber-400/50 shadow-xl shadow-amber-200/20' : ''
              }`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDirector 
                    ? 'bg-gradient-to-br from-amber-400/10 to-yellow-400/15' 
                    : 'bg-gradient-to-br from-purple-600/5 to-violet-600/10'
                }`}></div>
                <CardContent className={`p-6 relative z-10 ${
                  isDirector ? 'bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/20' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-caption mb-2 ${
                        isDirector ? 'text-amber-700/90 font-semibold' : 'text-purple-600/80'
                      }`}>Companies</p>
                      <p className={`text-display-3 font-bold mb-1 ${
                        isDirector ? 'text-amber-900' : 'text-slate-900'
                      }`}>
                        {dashboardData.overallStats?.total_companies || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className={isDirector ? 'status-warning' : 'status-info'}>Active clients</div>
                        <Users className={`w-3 h-3 ${
                          isDirector ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg ${
                      isDirector 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                        : 'bg-gradient-to-br from-purple-500 to-purple-600'
                    }`}>
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
              <div className={`modern-card group hover:shadow-2xl hover:scale-105 transition-all duration-300 hardware-accelerated overflow-hidden relative ${
                isDirector ? 'border-2 border-amber-400/50 shadow-xl shadow-amber-200/20' : ''
              }`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDirector 
                    ? 'bg-gradient-to-br from-amber-400/10 to-yellow-400/15' 
                    : 'bg-gradient-to-br from-amber-600/5 to-yellow-600/10'
                }`}></div>
                <CardContent className={`p-6 relative z-10 ${
                  isDirector ? 'bg-gradient-to-br from-amber-50/50 via-yellow-50/30 to-orange-50/20' : ''
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-caption mb-2 ${
                        isDirector ? 'text-amber-700/90 font-semibold' : 'text-amber-600/80'
                      }`}>Active Users</p>
                      <p className={`text-display-3 font-bold mb-1 ${
                        isDirector ? 'text-amber-900' : 'text-slate-900'
                      }`}>
                        {dashboardData.overallStats?.total_users || 0}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="status-warning">Team members</div>
                        <Activity className="w-3 h-3 text-amber-600" />
                      </div>
                    </div>
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg ${
                      isDirector 
                        ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                        : 'bg-gradient-to-br from-amber-500 to-amber-600'
                    }`}>
                      <Activity className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </motion.div>
          </div>

          {/* Jobs and Products Management Tables with Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="col-span-full"
          >
            <Tabs defaultValue="jobs" className="w-full">
              <TabsList className={`grid w-full mb-4 ${userRole === 'DIRECTOR' ? 'grid-cols-4' : 'grid-cols-3'} ${
                isDirector ? 'bg-amber-50/50 border-2 border-amber-200/50 shadow-lg' : ''
              }`}>
                <TabsTrigger 
                  value="jobs"
                  className={isDirector ? 'data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg' : ''}
                >
                  Jobs
                </TabsTrigger>
                <TabsTrigger 
                  value="products"
                  className={isDirector ? 'data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg' : ''}
                >
                  Products
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className={isDirector ? 'data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg' : ''}
                >
                  Reports
                </TabsTrigger>
                {userRole === 'DIRECTOR' && (
                  <TabsTrigger 
                    value="team-analytics"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:border-2 data-[state=active]:border-amber-400"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Team Analytics
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="jobs" className="space-y-4">
                <JobManagementTable 
                  onCreateJob={() => onNavigateToJobForm()}
                  onEditJob={(job) => {
                    // Navigate to job form with job data for editing
                    onNavigateToJobForm(job);
                  }}
                />
              </TabsContent>
              
              <TabsContent value="products" className="space-y-4">
                <ProductManagementTable 
                  onCreateProduct={() => {
                    if (onCreateProduct) {
                      onCreateProduct();
                    } else {
                      onNavigateToProductForm();
                    }
                  }}
                />
              </TabsContent>
              
              <TabsContent value="reports" className="space-y-4">
                <JobReport />
              </TabsContent>

              {userRole === 'DIRECTOR' && (
                <TabsContent value="team-analytics" className={`space-y-4 p-6 rounded-lg ${
                  isDirector 
                    ? 'bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/40 border-2 border-amber-200/50 shadow-xl' 
                    : ''
                }`}>
                  <div className={`mb-4 p-4 rounded-lg ${
                    isDirector 
                      ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 border-l-4 border-amber-500' 
                      : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <Crown className={`w-5 h-5 ${isDirector ? 'text-amber-600' : ''}`} />
                      <h3 className={`text-lg font-bold ${
                        isDirector ? 'text-amber-900' : 'text-gray-900'
                      }`}>
                        Executive Team Performance Dashboard
                      </h3>
                    </div>
                    <p className={`text-sm mt-1 ${
                      isDirector ? 'text-amber-700/80' : 'text-gray-600'
                    }`}>
                      Comprehensive analytics for all senior merchandisers and their teams
                    </p>
                  </div>
                  <TeamAnalytics />
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboardWithSidebar;