-- Adiciona client_name na tabela comandas (necessário para exibir nome do cliente)
ALTER TABLE comandas ADD COLUMN IF NOT EXISTS client_name text;

-- Adiciona coluna type em comanda_items para distinguir serviço de produto
ALTER TABLE comanda_items ADD COLUMN IF NOT EXISTS type text DEFAULT 'service';

-- Renomeia price → unit_price em comanda_items para consistência com o app
-- (mantém price como alias via view ou adiciona a nova coluna)
ALTER TABLE comanda_items ADD COLUMN IF NOT EXISTS unit_price numeric DEFAULT 0;

-- Copia valores existentes de price para unit_price
UPDATE comanda_items SET unit_price = price WHERE unit_price = 0;

-- Adiciona employee_id em comanda_items
ALTER TABLE comanda_items ADD COLUMN IF NOT EXISTS employee_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Adiciona description em comanda_items (nome do item na comanda)
ALTER TABLE comanda_items ADD COLUMN IF NOT EXISTS description text;

-- Copia name → description para registros existentes
UPDATE comanda_items SET description = name WHERE description IS NULL;
