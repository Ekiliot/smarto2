-- Исправление системы лайков комментариев
-- Создаем таблицу comment_reactions и добавляем поле total_likes

-- 1. Добавляем поле total_likes в таблицу review_comments
ALTER TABLE public.review_comments 
ADD COLUMN IF NOT EXISTS total_likes integer DEFAULT 0;

-- 2. Создаем таблицу comment_reactions если её нет
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like')),
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT comment_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) 
    REFERENCES review_comments (id) ON DELETE CASCADE,
  CONSTRAINT comment_reactions_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT comment_reactions_user_comment_unique UNIQUE (comment_id, user_id)
);

-- 3. Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id ON public.comment_reactions (comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON public.comment_reactions (user_id);

-- 4. Настраиваем RLS политики
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Политика для SELECT - все могут читать
DROP POLICY IF EXISTS "Everyone can view comment reactions" ON public.comment_reactions;
CREATE POLICY "Everyone can view comment reactions" ON public.comment_reactions
FOR SELECT USING (true);

-- Политика для INSERT - авторизованные пользователи могут создавать
DROP POLICY IF EXISTS "Users can create comment reactions" ON public.comment_reactions;
CREATE POLICY "Users can create comment reactions" ON public.comment_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политика для DELETE - пользователи могут удалять свои реакции
DROP POLICY IF EXISTS "Users can delete own comment reactions" ON public.comment_reactions;
CREATE POLICY "Users can delete own comment reactions" ON public.comment_reactions
FOR DELETE USING (auth.uid() = user_id);

-- 5. Создаем функцию для обновления счетчиков лайков комментариев
CREATE OR REPLACE FUNCTION update_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Пересчитываем лайки для комментария
  UPDATE review_comments 
  SET 
    total_likes = (
      SELECT COUNT(*) 
      FROM comment_reactions 
      WHERE comment_id = COALESCE(NEW.comment_id, OLD.comment_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.comment_id, OLD.comment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 6. Создаем триггеры для таблицы comment_reactions
DROP TRIGGER IF EXISTS trigger_update_comment_like_counts_insert ON comment_reactions;
CREATE TRIGGER trigger_update_comment_like_counts_insert
  AFTER INSERT ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_counts();

DROP TRIGGER IF EXISTS trigger_update_comment_like_counts_delete ON comment_reactions;
CREATE TRIGGER trigger_update_comment_like_counts_delete
  AFTER DELETE ON comment_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_counts();

-- 7. Пересчитываем существующие счетчики для всех комментариев
UPDATE review_comments 
SET 
  total_likes = (
    SELECT COUNT(*) 
    FROM comment_reactions 
    WHERE comment_id = review_comments.id
  ),
  updated_at = now();

-- 8. Проверяем результат
SELECT 
  'После исправления:' as status,
  COUNT(*) as total_comments,
  COUNT(CASE WHEN total_likes > 0 THEN 1 END) as comments_with_likes,
  SUM(total_likes) as total_likes_sum
FROM review_comments;

-- 9. Показываем примеры комментариев с их лайками
SELECT 
  rc.id,
  LEFT(rc.text, 40) as text_preview,
  rc.total_likes,
  (SELECT COUNT(*) FROM comment_reactions WHERE comment_id = rc.id) as actual_likes
FROM review_comments rc
ORDER BY rc.created_at DESC
LIMIT 5; 