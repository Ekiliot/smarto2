-- Добавление поля icon в таблицу categories

-- Добавляем поле icon
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN categories.icon IS 'Эмодзи или символ для иконки категории';

-- Показываем результат
SELECT 
  'Поле icon добавлено в таблицу categories' as result,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' AND column_name = 'icon'; 