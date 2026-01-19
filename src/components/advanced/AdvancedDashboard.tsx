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
  LogOut
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { dashboardAPI, productsAPI, jobsAPI, authAPI } from '@/services/api';
import BackendStatusIndicator from '../BackendStatusIndicator';
import { MainLayout } from '../layout/MainLayout';

interface DashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
  currentPage?: string;
  isLoading?: boolean;
}


const recentJobs = [
  { id: 'JC-001234', product: 'BR-00-139-A', status: 'In Progress', progress: 75, priority: 'High', customer: 'JCP Brand', dueDate: '2024-01-15' },
  { id: 'JC-001235', product: 'BR-00-140-B', status: 'Quality Check', progress: 90, priority: 'Medium', customer: 'Nike', dueDate: '2024-01-18' },
  { id: 'JC-001236', product: 'BR-00-141-C', status: 'Completed', progress: 100, priority: 'Low', customer: 'Adidas', dueDate: '2024-01-10' },
  { id: 'JC-001237', product: 'BR-00-142-D', status: 'Pending', progress: 25, priority: 'High', customer: 'Puma', dueDate: '2024-01-20' },
  { id: 'JC-001238', product: 'BR-00-143-E', status: 'In Progress', progress: 60, priority: 'Medium', customer: 'Under Armour', dueDate: '2024-01-22' }
];

const notifications = [
  { id: 1, type: 'success', title: 'Job Completed', message: 'Job JC-001233 has been completed successfully', time: '2 min ago' },
  { id: 2, type: 'warning', title: 'Material Low', message: 'C1S material stock is running low', time: '15 min ago' },
  { id: 3, type: 'info', title: 'New Order', message: 'New job order received from Nike', time: '1 hour ago' },
  { id: 4, type: 'error', title: 'Quality Issue', message: 'Quality check failed for JC-001230', time: '2 hours ago' }
];

