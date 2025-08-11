-- Создание таблицы product_bundles
CREATE TABLE IF NOT EXISTS product_bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  discount_percentage DECIMAL(5,2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы bundle_products
CREATE TABLE IF NOT EXISTS bundle_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES product_bundles(id) ON DELETE CASCADE,
  suggested_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(bundle_id, suggested_product_id)
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_product_bundles_trigger_product ON product_bundles(trigger_product_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_bundle_id ON bundle_products(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_products_suggested_product ON bundle_products(suggested_product_id);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для updated_at
DROP TRIGGER IF EXISTS trigger_update_bundles_updated_at ON product_bundles;
CREATE TRIGGER trigger_update_bundles_updated_at
  BEFORE UPDATE ON product_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_bundles_updated_at();

-- Функция для получения активных бандлов для товара
CREATE OR REPLACE FUNCTION get_active_bundles_for_product(product_id UUID)
RETURNS TABLE (
  bundle_id UUID,
  trigger_product_id UUID,
  discount_percentage DECIMAL(5,2),
  suggested_products JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id as bundle_id,
    pb.trigger_product_id,
    pb.discount_percentage,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'price', p.price,
          'image_url', p.image_url,
          'brand', p.brand
        )
      ) FILTER (WHERE p.id IS NOT NULL),
      '[]'::jsonb
    ) as suggested_products
  FROM product_bundles pb
  LEFT JOIN bundle_products bp ON pb.id = bp.bundle_id
  LEFT JOIN products p ON bp.suggested_product_id = p.id
  WHERE pb.trigger_product_id = product_id
  GROUP BY pb.id, pb.trigger_product_id, pb.discount_percentage;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения бандлов, где товар является предложенным
CREATE OR REPLACE FUNCTION get_bundles_with_suggested_product(product_id UUID)
RETURNS TABLE (
  bundle_id UUID,
  trigger_product_id UUID,
  discount_percentage DECIMAL(5,2),
  trigger_product JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pb.id as bundle_id,
    pb.trigger_product_id,
    pb.discount_percentage,
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'price', p.price,
      'image_url', p.image_url,
      'brand', p.brand
    ) as trigger_product
  FROM product_bundles pb
  JOIN bundle_products bp ON pb.id = bp.bundle_id
  JOIN products p ON pb.trigger_product_id = p.id
  WHERE bp.suggested_product_id = product_id;
END;
$$ LANGUAGE plpgsql;

-- RLS политики для product_bundles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_bundles' AND policyname = 'Everyone can view bundles') THEN
    CREATE POLICY "Everyone can view bundles" ON product_bundles
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_bundles' AND policyname = 'Admins can manage bundles') THEN
    CREATE POLICY "Admins can manage bundles" ON product_bundles
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- RLS политики для bundle_products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundle_products' AND policyname = 'Everyone can view bundle products') THEN
    CREATE POLICY "Everyone can view bundle products" ON bundle_products
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bundle_products' AND policyname = 'Admins can manage bundle products') THEN
    CREATE POLICY "Admins can manage bundle products" ON bundle_products
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
      );
  END IF;
END $$;

-- Включение RLS
ALTER TABLE product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_products ENABLE ROW LEVEL SECURITY; 