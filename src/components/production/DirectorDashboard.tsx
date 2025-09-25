import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, Factory, TrendingUp, AlertTriangle, CheckCircle, 
  Clock, Package, Truck, Eye, Settings, BarChart3 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface DirectorDashboardProps {
  user: any;
}

interface DepartmentStats {
  
  id: string;
  name: string;
  code: string;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  onHoldJobs: number;
  reworkJobs: number;
  completionRate: number;
  efficiency: number;
  activeOperators: number;
  equipmentUtilization: number;
}

interface ProductionMetrics {
  totalProduction: number;
  dailyTarget: number;
  monthlyTarget: number;
  qualityScore: number;
  onTimeDelivery: number;
  materialWaste: number;
  energyConsumption: number;
  activeJobCards: number;
  completedJobCards: number;
  overdueJobCards: number;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [productionMetrics, setProductionMetrics] = useState<ProductionMetrics | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('today');
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedTimeFrame]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/production/director/dashboard?timeframe=${selectedTimeFrame}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDepartmentStats(data.departmentStats);
        setProductionMetrics(data.productionMetrics);
        setRecentActivities(data.recentActivities);
        setAlertsCount(data.alertsCount);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'ON_HOLD': return 'bg-orange-500';
      case 'REWORK': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-700 bg-green-100';
      case 'IN_PROGRESS': return 'text-blue-700 bg-blue-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'ON_HOLD': return 'text-orange-700 bg-orange-100';
      case 'REWORK': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Director of Production Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Complete visibility and control over all production operations
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {alertsCount > 0 && (
                <Button variant="outline" className="relative">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                  Alerts
                  <Badge className="ml-2 bg-red-500 text-white">
                    {alertsCount}
                  </Badge>
                </Button>
              )}
              <select
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {productionMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Factory className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Production</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {productionMetrics.totalProduction.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Target: {productionMetrics.dailyTarget.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Quality Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {productionMetrics.qualityScore}%
                    </p>
                    <p className="text-xs text-green-600">
                      +2.5% from last period
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {productionMetrics.onTimeDelivery}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {productionMetrics.completedJobCards} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {productionMetrics.activeJobCards}
                    </p>
                    <p className="text-xs text-red-600">
                      {productionMetrics.overdueJobCards} overdue
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="code" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completedJobs" fill="#10b981" name="Completed" />
                      <Bar dataKey="inProgressJobs" fill="#3b82f6" name="In Progress" />
                      <Bar dataKey="pendingJobs" fill="#f59e0b" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Production Efficiency */}
              <Card>
                <CardHeader>
                  <CardTitle>Production Efficiency</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={departmentStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="code" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="completionRate" 
                        stroke="#8884d8" 
                        name="Completion Rate %" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="#82ca9d" 
                        name="Efficiency %" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Production Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(activity.status_to)}`}></div>
                        <div>
                          <p className="font-medium">{activity.job_card_id}</p>
                          <p className="text-sm text-gray-600">
                            {activity.department_name} - {activity.process_name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusTextColor(activity.status_to)}>
                          {activity.status_to.replace('_', ' ')}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.changed_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departmentStats.map((dept) => (
                <Card key={dept.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{dept.name}</CardTitle>
                      <Badge variant="secondary">{dept.code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Jobs</span>
                        <span className="font-semibold">{dept.totalJobs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="font-semibold text-green-600">{dept.completionRate}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Efficiency</span>
                        <span className="font-semibold text-blue-600">{dept.efficiency}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Operators</span>
                        <span className="font-semibold">{dept.activeOperators}</span>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-green-50 p-2 rounded text-center">
                            <div className="font-semibold text-green-700">{dept.completedJobs}</div>
                            <div className="text-green-600">Completed</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="font-semibold text-blue-700">{dept.inProgressJobs}</div>
                            <div className="text-blue-600">In Progress</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded text-center">
                            <div className="font-semibold text-yellow-700">{dept.pendingJobs}</div>
                            <div className="text-yellow-600">Pending</div>
                          </div>
                          <div className="bg-red-50 p-2 rounded text-center">
                            <div className="font-semibold text-red-700">{dept.reworkJobs}</div>
                            <div className="text-red-600">Rework</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.location.href = `/production/department/${dept.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Other tabs would go here - Workflow, Analytics, Reports */}
          <TabsContent value="workflow">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium">Workflow Management</h3>
                <p className="text-gray-600 mt-2">Real-time workflow tracking and optimization tools</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium">Advanced Analytics</h3>
                <p className="text-gray-600 mt-2">Deep insights and predictive analytics</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium">Production Reports</h3>
                <p className="text-gray-600 mt-2">Comprehensive reporting and data export</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DirectorDashboard;
