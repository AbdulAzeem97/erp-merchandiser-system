import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  FileText, 
  ArrowRight, 
  Factory, 
  Search,
  Plus,
  Database,
  ChevronRight
} from 'lucide-react';
import { ProductMaster } from '../types/erp';

interface FormNavigatorProps {
  onNavigateToProductForm: () => void;
  onNavigateToJobForm: (product?: ProductMaster) => void;
}

export const FormNavigator: React.FC<FormNavigatorProps> = ({ 
  onNavigateToProductForm, 
  onNavigateToJobForm 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Factory className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            ERP Job Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional workflow management for product masters and job orders
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Master Product Form Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 cursor-pointer"
                onClick={onNavigateToProductForm}>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                Master Product Form
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Create and manage product master data with complete specifications, 
                materials, and process requirements.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Define product specifications
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Set material properties
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Configure process sequences
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  <Plus className="w-3 h-3 mr-1" />
                  Create New
                </Badge>
                <span className="text-sm font-medium text-primary">Start Here →</span>
              </div>
            </CardContent>
          </Card>

          {/* Job ID Form Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 cursor-pointer"
                onClick={() => onNavigateToJobForm()}>
            <CardHeader className="pb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-semibold flex items-center justify-between">
                Job Card Form
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Search existing products by ID and create job cards with order details, 
                quantities, and delivery requirements.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Search product by ID
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Enter job details
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Upload attachments
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="bg-green-50 text-green-700">
                  <Search className="w-3 h-3 mr-1" />
                  Search & Create
                </Badge>
                <span className="text-sm font-medium text-green-600">Quick Access →</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Info */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-0">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <Database className="w-5 h-5" />
              Recommended Workflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs">1</span>
                </div>
                <span>Create Product Master</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">2</span>
                </div>
                <span>Generate Job Cards</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-xs">3</span>
                </div>
                <span>Process Orders</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
            <div className="text-sm text-gray-500">Products Created</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600 mb-1">0</div>
            <div className="text-sm text-gray-500">Active Jobs</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-purple-600 mb-1">0</div>
            <div className="text-sm text-gray-500">Completed Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
};