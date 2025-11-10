-- Create item_specifications table
CREATE TABLE IF NOT EXISTS item_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_card_id INTEGER REFERENCES job_cards(id) ON DELETE CASCADE,
    excel_file_link TEXT,
    excel_file_name VARCHAR(255),
    po_number VARCHAR(100),
    job_number VARCHAR(100),
    brand_name VARCHAR(255),
    item_name VARCHAR(255),
    uploaded_at TIMESTAMP WITH TIME ZONE,
    item_count INTEGER DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    size_variants INTEGER DEFAULT 0,
    color_variants INTEGER DEFAULT 0,
    specifications JSONB DEFAULT '{}',
    raw_excel_data JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create item_specification_items table to store individual items
CREATE TABLE IF NOT EXISTS item_specification_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_specification_id UUID REFERENCES item_specifications(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    color VARCHAR(100),
    size VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 0,
    secondary_code VARCHAR(100),
    decimal_value DECIMAL(10, 4) DEFAULT 0,
    material VARCHAR(255),
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_item_specifications_job_card_id ON item_specifications(job_card_id);
CREATE INDEX IF NOT EXISTS idx_item_specification_items_spec_id ON item_specification_items(item_specification_id);
CREATE INDEX IF NOT EXISTS idx_item_specification_items_item_code ON item_specification_items(item_code);
CREATE INDEX IF NOT EXISTS idx_item_specification_items_color ON item_specification_items(color);
CREATE INDEX IF NOT EXISTS idx_item_specification_items_size ON item_specification_items(size);

