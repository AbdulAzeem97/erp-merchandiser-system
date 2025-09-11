import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  RefreshCw,
  Download,
  Upload,
  MoreVertical,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { productsAPI } from '@/services/api';
import SmartSidebar from '@/components/layout/SmartSidebar';
import { useSocket } from '@/services/socketService.tsx';

interface Product {
  id: string;
  product_item_code: string;
  brand: string;
  type: string;
  material_id: string;
  material_name?: string;
  category_id: string;
  category_name?: string;
  gsm: number;
  dimensions: string;
  color: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Material {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

const ProductsModule: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('products');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const socket = useSocket();

  // Form state
  const [formData, setFormData] = useState({
    product_item_code: '',
    brand: '',
    type: '',
    material_id: '',
    category_id: '',
    gsm: '',
    dimensions: '',
    color: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (socket && socket.connected) {
      // Join product updates room
      socket.emit('join_product_updates');

      // Listen for product updates
      socket.on('productUpdated', (data) => {
        const updatedProduct = data.data;
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product
          )
        );
        toast.info(`Product ${updatedProduct.product_item_code} has been updated`);
      });

      // Listen for new products
      socket.on('productCreated', (data) => {
        const newProduct = data.data;
        setProducts(prevProducts => [newProduct, ...prevProducts]);
        toast.success(`New product created: ${newProduct.product_item_code}`);
      });

      return () => {
        socket.off('productUpdated');
        socket.off('productCreated');
      };
    }
  }, [socket]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, materialsRes, categoriesRes] = await Promise.all([
        productsAPI.getAll(),
        productsAPI.getMaterials(),
        productsAPI.getCategories()
      ]);
      
      setProducts(productsRes.data || []);
      setMaterials(materialsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await productsAPI.create(formData);
      toast.success('Product created successfully');
      setIsCreateModalOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product');
    }
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    
    try {
      await productsAPI.update(selectedProduct.id, formData);
      toast.success('Product updated successfully');
      setIsEditModalOpen(false);
      setSelectedProduct(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productsAPI.delete(productId);
      toast.success('Product deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      product_item_code: product.product_item_code,
      brand: product.brand,
      type: product.type,
      material_id: product.material_id,
      category_id: product.category_id,
      gsm: product.gsm.toString(),
      dimensions: product.dimensions,
      color: product.color,
      description: product.description,
      is_active: product.is_active
    });
    setIsEditModalOpen(true);
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      product_item_code: '',
      brand: '',
      type: '',
      material_id: '',
      category_id: '',
      gsm: '',
      dimensions: '',
      color: '',
      description: '',
      is_active: true
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.product_item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' || 
      (filterStatus === 'active' && product.is_active) ||
      (filterStatus === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesFilter;
  });

  const ProductForm = ({ isEdit = false }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_item_code">Product Code *</Label>
          <Input
            id="product_item_code"
            value={formData.product_item_code}
            onChange={(e) => setFormData({ ...formData, product_item_code: e.target.value })}
            placeholder="e.g., BR-00-139-A"
            required
          />
        </div>
        <div>
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="e.g., Sample Brand"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type *</Label>
          <Input
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., Box, Bag, Label"
            required
          />
        </div>
        <div>
          <Label htmlFor="gsm">GSM *</Label>
          <Input
            id="gsm"
            type="number"
            value={formData.gsm}
            onChange={(e) => setFormData({ ...formData, gsm: e.target.value })}
            placeholder="e.g., 250"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="material_id">Material *</Label>
          <Select value={formData.material_id} onValueChange={(value) => setFormData({ ...formData, material_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select material" />
            </SelectTrigger>
            <SelectContent>
              {materials.map((material) => (
                <SelectItem key={material.id} value={material.id}>
                  {material.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="category_id">Category *</Label>
          <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dimensions">Dimensions</Label>
          <Input
            id="dimensions"
            value={formData.dimensions}
            onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
            placeholder="e.g., 10x15x5 cm"
          />
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="e.g., White, Blue"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Product description..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          resetForm();
        }}>
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? 'Update' : 'Create'} Product
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SmartSidebar 
        currentView={currentView}
        onNavigate={setCurrentView}
        userRole="MERCHANDISER"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`p-6 transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-70'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
              <p className="text-gray-600 mt-1">Manage your product catalog</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={loadData} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                  </DialogHeader>
                  <ProductForm />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Products ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Loading products...
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Code</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Material</TableHead>
                        <TableHead>GSM</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.product_item_code}</TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>{product.type}</TableCell>
                          <TableCell>{product.material_name || 'N/A'}</TableCell>
                          <TableCell>{product.gsm} g/m²</TableCell>
                          <TableCell>
                            <Badge variant={product.is_active ? "default" : "secondary"}>
                              {product.is_active ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Inactive
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(product)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Product Code</Label>
                  <p className="text-lg font-semibold">{selectedProduct.product_item_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Brand</Label>
                  <p className="text-lg font-semibold">{selectedProduct.brand}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Type</Label>
                  <p>{selectedProduct.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">GSM</Label>
                  <p>{selectedProduct.gsm} g/m²</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Material</Label>
                  <p>{selectedProduct.material_name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Category</Label>
                  <p>{selectedProduct.category_name || 'N/A'}</p>
                </div>
              </div>
              {selectedProduct.dimensions && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Dimensions</Label>
                  <p>{selectedProduct.dimensions}</p>
                </div>
              )}
              {selectedProduct.color && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Color</Label>
                  <p>{selectedProduct.color}</p>
                </div>
              )}
              {selectedProduct.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p>{selectedProduct.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge variant={selectedProduct.is_active ? "default" : "secondary"}>
                    {selectedProduct.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-right">
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm">{new Date(selectedProduct.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsModule;
