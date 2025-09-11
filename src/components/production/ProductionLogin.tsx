import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Factory, 
  User, 
  Lock, 
  LogIn, 
  Building2, 
  Users, 
  Settings, 
  Shield,
  Crown,
  Wrench,
  Eye,
  AlertCircle
} from 'lucide-react';

interface ProductionLoginProps {
  onLogin: (userData: ProductionUserData) => void;
}

interface ProductionUserData {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  production_roles: Array<{
    id: string;
    department_id: string;
    department_name: string;
    department_code: string;
    role_type: string;
    permissions: string[];
    can_approve_jobs: boolean;
    can_assign_jobs: boolean;
    max_priority_level: number;
  }>;
  has_director_access: boolean;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  hierarchy_level: number;
  color_code: string;
}

const ProductionLogin: React.FC<ProductionLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    loadInitialData();
    generateDemoUsers();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load departments for context
      const response = await fetch('/api/complete-production/hierarchy');
      if (response.ok) {
        const hierarchy = await response.json();
        const flatDepartments = flattenHierarchy(hierarchy);
        setDepartments(flatDepartments);
      }
    } catch (err) {
      console.log('Could not load departments - using mock data');
    }
  };

  const flattenHierarchy = (hierarchy: any[]): Department[] => {
    const result: Department[] = [];
    
    const flatten = (items: any[], level: number = 0) => {
      items.forEach(item => {
        result.push({
          id: item.id,
          name: item.name,
          code: item.code,
          description: item.description,
          hierarchy_level: level,
          color_code: item.color_code || '#6b7280'
        });
        
        if (item.children && item.children.length > 0) {
          flatten(item.children, level + 1);
        }
      });
    };
    
    flatten(hierarchy);
    return result;
  };

  const generateDemoUsers = () => {
    const users = [
      // Production Director
      {
        id: 'user-director',
        username: 'director',
        password: 'director123',
        first_name: 'John',
        last_name: 'Director',
        email: 'director@company.com',
        role_type: 'DIRECTOR',
        department_name: 'Production Director',
        department_code: 'PROD-DIR',
        description: 'Complete production oversight and management',
        permissions: ['ALL_PERMISSIONS'],
        has_director_access: true
      },
      // Department Heads (HODs)
      {
        id: 'user-offset-hod',
        username: 'offset_hod',
        password: 'offset123',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@company.com',
        role_type: 'HOD',
        department_name: 'Offset Printing',
        department_code: 'OFFSET',
        description: 'Head of Offset Printing Department',
        permissions: ['MANAGE_DEPARTMENT', 'ASSIGN_SUPERVISORS', 'APPROVE_DEPARTMENT_JOBS'],
        has_director_access: false
      },
      {
        id: 'user-heat-hod',
        username: 'heat_hod',
        password: 'heat123',
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@company.com',
        role_type: 'HOD',
        department_name: 'Heat Transfer Label',
        department_code: 'HEAT-TXR',
        description: 'Head of Heat Transfer Department',
        permissions: ['MANAGE_DEPARTMENT', 'ASSIGN_SUPERVISORS', 'APPROVE_DEPARTMENT_JOBS'],
        has_director_access: false
      },
      {
        id: 'user-pfl-hod',
        username: 'pfl_hod',
        password: 'pfl123',
        first_name: 'Lisa',
        last_name: 'Wong',
        email: 'lisa.wong@company.com',
        role_type: 'HOD',
        department_name: 'PFL (Printed Film Labels)',
        department_code: 'PFL',
        description: 'Head of PFL Department',
        permissions: ['MANAGE_DEPARTMENT', 'ASSIGN_SUPERVISORS', 'APPROVE_DEPARTMENT_JOBS'],
        has_director_access: false
      },
      {
        id: 'user-woven-hod',
        username: 'woven_hod',
        password: 'woven123',
        first_name: 'David',
        last_name: 'Kumar',
        email: 'david.kumar@company.com',
        role_type: 'HOD',
        department_name: 'Woven Labels',
        department_code: 'WOVL',
        description: 'Head of Woven Labels Department',
        permissions: ['MANAGE_DEPARTMENT', 'ASSIGN_SUPERVISORS', 'APPROVE_DEPARTMENT_JOBS'],
        has_director_access: false
      },
      {
        id: 'user-leather-hod',
        username: 'leather_hod',
        password: 'leather123',
        first_name: 'Maria',
        last_name: 'Rodriguez',
        email: 'maria.rodriguez@company.com',
        role_type: 'HOD',
        department_name: 'Leather Patch',
        department_code: 'LEATHER',
        description: 'Head of Leather Patch Department',
        permissions: ['MANAGE_DEPARTMENT', 'ASSIGN_SUPERVISORS', 'APPROVE_DEPARTMENT_JOBS'],
        has_director_access: false
      },
      {
        id: 'user-digital-hod',
        username: 'digital_hod',
        password: 'digital123',
        first_name: 'James',
        last_name: 'Smith',
        email: 'james.smith@company.com',
        role_type: 'HOD',
        department_name: 'Digital Printing',
        department_code: 'DIGITAL',
        description: 'Head of Digital Printing Department',
        permissions: ['MANAGE_DEPARTMENT', 'ASSIGN_SUPERVISORS', 'APPROVE_DEPARTMENT_JOBS'],
        has_director_access: false
      },
      // Supervisors
      {
        id: 'user-offset-supervisor',
        username: 'offset_sup',
        password: 'sup123',
        first_name: 'Robert',
        last_name: 'Taylor',
        email: 'robert.taylor@company.com',
        role_type: 'SUPERVISOR',
        department_name: 'Offset Printing',
        department_code: 'OFFSET',
        description: 'Offset Printing Supervisor',
        permissions: ['ASSIGN_JOBS', 'UPDATE_JOB_STATUS', 'MANAGE_MATERIALS'],
        has_director_access: false
      },
      {
        id: 'user-prepress-supervisor',
        username: 'prepress_sup',
        password: 'prep123',
        first_name: 'Amanda',
        last_name: 'Wilson',
        email: 'amanda.wilson@company.com',
        role_type: 'SUPERVISOR',
        department_name: 'Offset Prepress',
        department_code: 'OFF-PREP',
        description: 'Prepress Supervisor',
        permissions: ['ASSIGN_JOBS', 'UPDATE_JOB_STATUS', 'CONDUCT_QUALITY_CHECK'],
        has_director_access: false
      },
      // Operators
      {
        id: 'user-offset-operator',
        username: 'offset_op',
        password: 'op123',
        first_name: 'Carlos',
        last_name: 'Garcia',
        email: 'carlos.garcia@company.com',
        role_type: 'OPERATOR',
        department_name: 'Offset Printing',
        department_code: 'OFFSET',
        description: 'Offset Printing Machine Operator',
        permissions: ['VIEW_ASSIGNED_JOBS', 'UPDATE_OWN_JOB_STATUS', 'RECORD_MATERIAL_CONSUMPTION'],
        has_director_access: false
      },
      {
        id: 'user-digital-operator',
        username: 'digital_op',
        password: 'dop123',
        first_name: 'Jennifer',
        last_name: 'Lee',
        email: 'jennifer.lee@company.com',
        role_type: 'OPERATOR',
        department_name: 'Digital Printing',
        department_code: 'DIGITAL',
        description: 'Digital Printing Operator',
        permissions: ['VIEW_ASSIGNED_JOBS', 'UPDATE_OWN_JOB_STATUS', 'RECORD_MATERIAL_CONSUMPTION'],
        has_director_access: false
      },
      // Quality Inspector
      {
        id: 'user-quality-inspector',
        username: 'quality_qc',
        password: 'qc123',
        first_name: 'Thomas',
        last_name: 'Anderson',
        email: 'thomas.anderson@company.com',
        role_type: 'QUALITY_INSPECTOR',
        department_name: 'Quality Control',
        department_code: 'QC',
        description: 'Quality Control Inspector',
        permissions: ['CONDUCT_QUALITY_INSPECTIONS', 'APPROVE_QUALITY', 'REJECT_QUALITY'],
        has_director_access: false
      }
    ];

    setDemoUsers(users);
  };

  const getRoleIcon = (roleType: string) => {
    switch (roleType) {
      case 'DIRECTOR':
        return <Crown className="h-5 w-5 text-purple-600" />;
      case 'HOD':
        return <Shield className="h-5 w-5 text-blue-600" />;
      case 'SUPERVISOR':
        return <Users className="h-5 w-5 text-green-600" />;
      case 'OPERATOR':
        return <Wrench className="h-5 w-5 text-orange-600" />;
      case 'QUALITY_INSPECTOR':
        return <Eye className="h-5 w-5 text-red-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
      case 'DIRECTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'HOD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUPERVISOR':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'OPERATOR':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'QUALITY_INSPECTOR':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // For demo purposes, simulate login with demo users
      const user = demoUsers.find(u => u.username === username && u.password === password);
      
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Simulate successful login
      const userData: ProductionUserData = {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        production_roles: [{
          id: `role-${user.id}`,
          department_id: user.department_code.toLowerCase(),
          department_name: user.department_name,
          department_code: user.department_code,
          role_type: user.role_type,
          permissions: user.permissions,
          can_approve_jobs: user.role_type === 'DIRECTOR' || user.role_type === 'HOD',
          can_assign_jobs: user.role_type === 'DIRECTOR' || user.role_type === 'HOD' || user.role_type === 'SUPERVISOR',
          max_priority_level: user.role_type === 'DIRECTOR' ? 4 : user.role_type === 'HOD' ? 3 : 2
        }],
        has_director_access: user.has_director_access
      };

      // Store login data
      localStorage.setItem('production_user', JSON.stringify(userData));
      localStorage.setItem('token', `demo_token_${user.id}`);

      onLogin(userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (user: any) => {
    setUsername(user.username);
    setPassword(user.password);
    setSelectedRole(user.role_type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto lg:mx-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <Factory className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Production System Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the production management system
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>Loading...</>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to Production System
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowDemo(!showDemo)}
                className="w-full"
              >
                {showDemo ? 'Hide' : 'Show'} Demo Accounts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Users Panel */}
        <div className="space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Production Hierarchy System</h2>
            <p className="text-gray-600 mb-4">
              Complete production management with role-based access control for all manufacturing departments.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 border">
                <Building2 className="h-8 w-8 text-blue-600 mb-2" />
                <h3 className="font-semibold">6 Main Departments</h3>
                <p className="text-sm text-gray-600">Offset, Heat Transfer, PFL, Woven, Leather, Digital</p>
              </div>
              <div className="bg-white rounded-lg p-4 border">
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <h3 className="font-semibold">5 Role Types</h3>
                <p className="text-sm text-gray-600">Director, HOD, Supervisor, Operator, QC Inspector</p>
              </div>
            </div>
          </div>

          {showDemo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Demo User Accounts
                </CardTitle>
                <CardDescription>
                  Click on any user to auto-fill login credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {demoUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleDemoLogin(user)}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getRoleIcon(user.role_type)}
                        <div>
                          <div className="font-medium">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-600">{user.department_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getRoleBadgeColor(user.role_type)}>
                          {user.role_type}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {user.username}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>System Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Director Access</h4>
                    <p className="text-sm text-gray-600">Complete system oversight with all permissions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Department Heads</h4>
                    <p className="text-sm text-gray-600">Manage specific departments and assign roles</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Supervisors</h4>
                    <p className="text-sm text-gray-600">Assign jobs and monitor team performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Wrench className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Operators</h4>
                    <p className="text-sm text-gray-600">Execute production tasks and update status</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductionLogin;