import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  Activity,
  Zap,
  Target,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useProductionKPIs, useSLACompliance, useRecentActivity, useExportToCSV } from '@/hooks/useReports';
import { toast } from 'sonner';

const HeadOfProductionDashboard: React.FC = () => {
  const { data: kpis, isLoading: kpisLoading, refetch: refetchKPIs } = useProductionKPIs();
  const { data: slaCompliance, isLoading: slaLoading } = useSLACompliance();
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(15);
  const exportToCSVMutation = useExportToCSV();

  const handleExport = (type: string) => {
    exportToCSVMutation.mutate({ type, filters: {} });
  };

  const handleRefresh = () => {
    refetchKPIs();
    toast.success('Production dashboard refreshed');
  };

  // Mock data for charts
  const wipData = kpis?.wipByProcess ? Object.entries(kpis.wipByProcess).map(([process, count]) => ({
    process,
    count,
    color: process === 'Job Cards' ? '#3b82f6' : process === 'Prepress' ? '#10b981' : '#f59e0b'
  })) : [];

  const agingData = kpis?.agingBuckets ? Object.entries(kpis.agingBuckets).map(([bucket, count]) => ({
    bucket,
    count,
    color: bucket === '0-3 days' ? '#10b981' : 
           bucket === '4-7 days' ? '#f59e0b' : 
           bucket === '8-14 days' ? '#f97316' : '#ef4444'
  })) : [];

  const throughputData = kpis?.processThroughput || [
    { process: 'Job Cards', completed: 45, date: '2024-01-01' },
    { process: 'Prepress', completed: 32, date: '2024-01-01' },
    { process: 'HOD Review', completed: 28, date: '2024-01-01' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Head of Production Dashboard</h1>
            <p className="text-gray-600 mt-1">Real-time production operations and process monitoring</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => handleExport('sla-compliance')} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Production KPIs */}
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
                    <p className="text-sm font-medium text-gray-600">Total WIP</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.queueLength || 0}
                    </p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <Factory className="h-3 w-3 mr-1" />
                      Active processes
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Factory className="h-6 w-6 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Today's Completions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.todaysCompletions || 0}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed today
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
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">SLA at Risk</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.slaAtRisk || 0}
                    </p>
                    <p className="text-xs text-red-600 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgent attention
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
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
                    <p className="text-sm font-medium text-gray-600">Blocked Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {kpisLoading ? '...' : kpis?.blockedItems || 0}
                    </p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <Zap className="h-3 w-3 mr-1" />
                      Requires action
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* WIP by Process */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  WIP by Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={wipData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="process" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Aging Buckets */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Aging Buckets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Views */}
        <Tabs defaultValue="queues" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="queues">Work Queues</TabsTrigger>
            <TabsTrigger value="sla">SLA Compliance</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="queues" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Cards Queue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Job Cards Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pending Jobs</span>
                      <Badge variant="secondary">{kpis?.wipByProcess?.['Job Cards'] || 0}</Badge>
                    </div>
                    <Progress value={75} className="h-2" />
                    <div className="text-xs text-gray-600">
                      Average processing time: 2.5 days
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prepress Queue */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Prepress Queue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Pending Prepress</span>
                      <Badge variant="secondary">{kpis?.wipByProcess?.['Prepress'] || 0}</Badge>
                    </div>
                    <Progress value={60} className="h-2" />
                    <div className="text-xs text-gray-600">
                      Average design time: 1.8 days
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Process Throughput */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Process Throughput
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={throughputData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="process" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="completed" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sla" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  SLA Compliance Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {slaLoading ? (
                    <div className="text-center py-8">Loading SLA compliance data...</div>
                  ) : (
                    slaCompliance?.map((compliance, index) => (
                      <motion.div
                        key={compliance.process_type}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{compliance.process_type}</h3>
                          <Badge variant={compliance.on_time_items > compliance.overdue_items ? 'default' : 'destructive'}>
                            {compliance.total_items > 0 ? 
                              Math.round((compliance.on_time_items / compliance.total_items) * 100) : 0
                            }% On Time
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{compliance.total_items}</p>
                            <p className="text-gray-600">Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{compliance.completed_items}</p>
                            <p className="text-gray-600">Completed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{compliance.on_time_items}</p>
                            <p className="text-gray-600">On Time</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{compliance.overdue_items}</p>
                            <p className="text-gray-600">Overdue</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress 
                            value={compliance.total_items > 0 ? (compliance.on_time_items / compliance.total_items) * 100 : 0} 
                            className="h-2" 
                          />
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Production Activity
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
        </Tabs>
      </div>
    </div>
  );
};

export default HeadOfProductionDashboard;
