import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Package
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { productsAPI } from '../services/api';
import { toast } from 'sonner';
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
  basePrice?: number;
  fsc?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name?: string;
  createdById?: number;
}

interface Material {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductManagementTableProps {
  onCreateProduct: () => void;
}

export const ProductManagementTable: React.FC<ProductManagementTableProps> = ({ 
  onCreateProduct 
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
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

  // Load products
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      // Backend allows max limit of 100
      const response = await productsAPI.getAll({ limit: 100 });
      // Handle different response formats: backend returns { products, pagination } or wrapped as { data }
      const productsData = response.products || response.data || [];
      console.log('📦 Products loaded:', productsData.length);
      setProducts(productsData);
    } catch (error: any) {
      console.error('Error loading products:', error);
      const errorMessage = error.response?.message || error.message || 'Failed to load products';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load materials and categories
  const loadMaterialsAndCategories = async () => {
    try {
      const [materialsRes, categoriesRes] = await Promise.all([
        productsAPI.getMaterials(),
        productsAPI.getCategories()
      ]);
      setMaterials(materialsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error('Error loading materials/categories:', error);
    }
  };

  // Filter products
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.product_item_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'ACTIVE') {
        filtered = filtered.filter(product => product.is_active);
      } else if (statusFilter === 'INACTIVE') {
        filtered = filtered.filter(product => !product.is_active);
      }
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter]);

  // Load data on component mount
  useEffect(() => {
    loadProducts();
    loadMaterialsAndCategories();
  }, []);

  // Real-time updates via Socket.io
  useEffect(() => {
    if (socket && socket.connected) {
      socket.emit('join_product_updates');

      socket.on('productCreated', (data) => {
        const newProduct = data.data;
        setProducts(prev => [newProduct, ...prev]);
        toast.success(`New product created: ${newProduct.product_item_code}`);
      });

      socket.on('productUpdated', (data) => {
        const updatedProduct = data.data;
        setProducts(prev => 
          prev.map(product => 
            product.id === updatedProduct.id ? { ...product, ...updatedProduct } : product
          )
        );
        toast.info(`Product ${updatedProduct.product_item_code} has been updated`);
      });

      socket.on('productDeleted', (data) => {
        const deletedProductId = data.data?.id || data.id;
        setProducts(prev => prev.filter(product => product.id !== deletedProductId));
        toast.info('Product deleted');
      });

      return () => {
        socket.off('productCreated');
        socket.off('productUpdated');
        socket.off('productDeleted');
      };
    }
  }, [socket]);

  // Handle product creation
  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!formData.product_item_code || !formData.brand || !formData.type || !formData.material_id || !formData.category_id || !formData.gsm) {
        toast.error('Please fill in all required fields');
        return;
      }

      await productsAPI.create(formData);
      toast.success('Product created successfully');
      setShowCreateModal(false);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.response?.message || 'Failed to create product');
    }
  };

  // Handle product update
  const handleUpdate = async () => {
    if (!selectedProduct) return;
    
    try {
      // Validate required fields
      if (!formData.product_item_code || !formData.brand || !formData.type || !formData.material_id || !formData.category_id || !formData.gsm) {
        toast.error('Please fill in all required fields');
        return;
      }

      await productsAPI.update(selectedProduct.id, formData);
      toast.success('Product updated successfully');
      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
      loadProducts();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.response?.message || 'Failed to update product');
    }
  };

  // Handle product deletion
  const handleDeleteProduct = async (product: Product) => {
    try {
      await productsAPI.delete(product.id);
      await loadProducts();
      setShowDeleteDialog(false);
      setProductToDelete(null);
      toast.success('Product deleted successfully');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.message || 'Failed to delete product');
    }
  };

  // Handle product edit
  const handleEditProduct = (product: Product) => {
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
    setShowEditModal(true);
  };

  // Handle product view
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  // Reset form
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

  // Product form component
  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product_item_code">Product Code *</Label>
          <Input
            id="product_item_code"
            value={formData.product_item_code}
            onChange={(e) => setFormData({ ...formData, product_item_code: e.target.value })}
            placeholder="Enter product code"
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
        <Button 
          variant="outline" 
          onClick={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            resetForm();
            setSelectedProduct(null);
          }}
        >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleUpdate : handleCreate}>
          {isEdit ? 'Update' : 'Create'} Product
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Product Management</CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={loadProducts} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search products by code, brand, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            No products found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GSM
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FSC Certified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {product.product_item_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.brand}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.material_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.gsm} g/m²
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={product.description || ''}>
                        {product.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${product.basePrice || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.fsc ? (
                        <Badge className="bg-green-100 text-green-800">Yes</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">No</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{product.created_by_name || 'System'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={`${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} flex items-center gap-1 w-fit`}>
                        {product.is_active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(product.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProductToDelete(product);
                            setShowDeleteDialog(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete product <strong>{productToDelete?.product_item_code}</strong>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => productToDelete && handleDeleteProduct(productToDelete)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <ProductForm />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Base Price</Label>
                  <p>${selectedProduct.basePrice || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">FSC Certified</Label>
                  <p>{selectedProduct.fsc ? 'Yes' : 'No'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={selectedProduct.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedProduct.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-right">
                  <Label className="text-sm font-medium text-gray-500">Created By</Label>
                  <p className="text-sm">{selectedProduct.created_by_name || 'System'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm">{new Date(selectedProduct.created_at).toLocaleString()}</p>
                </div>
                {selectedProduct.updated_at && (
                  <div className="text-right">
                    <Label className="text-sm font-medium text-gray-500">Updated</Label>
                    <p className="text-sm">{new Date(selectedProduct.updated_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