export const AdvancedDashboard: React.FC<DashboardProps> = ({ 
  onNavigate,
  onLogout,
  currentPage = 'dashboard',
  isLoading = false
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState('6M');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('production');
  
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
        recentActivity: recentActivity?.length || 0,
        monthlyTrends: monthlyTrends?.length || 0,
        productsStats: productsStats?.total || 0
      });

      setDashboardData({
        overallStats,
        jobStatusStats,
        recentActivity,
        monthlyTrends
      });

      // Update products summary
      if (productsStats) {
        setProductsSummary({
          totalProducts: productsStats.total || 0,
          activeProducts: productsStats.active || 0,
          recentProducts: productsStats.recent || []
        });
      }
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      });
      // Fallback to mock data if API fails
      setDashboardData({
        overallStats: { totalJobs: 0, totalProducts: 0, totalCompanies: 0 },
        jobStatusStats: [],
        recentActivity: [
          { id: 'JC-001234', product: 'BR-00-139-A', status: 'In Progress', progress: 75, priority: 'High', customer: 'JCP Brand', dueDate: '2024-01-15' },
          { id: 'JC-001235', product: 'BR-00-140-B', status: 'Quality Check', progress: 90, priority: 'Medium', customer: 'Nike', dueDate: '2024-01-18' }
        ],
        monthlyTrends: []
      });
      setProductsSummary({
        totalProducts: 0,
        activeProducts: 0,
        recentProducts: [
          { id: '1', productItemCode: 'BR-00-139-A', brand: 'Sample Brand', productType: 'Box', material: 'C1S', gsm: 250, createdAt: '2024-01-15' },
          { id: '2', productItemCode: 'BR-00-140-B', brand: 'Sample Brand', productType: 'Bag', material: 'Kraft', gsm: 200, createdAt: '2024-01-18' }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh function for manual refresh
  const handleRefresh = async () => {
    await loadDashboardData();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  };

  const cardHoverVariants = {
    hover: { 
      scale: 1.02, 
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onNavigate={onNavigate}
      onLogout={onLogout}
      isLoading={isLoading}
      pageTitle="Dashboard"
      pageDescription="Real-time overview of production and job management"
    >
      <motion.div 
        className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={containerVariants}
        >
          {[
            {
              title: 'Total Products',
              value: (productsSummary.totalProducts || 0).toString(),
              change: 'Active products',
              trend: 'up',
              icon: Package,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-50 to-blue-100'
            },
            {
              title: 'Active Products',
              value: (productsSummary.activeProducts || 0).toString(),
              change: 'Currently active',
              trend: 'up',
              icon: CheckCircle,
              color: 'from-green-500 to-green-600',
              bgColor: 'from-green-50 to-green-100'
            },
            {
              title: 'Recent Products',
              value: (productsSummary.recentProducts?.length || 0).toString(),
              change: 'Recently added',
              trend: 'up',
              icon: Award,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'from-purple-50 to-purple-100'
            },
            {
              title: 'Total Jobs',
              value: (dashboardData.overallStats?.totalJobs || 0).toString(),
              change: 'Active jobs',
              trend: 'up',
              icon: Target,
              color: 'from-orange-500 to-orange-600',
              bgColor: 'from-orange-50 to-orange-100'
            }
          ].map((kpi, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={cardHoverVariants.hover}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                      <div className="flex items-center mt-2 space-x-1">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {kpi.change}
                        </span>
                        <span className="text-sm text-gray-500">vs last month</span>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${kpi.bgColor} flex items-center justify-center`}>
                      <kpi.icon className={`w-8 h-8 bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Backend Status Card */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span>System Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <BackendStatusIndicator className="text-base px-4 py-3" showDetails={true} />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Last checked</p>
                  <p className="text-sm font-semibold text-gray-700">Just now</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mb-8"
          variants={itemVariants}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Only show product creation for non-prepress roles */}
                {userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('productForm')}
                    className="p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Package className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">Create Product Master</h3>
                    <p className="text-sm text-blue-100">Define new product specifications</p>
                  </motion.button>
                )}

                {/* Only show job creation for non-prepress roles */}
                {userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('jobForm')}
                    className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Factory className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">New Job Card</h3>
                    <p className="text-sm text-green-100">Create production job order</p>
                  </motion.button>
                )}

                {/* Only show reports for non-prepress roles */}
                {userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('reports')}
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">Reports Suite</h3>
                    <p className="text-sm text-purple-100">Analytics & metrics</p>
                  </motion.button>
                )}

                {(userRole === 'HOD_PREPRESS' || userRole === 'ADMIN') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('prepressHOD')}
                    className="p-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">Prepress HOD</h3>
                    <p className="text-sm text-orange-100">Design management</p>
                  </motion.button>
                )}

                {(userRole === 'DESIGNER' || userRole === 'ADMIN') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('prepressDesigner')}
                    className="p-4 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">My Tasks</h3>
                    <p className="text-sm text-teal-100">Designer workbench</p>
                  </motion.button>
                )}

                {(userRole === 'HEAD_OF_PRODUCTION' || userRole === 'ADMIN') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('productionDashboard')}
                    className="p-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Factory className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">Production</h3>
                    <p className="text-sm text-indigo-100">Manufacturing control</p>
                  </motion.button>
                )}

                {(userRole === 'HEAD_OF_MERCHANDISER' || userRole === 'ADMIN') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onNavigate('jobMonitoring')}
                    className="p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-left group transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-8 h-8" />
                      <div className="w-2 h-2 bg-white/30 rounded-full group-hover:bg-white/50 transition-colors" />
                    </div>
                    <h3 className="font-semibold mb-1">Job Monitoring</h3>
                    <p className="text-sm text-emerald-100">Real-time tracking</p>
                  </motion.button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        </div>

        {/* Recent Products Table */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Recent Products</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <Activity className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  {userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER' && (
                    <Button variant="outline" size="sm" onClick={() => onNavigate('productForm')}>
                      <Package className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(!productsSummary.recentProducts || productsSummary.recentProducts.length === 0) ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products created yet</h3>
                  <p className="text-gray-500 mb-4">Create your first product to get started</p>
                  <Button onClick={() => onNavigate('productForm')} className="gap-2">
                    <Package className="w-4 h-4" />
                    Create Product
                  </Button>
                </div>
              ) : (
                                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[700px]">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GSM</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(productsSummary.recentProducts || []).map((product, index) => (
                        <motion.tr
                          key={product.id || `product-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono font-medium text-gray-900">{product.product_item_code || product.productItemCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.brand || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {product.product_type || product.productType || 'N/A'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.material_name || product.material || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.gsm || 'N/A'} g/m²</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.created_at ? new Date(product.created_at).toLocaleDateString() : 
                             product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 
                             'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => onNavigate('jobForm')}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Jobs Table */}
        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span>Recent Jobs</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <Activity className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                  {userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER' && (
                    <Button variant="outline" size="sm" onClick={() => onNavigate('jobForm')}>
                      <FileText className="w-4 h-4 mr-2" />
                      Create Job
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(!dashboardData.recentActivity || dashboardData.recentActivity.length === 0) ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs created yet</h3>
                  <p className="text-gray-500 mb-4">Create your first job to get started</p>
                  {userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER' && (
                    <Button onClick={() => onNavigate('jobForm')} className="gap-2">
                      <FileText className="w-4 h-4" />
                      Create Job
                    </Button>
                  )}
                </div>
              ) : (
                                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Code</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(dashboardData.recentActivity || []).map((job, index) => (
                        <motion.tr
                          key={job.id || `job-${index}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                                                      <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono font-medium text-gray-900">{job.identifier || job.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-600">{job.product_code || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{job.product_name || job.product}</div>
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{job.company_name || job.customer}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className={`${
                                job.status === 'Completed' ? 'bg-green-50 text-green-700' :
                                job.status === 'In Progress' ? 'bg-blue-50 text-blue-700' :
                                job.status === 'Quality Check' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {job.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Progress value={job.progress || 0} className="w-16 h-2" />
                              <span className="text-sm text-gray-600">{job.progress || 0}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant="outline" 
                              className={`${
                                (job.priority || '').toUpperCase() === 'HIGH' ? 'bg-red-50 text-red-700' :
                                (job.priority || '').toUpperCase() === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' :
                                'bg-green-50 text-green-700'
                              }`}
                            >
                              {job.priority || 'Low'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(job.due_date || job.dueDate || job.created_at) && !isNaN(new Date(job.due_date || job.dueDate || job.created_at).getTime()) 
                              ? new Date(job.due_date || job.dueDate || job.created_at).toLocaleDateString() 
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mr-2"
                              onClick={() => onNavigate('jobForm')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
};
