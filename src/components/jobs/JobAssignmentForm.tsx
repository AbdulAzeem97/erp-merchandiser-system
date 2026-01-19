import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  User,
  Building,
  Package,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Save,
  X,
  Users,
  Flag,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getApiUrl, getApiBaseUrl } from '@/utils/apiConfig';

interface Company {
  id: string;
  name: string;
}

interface Product {
  id: string;
  product_item_code: string;
  brand: string;
}

interface Designer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  active_jobs: number;
}

interface JobAssignmentFormProps {
  onJobCreated?: (job: any) => void;
  onClose?: () => void;
}

const JobAssignmentForm: React.FC<JobAssignmentFormProps> = ({ onJobCreated, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [formData, setFormData] = useState({
    jobCardId: '',
    companyId: '',
    productId: '',
    quantity: '',
    deliveryDate: '',
    targetDate: '',
    customerNotes: '',
    specialInstructions: '',
    priority: 'MEDIUM',
    assignedDesignerId: '',
    assignPriority: 'MEDIUM',
    assignDueDate: '',
    assignNotes: ''
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const apiUrl = getApiUrl();
      const [companiesRes, productsRes, designersRes] = await Promise.all([
        fetch(`${apiUrl}/api/companies`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/products`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/job-assignment/designers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData.data || []);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);
      }

      if (designersRes.ok) {
        const designersData = await designersRes.json();
        setDesigners(designersData.data || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Error loading form data');
    }
  };

  const generateJobCardId = () => {
    const timestamp = Date.now();
    return `JC-${timestamp}`;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      
      // First create the job card
      const jobCardData = {
        job_card_id: formData.jobCardId || generateJobCardId(),
        product_id: formData.productId,
        company_id: formData.companyId,
        quantity: parseInt(formData.quantity),
        delivery_date: formData.deliveryDate,
        target_date: formData.targetDate,
        customer_notes: formData.customerNotes,
        special_instructions: formData.specialInstructions,
        priority: formData.priority,
        status: 'PENDING'
      };

      const apiBaseUrl = getApiBaseUrl();
      const jobResponse = await fetch(`${apiBaseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobCardData)
      });

      if (!jobResponse.ok) {
        const error = await jobResponse.json();
        throw new Error(error.error || 'Failed to create job');
      }

      const jobResult = await jobResponse.json();
      const jobCardId = jobResult.job.job_card_id;

      // If a designer is selected, assign the job to them
      if (formData.assignedDesignerId) {
        const assignmentData = {
          jobCardId: jobCardId,
          designerId: formData.assignedDesignerId,
          priority: formData.assignPriority,
          dueDate: formData.assignDueDate,
          notes: formData.assignNotes
        };

        const assignmentResponse = await fetch(`${apiBaseUrl}/job-assignment/assign`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(assignmentData)
        });

        if (!assignmentResponse.ok) {
          const error = await assignmentResponse.json();
          throw new Error(error.error || 'Failed to assign job to designer');
        }

        const assignmentResult = await assignmentResponse.json();
        toast.success(`Job created and assigned to designer successfully!`);
        
        if (onJobCreated) {
          onJobCreated(assignmentResult.data);
        }
      } else {
        toast.success('Job created successfully!');
        
        if (onJobCreated) {
          onJobCreated(jobResult.job);
        }
      }

      // Reset form
      setFormData({
        jobCardId: '',
        companyId: '',
        productId: '',
        quantity: '',
        deliveryDate: '',
        targetDate: '',
        customerNotes: '',
        specialInstructions: '',
        priority: 'MEDIUM',
        assignedDesignerId: '',
        assignPriority: 'MEDIUM',
        assignDueDate: '',
        assignNotes: ''
      });

      setIsOpen(false);
      if (onClose) onClose();

    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(error instanceof Error ? error.message : 'Error creating job');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCompany = companies.find(c => c.id === formData.companyId);
  const selectedProduct = products.find(p => p.id === formData.productId);
  const selectedDesigner = designers.find(d => d.id === formData.assignedDesignerId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Create & Assign Job
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Create Job & Assign to Designer</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Card Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Job Card Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobCardId">Job Card ID</Label>
                  <Input
                    id="jobCardId"
                    value={formData.jobCardId}
                    onChange={(e) => handleInputChange('jobCardId', e.target.value)}
                    placeholder="Leave empty for auto-generation"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Select value={formData.companyId} onValueChange={(value) => handleInputChange('companyId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="product">Product</Label>
                  <Select value={formData.productId} onValueChange={(value) => handleInputChange('productId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.brand} ({product.product_item_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={formData.deliveryDate}
                    onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => handleInputChange('targetDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="customerNotes">Customer Notes</Label>
                  <Textarea
                    id="customerNotes"
                    value={formData.customerNotes}
                    onChange={(e) => handleInputChange('customerNotes', e.target.value)}
                    placeholder="Enter customer notes..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions}
                    onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                    placeholder="Enter special instructions..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Designer Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Designer Assignment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="designer">Assign to Designer</Label>
                <Select value={formData.assignedDesignerId} onValueChange={(value) => handleInputChange('assignedDesignerId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select designer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {designers.map((designer) => (
                      <SelectItem key={designer.id} value={designer.id}>
                        {designer.first_name} {designer.last_name} ({designer.active_jobs} active jobs)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.assignedDesignerId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex items-center space-x-2 text-blue-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Assignment Details</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="assignPriority">Assignment Priority</Label>
                      <Select value={formData.assignPriority} onValueChange={(value) => handleInputChange('assignPriority', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="assignDueDate">Assignment Due Date</Label>
                      <Input
                        id="assignDueDate"
                        type="datetime-local"
                        value={formData.assignDueDate}
                        onChange={(e) => handleInputChange('assignDueDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="assignNotes">Assignment Notes</Label>
                    <Textarea
                      id="assignNotes"
                      value={formData.assignNotes}
                      onChange={(e) => handleInputChange('assignNotes', e.target.value)}
                      placeholder="Add notes for the designer..."
                      rows={3}
                    />
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {(selectedCompany || selectedProduct || selectedDesigner) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Job Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedCompany && (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Company:</span>
                      <Badge variant="outline">{selectedCompany.name}</Badge>
                    </div>
                  )}
                  {selectedProduct && (
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Product:</span>
                      <Badge variant="outline">{selectedProduct.brand} ({selectedProduct.product_item_code})</Badge>
                    </div>
                  )}
                  {selectedDesigner && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Designer:</span>
                      <Badge variant="outline">{selectedDesigner.first_name} {selectedDesigner.last_name}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JobAssignmentForm;
