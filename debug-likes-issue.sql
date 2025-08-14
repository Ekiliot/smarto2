-- Диагностика проблемы с лайками
-- Проверяем структуру таблиц

-- 1. Проверяем есть ли таблица review_reactions
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'review_reactions'
);

-- 2. Если таблица существует, смотрим её структуру
\d review_reactions;

-- 3. Проверяем данные в product_reviews
SELECT 
  id,
  LEFT(text, 50) as text_preview,
  total_likes,
  total_dislikes,
  created_at
FROM product_reviews 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Проверяем есть ли данные в review_reactions
SELECT 
  rr.id,
  rr.review_id,
  rr.user_id,
  rr.reaction_type,
  rr.created_at
FROM review_reactions rr
ORDER BY rr.created_at DESC 
LIMIT 10;

-- 5. Подсчитываем реальные лайки и сравниваем с полями в product_reviews
SELECT 
  pr.id as review_id,
  LEFT(pr.text, 30) as text_preview,
  pr.total_likes as stored_likes,
  pr.total_dislikes as stored_dislikes,
  COUNT(CASE WHEN rr.reaction_type = 'like' THEN 1 END) as actual_likes,
  COUNT(CASE WHEN rr.reaction_type = 'dislike' THEN 1 END) as actual_dislikes,
  COUNT(rr.id) as total_reactions
FROM product_reviews pr
LEFT JOIN review_reactions rr ON pr.id = rr.review_id
GROUP BY pr.id, pr.text, pr.total_likes, pr.total_dislikes
ORDER BY pr.created_at DESC
LIMIT 10;

-- 6. Ищем отзывы с отрицательными значениями
SELECT 
  id,
  LEFT(text, 50) as text_preview,
  total_likes,
  total_dislikes
FROM product_reviews 
WHERE total_likes < 0 OR total_dislikes < 0; 