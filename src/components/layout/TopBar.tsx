import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Search,
  Settings,
  User,
  ChevronDown,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  RefreshCw,
  Wifi,
  WifiOff,
  ChevronRight,
  Home,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSocket } from '@/services/socketService.tsx';
import BackendStatusIndicator from '../BackendStatusIndicator';

interface TopBarProps {
  pageTitle?: string;
  pageDescription?: string;
  user: any;
  onNavigate: (page: string) => void;
  sidebarCollapsed: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  onMobileMenuToggle?: () => void;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'New Job Created',
    message: 'Job JC-1758001698991 has been created successfully',
    timestamp: '2 minutes ago',
    read: false
  },
  {
    id: '2',
    type: 'success',
    title: 'Product Updated',
    message: 'Product "HANGTAG" has been updated with new specifications',
    timestamp: '15 minutes ago',
    read: false
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low Stock Alert',
    message: 'Material "C1S" is running low on stock',
    timestamp: '1 hour ago',
    read: true
  },
  {
    id: '4',
    type: 'error',
    title: 'System Error',
    message: 'Failed to process job JC-1758001698990',
    timestamp: '2 hours ago',
    read: true
  }
];

const getBreadcrumbs = (pageTitle: string) => {
  const breadcrumbs = [
    { label: 'Dashboard', page: 'dashboard' }
  ];

  if (pageTitle) {
    const pageMap: { [key: string]: { label: string; page?: string } } = {
      'product form': { label: 'Create Product', page: 'productForm' },
      'job form': { label: 'Create Job', page: 'jobForm' },
      'job monitoring': { label: 'Job Monitoring', page: 'jobMonitoring' },
      'my jobs': { label: 'My Jobs', page: 'myJobs' },
      'products': { label: 'Products', page: 'products' },
      'companies': { label: 'Companies', page: 'companies' },
      'users': { label: 'Users', page: 'users' },
      'settings': { label: 'Settings', page: 'settings' }
    };

    const currentPage = pageMap[pageTitle.toLowerCase()];
    if (currentPage) {
      breadcrumbs.push({
        label: currentPage.label,
        page: currentPage.page ? currentPage.page : undefined
      });
    }
  }

  return breadcrumbs;
};

export const TopBar: React.FC<TopBarProps> = ({
  pageTitle,
  pageDescription,
  user,
  onNavigate,
  sidebarCollapsed,
  showSearch = true,
  showNotifications = true,
  onMobileMenuToggle
}) => {
  const { isConnected } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(mockNotifications);
  const [darkMode, setDarkMode] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const breadcrumbs = getBreadcrumbs(pageTitle?.toLowerCase() || '');

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white border-b border-gray-200 shadow-sm z-40"
    >
      <div className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Mobile Menu & Breadcrumbs & Title */}
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Button */}
            {onMobileMenuToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileMenuToggle}
                className="lg:hidden p-2"
                title="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            
            <div className="flex-1">
              {/* Breadcrumbs */}
              <nav className="flex items-center text-sm text-gray-500 mb-1">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index === 0 && <Home className="w-4 h-4 mr-2" />}
                    <button
                      onClick={() => crumb.page && onNavigate(crumb.page)}
                      className={`hover:text-gray-700 transition-colors ${
                        !crumb.page ? 'text-gray-900 font-medium' : 'hover:underline'
                      }`}
                    >
                      {crumb.label}
                    </button>
                    {index < breadcrumbs.length - 1 && (
                      <ChevronRight className="w-4 h-4 mx-2" />
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Page Title */}
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {pageTitle || 'Dashboard'}
                  </h1>
                  {pageDescription && (
                    <p className="text-gray-600 mt-1">{pageDescription}</p>
                  )}
                </div>

                {/* Live Status Indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          {showSearch && (
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search jobs, products, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Right Section - Actions */}
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <Button variant="ghost" size="sm" className="p-2">
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Backend Status */}
            <BackendStatusIndicator />

            {/* Notifications */}
            {showNotifications && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <Badge variant="secondary">{unreadCount} new</Badge>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'success' ? 'bg-green-500' :
                            'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">
                              {notification.title}
                            </p>
                            <p className="text-gray-600 text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              {notification.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-gray-200">
                    <Button variant="ghost" size="sm" className="w-full">
                      View All Notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 p-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-3 border-b border-gray-200">
                  <p className="font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
                <DropdownMenuItem className="gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.header>
  );
};