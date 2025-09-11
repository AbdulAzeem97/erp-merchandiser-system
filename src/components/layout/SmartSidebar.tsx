import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Factory, 
  Building2, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  User,
  Bell,
  Search,
  Menu,
  X,
  FileText,
  Target,
  PieChart,
  TrendingUp,
  Calendar,
  Shield,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { authAPI } from '@/services/api';

interface SmartSidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout?: () => void;
  userRole?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SmartSidebar: React.FC<SmartSidebarProps> = ({
  currentView,
  onNavigate,
  onLogout,
  userRole = 'ADMIN',
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const currentUser = authAPI.getCurrentUser();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        description: 'Overview & Analytics'
      }
    ];

    // Role-based navigation
    if (userRole === 'ADMIN' || userRole === 'MERCHANDISER' || userRole === 'HEAD_MERCHANDISER') {
      baseItems.push(
        {
          id: 'products',
          label: 'Products',
          icon: Package,
          path: '/products',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'Product Management',
          badge: 'CRUD'
        },
        {
          id: 'jobs',
          label: 'Job Cards',
          icon: Factory,
          path: '/jobs',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: 'Production Jobs',
          badge: 'CRUD'
        },
        {
          id: 'companies',
          label: 'Companies',
          icon: Building2,
          path: '/companies',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          description: 'Customer Management',
          badge: 'CRUD'
        }
      );
    }

    if (userRole === 'ADMIN' || userRole === 'HEAD_MERCHANDISER') {
      baseItems.push(
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          path: '/users',
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          description: 'User Management',
          badge: 'CRUD'
        }
      );
    }

    // Prepress modules
    if (userRole === 'HOD_PREPRESS' || userRole === 'DESIGNER') {
      baseItems.push(
        {
          id: 'prepressHOD',
          label: 'Prepress HOD',
          icon: Target,
          path: '/prepress/hod',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          description: 'Design Management'
        },
        {
          id: 'prepressDesigner',
          label: 'My Tasks',
          icon: FileText,
          path: '/prepress/my',
          color: 'text-teal-600',
          bgColor: 'bg-teal-50',
          description: 'Designer Workbench'
        }
      );
    }

    // Reports (for non-prepress roles)
    if (userRole !== 'HOD_PREPRESS' && userRole !== 'DESIGNER') {
      baseItems.push(
        {
          id: 'reports',
          label: 'Reports',
          icon: BarChart3,
          path: '/reports',
          color: 'text-cyan-600',
          bgColor: 'bg-cyan-50',
          description: 'Analytics & Reports'
        }
      );
    }

    // Settings (for admin)
    if (userRole === 'ADMIN') {
      baseItems.push(
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          path: '/settings',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'System Settings'
        }
      );
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = (itemId: string) => {
    onNavigate(itemId);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      authAPI.logout();
      window.location.reload();
    }
  };

  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 }
  };

  const contentVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white/90 backdrop-blur-sm border-white/20"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={isCollapsed ? "collapsed" : "expanded"}
        className={`
          sidebar-modern fixed left-0 top-0 h-full z-50 shadow-2xl
          ${isMobileOpen ? 'translate-x-0' : 'lg:translate-x-0 -translate-x-full'}
          transition-transform duration-300 ease-in-out lg:transition-none
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200/30">
            <div className="flex items-center justify-between">
              <motion.div
                variants={contentVariants}
                animate={isCollapsed ? "collapsed" : "expanded"}
                className="flex items-center space-x-3"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Factory className="w-7 h-7 text-white" />
                </div>
                {!isCollapsed && (
                  <div>
                    <h1 className="text-heading-3 font-bold text-slate-900">ERP System</h1>
                    <p className="text-caption text-slate-500">Merchandiser Platform</p>
                  </div>
                )}
              </motion.div>
              
              {/* Collapse Toggle (Desktop only) */}
              <div className="hidden lg:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleCollapse}
                  className="w-9 h-9 p-0 hover:bg-slate-100 rounded-xl transition-all duration-200"
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* User Info */}
          <motion.div
            variants={contentVariants}
            animate={isCollapsed ? "collapsed" : "expanded"}
            className="p-4 border-b border-slate-200/30"
          >
            {!isCollapsed && currentUser && (
              <div className="modern-card p-4 bg-gradient-to-r from-slate-50 to-blue-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-small font-semibold text-slate-900 truncate">
                      {currentUser.first_name} {currentUser.last_name}
                    </p>
                    <p className="text-caption text-slate-600 truncate">{currentUser.role}</p>
                  </div>
                  <div className="status-success text-xs">Online</div>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="flex justify-center">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-2 px-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={`
                      sidebar-item group relative overflow-hidden
                      ${isActive 
                        ? `sidebar-item-active shadow-lg` 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                      ${isCollapsed ? 'justify-center px-3' : 'w-full'}
                    `}
                    whileHover={{ scale: 1.02, x: isActive ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-r-full"></div>
                    )}
                    
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg transition-all duration-200 ${isActive ? 'bg-white/80 shadow-sm' : 'group-hover:bg-slate-100'}`}>
                        <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-700'}`} />
                      </div>
                      {!isCollapsed && (
                        <motion.div
                          variants={contentVariants}
                          animate={isCollapsed ? "collapsed" : "expanded"}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-body-small font-medium truncate">{item.label}</span>
                            {item.badge && (
                              <div className="status-indicator bg-blue-100 text-blue-700 ml-2">
                                {item.badge}
                              </div>
                            )}
                          </div>
                          <p className="text-caption text-slate-500 mt-0.5 truncate">{item.description}</p>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200/30">
            <motion.button
              onClick={handleLogout}
              className={`
                sidebar-item group text-red-600 hover:bg-red-50/80 hover:text-red-700 transition-all duration-200
                ${isCollapsed ? 'justify-center px-3' : 'w-full'}
              `}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg group-hover:bg-red-100 transition-all duration-200">
                  <LogOut className="w-5 h-5" />
                </div>
                {!isCollapsed && (
                  <motion.div
                    variants={contentVariants}
                    animate={isCollapsed ? "collapsed" : "expanded"}
                    className="flex-1 text-left"
                  >
                    <span className="text-body-small font-medium">Logout</span>
                    <p className="text-caption text-red-400 mt-0.5">Sign out of system</p>
                  </motion.div>
                )}
              </div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Spacer */}
      <div 
        className={`
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'lg:ml-20' : 'lg:ml-70'}
        `}
      />
    </>
  );
};

export default SmartSidebar;
