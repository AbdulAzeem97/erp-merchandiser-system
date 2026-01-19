-- Migration: Add product creator tracking
-- Description: Adds createdById column to products table to track who created each product
-- Products remain visible to all users (no filtering), but we track creator for reference

-- Add createdById column to products table
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS "createdById" INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products("createdById");

-- Grandfather existing products: set createdById to NULL (visible to all)
-- No UPDATE needed as NULL means visible to all users

COMMENT ON COLUMN products."createdById" IS 'User who created this product. NULL means visible to all users.';

