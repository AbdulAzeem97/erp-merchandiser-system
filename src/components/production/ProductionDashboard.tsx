import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Factory, Users, CheckCircle, Clock, AlertTriangle, Pause, RefreshCw, Plus, Eye, Settings } from 'lucide-react';
import { productionApi, ProductionDashboardData, ProductionDepartment, ProductionJobAssignment } from '@/services/productionApi';

interface ProductionDashboardProps {
  userRole?: string;
  accessibleDepartments?: string[];
}

const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
  userRole = 'operator',
  accessibleDepartments = []
}) => {
  const [dashboardData, setDashboardData] = useState<ProductionDashboardData | null>(null);
  const [departments, setDepartments] = useState<ProductionDepartment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [jobAssignments, setJobAssignments] = useState<ProductionJobAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (departmentId?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data
      const dashboard = await productionApi.getDashboardData(
        departmentId === 'all' ? undefined : departmentId
      );
      setDashboardData(dashboard);

      // Load departments (will be filtered by user access on backend)
      const depts = await productionApi.getDepartments();
      setDepartments(depts);

      // Load job assignments
      const jobs = await productionApi.getJobAssignments({
        departmentId: departmentId === 'all' ? undefined : departmentId,
        limit: 20
      });
      setJobAssignments(jobs);

    } catch (err: any) {
      console.error('Error loading production data:', err);
      setError(err.response?.data?.message || 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDepartment);
  }, [selectedDepartment]);

  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'ON_HOLD':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'REWORK':
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'PENDING':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800';
      case 'REWORK':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading production dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No production data available</AlertDescription>
      </Alert>
    );
  }

  const { jobStats, recentActivities, departmentPerformance, userAccess } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
          <p className="text-gray-600 mt-2">
            {userAccess.hasDirectorAccess ? 'Director View - Complete Production Overview' : 
             `Department Access: ${userAccess.departmentAccess.map(d => d.departmentName).join(', ')}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={() => loadData(selectedDepartment)} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Job Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{jobStats.total_jobs}</p>
              </div>
              <Factory className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-600">{jobStats.pending_jobs}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{jobStats.in_progress_jobs}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{jobStats.completed_jobs}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">On Hold</p>
                <p className="text-2xl font-bold text-yellow-600">{jobStats.on_hold_jobs}</p>
              </div>
              <Pause className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Rework</p>
                <p className="text-2xl font-bold text-orange-600">{jobStats.rework_jobs}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">Job Assignments</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          {userAccess.hasDirectorAccess && <TabsTrigger value="performance">Department Performance</TabsTrigger>}
          {departments.length > 0 && <TabsTrigger value="departments">Departments</TabsTrigger>}
        </TabsList>

        {/* Job Assignments Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Job Assignments</CardTitle>
                <CardDescription>
                  Current production jobs {selectedDepartment !== 'all' && `for selected department`}
                </CardDescription>
              </div>
              {userAccess.permissions.includes('ASSIGN_JOBS') && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobAssignments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No job assignments found</p>
                ) : (
                  jobAssignments.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {job.job_card} - {job.company_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {job.product_item_code} | {job.department_name} → {job.process_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          <Badge className={getPriorityColor(job.priority)}>
                            {job.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-4">
                          {job.assigned_to_name && (
                            <span>
                              <Users className="h-4 w-4 inline mr-1" />
                              {job.assigned_to_name}
                            </span>
                          )}
                          <span>Assigned: {new Date(job.assigned_date).toLocaleDateString()}</span>
                          {job.estimated_completion_date && (
                            <span>Due: {new Date(job.estimated_completion_date).toLocaleDateString()}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 sm:ml-auto">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          {(userAccess.permissions.includes('UPDATE_JOB_STATUS') || 
                            job.assigned_to_user_id === 'current_user_id') && (
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Update
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {job.notes && (
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {job.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest production updates and status changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No recent activities</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 border-l-2 border-blue-200 bg-blue-50">
                      {getStatusIcon(activity.status_to)}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="font-medium text-gray-900">
                            {activity.job_card_id} - {activity.department_name}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.changed_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Status: {activity.status_from || 'New'} → {activity.status_to} | 
                          Process: {activity.process_name} | 
                          By: {activity.changed_by_name}
                        </p>
                        {activity.remarks && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{activity.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Department Performance Tab (Director Only) */}
        {userAccess.hasDirectorAccess && (
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Production completion rates by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentPerformance.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No performance data available</p>
                  ) : (
                    departmentPerformance.map((dept) => (
                      <div key={dept.department_code} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {dept.department_name} ({dept.department_code})
                            </h3>
                            <p className="text-sm text-gray-600">
                              {dept.completed_assignments} of {dept.total_assignments} assignments completed
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              {dept.completion_rate.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(dept.completion_rate, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Production Departments</CardTitle>
                <CardDescription>Manage production departments and processes</CardDescription>
              </div>
              {userAccess.hasDirectorAccess && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Department
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Card key={dept.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {dept.name}
                          </h3>
                          <p className="text-sm text-gray-600">{dept.code}</p>
                          {dept.description && (
                            <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
                          )}
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Processes: {dept.process_count}</span>
                          <span className="text-gray-600">Equipment: {dept.equipment_count}</span>
                        </div>
                        
                        {dept.head_name && (
                          <p className="text-sm text-gray-600">
                            <Users className="h-4 w-4 inline mr-1" />
                            {dept.head_name}
                          </p>
                        )}
                        
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDashboard;