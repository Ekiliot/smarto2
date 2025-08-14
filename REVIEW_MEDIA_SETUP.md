# Настройка медиа файлов для отзывов

## Проблема
Медиа файлы (фото и видео) не загружаются в bucket `review-media` и не отображаются при просмотре отзывов.

## Решение

### 1. Создание bucket в Supabase

Выполните SQL скрипт `review-media-storage-setup.sql` в Supabase SQL Editor:

```sql
-- Создание bucket для медиа файлов отзывов
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'review-media',
  'review-media',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- RLS политики для bucket
CREATE POLICY "Review media is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-media');

CREATE POLICY "Users can upload review media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update own review media" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'review-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own review media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-media' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 2. Проверка bucket в Supabase Dashboard

1. Откройте Supabase Dashboard
2. Перейдите в Storage → Buckets
3. Убедитесь, что bucket `review-media` создан
4. Проверьте, что он публичный (public = true)

### 3. Проверка RLS политик

1. В Supabase Dashboard перейдите в Storage → Policies
2. Убедитесь, что для bucket `review-media` есть политики:
   - SELECT: публичный доступ
   - INSERT: только авторизованные пользователи
   - UPDATE/DELETE: только владельцы файлов

### 4. Тестирование загрузки

После настройки:

1. Создайте новый отзыв с фото/видео
2. Проверьте консоль браузера на наличие ошибок
3. Проверьте bucket `review-media` в Supabase Dashboard
4. Убедитесь, что файлы загрузились

### 5. Проверка отображения

1. Откройте страницу товара с отзывами
2. Проверьте, что медиа файлы отображаются
3. Проверьте консоль на наличие логов загрузки

## Возможные проблемы

### Bucket не создается
- Убедитесь, что у вас есть права администратора в Supabase
- Проверьте, что storage включен в проекте

### Файлы не загружаются
- Проверьте RLS политики
- Убедитесь, что пользователь авторизован
- Проверьте размер и тип файла

### Файлы не отображаются
- Проверьте, что bucket публичный
- Убедитесь, что RLS политика SELECT разрешает доступ
- Проверьте консоль на ошибки

## Логирование

В коде добавлено подробное логирование:
- Загрузка файлов
- Создание записей в БД
- Получение отзывов с медиа

Проверьте консоль браузера для диагностики проблем. 