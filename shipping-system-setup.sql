-- Система способов доставки для Smarto2

-- Создание таблицы способов доставки
CREATE TABLE IF NOT EXISTS shipping_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    free_shipping_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
    estimated_days VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON shipping_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_sort ON shipping_methods(sort_order);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_threshold ON shipping_methods(free_shipping_threshold);

-- Добавление RLS (Row Level Security)
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- Политики для чтения (все могут читать активные способы доставки)
CREATE POLICY "Shipping methods are viewable by everyone" ON shipping_methods
    FOR SELECT USING (is_active = true);

-- Политики для админов (полный доступ)
CREATE POLICY "Admins can manage shipping methods" ON shipping_methods
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Создание функции для обновления updated_at
CREATE OR REPLACE FUNCTION update_shipping_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления updated_at
CREATE TRIGGER trigger_update_shipping_methods_updated_at
    BEFORE UPDATE ON shipping_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_shipping_methods_updated_at();

-- Вставка начальных данных
INSERT INTO shipping_methods (name, description, price, free_shipping_threshold, estimated_days, is_active, sort_order) VALUES
    ('Стандартная доставка', 'Доставка курьером по городу Кишинев', 150.00, 1000.00, '1-2 дня', true, 1),
    ('Экспресс доставка', 'Быстрая доставка в течение дня', 300.00, 2000.00, 'В течение дня', true, 2),
    ('Почта Молдовы', 'Доставка почтой по всей стране', 100.00, 1500.00, '3-5 дней', true, 3),
    ('Самовывоз', 'Бесплатный самовывоз из нашего магазина', 0.00, 0.00, 'В день заказа', true, 4)
ON CONFLICT (id) DO NOTHING;

-- Обновление таблицы заказов для поддержки способов доставки
-- Добавляем колонки если их нет
DO $$ 
BEGIN
    -- Добавляем колонку shipping_method_id если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_method_id') THEN
        ALTER TABLE orders ADD COLUMN shipping_method_id UUID REFERENCES shipping_methods(id);
    END IF;
    
    -- Добавляем колонку shipping_cost если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
        ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    -- Добавляем колонку shipping_method_name если её нет
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'shipping_method_name') THEN
        ALTER TABLE orders ADD COLUMN shipping_method_name VARCHAR(255);
    END IF;
END $$;

-- Создание представления для удобного получения информации о доставке
CREATE OR REPLACE VIEW shipping_methods_view AS
SELECT 
    id,
    name,
    description,
    price,
    free_shipping_threshold,
    estimated_days,
    is_active,
    sort_order,
    created_at,
    updated_at,
    CASE 
        WHEN price = 0 THEN 'Бесплатно'
        ELSE price::text || ' MDL'
    END as price_display,
    CASE 
        WHEN free_shipping_threshold = 0 THEN 'Всегда бесплатно'
        ELSE 'Бесплатно от ' || free_shipping_threshold::text || ' MDL'
    END as threshold_display
FROM shipping_methods
ORDER BY sort_order, name;

-- Функция для получения активных способов доставки
CREATE OR REPLACE FUNCTION get_active_shipping_methods()
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    free_shipping_threshold DECIMAL(10,2),
    estimated_days VARCHAR(100),
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.name,
        sm.description,
        sm.price,
        sm.free_shipping_threshold,
        sm.estimated_days,
        sm.sort_order
    FROM shipping_methods sm
    WHERE sm.is_active = true
    ORDER BY sm.sort_order, sm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для расчета стоимости доставки
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
    p_subtotal DECIMAL(10,2),
    p_shipping_method_id UUID
)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_price DECIMAL(10,2);
    v_threshold DECIMAL(10,2);
BEGIN
    SELECT price, free_shipping_threshold 
    INTO v_price, v_threshold
    FROM shipping_methods 
    WHERE id = p_shipping_method_id AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Если сумма заказа достигает порога, доставка бесплатна
    IF p_subtotal >= v_threshold THEN
        RETURN 0;
    END IF;
    
    RETURN v_price;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения способа доставки по ID
CREATE OR REPLACE FUNCTION get_shipping_method_by_id(p_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2),
    free_shipping_threshold DECIMAL(10,2),
    estimated_days VARCHAR(100),
    is_active BOOLEAN,
    sort_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.name,
        sm.description,
        sm.price,
        sm.free_shipping_threshold,
        sm.estimated_days,
        sm.is_active,
        sm.sort_order
    FROM shipping_methods sm
    WHERE sm.id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарии к таблицам и функциям
COMMENT ON TABLE shipping_methods IS 'Способы доставки для магазина';
COMMENT ON COLUMN shipping_methods.price IS 'Стоимость доставки в MDL';
COMMENT ON COLUMN shipping_methods.free_shipping_threshold IS 'Порог для бесплатной доставки в MDL';
COMMENT ON COLUMN shipping_methods.estimated_days IS 'Ожидаемые сроки доставки';
COMMENT ON COLUMN shipping_methods.sort_order IS 'Порядок сортировки способов доставки';

COMMENT ON FUNCTION get_active_shipping_methods() IS 'Получение активных способов доставки';
COMMENT ON FUNCTION calculate_shipping_cost(DECIMAL, UUID) IS 'Расчет стоимости доставки с учетом порога';
COMMENT ON FUNCTION get_shipping_method_by_id(UUID) IS 'Получение способа доставки по ID'; 