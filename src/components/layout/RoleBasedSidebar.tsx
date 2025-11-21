import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Warehouse,
  ShoppingCart,
  TrendingDown,
  Box,
  ClipboardList,
  Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { authAPI } from '@/services/api';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  page?: string;
  badge?: string | number;
  badgeColor?: string;
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
  },
  
  // Merchandiser Section
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
        badgeColor: 'bg-green-500',
        roles: ['ADMIN', 'MERCHANDISER', 'HEAD_OF_MERCHANDISER']
      },
      {
        id: 'my-jobs',
        label: 'My Jobs',
        icon: Eye,
        page: 'myJobs',
        roles: ['ADMIN', 'MERCHANDISER']
      }
    ]
  },

  // Prepress Section
  {
    id: 'prepress',
    label: 'Prepress',
    icon: Palette,
    roles: ['ADMIN', 'HOD_PREPRESS', 'DESIGNER', 'QA', 'QA_PREPRESS'],
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
        page: 'designer-dashboard',
        roles: ['ADMIN', 'DESIGNER']
      },
      {
        id: 'qa-dashboard',
        label: 'QA Prepress Dashboard',
        icon: CheckCircle,
        page: 'qa-dashboard',
        roles: ['ADMIN', 'QA', 'QA_PREPRESS']
      },
      {
        id: 'job-queue',
        label: 'Job Queue',
        icon: Layers,
        page: 'jobQueue',
        roles: ['ADMIN', 'HOD_PREPRESS', 'DESIGNER']
      },
      {
        id: 'design-resources',
        label: 'Design Resources',
        icon: Target,
        page: 'designResources',
        roles: ['ADMIN', 'HOD_PREPRESS', 'DESIGNER']
      }
    ]
  },

  // CTP Section (Standalone for CTP Operators)
  {
    id: 'ctp',
    label: 'CTP Department',
    icon: Layers,
    page: 'ctp-dashboard',
    roles: ['ADMIN', 'CTP_OPERATOR']
  },

  // Cutting Section (Standalone for Cutting Department)
  {
    id: 'cutting',
    label: 'Cutting Department',
    icon: Scissors,
    page: 'cutting-dashboard',
    roles: ['ADMIN', 'HOD_CUTTING']
  },

  // Production Section (Standalone for Production Department)
  {
    id: 'production',
    label: 'Production Department',
    icon: Factory,
    page: 'production-dashboard',
    roles: ['ADMIN', 'HOD_PRODUCTION', 'PRODUCTION_OPERATOR', 'HEAD_OF_PRODUCTION']
  },
  {
    id: 'smart-production-dashboard',
    label: 'Smart Production Dashboard',
    icon: TrendingUp,
    page: 'smart-production-dashboard',
    roles: ['ADMIN', 'PRODUCTION_MANAGER', 'CUTTING_HEAD', 'MERCHANDISER', 'DIRECTOR', 'FINANCE']
  },

  // Analytics & Reports
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
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        page: 'reports',
        roles: ['ADMIN', 'HEAD_OF_MERCHANDISER', 'HEAD_OF_PRODUCTION', 'HOD_PREPRESS']
      }
    ]
  },

  // Inventory Management
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Warehouse,
    roles: ['ADMIN', 'INVENTORY_MANAGER'],
    children: [
      {
        id: 'inventory-dashboard',
        label: 'Dashboard',
        icon: Home,
        page: 'inventory-dashboard',
        roles: ['ADMIN', 'INVENTORY_MANAGER']
      },
      {
        id: 'inventory-items',
        label: 'Items',
        icon: Box,
        page: 'inventory-items',
        roles: ['ADMIN', 'INVENTORY_MANAGER']
      },
      {
        id: 'inventory-transactions',
        label: 'Transactions',
        icon: Activity,
        page: 'inventory-transactions',
        roles: ['ADMIN', 'INVENTORY_MANAGER']
      },
      {
        id: 'inventory-categories',
        label: 'Categories & Locations',
        icon: Layers,
        page: 'inventory-categories',
        roles: ['ADMIN', 'INVENTORY_MANAGER']
      },
      {
        id: 'inventory-reports',
        label: 'Reports',
        icon: BarChart3,
        page: 'inventory-reports',
        roles: ['ADMIN', 'INVENTORY_MANAGER']
      }
    ]
  },

  // Procurement Management
  {
    id: 'procurement',
    label: 'Procurement',
    icon: ShoppingCart,
    roles: ['ADMIN', 'PROCUREMENT_MANAGER'],
    children: [
      {
        id: 'procurement-dashboard',
        label: 'Dashboard',
        icon: Home,
        page: 'procurement-dashboard',
        roles: ['ADMIN', 'PROCUREMENT_MANAGER']
      },
      {
        id: 'procurement-suppliers',
        label: 'Suppliers',
        icon: Users,
        page: 'procurement-suppliers',
        roles: ['ADMIN', 'PROCUREMENT_MANAGER']
      },
      {
        id: 'procurement-purchase-orders',
        label: 'Purchase Orders',
        icon: ClipboardList,
        page: 'procurement-purchase-orders',
        roles: ['ADMIN', 'PROCUREMENT_MANAGER']
      },
      {
        id: 'procurement-reports',
        label: 'Reports',
        icon: BarChart3,
        page: 'procurement-reports',
        roles: ['ADMIN', 'PROCUREMENT_MANAGER']
      }
    ]
  },

  // Management
  {
    id: 'management',
    label: 'Management',
    icon: Settings,
    roles: ['ADMIN'],
    children: [
      {
        id: 'user-management',
        label: 'Users',
        icon: Users,
        page: 'users',
        roles: ['ADMIN']
      },
      {
        id: 'system-monitoring',
        label: 'System Monitor',
        icon: Activity,
        page: 'systemMonitoring',
        badge: 'Live',
        badgeColor: 'bg-blue-500',
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
    ]
  }
];

