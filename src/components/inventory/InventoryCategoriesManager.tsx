import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  RefreshCw,
  Save,
  X,
  Building2,
  Package,
  Tag,
  MapPin,
  Warehouse,
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Category {
  category_id: number;
  department: string;
  master_category: string;
  control_category: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Location {
  location_id: number;
  location_name: string;
  location_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const InventoryCategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'categories' | 'locations'>('categories');
  
  // Category form state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    department: '',
    master_category: '',
    control_category: '',
    description: '',
    is_active: true,
  });

  // Location form state
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationForm, setLocationForm] = useState({
    location_name: '',
    location_code: '',
    description: '',
    is_active: true,
  });

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/inventory/categories', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const categoriesData = await categoriesResponse.json();
      if (categoriesData.success) {
        setCategories(categoriesData.categories);
      }

      // Fetch locations
      const locationsResponse = await fetch('/api/inventory/locations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const locationsData = await locationsResponse.json();
      if (locationsData.success) {
        setLocations(locationsData.locations);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.master_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.control_category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.location_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.location_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Category handlers
  const handleAddCategory = async () => {
    try {
      const response = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(categoryForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Category added successfully');
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      department: category.department,
      master_category: category.master_category,
      control_category: category.control_category,
      description: category.description,
      is_active: category.is_active,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const response = await fetch(`/api/inventory/categories/${editingCategory.category_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(categoryForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Category updated successfully');
        setIsCategoryDialogOpen(false);
        setEditingCategory(null);
        resetCategoryForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update category');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      department: '',
      master_category: '',
      control_category: '',
      description: '',
      is_active: true,
    });
  };

  // Location handlers
  const handleAddLocation = async () => {
    try {
      const response = await fetch('/api/inventory/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(locationForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Location added successfully');
        setIsLocationDialogOpen(false);
        resetLocationForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to add location');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      toast.error('Failed to add location');
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setLocationForm({
      location_name: location.location_name,
      location_code: location.location_code,
      description: location.description,
      is_active: location.is_active,
    });
    setIsLocationDialogOpen(true);
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation) return;

    try {
      const response = await fetch(`/api/inventory/locations/${editingLocation.location_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(locationForm)
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Location updated successfully');
        setIsLocationDialogOpen(false);
        setEditingLocation(null);
        resetLocationForm();
        fetchData();
      } else {
        toast.error(data.error || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    }
  };

  const resetLocationForm = () => {
    setLocationForm({
      location_name: '',
      location_code: '',
      description: '',
      is_active: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories & Locations</h1>
          <p className="text-muted-foreground">
            Manage inventory categories and warehouse locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-muted p-1">
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('categories')}
          className="flex-1"
        >
          <Tag className="w-4 h-4 mr-2" />
          Categories
        </Button>
        <Button
          variant={activeTab === 'locations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('locations')}
          className="flex-1"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Locations
        </Button>
      </div>

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Categories</CardTitle>
                <CardDescription>
                  Manage product categories and classifications
                </CardDescription>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Edit Category' : 'Add New Category'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory ? 'Update category information' : 'Create a new inventory category'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Input
                          id="department"
                          value={categoryForm.department}
                          onChange={(e) => setCategoryForm({ ...categoryForm, department: e.target.value })}
                          placeholder="e.g., Printing, Production"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="master_category">Master Category *</Label>
                        <Input
                          id="master_category"
                          value={categoryForm.master_category}
                          onChange={(e) => setCategoryForm({ ...categoryForm, master_category: e.target.value })}
                          placeholder="e.g., Printing, Packing Material"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="control_category">Control Category *</Label>
                      <Input
                        id="control_category"
                        value={categoryForm.control_category}
                        onChange={(e) => setCategoryForm({ ...categoryForm, control_category: e.target.value })}
                        placeholder="e.g., Flexo Ink, Screen Ink"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={categoryForm.description}
                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                        placeholder="Optional description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingCategory ? handleUpdateCategory : handleAddCategory}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingCategory ? 'Update' : 'Add'} Category
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department</TableHead>
                    <TableHead>Master Category</TableHead>
                    <TableHead>Control Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-medium">{category.department}</TableCell>
                      <TableCell>{category.master_category}</TableCell>
                      <TableCell>{category.control_category}</TableCell>
                      <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Items
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Warehouse Locations</CardTitle>
                <CardDescription>
                  Manage warehouse and storage locations
                </CardDescription>
              </div>
              <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLocation ? 'Edit Location' : 'Add New Location'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingLocation ? 'Update location information' : 'Create a new warehouse location'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location_name">Location Name *</Label>
                        <Input
                          id="location_name"
                          value={locationForm.location_name}
                          onChange={(e) => setLocationForm({ ...locationForm, location_name: e.target.value })}
                          placeholder="e.g., Main Store, CTP Room"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location_code">Location Code *</Label>
                        <Input
                          id="location_code"
                          value={locationForm.location_code}
                          onChange={(e) => setLocationForm({ ...locationForm, location_code: e.target.value })}
                          placeholder="e.g., MAIN, CTP"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={locationForm.description}
                        onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                        placeholder="Optional description"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsLocationDialogOpen(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={editingLocation ? handleUpdateLocation : handleAddLocation}>
                      <Save className="w-4 h-4 mr-2" />
                      {editingLocation ? 'Update' : 'Add'} Location
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location Name</TableHead>
                    <TableHead>Location Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLocations.map((location) => (
                    <TableRow key={location.location_id}>
                      <TableCell className="font-medium">{location.location_name}</TableCell>
                      <TableCell className="font-mono">{location.location_code}</TableCell>
                      <TableCell className="max-w-xs truncate">{location.description}</TableCell>
                      <TableCell>
                        <Badge variant={location.is_active ? 'default' : 'secondary'}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(location.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditLocation(location)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Location
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Inventory
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryCategoriesManager;
