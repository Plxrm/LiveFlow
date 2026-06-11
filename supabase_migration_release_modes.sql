-- Migration to support Live Session Product Release Modes

ALTER TABLE live_products ADD COLUMN release_mode text DEFAULT 'all' CHECK (release_mode IN ('all', 'manual'));

ALTER TABLE product_keys ADD COLUMN is_released boolean DEFAULT false;