export const RoleBasedSidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  onLogout,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileToggle
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(12);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    
    // Auto-expand current section
    if (currentUser) {
      const currentItem = findCurrentMenuItem(currentPage);
      if (currentItem?.parentId) {
        setExpandedItems(prev => [...prev, currentItem.parentId]);
      }
    }
  }, [currentPage]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 1024;
      setIsMobile(isMobileSize);
      
      // Close mobile sidebar when switching to desktop
      if (!isMobileSize && isMobileOpen && onMobileToggle) {
        onMobileToggle();
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [isMobileOpen, onMobileToggle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        if (isMobile && onMobileToggle) {
          onMobileToggle();
        } else if (onToggleCollapse) {
          onToggleCollapse();
        }
      }
      // Escape to close mobile sidebar
      if (event.key === 'Escape' && isMobile && isMobileOpen && onMobileToggle) {
        onMobileToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isMobileOpen, onMobileToggle, onToggleCollapse]);

  const findCurrentMenuItem = (page: string, items = menuItems, parentId?: string): any => {
    for (const item of items) {
      if (item.page === page) {
        return { ...item, parentId };
      }
      if (item.children) {
        const found = findCurrentMenuItem(page, item.children, item.id);
        if (found) return found;
      }
    }
    return null;
  };

  const hasAccess = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role) || user.role === 'ADMIN';
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Filter menu items based on role
  // HOD_CUTTING, CUTTING_LABOR, HOD_PRODUCTION, PRODUCTION_OPERATOR should only see their department items
  const filteredMenuItems = (() => {
    if (user?.role === 'HOD_CUTTING' || user?.role === 'CUTTING_LABOR') {
      // Only show cutting department menu
      return menuItems.filter(item => 
        item.id === 'cutting' && hasAccess(item.roles)
      );
    }
    if (user?.role === 'HOD_PRODUCTION' || user?.role === 'PRODUCTION_OPERATOR') {
      // Only show production department menu
      return menuItems.filter(item => 
        item.id === 'production' && hasAccess(item.roles)
      );
    }
    // For other roles, show all accessible items
    return menuItems.filter(item => hasAccess(item.roles));
  })();

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasAccess(item.roles)) return null;

    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.page === currentPage;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="w-full">
        <motion.div
          whileHover={{ x: level === 0 ? 4 : 2 }}
          whileTap={{ scale: 0.98 }}
          className={`
            flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200
            ${isCollapsed && !isMobile ? 'px-2 py-3 justify-center' : 'px-4 py-3'}
            ${level > 0 && !isCollapsed ? 'ml-6 pl-8' : ''}
            ${isActive 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
              : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'
            }
          `}
          onClick={() => {
            if (hasChildren && !isCollapsed) {
              toggleExpanded(item.id);
            } else if (item.page) {
              onNavigate(item.page);
            }
          }}
          title={isCollapsed && !isMobile ? item.label : undefined}
        >
          <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
          
          {!isCollapsed && (
            <>
              <span className="flex-1 font-medium">{item.label}</span>
              
              {item.badge && (
                <Badge 
                  className={`px-2 py-1 text-xs ${
                    item.badgeColor || 'bg-blue-500'
                  } text-white border-none`}
                >
                  {item.badge}
                </Badge>
              )}
              
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {hasChildren && !isCollapsed && (
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="space-y-1 mt-1">
              <AnimatePresence>
                {item.children?.map(child => 
                  <motion.div
                    key={child.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderMenuItem(child, level + 1)}
                  </motion.div>
                )}
              </AnimatePresence>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: isMobile ? 320 : (isCollapsed ? 80 : 320)
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 40,
          duration: 0.3
        }}
        className={`
          fixed lg:relative top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-xl flex flex-col z-50
          ${isMobile ? 'w-80' : ''}
        `}
        style={{
          transform: isMobile ? `translateX(${isMobileOpen ? '0' : '-100%'})` : 'none'
        }}
      >
        {/* Header */}
        <div className={`${isCollapsed && !isMobile ? 'p-2' : 'p-4 lg:p-6'} border-b border-gray-200`}>
          <div className="flex items-center justify-between">
            {(!isCollapsed || isMobile) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">ERP System</h2>
                  <p className="text-xs text-gray-500">
                    {user?.role?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Collapsed state - show only icon */}
            {isCollapsed && !isMobile && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center w-full"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </motion.div>
            )}
            
            <div className="flex items-center gap-2">
              {/* Mobile close button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMobileToggle}
                  className="p-2 lg:hidden"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
              
              {/* Desktop collapse button */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className={`p-2 hidden lg:flex ${isCollapsed ? 'absolute top-2 right-2' : ''}`}
                  title={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
                >
                  {isCollapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                </Button>
              )}
            </div>
          </div>

          {(!isCollapsed || isMobile) && user && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {user.firstName || user.first_name} {user.lastName || user.last_name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                </div>
                <div className="relative">
                  <Bell className="w-4 h-4 text-gray-500 hover:text-gray-700 transition-colors" />
                  {notifications > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm"
                    >
                      {notifications > 9 ? '9+' : notifications}
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
      </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className={`${isCollapsed && !isMobile ? 'p-2' : 'p-3 lg:p-4'} space-y-1 lg:space-y-2`}>
            {filteredMenuItems.map(item => renderMenuItem(item))}
          </div>
        </div>

        {/* Footer */}
        <div className={`${isCollapsed && !isMobile ? 'p-2' : 'p-3 lg:p-4'} border-t border-gray-200`}>
          {(!isCollapsed || isMobile) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3 mb-3"
            >
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2 lg:gap-3">
                <div className="text-center p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <div className="font-semibold text-green-700 text-sm lg:text-base">24</div>
                  <div className="text-xs text-green-600">Active</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <div className="font-semibold text-blue-700 text-sm lg:text-base">8</div>
                  <div className="text-xs text-blue-600">Pending</div>
                </div>
              </div>

              <Separator />
            </motion.div>
          )}

          {/* Logout Button */}
          <Button
            onClick={onLogout}
            variant="ghost"
            className={`
              w-full gap-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200
              ${(isCollapsed && !isMobile) ? 'px-2 py-3 justify-center' : ''}
              ${isMobile ? 'text-sm' : ''}
            `}
            title={isCollapsed && !isMobile ? 'Logout' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && <span className="truncate">Logout</span>}
          </Button>
        </div>
      </motion.div>
    </>
  );
};
