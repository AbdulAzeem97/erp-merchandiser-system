import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { jobsAPI } from '../services/api';

interface Job {
  id: number;
  jobNumber: string;
  productId: number;
  productCode?: string;
  brand?: string;
  companyName?: string;
  quantity: number;
  dueDate: string;
  status: string;
  urgency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  po_number?: string;
  without_po?: boolean;
}

interface JobEditFormProps {
  job: Job;
  onSave: (updatedJob: Job) => void;
  onCancel: () => void;
  onClose: () => void;
}

export const JobEditForm: React.FC<JobEditFormProps> = ({
  job,
  onSave,
  onCancel,
  onClose
}) => {
  const [formData, setFormData] = useState({
    jobNumber: job.jobNumber,
    quantity: job.quantity,
    dueDate: job.dueDate.split('T')[0], // Format for date input
    status: job.status,
    urgency: job.urgency,
    notes: job.notes || '',
    poNumber: job.po_number || '',
    withoutPo: job.without_po || false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Update PO number if changed
      if (formData.poNumber !== job.po_number || formData.withoutPo !== job.without_po) {
        try {
          await jobsAPI.updatePONumber(job.id.toString(), {
            po_number: formData.withoutPo ? '' : formData.poNumber,
            without_po: formData.withoutPo
          });
        } catch (error: any) {
          console.error('Error updating PO number:', error);
          // Continue with other updates even if PO update fails
        }
      }

      const updatedJob = await jobsAPI.update(job.id.toString(), {
        job_card_id: formData.jobNumber,
        quantity: formData.quantity,
        delivery_date: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        priority: formData.urgency,
        customer_notes: formData.notes
      });

      onSave(updatedJob.job);
      onClose();
    } catch (error: any) {
      console.error('Error updating job:', error);
      setError(error.message || 'Failed to update job');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">Edit Job</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jobNumber">Job Number</Label>
                  <Input
                    id="jobNumber"
                    value={formData.jobNumber}
                    onChange={(e) => handleInputChange('jobNumber', e.target.value)}
                    placeholder="e.g., JC-001234"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value))}
                    placeholder="Enter quantity"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Priority</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => handleInputChange('urgency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="poNumber">PO Number</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="checkbox"
                      id="withoutPo"
                      checked={formData.withoutPo}
                      onChange={(e) => {
                        handleInputChange('withoutPo', e.target.checked);
                        if (e.target.checked) {
                          handleInputChange('poNumber', '');
                        }
                      }}
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <Label htmlFor="withoutPo" className="text-sm text-gray-700 cursor-pointer">
                      Job without PO number
                    </Label>
                  </div>
                  <Input
                    id="poNumber"
                    value={formData.poNumber}
                    onChange={(e) => handleInputChange('poNumber', e.target.value)}
                    placeholder={formData.withoutPo ? "Will be added later" : "Enter PO number"}
                    disabled={formData.withoutPo}
                    className={formData.withoutPo ? 'bg-gray-100 cursor-not-allowed' : ''}
                  />
                  {job.without_po && (
                    <p className="text-xs text-amber-700 mt-1">
                      This job was created without a PO number. You can add it now.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

              {/* Job Info Display */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Job Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Product Code:</span>
                    <span className="ml-2 font-medium">{job.productCode || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Brand:</span>
                    <span className="ml-2 font-medium">{job.brand || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Company:</span>
                    <span className="ml-2 font-medium">{job.companyName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};
