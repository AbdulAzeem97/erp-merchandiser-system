import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Clock,
  ShoppingCart,
  Truck,
  Settings,
  FileText,
  Calculator
} from 'lucide-react';
import { JobWithInventory, JobMaterialAnalysis, JobMaterialRequirement, JobApprovalForm } from '../../types/inventory';
import { formatDate, formatCurrency } from '../../utils/formatting';
import { inventoryAPI } from '../../services/api';

interface JobAcceptanceInterfaceProps {
  className?: string;
}

export default function JobAcceptanceInterface({ className = '' }: JobAcceptanceInterfaceProps) {
  const [pendingJobs, setPendingJobs] = useState<JobWithInventory[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithInventory | null>(null);
  const [analysis, setAnalysis] = useState<JobMaterialAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [approvalForm, setApprovalForm] = useState<JobApprovalForm>({
    status: 'APPROVED',
    approval_percentage: 100,
    special_approval_reason: '',
    remarks: ''
  });

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const data = await inventoryAPI.getPendingJobs();
      setPendingJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeJobMaterials = async (job: JobWithInventory) => {
    setAnalyzing(true);
    setSelectedJob(job);
    
    try {
      // In a real application, you would get material requirements from the job details
      // For now, we'll simulate with sample data
      const sampleMaterials = [
        { inventory_material_id: 'mat-001', required_quantity: 1000, priority: 8 },
        { inventory_material_id: 'mat-002', required_quantity: 500, priority: 6 },
        { inventory_material_id: 'mat-003', required_quantity: 200, priority: 9 }
      ];

      const data = await inventoryAPI.analyzeJob(job.id, sampleMaterials);
      setAnalysis(data.analysis);
        
      // Update approval form based on analysis
      if (data.analysis.available_percentage === 100) {
        setApprovalForm(prev => ({ ...prev, status: 'APPROVED', approval_percentage: 100 }));
      } else if (data.analysis.can_proceed) {
        setApprovalForm(prev => ({ 
          ...prev, 
          status: 'PARTIALLY_APPROVED', 
          approval_percentage: data.analysis.available_percentage,
          special_approval_reason: `Proceeding with ${data.analysis.available_percentage}% materials available`
        }));
      } else {
        setApprovalForm(prev => ({ 
          ...prev, 
          status: 'PENDING_PROCUREMENT',
          approval_percentage: data.analysis.available_percentage
        }));
      }
    } catch (error) {
      console.error('Error analyzing job materials:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const approveJob = async () => {
    if (!selectedJob) return;

    try {
      await inventoryAPI.approveJob(selectedJob.id, approvalForm);
      // Refresh the pending jobs list
      fetchPendingJobs();
      setSelectedJob(null);
      setAnalysis(null);
    } catch (error) {
      console.error('Error approving job:', error);
    }
  };

  const getStatusBadge = (status: string, percentage?: number) => {
    switch (status) {
      case 'FULLY_AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Fully Available</Badge>;
      case 'PARTIALLY_AVAILABLE':
        return <Badge className="bg-yellow-100 text-yellow-800">{percentage}% Available</Badge>;
      case 'INSUFFICIENT_STOCK':
        return <Badge className="bg-red-100 text-red-800">Insufficient Stock</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Urgent': 'bg-red-500 text-white',
      'High': 'bg-orange-500 text-white',
      'Medium': 'bg-blue-500 text-white',
      'Low': 'bg-gray-500 text-white'
    };
    return <Badge className={colors[priority as keyof typeof colors] || 'bg-gray-500 text-white'}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Job Acceptance Center</h2>
          <p className="text-muted-foreground">Review and approve jobs based on material availability</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {pendingJobs.length} Pending Jobs
        </Badge>
      </div>

      {/* Pending Jobs Grid */}
      {pendingJobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Pending Jobs</h3>
            <p className="text-muted-foreground">All jobs have been processed. Great work!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{job.job_card_id}</CardTitle>
                  {getPriorityBadge(job.priority)}
                </div>
                <CardDescription>
                  {job.company_name} • {job.brand}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-medium">{job.product_item_code}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(job.delivery_date)}</p>
                  </div>
                </div>
                
                {job.approval_status && (
                  <div className="pt-2 border-t">
                    {getStatusBadge(job.approval_status, job.approval_percentage)}
                    {job.approval_remarks && (
                      <p className="text-xs text-muted-foreground mt-1">{job.approval_remarks}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => analyzeJobMaterials(job)}
                    disabled={analyzing && selectedJob?.id === job.id}
                    className="flex-1"
                  >
                    {analyzing && selectedJob?.id === job.id ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Analysis Dialog */}
      <Dialog open={!!selectedJob && !!analysis} onOpenChange={() => {
        setSelectedJob(null);
        setAnalysis(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Analysis: {selectedJob?.job_card_id}
            </DialogTitle>
            <DialogDescription>
              Review material availability and approve job for production
            </DialogDescription>
          </DialogHeader>

          {analysis && (
            <div className="space-y-6">
              {/* Analysis Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">{analysis.available_percentage}%</div>
                      <p className="text-sm text-muted-foreground">Materials Available</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {analysis.can_proceed ? (
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500 mx-auto" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysis.can_proceed ? 'Can Proceed' : 'Cannot Proceed'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-1">
                        {analysis.procurement_needed ? (
                          <ShoppingCart className="h-8 w-8 text-orange-500 mx-auto" />
                        ) : (
                          <Truck className="h-8 w-8 text-blue-500 mx-auto" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analysis.procurement_needed ? 'Procurement Needed' : 'Ready to Ship'}
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={analysis.available_percentage} className="h-3" />
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{analysis.recommendation}</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Material Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Material Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.material_statuses.map((material, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            material.status === 'FULLY_ALLOCATED' ? 'bg-green-500' :
                            material.status === 'PARTIALLY_ALLOCATED' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <div>
                            <p className="font-medium">{material.material_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Required: {material.required_quantity} | Available: {material.available_stock}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            material.status === 'FULLY_ALLOCATED' ? 'default' :
                            material.status === 'PARTIALLY_ALLOCATED' ? 'secondary' : 'destructive'
                          }>
                            {material.allocated_quantity}/{material.required_quantity}
                          </Badge>
                          {material.shortage > 0 && (
                            <p className="text-xs text-red-600 mt-1">Short: {material.shortage}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Approval Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Approval Decision</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="approval-status">Approval Status</Label>
                      <Select 
                        value={approvalForm.status} 
                        onValueChange={(value) => setApprovalForm(prev => ({ ...prev, status: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">Approved</SelectItem>
                          <SelectItem value="PARTIALLY_APPROVED">Partially Approved</SelectItem>
                          <SelectItem value="REJECTED">Rejected</SelectItem>
                          <SelectItem value="PENDING_PROCUREMENT">Pending Procurement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(approvalForm.status === 'PARTIALLY_APPROVED' || approvalForm.status === 'PENDING_PROCUREMENT') && (
                      <div className="space-y-2">
                        <Label htmlFor="approval-percentage">Approval Percentage</Label>
                        <Input
                          id="approval-percentage"
                          type="number"
                          min="0"
                          max="100"
                          value={approvalForm.approval_percentage || ''}
                          onChange={(e) => setApprovalForm(prev => ({ 
                            ...prev, 
                            approval_percentage: parseInt(e.target.value) || 0 
                          }))}
                        />
                      </div>
                    )}
                  </div>

                  {(approvalForm.status === 'PARTIALLY_APPROVED' || approvalForm.status === 'REJECTED') && (
                    <div className="space-y-2">
                      <Label htmlFor="special-reason">Special Approval Reason</Label>
                      <Textarea
                        id="special-reason"
                        placeholder="Explain the reason for partial approval or rejection..."
                        value={approvalForm.special_approval_reason}
                        onChange={(e) => setApprovalForm(prev => ({ 
                          ...prev, 
                          special_approval_reason: e.target.value 
                        }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Additional Remarks</Label>
                    <Textarea
                      id="remarks"
                      placeholder="Any additional notes or instructions..."
                      value={approvalForm.remarks}
                      onChange={(e) => setApprovalForm(prev => ({ 
                        ...prev, 
                        remarks: e.target.value 
                      }))}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button onClick={approveJob} className="flex-1">
                      {approvalForm.status === 'APPROVED' ? 'Approve Job' :
                       approvalForm.status === 'PARTIALLY_APPROVED' ? 'Partially Approve' :
                       approvalForm.status === 'REJECTED' ? 'Reject Job' :
                       'Mark for Procurement'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedJob(null);
                        setAnalysis(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
