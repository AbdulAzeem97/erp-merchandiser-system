import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  Calendar,
  Search,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useDashboardKPIs, useMonthlyTrends, useMerchandiserPerformance, useRecentActivity, useExportToCSV, useReportFilters } from '@/hooks/useReports';
import { toast } from 'sonner';

const HeadOfMerchandiserDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const { filters, setDateRange: updateDateRange } = useReportFilters({
    fromDate: dateRange.from,
    toDate: dateRange.to
  });

  const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } = useDashboardKPIs();
  const { data: monthlyTrends, isLoading: trendsLoading } = useMonthlyTrends();
  const { data: merchandiserPerformance, isLoading: performanceLoading } = useMerchandiserPerformance(filters);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(20);
  const exportToCSVMutation = useExportToCSV();

  const handleDateRangeChange = (field: 'from' | 'to', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    updateDateRange(newDateRange.from, newDateRange.to);
  };

  const handleExport = (type: string) => {
    exportToCSVMutation.mutate({ type, filters });
  };

  const handleRefresh = () => {
    refetchKPIs();
    toast.success('Dashboard refreshed');
  };

  // Mock data for charts (replace with real data)
  const statusDistribution = [
    { name: 'Completed', value: kpis?.jobsCompleted || 0, color: '#10b981' },
    { name: 'In Progress', value: kpis?.jobsInProgress || 0, color: '#f59e0b' },
    { name: 'Pending', value: kpis?.jobsPunchedMTD - (kpis?.jobsCompleted || 0) - (kpis?.jobsInProgress || 0) || 0, color: '#6b7280' }
  ];

  const monthlyData = monthlyTrends?.map(trend => ({
    month: new Date(trend.month).toLocaleDateString('en-US', { month: 'short' }),
    jobsPunched: trend.jobs_punched,
    jobsCompleted: trend.jobs_completed,
    prepressJobs: trend.prepress_jobs,
    prepressCompleted: trend.prepress_completed
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Head of Merchandiser Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time merchandising operations overview</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => handleExport('summary')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">From Date</label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => handleDateRangeChange('from', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">To Date</label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => handleDateRangeChange('to', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jobs Punched (MTD)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.jobsPunchedMTD || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% from last month
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jobs In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.jobsInProgress || 0}
                    </p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Active jobs
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Jobs Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.jobsCompleted || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {kpis?.jobsPunchedMTD ? Math.round((kpis.jobsCompleted / kpis.jobsPunchedMTD) * 100) : 0}% completion rate
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Turnaround</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : Math.round((kpis?.avgTurnaroundTime || 0) / 3600)}h
                    </p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Target className="h-3 w-3 mr-1" />
                      Target: 24h
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="jobsPunched" 
                      stackId="1" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      name="Jobs Punched"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="jobsCompleted" 
                      stackId="1" 
                      stroke="#10b981" 
                      fill="#10b981" 
                      name="Jobs Completed"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Views */}
        <Tabs defaultValue="merchandisers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="merchandisers">Merchandiser Performance</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
          </TabsList>

          <TabsContent value="merchandisers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Merchandiser Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceLoading ? (
                    <div className="text-center py-8">Loading performance data...</div>
                  ) : (
                    merchandiserPerformance?.map((merchandiser, index) => (
                      <motion.div
                        key={merchandiser.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {merchandiser.first_name[0]}{merchandiser.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{merchandiser.first_name} {merchandiser.last_name}</h3>
                            <p className="text-sm text-gray-600">{merchandiser.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{merchandiser.total_jobs}</p>
                            <p className="text-xs text-gray-600">Total Jobs</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{merchandiser.completed_jobs}</p>
                            <p className="text-xs text-gray-600">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{merchandiser.in_progress_jobs}</p>
                            <p className="text-xs text-gray-600">In Progress</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-600">
                              {merchandiser.avg_turnaround_seconds ? 
                                Math.round(merchandiser.avg_turnaround_seconds / 3600) + 'h' : 'N/A'
                              }
                            </p>
                            <p className="text-xs text-gray-600">Avg TAT</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activityLoading ? (
                    <div className="text-center py-8">Loading recent activity...</div>
                  ) : (
                    recentActivity?.map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className={`h-2 w-2 rounded-full ${
                          activity.activity_type === 'job_card' ? 'bg-blue-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {activity.actor_name} {activity.activity_type === 'job_card' ? 'created' : 'updated'} {activity.item_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {activity.company_name} • {activity.product_type} • {new Date(activity.activity_date).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={activity.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bottlenecks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Process Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Prepress Queue</h3>
                      <Badge variant="destructive">High</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {kpis?.pendingPrepress || 0} jobs waiting for designer assignment
                    </p>
                    <Progress value={75} className="h-2" />
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">SLA Breaches</h3>
                      <Badge variant="destructive">{kpis?.slaBreaches || 0}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Jobs exceeding delivery deadlines
                    </p>
                    <Progress value={kpis?.slaBreaches ? (kpis.slaBreaches / kpis.jobsPunchedMTD) * 100 : 0} className="h-2" />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Designer Workload</h3>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {kpis?.activeDesigners || 0} active designers handling {kpis?.jobsInProgress || 0} jobs
                    </p>
                    <Progress value={60} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HeadOfMerchandiserDashboard;
