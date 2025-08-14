-- Проверяем конкретные отзывы из данных которые предоставил пользователь

-- 1. Подсчитываем реальные лайки для отзывов из предоставленных данных
SELECT 
  review_id,
  COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as actual_likes,
  COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as actual_dislikes,
  COUNT(*) as total_reactions
FROM review_reactions 
WHERE review_id IN (
  '72ebf451-adc3-40bc-9583-0444d2941822',
  '85294ff8-a555-4a20-950c-95215095b06d',
  'e0598693-8d02-4f98-a4c2-62d201c73079'
)
GROUP BY review_id;

-- 2. Сравниваем с тем что хранится в product_reviews
SELECT 
  pr.id as review_id,
  LEFT(pr.text, 50) as text_preview,
  pr.total_likes as stored_likes,
  pr.total_dislikes as stored_dislikes,
  rr_counts.actual_likes,
  rr_counts.actual_dislikes,
  rr_counts.total_reactions
FROM product_reviews pr
LEFT JOIN (
  SELECT 
    review_id,
    COUNT(CASE WHEN reaction_type = 'like' THEN 1 END) as actual_likes,
    COUNT(CASE WHEN reaction_type = 'dislike' THEN 1 END) as actual_dislikes,
    COUNT(*) as total_reactions
  FROM review_reactions 
  GROUP BY review_id
) rr_counts ON pr.id = rr_counts.review_id
WHERE pr.id IN (
  '72ebf451-adc3-40bc-9583-0444d2941822',
  '85294ff8-a555-4a20-950c-95215095b06d',
  'e0598693-8d02-4f98-a4c2-62d201c73079'
);

-- 3. Исправляем счетчики для этих конкретных отзывов
UPDATE product_reviews 
SET 
  total_likes = (
    SELECT COUNT(*) 
    FROM review_reactions 
    WHERE review_id = product_reviews.id 
      AND reaction_type = 'like'
  ),
  total_dislikes = (
    SELECT COUNT(*) 
    FROM review_reactions 
    WHERE review_id = product_reviews.id 
      AND reaction_type = 'dislike'
  ),
  updated_at = now()
WHERE id IN (
  '72ebf451-adc3-40bc-9583-0444d2941822',
  '85294ff8-a555-4a20-950c-95215095b06d',
  'e0598693-8d02-4f98-a4c2-62d201c73079'
);

-- 4. Проверяем результат
SELECT 
  pr.id as review_id,
  LEFT(pr.text, 50) as text_preview,
  pr.total_likes as stored_likes,
  pr.total_dislikes as stored_dislikes
FROM product_reviews pr
WHERE pr.id IN (
  '72ebf451-adc3-40bc-9583-0444d2941822',
  '85294ff8-a555-4a20-950c-95215095b06d',
  'e0598693-8d02-4f98-a4c2-62d201c73079'
);

-- 5. Исправляем ВСЕ отзывы разом
UPDATE product_reviews 
SET 
  total_likes = COALESCE((
    SELECT COUNT(*) 
    FROM review_reactions 
    WHERE review_id = product_reviews.id 
      AND reaction_type = 'like'
  ), 0),
  total_dislikes = COALESCE((
    SELECT COUNT(*) 
    FROM review_reactions 
    WHERE review_id = product_reviews.id 
      AND reaction_type = 'dislike'
  ), 0),
  updated_at = now();

-- 6. Финальная проверка - показываем все отзывы с отрицательными значениями
SELECT 
  id,
  LEFT(text, 50) as text_preview,
  total_likes,
  total_dislikes
FROM product_reviews 
WHERE total_likes < 0 OR total_dislikes < 0; 