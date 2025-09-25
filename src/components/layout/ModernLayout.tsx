import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ModernSidebar } from './ModernSidebar';
import { ModernTopBar } from './ModernTopBar';
import { Toaster } from '@/components/ui/sonner';

interface ModernLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  pageTitle?: string;
  pageDescription?: string;
  showTopBar?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
}

export function ModernLayout({
  children,
  currentPage,
  onNavigate,
  onLogout,
  pageTitle,
  pageDescription,
  showTopBar = true,
  showSearch = true,
  showNotifications = true
}: ModernLayoutProps) {
  return (
    <SidebarProvider>
      <ModernSidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />
      <SidebarInset>
        {showTopBar && (
          <ModernTopBar
            pageTitle={pageTitle}
            pageDescription={pageDescription}
            user={{
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@company.com',
              role: 'ADMIN'
            }}
            onNavigate={onNavigate}
            showSearch={showSearch}
            showNotifications={showNotifications}
          />
        )}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {pageTitle && showTopBar && (
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              {pageDescription && (
                <p className="text-muted-foreground">{pageDescription}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
