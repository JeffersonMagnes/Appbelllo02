-- Add is_demo_data flag to all seedable tables
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comanda_items ADD COLUMN IF NOT EXISTS is_demo_data BOOLEAN NOT NULL DEFAULT false;

-- Track whether establishment has demo data loaded
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS has_demo_data BOOLEAN NOT NULL DEFAULT false;

-- Indexes for efficient clearing
CREATE INDEX IF NOT EXISTS idx_professionals_demo ON professionals (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_services_demo ON services (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_service_categories_demo ON service_categories (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_clients_demo ON clients (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_appointments_demo ON appointments (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_employees_demo ON employees (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_products_demo ON products (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_transactions_demo ON transactions (establishment_id) WHERE is_demo_data = true;
CREATE INDEX IF NOT EXISTS idx_comandas_demo ON comandas (establishment_id) WHERE is_demo_data = true;
