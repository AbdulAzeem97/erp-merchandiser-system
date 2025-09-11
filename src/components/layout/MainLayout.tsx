import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { RoleBasedSidebar } from './RoleBasedSidebar';
import { LoadingScreen } from './LoadingScreen';
import { TopBar } from './TopBar';
import { authAPI } from '@/services/api';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isLoading?: boolean;
  pageTitle?: string;
  pageDescription?: string;
  showTopBar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  onLogout,
  isLoading = false,
  pageTitle,
  pageDescription,
  showTopBar = true
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [pageTransition, setPageTransition] = useState(false);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleNavigate = async (page: string) => {
    setPageTransition(true);
    
    // Smooth transition delay
    setTimeout(() => {
      onNavigate(page);
      setPageTransition(false);
    }, 150);
  };

  if (!user) {
    return <LoadingScreen message="Initializing user session..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <RoleBasedSidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        {showTopBar && (
          <TopBar
            pageTitle={pageTitle}
            pageDescription={pageDescription}
            user={user}
            onNavigate={handleNavigate}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {(isLoading || pageTransition) ? (
              <LoadingScreen 
                key="loading"
                message={pageTransition ? "Switching pages..." : "Loading content..."} 
              />
            ) : (
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.4, 0.0, 0.2, 1]
                }}
                className="h-full overflow-y-auto scrollbar-hide"
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: 'bg-white border-gray-200 shadow-lg',
        }}
      />
    </div>
  );
};