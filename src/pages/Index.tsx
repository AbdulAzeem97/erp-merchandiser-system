import React, { useState, useEffect } from 'react';
import { AdvancedDashboard } from '../components/advanced/AdvancedDashboard';
import AdvancedDashboardWithSidebar from '../components/advanced/AdvancedDashboardWithSidebar';
import { AdvancedProductForm } from '../components/advanced/AdvancedProductForm';
import { AdvancedJobForm } from '../components/advanced/AdvancedJobForm';
import HeadOfMerchandiserDashboard from '../components/dashboards/HeadOfMerchandiserDashboard';
import HeadOfProductionDashboard from '../components/dashboards/HeadOfProductionDashboard';
import { HodPrepressDashboard } from '../components/dashboards/HodPrepressDashboard';
import { DesignerDashboard } from '../components/dashboards/DesignerDashboard';
import QADashboard from '../components/qa/QADashboard';
import CTPDashboard from '../components/ctp/CTPDashboard';
import HODPrepressDashboard from '../components/prepress/HODPrepressDashboard';
import DesignerWorkbench from '../components/prepress/DesignerWorkbench';
import ProductsModule from '../components/modules/ProductsModule';
import JobsModule from '../components/modules/JobsModule';
import DesignerPortal from '../components/modules/DesignerPortal';
import { LoginForm } from '../components/LoginForm';
import { ProductMaster } from '../types/erp';
import { Toaster } from '@/components/ui/sonner';
import { authAPI } from '@/services/api';

