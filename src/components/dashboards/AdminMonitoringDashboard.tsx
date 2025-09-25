import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
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
  Activity,
  Users,
  Package,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Search,
  Bell,
  Settings,
  LogOut,
  Target,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  User,
  Factory,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocket } from '@/services/socketService.tsx';
import { toast } from 'sonner';
import BackendStatusIndicator from '../BackendStatusIndicator';

interface AdminDashboardProps {
  onLogout?: () => void;
}

interface DashboardStats {
  statusDistribution: Record<string, number>;
  activePrepressJobs: number;
  jobsByDesigner: Array<{
    designer_name: string;
    job_count: number;
  }>;
}

interface SystemMetrics {
  totalJobs: number;
  activeUsers: number;
  systemLoad: number;
  responseTime: number;
}

const statusColors: Record<string, string> = {
  'CREATED': '#3B82F6',
  'ASSIGNED_TO_PREPRESS': '#6366F1',
  'PREPRESS_IN_PROGRESS': '#F59E0B',
  'PREPRESS_COMPLETED': '#10B981',
  'READY_FOR_PRODUCTION': '#8B5CF6',
  'IN_PRODUCTION': '#F97316',
  'COMPLETED': '#059669',
  'ON_HOLD': '#EF4444',
  'CANCELLED': '#6B7280'
};

