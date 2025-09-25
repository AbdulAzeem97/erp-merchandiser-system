import React from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  User,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const navigationItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    isActive: true,
  },
  {
    title: 'Projects',
    icon: FolderOpen,
    url: '/projects',
  },
  {
    title: 'Teams',
    icon: Users,
    url: '/teams',
  },
  {
    title: 'Reports',
    icon: BarChart3,
    url: '/reports',
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/settings',
  },
];

const kpiCards = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    description: 'from last month',
  },
  {
    title: 'Active Projects',
    value: '24',
    change: '+12%',
    description: 'from last month',
  },
  {
    title: 'Team Members',
    value: '152',
    change: '+3.2%',
    description: 'from last month',
  },
  {
    title: 'Tasks Completed',
    value: '1,429',
    change: '+8.1%',
    description: 'from last month',
  },
];

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar variant="inset">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">E</span>
              </div>
              <span className="font-semibold">ERP System</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.isActive}
                        tooltip={item.title}
                      >
                        <a href={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <span>John Doe</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <SidebarInset>
          {/* Top Bar */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center justify-between">
              {/* Search */}
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10 pr-4 w-full"
                />
              </div>

              {/* Profile Section */}
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children || (
              <div className="space-y-6">
                {/* KPI Cards Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {kpiCards.map((card) => (
                    <Card key={card.title}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          {card.title}
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-green-600">{card.change}</span> {card.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Charts and Tables Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                  {/* Main Chart */}
                  <Card className="col-span-4">
                    <CardHeader>
                      <CardTitle>Revenue Overview</CardTitle>
                      <CardDescription>
                        Monthly revenue trends for the current year
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80 flex items-center justify-center bg-muted/50 rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Chart placeholder</p>
                        <p className="text-sm">Revenue chart would go here</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Side Stats */}
                  <Card className="col-span-3">
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest updates and notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-80">
                      <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Activity {i + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                Sample activity description
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {i + 1}h ago
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Data Table */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Projects</CardTitle>
                    <CardDescription>
                      Overview of your most recent project activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border bg-muted/50 p-8">
                      <div className="text-center text-muted-foreground">
                        <FolderOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>Data table placeholder</p>
                        <p className="text-sm">Project data table would go here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