type ViewType = 'dashboard' | 'productForm' | 'jobForm' | 'reports' | 'prepressHOD' | 'prepressDesigner' | 'qaDashboard' | 'products' | 'jobs' | 'companies' | 'users' | 'settings';

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [savedProduct, setSavedProduct] = useState<ProductMaster | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleNavigateToProductForm = () => {
    setCurrentView('productForm');
  };

  const handleNavigateToJobForm = (product?: ProductMaster) => {
    if (product) {
      setSavedProduct(product);
    }
    setCurrentView('jobForm');
  };

  const handleProductSaved = (product: ProductMaster) => {
    // Route back to dashboard after saving product
    setCurrentView('dashboard');
    setSavedProduct(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSavedProduct(null);
  };

  const handleBackToProductForm = () => {
    setCurrentView('productForm');
  };

  const handleNavigateToReports = () => {
    setCurrentView('reports');
  };

  const handleNavigateToPrepressHOD = () => {
    setCurrentView('prepressHOD');
  };

  const handleNavigateToPrepressDesigner = () => {
    setCurrentView('prepressDesigner');
  };

  const handleNavigateToProducts = () => {
    setCurrentView('products');
  };

  const handleNavigateToJobs = () => {
    setCurrentView('jobs');
  };

  const handleNavigateToCompanies = () => {
    setCurrentView('companies');
  };

  const handleNavigateToUsers = () => {
    setCurrentView('users');
  };

  const handleNavigateToSettings = () => {
    setCurrentView('settings');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    // Check user role and redirect accordingly
    const user = authAPI.getCurrentUser();
    if (user?.role === 'HOD_PREPRESS') {
      setCurrentView('prepressHOD');
    } else if (user?.role === 'DESIGNER') {
      // Redirect to complete designer dashboard
      window.location.href = '/designer/dashboard';
      return;
    } else if (user?.role === 'QA' || user?.role === 'QA_PREPRESS') {
      setCurrentView('qaDashboard');
    } else if (user?.role === 'CTP_OPERATOR') {
      // Redirect to CTP dashboard
      setCurrentView('ctp-dashboard');
    } else if (user?.role === 'INVENTORY_MANAGER') {
      // Redirect to inventory dashboard
      window.location.href = '/inventory/dashboard';
      return;
    } else if (user?.role === 'PROCUREMENT_MANAGER') {
      // Redirect to procurement dashboard
      window.location.href = '/procurement/dashboard';
      return;
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleNavigate = (view: string) => {
    setCurrentView(view as ViewType);
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authAPI.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Check user role and set initial view
        const user = authAPI.getCurrentUser();
        if (user?.role === 'HOD_PREPRESS') {
          setCurrentView('prepressHOD');
        } else if (user?.role === 'DESIGNER') {
          // Redirect to complete designer dashboard
          window.location.href = '/designer/dashboard';
          return;
        } else if (user?.role === 'QA' || user?.role === 'QA_PREPRESS') {
          setCurrentView('qaDashboard');
        } else if (user?.role === 'CTP_OPERATOR') {
          // Redirect to CTP dashboard
          setCurrentView('ctp-dashboard');
        } else if (user?.role === 'HOD_CUTTING') {
          // Redirect to Cutting dashboard
          window.location.href = '/cutting/dashboard';
          return;
        } else if (user?.role === 'CUTTING_LABOR') {
          // Redirect to Cutting labor view
          window.location.href = '/cutting/labor';
          return;
        } else if (user?.role === 'HOD_PRODUCTION' || user?.role === 'PRODUCTION_OPERATOR') {
          // Redirect to Production dashboard
          window.location.href = '/production/dashboard';
          return;
        } else if (user?.role === 'INVENTORY_MANAGER') {
          // Redirect to inventory dashboard
          window.location.href = '/inventory/dashboard';
          return;
        } else if (user?.role === 'PROCUREMENT_MANAGER') {
          // Redirect to procurement dashboard
          window.location.href = '/procurement/dashboard';
          return;
        } else {
          setCurrentView('dashboard');
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const renderCurrentView = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
          <div className="text-center animate-fade-in">
            <div className="modern-card p-8 max-w-sm mx-auto">
              <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-spin">
                  <div className="absolute inset-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse"></div>
              </div>
              <h3 className="text-heading-3 text-slate-900 mb-2">ERP System</h3>
              <p className="text-body-small text-slate-600">Loading your workspace...</p>
              <div className="mt-4 w-full bg-slate-200 rounded-full h-1">
                <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full loading-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show login form if not authenticated
    if (!isAuthenticated) {
      return <LoginForm onLoginSuccess={handleLoginSuccess} />;
    }

    // Show main application if authenticated
    switch (currentView) {
      case 'dashboard':
        return (
          <AdvancedDashboardWithSidebar 
            onNavigateToProductForm={handleNavigateToProductForm}
            onNavigateToJobForm={handleNavigateToJobForm}
            onNavigateToReports={handleNavigateToReports}
            onNavigateToPrepressHOD={handleNavigateToPrepressHOD}
            onNavigateToPrepressDesigner={handleNavigateToPrepressDesigner}
            onLogout={handleLogout}
          />
        );
      case 'productForm':
        return (
          <AdvancedProductForm 
            onProductSaved={handleProductSaved}
            onBack={handleBackToDashboard}
          />
        );
      case 'jobForm':
        return (
          <AdvancedJobForm 
            product={savedProduct || undefined}
            onBack={savedProduct ? handleBackToProductForm : handleBackToDashboard}
          />
        );
      case 'reports':
        return (
          <HeadOfMerchandiserDashboard />
        );
      case 'prepressHOD':
        return (
          <HodPrepressDashboard onLogout={handleLogout} />
        );
      case 'prepressDesigner':
        return (
          <DesignerDashboard onNavigate={handleNavigate} onLogout={handleLogout} />
        );
      case 'qaDashboard':
        return (
          <QADashboard />
        );
      case 'ctp-dashboard':
        return (
          <CTPDashboard onLogout={handleLogout} onNavigate={handleNavigate} />
        );
      case 'products':
        return <ProductsModule />;
      case 'jobs':
        return <JobsModule />;
      case 'companies':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
            <div className="modern-card p-12 max-w-md mx-auto text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-heading-1 text-slate-900 mb-4">Companies Module</h1>
              <p className="text-body text-slate-600 mb-6">Advanced company management features are being developed.</p>
              <div className="status-info">Coming Soon</div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
            <div className="modern-card p-12 max-w-md mx-auto text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h1 className="text-heading-1 text-slate-900 mb-4">Users Module</h1>
              <p className="text-body text-slate-600 mb-6">User management and role-based access control system.</p>
              <div className="status-info">Coming Soon</div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
            <div className="modern-card p-12 max-w-md mx-auto text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-heading-1 text-slate-900 mb-4">Settings Module</h1>
              <p className="text-body text-slate-600 mb-6">System configuration and personalization options.</p>
              <div className="status-info">Coming Soon</div>
            </div>
          </div>
        );
      default:
        return (
          <AdvancedDashboardWithSidebar 
            onNavigateToProductForm={handleNavigateToProductForm}
            onNavigateToJobForm={handleNavigateToJobForm}
            onNavigateToReports={handleNavigateToReports}
            onNavigateToPrepressHOD={handleNavigateToPrepressHOD}
            onNavigateToPrepressDesigner={handleNavigateToPrepressDesigner}
            onLogout={handleLogout}
          />
        );
    }
  };

  return (
    <>
      {renderCurrentView()}
      <Toaster />
    </>
  );
};

export default Index;
