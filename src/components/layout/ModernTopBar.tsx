import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  ChevronRight,
  Home,
  Command,
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import BackendStatusIndicator from '../BackendStatusIndicator';
import { useSocket } from '@/services/socketService.tsx';

interface ModernTopBarProps {
  pageTitle?: string;
  pageDescription?: string;
  user: any;
  onNavigate: (page: string) => void;
  showSearch?: boolean;
  showNotifications?: boolean;
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
    type: 'success',
    title: 'Job Completed',
    message: 'Job JC-001234 has been completed successfully',
    timestamp: '2 min ago',
    read: false
  },
  {
    id: '2',
    type: 'info',
    title: 'New Assignment',
    message: 'You have been assigned a new prepress job',
    timestamp: '5 min ago',
    read: false
  },
  {
    id: '3',
    type: 'warning',
    title: 'Due Date Alert',
    message: 'Job JC-001235 is due tomorrow',
    timestamp: '10 min ago',
    read: true
  }
];

const getBreadcrumbs = (currentPage: string) => {
  const breadcrumbs: Array<{ label: string; page?: string }> = [
    { label: 'Dashboard', page: 'dashboard' }
  ];

  const pageMap: Record<string, string[]> = {
    'productForm': ['Products', 'Create Product'],
    'jobForm': ['Jobs', 'Create Job Order'],
    'prepressHOD': ['Prepress', 'HOD Dashboard'],
    'prepressDesigner': ['Prepress', 'Designer Portal'],
    'jobMonitoring': ['Monitoring', 'Job Lifecycle'],
    'reports': ['Analytics', 'Reports'],
    'settings': ['System', 'Settings'],
    'users': ['Management', 'Users']
  };

  if (pageMap[currentPage]) {
    pageMap[currentPage].forEach((label, index) => {
      breadcrumbs.push({ 
        label,
        page: index === pageMap[currentPage].length - 1 ? undefined : currentPage
      });
    });
  }

  return breadcrumbs;
};

export function ModernTopBar({
  pageTitle,
  pageDescription,
  user,
  onNavigate,
  showSearch = true,
  showNotifications = true
}: ModernTopBarProps) {
  const { isConnected } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState(mockNotifications);
  const [darkMode, setDarkMode] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  const breadcrumbs = getBreadcrumbs(pageTitle?.toLowerCase() || '');

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" onClick={() => onNavigate('dashboard')}>
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.slice(1).map((crumb, index) => (
              <React.Fragment key={index}>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  {crumb.page ? (
                    <BreadcrumbLink href="#" onClick={() => onNavigate(crumb.page!)}>
                      {crumb.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Center Section - Search */}
      <div className="flex flex-1 items-center gap-2 px-4">
        {showSearch && (
          <div className="relative ml-auto flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search jobs, products, users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
            />
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        )}

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Live Status */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Refresh Button */}
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>

          {/* Backend Status */}
          <BackendStatusIndicator />

          {/* Notifications */}
          {showNotifications && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs font-medium text-white flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                  <span className="sr-only">Toggle notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-4">
                  <h4 className="text-sm font-medium">Notifications</h4>
                  <Badge variant="secondary">{unreadCount} new</Badge>
                </div>
                <Separator />
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 ${
                        !notification.read ? 'bg-muted/50' : ''
                      }`}
                    >
                      <div className={`mt-1 h-2 w-2 rounded-full ${
                        notification.type === 'success' ? 'bg-green-500' :
                        notification.type === 'error' ? 'bg-red-500' :
                        notification.type === 'warning' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="p-1">
                  <Button variant="ghost" className="w-full justify-start">
                    View all notifications
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm">
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Help</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
