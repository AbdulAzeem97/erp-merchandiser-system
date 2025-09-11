import React from 'react';
import { 
  Home,
  Package,
  FileText,
  Users,
  Settings,
  BarChart3,
  Activity,
  User,
  Factory,
  Palette,
  Eye,
  Bell,
  Calendar,
  TrendingUp,
  Layers,
  Target,
  Zap,
  Shield,
  Database,
  Monitor,
  Briefcase,
  PieChart,
  Clock,
  CheckCircle,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { authAPI } from '@/services/api';

interface ModernSidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  page?: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  children?: MenuItem[];
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    page: 'dashboard',
    roles: ['ADMIN', 'MERCHANDISER', 'HOD_PREPRESS', 'DESIGNER', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION']
  }
];

const projectsMenuItems: MenuItem[] = [
  {
    id: 'merchandiser',
    label: 'Merchandiser',
    icon: Briefcase,
    roles: ['ADMIN', 'MERCHANDISER', 'HEAD_OF_MERCHANDISER'],
    children: [
      {
        id: 'create-product',
        label: 'Create Product',
        icon: Package,
        page: 'productForm',
        roles: ['ADMIN', 'MERCHANDISER']
      },
      {
        id: 'create-job',
        label: 'Create Job Order',
        icon: FileText,
        page: 'jobForm',
        roles: ['ADMIN', 'MERCHANDISER']
      },
      {
        id: 'job-monitoring',
        label: 'Job Monitoring',
        icon: Monitor,
        page: 'jobMonitoring',
        badge: 'Live',
        badgeVariant: 'secondary',
        roles: ['ADMIN', 'MERCHANDISER', 'HEAD_OF_MERCHANDISER']
      }
    ]
  },
  {
    id: 'prepress',
    label: 'Prepress',
    icon: Palette,
    roles: ['ADMIN', 'HOD_PREPRESS', 'DESIGNER'],
    children: [
      {
        id: 'hod-dashboard',
        label: 'HOD Dashboard',
        icon: Shield,
        page: 'prepressHOD',
        roles: ['ADMIN', 'HOD_PREPRESS']
      },
      {
        id: 'designer-dashboard',
        label: 'Designer Portal',
        icon: User,
        page: 'prepressDesigner',
        roles: ['ADMIN', 'DESIGNER']
      },
      {
        id: 'job-queue',
        label: 'Job Queue',
        icon: Layers,
        page: 'jobQueue',
        badge: 5,
        badgeVariant: 'outline',
        roles: ['ADMIN', 'HOD_PREPRESS', 'DESIGNER']
      }
    ]
  },
  {
    id: 'production',
    label: 'Production',
    icon: Factory,
    roles: ['ADMIN', 'HEAD_OF_PRODUCTION'],
    children: [
      {
        id: 'production-dashboard',
        label: 'Production Dashboard',
        icon: BarChart3,
        page: 'productionDashboard',
        roles: ['ADMIN', 'HEAD_OF_PRODUCTION']
      },
      {
        id: 'production-schedule',
        label: 'Schedule',
        icon: Calendar,
        page: 'productionSchedule',
        roles: ['ADMIN', 'HEAD_OF_PRODUCTION']
      },
      {
        id: 'quality-control',
        label: 'Quality Control',
        icon: CheckCircle,
        page: 'qualityControl',
        roles: ['ADMIN', 'HEAD_OF_PRODUCTION']
      }
    ]
  }
];

const teamsMenuItems: MenuItem[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    roles: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS'],
    children: [
      {
        id: 'performance-metrics',
        label: 'Performance',
        icon: PieChart,
        page: 'performanceMetrics',
        roles: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS']
      },
      {
        id: 'time-tracking',
        label: 'Time Tracking',
        icon: Clock,
        page: 'timeTracking',
        roles: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS']
      }
    ]
  }
];

const reportsMenuItems: MenuItem[] = [
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    page: 'reports',
    roles: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS']
  },
  {
    id: 'system-monitoring',
    label: 'System Monitor',
    icon: Activity,
    page: 'systemMonitoring',
    badge: 'Live',
    badgeVariant: 'secondary',
    roles: ['ADMIN']
  }
];

const settingsMenuItems: MenuItem[] = [
  {
    id: 'user-management',
    label: 'Users',
    icon: Users,
    page: 'users',
    roles: ['ADMIN']
  },
  {
    id: 'database-management',
    label: 'Database',
    icon: Database,
    page: 'databaseManagement',
    roles: ['ADMIN']
  },
  {
    id: 'system-settings',
    label: 'Settings',
    icon: Settings,
    page: 'settings',
    roles: ['ADMIN']
  }
];

export function ModernSidebar({ currentPage, onNavigate, onLogout }: ModernSidebarProps) {
  const { state } = useSidebar();
  const user = authAPI.getCurrentUser();

  const hasAccess = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role) || user.role === 'ADMIN';
  };

  const filteredMenuItems = (items: MenuItem[]) => items.filter(item => hasAccess(item.roles));

  const renderMenuItems = (items: MenuItem[], inSubmenu = false) => {
    return items.map((item) => {
      if (!hasAccess(item.roles)) return null;

      const isActive = item.page === currentPage;

      if (item.children && item.children.length > 0) {
        const hasActiveChild = item.children.some(child => child.page === currentPage);
        
        return (
          <Collapsible key={item.id} defaultOpen={hasActiveChild}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={hasActiveChild}
                  className="w-full"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.children.map((child) => {
                    if (!hasAccess(child.roles)) return null;
                    
                    const isChildActive = child.page === currentPage;
                    
                    return (
                      <SidebarMenuSubItem key={child.id}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isChildActive}
                        >
                          <button
                            onClick={() => child.page && onNavigate(child.page)}
                            className="flex items-center gap-2 w-full"
                          >
                            <child.icon className="w-4 h-4" />
                            <span>{child.label}</span>
                            {child.badge && (
                              <Badge variant={child.badgeVariant || 'default'} className="ml-auto">
                                {child.badge}
                              </Badge>
                            )}
                          </button>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    );
                  })}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        );
      }

      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            asChild
            tooltip={item.label}
            isActive={isActive}
          >
            <button
              onClick={() => item.page && onNavigate(item.page)}
              className="flex items-center gap-2 w-full"
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && (
                <Badge variant={item.badgeVariant || 'default'} className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  };

  return (
    <Sidebar side="left" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button className="flex items-center gap-3">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-sidebar-primary-foreground">
                  <Package className="size-4 text-white" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">ERP System</span>
                  <span className="truncate text-xs">
                    {user?.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {renderMenuItems(filteredMenuItems(menuItems))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Projects Section */}
        {filteredMenuItems(projectsMenuItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredMenuItems(projectsMenuItems))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Teams Section */}
        {filteredMenuItems(teamsMenuItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Teams</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredMenuItems(teamsMenuItems))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Reports Section */}
        {filteredMenuItems(reportsMenuItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Reports</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredMenuItems(reportsMenuItems))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Settings Section */}
        {filteredMenuItems(settingsMenuItems).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {renderMenuItems(filteredMenuItems(settingsMenuItems))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign out"
            >
              <button
                onClick={onLogout}
                className="flex items-center gap-2 w-full text-red-600 hover:text-red-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}