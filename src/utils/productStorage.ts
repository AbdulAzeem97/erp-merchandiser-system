import { ProductMaster } from '../types/erp';

const PRODUCTS_STORAGE_KEY = 'erp_saved_products';

export interface SavedProduct extends ProductMaster {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Get all saved products
export const getSavedProducts = (): SavedProduct[] => {
  try {
    const products = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return products ? JSON.parse(products) : [];
  } catch (error) {
    console.error('Error loading saved products:', error);
    return [];
  }
};

// Save a new product
export const saveProduct = (product: ProductMaster): SavedProduct => {
  const savedProduct: SavedProduct = {
    ...product,
    id: `PRD-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const existingProducts = getSavedProducts();
  
  // Check if product with same code already exists
  const existingIndex = existingProducts.findIndex(p => p.productItemCode === product.productItemCode);
  
  if (existingIndex >= 0) {
    // Update existing product
    savedProduct.id = existingProducts[existingIndex].id;
    savedProduct.createdAt = existingProducts[existingIndex].createdAt;
    existingProducts[existingIndex] = savedProduct;
  } else {
    // Add new product
    existingProducts.push(savedProduct);
  }

  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(existingProducts));
    return savedProduct;
  } catch (error) {
    console.error('Error saving product:', error);
    throw new Error('Failed to save product');
  }
};

// Get product by ID or code
export const getProductByCode = (code: string): SavedProduct | null => {
  const products = getSavedProducts();
  return products.find(p => p.productItemCode === code || p.id === code) || null;
};

// Delete a product
export const deleteProduct = (id: string): boolean => {
  try {
    const products = getSavedProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(filteredProducts));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// Get recent products (for suggestions)
export const getRecentProducts = (limit: number = 5): SavedProduct[] => {
  const products = getSavedProducts();
  return products
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
};

// Get products summary for dashboard
export const getProductsSummary = () => {
  const products = getSavedProducts();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createdToday = products.filter(p => {
    const createdDate = new Date(p.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  }).length;

  const byBrand = products.reduce((acc, product) => {
    acc[product.brand] = (acc[product.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byType = products.reduce((acc, product) => {
    acc[product.productType] = (acc[product.productType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: products.length,
    createdToday,
    byBrand,
    byType,
    recent: getRecentProducts(10)
  };
};
