import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  User,
  Calendar,
  FileText,
  Image as ImageIcon,
  Download,
  Upload,
  Eye,
  Edit,
  Settings,
  ChevronDown,
  ChevronUp,
  Star,
  Flag,
  Timer,
  Target,
  TrendingUp,
  BarChart3,
  MessageSquare,
  Paperclip,
  Camera,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JobStageData {
  id: string;
  name: string;
  department: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  estimatedDuration?: string;
  actualDuration?: string;
  notes?: string;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedBy: string;
    uploadedAt: string;
  }>;
  qualityCheck?: {
    passed: boolean;
    checkedBy: string;
    checkedAt: string;
    notes?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies?: string[];
  milestones?: Array<{
    id: string;
    name: string;
    completed: boolean;
    completedAt?: string;
  }>;
  metrics?: {
    efficiency: number;
    quality: number;
    onTimeDelivery: boolean;
  };
}

interface JobStageCardProps {
  stage: JobStageData;
  onUpdate?: (stageId: string, updates: Partial<JobStageData>) => void;
  onFileUpload?: (stageId: string, file: File) => void;
  onAddNote?: (stageId: string, note: string) => void;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

const JobStageCard: React.FC<JobStageCardProps> = ({
  stage,
  onUpdate,
  onFileUpload,
  onAddNote,
  expanded = false,
  onToggleExpanded
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      case 'skipped': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress': return <Play className="w-5 h-5 text-blue-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
      case 'blocked': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'skipped': return <RotateCcw className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleStatusChange = (newStatus: JobStageData['status']) => {
    onUpdate?.(stage.id, { status: newStatus });
  };

  const handleProgressChange = (newProgress: number) => {
    onUpdate?.(stage.id, { progress: newProgress });
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote?.(stage.id, newNote);
      setNewNote('');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <CardHeader 
          className="cursor-pointer"
          onClick={onToggleExpanded}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getStatusIcon(stage.status)}
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {stage.name}
                </CardTitle>
                <p className="text-sm text-gray-600">{stage.department}</p>
                {stage.assignedTo && (
                  <p className="text-xs text-gray-500 flex items-center mt-1">
                    <User className="w-3 h-3 mr-1" />
                    {stage.assignedTo}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{stage.progress}%</div>
                <Progress value={stage.progress} className="w-20 h-2" />
              </div>
              <div className="flex flex-col items-end space-y-1">
                <Badge className={`${getPriorityColor(stage.priority)} text-xs`}>
                  <Flag className="w-3 h-3 mr-1" />
                  {stage.priority}
                </Badge>
                <Badge className={`${getStatusColor(stage.status)} text-xs`}>
                  {stage.status.replace('_', ' ')}
                </Badge>
              </div>
              {expanded ? 
                <ChevronUp className="w-5 h-5 text-gray-400" /> : 
                <ChevronDown className="w-5 h-5 text-gray-400" />
              }
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CardContent className="pt-0">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Stage Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            <div className="flex space-x-2">
                              {['pending', 'in_progress', 'completed', 'blocked'].map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={stage.status === status ? 'default' : 'outline'}
                                  onClick={() => handleStatusChange(status as JobStageData['status'])}
                                  className="text-xs"
                                >
                                  {status.replace('_', ' ')}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Progress:</span>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={stage.progress}
                                onChange={(e) => handleProgressChange(parseInt(e.target.value))}
                                className="w-16 h-8 text-sm"
                              />
                              <span className="text-sm">%</span>
                            </div>
                          </div>
                          {stage.estimatedDuration && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Estimated:</span>
                              <span className="text-gray-900">{stage.estimatedDuration}</span>
                            </div>
                          )}
                          {stage.actualDuration && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Actual:</span>
                              <span className="text-gray-900">{stage.actualDuration}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Quality & Metrics</h4>
                        <div className="space-y-2 text-sm">
                          {stage.qualityCheck && (
                            <div className="flex justify-between items-center">
                              <span className="text-gray-600">Quality Check:</span>
                              <div className="flex items-center space-x-2">
                                {stage.qualityCheck.passed ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span className={stage.qualityCheck.passed ? 'text-green-600' : 'text-red-600'}>
                                  {stage.qualityCheck.passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            </div>
                          )}
                          {stage.metrics && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Efficiency:</span>
                                <span className="text-gray-900">{stage.metrics.efficiency}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Quality Score:</span>
                                <span className="text-gray-900">{stage.metrics.quality}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">On Time:</span>
                                <span className={stage.metrics.onTimeDelivery ? 'text-green-600' : 'text-red-600'}>
                                  {stage.metrics.onTimeDelivery ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {stage.milestones && stage.milestones.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900">Milestones</h4>
                        <div className="space-y-2">
                          {stage.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              {milestone.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{milestone.name}</p>
                                {milestone.completedAt && (
                                  <p className="text-xs text-gray-500">Completed: {milestone.completedAt}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Timeline Details</h4>
                      <div className="space-y-3">
                        {stage.startDate && (
                          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-gray-900">Start Date</p>
                              <p className="text-sm text-gray-600">{stage.startDate}</p>
                            </div>
                          </div>
                        )}
                        {stage.endDate && (
                          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-gray-900">End Date</p>
                              <p className="text-sm text-gray-600">{stage.endDate}</p>
                            </div>
                          </div>
                        )}
                        {stage.estimatedDuration && (
                          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                            <Timer className="w-5 h-5 text-yellow-600" />
                            <div>
                              <p className="font-medium text-gray-900">Estimated Duration</p>
                              <p className="text-sm text-gray-600">{stage.estimatedDuration}</p>
                            </div>
                          </div>
                        )}
                        {stage.actualDuration && (
                          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                            <Target className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-medium text-gray-900">Actual Duration</p>
                              <p className="text-sm text-gray-600">{stage.actualDuration}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="files" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Files & Documents</h4>
                      <Button size="sm" onClick={() => setShowFileUpload(!showFileUpload)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>

                    {showFileUpload && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="space-y-3">
                          <Label htmlFor="file-upload">Choose files to upload</Label>
                          <Input
                            id="file-upload"
                            type="file"
                            multiple
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach(file => {
                                  onFileUpload?.(stage.id, file);
                                });
                              }
                            }}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      {stage.files && stage.files.length > 0 ? (
                        stage.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-600">
                                  {file.size} • Uploaded by {file.uploadedBy} on {file.uploadedAt}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No files uploaded yet</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Notes & Comments</h4>
                      
                      <div className="space-y-3">
                        <div className="flex space-x-2">
                          <Textarea
                            placeholder="Add a note or comment..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {stage.notes && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <MessageSquare className="w-5 h-5 text-gray-400 mt-1" />
                            <div className="flex-1">
                              <p className="text-gray-900">{stage.notes}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                Added by {stage.assignedTo} • {stage.startDate}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default JobStageCard;