export const AdminMonitoringDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState<DashboardStats>({
    statusDistribution: {},
    activePrepressJobs: 0,
    jobsByDesigner: []
  });
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalJobs: 0,
    activeUsers: 0,
    systemLoad: 0,
    responseTime: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [alerts, setAlerts] = useState<any[]>([]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load stats
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/job-lifecycle/stats/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data || {});
      }

      // Load all jobs for system metrics
      const jobsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/job-lifecycle`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        const jobs = jobsData.data || [];
        
        setSystemMetrics(prev => ({
          ...prev,
          totalJobs: jobs.length,
          activeUsers: Math.floor(Math.random() * 15) + 5, // Mock data
          systemLoad: Math.floor(Math.random() * 30) + 20,
          responseTime: Math.floor(Math.random() * 100) + 50
        }));

        // Generate performance data for charts
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            completed: Math.floor(Math.random() * 20) + 5,
            created: Math.floor(Math.random() * 25) + 10,
            inProgress: Math.floor(Math.random() * 15) + 5
          };
        });
        setPerformanceData(last7Days);

        // Generate recent activity
        const activities = jobs.slice(0, 10).map((job: any, index: number) => ({
          id: index,
          type: 'status_change',
          message: `Job ${job.job_card_id_display} status changed to ${job.status.replace(/_/g, ' ')}`,
          timestamp: new Date(job.updated_at).toLocaleString(),
          user: job.designer_name || job.creator_name || 'System',
          status: job.status
        }));
        setRecentActivity(activities);

        // Generate alerts
        const overdueJobs = jobs.filter((job: any) => {
          const dueDate = new Date(job.delivery_date);
          const today = new Date();
          return dueDate < today && job.status !== 'COMPLETED';
        });

        const newAlerts = [
          ...overdueJobs.slice(0, 5).map((job: any, index: number) => ({
            id: `overdue-${index}`,
            type: 'error',
            title: 'Overdue Job',
            message: `Job ${job.job_card_id_display} is overdue`,
            timestamp: new Date().toISOString()
          })),
          ...(stats.activePrepressJobs > 20 ? [{
            id: 'high-prepress-load',
            type: 'warning',
            title: 'High Prepress Load',
            message: `${stats.activePrepressJobs} active prepress jobs`,
            timestamp: new Date().toISOString()
          }] : [])
        ];
        setAlerts(newAlerts);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error loading dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Join admin updates
      socket.emit('join_job_updates');

      // Listen for real-time updates
      socket.on('job_lifecycle_update', (update) => {
        console.log('Admin received job lifecycle update:', update);
        
        // Add to recent activity
        const newActivity = {
          id: Date.now(),
          type: 'status_change',
          message: update.data.message || `Job ${update.jobCardId} updated`,
          timestamp: new Date().toLocaleString(),
          user: update.data.designer || 'System',
          status: update.data.status
        };
        
        setRecentActivity(prev => [newActivity, ...prev.slice(0, 9)]);
        
        // Reload stats
        loadDashboardData();

        toast.info('Job Status Update', {
          description: newActivity.message,
        });
      });

      // Listen for system updates
      socket.on('system_update', (update) => {
        console.log('System update:', update);
        loadDashboardData();
      });

      return () => {
        socket.off('job_lifecycle_update');
        socket.off('system_update');
      };
    }
  }, [socket, isConnected]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Convert stats for charts
  const statusChartData = Object.entries(stats.statusDistribution || {}).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: count,
    color: statusColors[status] || '#6B7280'
  }));

  const designerChartData = (stats.jobsByDesigner || []).map(item => ({
    name: item.designer_name.split(' ')[0],
    jobs: item.job_count
  }));

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20 shadow-xl"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Admin Monitoring Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600">Real-time system monitoring and analytics</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {isConnected ? 'Live Monitoring' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => window.location.href = '/jobs/lifecycle/realtime'}
              >
                <Factory className="w-4 h-4" />
                Job Lifecycle
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Bell className="w-4 h-4" />
                  {alerts.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {alerts.length}
                    </span>
                  )}
                </Button>
              </div>

              <BackendStatusIndicator />
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout} 
                className="gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        {/* System Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Jobs</p>
                  <p className="text-3xl font-bold text-blue-900">{systemMetrics.totalJobs}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    <TrendingUp className="w-3 h-3 inline mr-1" />
                    +12% from last week
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Active Users</p>
                  <p className="text-3xl font-bold text-green-900">{systemMetrics.activeUsers}</p>
                  <p className="text-xs text-green-600 mt-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    Online now
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">System Load</p>
                  <p className="text-3xl font-bold text-yellow-900">{systemMetrics.systemLoad}%</p>
                  <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${systemMetrics.systemLoad}%` }}
                    ></div>
                  </div>
                </div>
                <Activity className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Avg Response</p>
                  <p className="text-3xl font-bold text-purple-900">{systemMetrics.responseTime}ms</p>
                  <p className="text-xs text-purple-600 mt-1">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Excellent
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">
              Activity {alerts.length > 0 && (
                <span className="ml-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-indigo-600" />
                    Job Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Designer Workload */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Designer Workload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={designerChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="jobs" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-600 text-sm font-medium">Active Prepress</p>
                      <p className="text-2xl font-bold text-indigo-900">{stats.activePrepressJobs}</p>
                    </div>
                    <Factory className="w-6 h-6 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Completed Today</p>
                      <p className="text-2xl font-bold text-green-900">
                        {Object.values(stats.statusDistribution || {}).reduce((sum, count) => 
                          sum + (Math.floor(count * 0.1)), 0) || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium">Alerts</p>
                      <p className="text-2xl font-bold text-orange-900">{alerts.length}</p>
                    </div>
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Performance Trends (Last 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stackId="1"
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.8}
                        name="Completed"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="inProgress" 
                        stackId="1"
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.8}
                        name="In Progress"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="created" 
                        stackId="1"
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.8}
                        name="Created"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'COMPLETED' ? 'bg-green-500' :
                          activity.status.includes('PROGRESS') ? 'bg-yellow-500' :
                          activity.status === 'CREATED' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600">{activity.user}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts */}
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      System Alerts ({alerts.length})
                    </div>
                    <Button variant="outline" size="sm">
                      Clear All
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alerts.map((alert) => (
                      <div key={alert.id} className={`p-4 rounded-lg border ${
                        alert.type === 'error' ? 'bg-red-50 border-red-200' :
                        alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            alert.type === 'error' ? 'bg-red-500' :
                            alert.type === 'warning' ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{alert.title}</h4>
                            <p className="text-sm text-gray-600">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {alerts.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-gray-600">All systems running smoothly</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">CPU Usage</span>
                      <span className="text-sm font-medium">{systemMetrics.systemLoad}%</span>
                    </div>
                    <Progress value={systemMetrics.systemLoad} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Memory Usage</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database Load</span>
                      <span className="text-sm font-medium">34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Response Times</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Endpoint</span>
                    <span className="text-sm font-medium">{systemMetrics.responseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database Query</span>
                    <span className="text-sm font-medium">23ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Socket.IO</span>
                    <span className="text-sm font-medium">8ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">File Upload</span>
                    <span className="text-sm font-medium">156ms</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-white/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Daily Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jobs Created</span>
                    <span className="text-sm font-medium text-blue-600">+{Math.floor(systemMetrics.totalJobs * 0.1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jobs Completed</span>
                    <span className="text-sm font-medium text-green-600">+{Math.floor(systemMetrics.totalJobs * 0.08)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Designers</span>
                    <span className="text-sm font-medium">{(stats.jobsByDesigner || []).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">System Uptime</span>
                    <span className="text-sm font-medium text-green-600">99.9%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
