-- Создание полной системы реакций на отзывы
-- Этот скрипт создаст таблицу review_reactions и настроит триггеры

-- 1. Создаем таблицу review_reactions если её нет
CREATE TABLE IF NOT EXISTS public.review_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT review_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT review_reactions_review_id_fkey FOREIGN KEY (review_id) 
    REFERENCES product_reviews (id) ON DELETE CASCADE,
  CONSTRAINT review_reactions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT review_reactions_user_review_unique UNIQUE (review_id, user_id)
);

-- 2. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id ON public.review_reactions (review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_id ON public.review_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_type ON public.review_reactions (reaction_type);

-- 3. Настраиваем RLS политики
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- Политика для SELECT - все могут читать
DROP POLICY IF EXISTS "Everyone can view reactions" ON public.review_reactions;
CREATE POLICY "Everyone can view reactions" ON public.review_reactions
FOR SELECT USING (true);

-- Политика для INSERT - авторизованные пользователи могут создавать
DROP POLICY IF EXISTS "Users can create reactions" ON public.review_reactions;
CREATE POLICY "Users can create reactions" ON public.review_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для DELETE - пользователи могут удалять свои реакции
DROP POLICY IF EXISTS "Users can delete own reactions" ON public.review_reactions;
CREATE POLICY "Users can delete own reactions" ON public.review_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Политика для UPDATE - пользователи могут обновлять свои реакции
DROP POLICY IF EXISTS "Users can update own reactions" ON public.review_reactions;
CREATE POLICY "Users can update own reactions" ON public.review_reactions
FOR UPDATE USING (auth.uid() = user_id);

-- 4. Создаем функцию для обновления счетчиков
CREATE OR REPLACE FUNCTION update_review_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Пересчитываем лайки и дизлайки для отзыва
  UPDATE product_reviews 
  SET 
    total_likes = (
      SELECT COUNT(*) 
      FROM review_reactions 
      WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
        AND reaction_type = 'like'
    ),
    total_dislikes = (
      SELECT COUNT(*) 
      FROM review_reactions 
      WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
        AND reaction_type = 'dislike'
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 5. Создаем триггеры
DROP TRIGGER IF EXISTS trigger_update_review_reaction_counts_insert ON review_reactions;
CREATE TRIGGER trigger_update_review_reaction_counts_insert
  AFTER INSERT ON review_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_review_reaction_counts();

DROP TRIGGER IF EXISTS trigger_update_review_reaction_counts_update ON review_reactions;
CREATE TRIGGER trigger_update_review_reaction_counts_update
  AFTER UPDATE ON review_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_review_reaction_counts();

DROP TRIGGER IF EXISTS trigger_update_review_reaction_counts_delete ON review_reactions;
CREATE TRIGGER trigger_update_review_reaction_counts_delete
  AFTER DELETE ON review_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_review_reaction_counts();

-- 6. Исправляем отрицательные значения и пересчитываем все счетчики
UPDATE product_reviews 
SET 
  total_likes = GREATEST(0, (
    SELECT COUNT(*) 
    FROM review_reactions 
    WHERE review_id = product_reviews.id 
      AND reaction_type = 'like'
  )),
  total_dislikes = GREATEST(0, (
    SELECT COUNT(*) 
    FROM review_reactions 
    WHERE review_id = product_reviews.id 
      AND reaction_type = 'dislike'
  )),
  updated_at = now();

-- 7. Проверяем результат
SELECT 
  'После исправления:' as status,
  COUNT(*) as total_reviews,
  COUNT(CASE WHEN total_likes < 0 THEN 1 END) as negative_likes,
  COUNT(CASE WHEN total_dislikes < 0 THEN 1 END) as negative_dislikes,
  SUM(total_likes) as total_likes_sum,
  SUM(total_dislikes) as total_dislikes_sum
FROM product_reviews;

-- 8. Показываем примеры отзывов с их лайками
SELECT 
  pr.id,
  LEFT(pr.text, 40) as text_preview,
  pr.total_likes,
  pr.total_dislikes,
  (SELECT COUNT(*) FROM review_reactions WHERE review_id = pr.id AND reaction_type = 'like') as actual_likes,
  (SELECT COUNT(*) FROM review_reactions WHERE review_id = pr.id AND reaction_type = 'dislike') as actual_dislikes
FROM product_reviews pr
ORDER BY pr.created_at DESC
LIMIT 5; 