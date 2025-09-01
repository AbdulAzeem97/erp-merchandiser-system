import React, { useState, useEffect } from 'react';
import { AdvancedDashboard } from '../components/advanced/AdvancedDashboard';
import { AdvancedProductForm } from '../components/advanced/AdvancedProductForm';
import { AdvancedJobForm } from '../components/advanced/AdvancedJobForm';
import { LoginForm } from '../components/LoginForm';
import { ProductMaster } from '../types/erp';
import { Toaster } from '@/components/ui/sonner';
import { authAPI } from '@/services/api';

type ViewType = 'dashboard' | 'productForm' | 'jobForm';

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

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
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
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const renderCurrentView = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ERP System...</p>
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
          <AdvancedDashboard 
            onNavigateToProductForm={handleNavigateToProductForm}
            onNavigateToJobForm={handleNavigateToJobForm}
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
      default:
        return (
          <AdvancedDashboard 
            onNavigateToProductForm={handleNavigateToProductForm}
            onNavigateToJobForm={handleNavigateToJobForm}
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
