-- Очистка всех mock данных из базы

-- 1. Удаляем все товары
DELETE FROM products;

-- 2. Удаляем все категории (кроме базовых)
DELETE FROM categories 
WHERE name NOT IN ('Умный дом', 'Электроника', 'Бытовая техника', 'Компьютеры', 'Телефоны');

-- 3. Сбрасываем счетчики товаров в категориях
UPDATE categories 
SET product_count = 0;

-- 4. Показываем результат
SELECT 
  'Удалено товаров: ' || (SELECT COUNT(*) FROM products) as products_count,
  'Осталось категорий: ' || (SELECT COUNT(*) FROM categories) as categories_count;

-- 5. Показываем оставшиеся категории
SELECT id, name, product_count FROM categories ORDER BY name; 