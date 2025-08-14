-- Исправление счетчиков лайков для отзывов
-- Создаем функцию для обновления счетчиков лайков/дизлайков

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
    )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создаем триггеры для таблицы review_reactions
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

-- Пересчитываем существующие счетчики для всех отзывов
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
  );

-- Проверим результат
SELECT 
  pr.id,
  pr.text,
  pr.total_likes,
  pr.total_dislikes,
  (SELECT COUNT(*) FROM review_reactions WHERE review_id = pr.id AND reaction_type = 'like') as actual_likes,
  (SELECT COUNT(*) FROM review_reactions WHERE review_id = pr.id AND reaction_type = 'dislike') as actual_dislikes
FROM product_reviews pr
ORDER BY pr.created_at DESC
LIMIT 10; 