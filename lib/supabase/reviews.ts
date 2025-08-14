import { supabase } from '@/lib/supabase'
import { 
  ProductReview, 
  ReviewComment, 
  ReviewMedia, 
  ReviewReaction,
  CreateReviewData,
  CreateCommentData,
  CreateReactionData
} from '@/lib/types/reviews'

// Получить отзывы для товара
export const getProductReviews = async (productId: string): Promise<ProductReview[]> => {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      *,
      user:profiles(id, email, first_name, last_name, image_url),
      media:review_media(*),
      comments:review_comments(
        *,
        user:profiles(id, email, first_name, last_name, image_url),
        replies:review_comments(
          *,
          user:profiles(id, email, first_name, last_name, image_url)
        )
      )
    `)
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    throw error
  }

  console.log('Fetched reviews with media:', data)

  // Если пользователь авторизован, получаем его реакции для каждого отзыва
  if (user) {
    const reviewsWithReactions = await Promise.all(
      (data || []).map(async (review) => {
        const userReaction = await getUserReaction(review.id)
        return {
          ...review,
          user_reaction: userReaction
        }
      })
    )
    return reviewsWithReactions
  }

  return data || []
}

// Получить отзывы пользователя
export const getUserReviews = async (userId: string): Promise<ProductReview[]> => {
  const { data, error } = await supabase
    .from('product_reviews')
    .select(`
      *,
      media:review_media(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user reviews:', error)
    throw error
  }

  return data || []
}

// Создать отзыв
export const createReview = async (reviewData: CreateReviewData): Promise<ProductReview> => {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data: review, error: reviewError } = await supabase
    .from('product_reviews')
    .insert({
      product_id: reviewData.product_id,
      user_id: user.id, // Добавляем user_id
      rating: reviewData.rating,
      text: reviewData.text,
      is_verified_purchase: true // предполагаем, что пользователь купил товар
    })
    .select()
    .single()

  if (reviewError) {
    console.error('Error creating review:', reviewError)
    throw reviewError
  }

  // Загружаем медиа файлы, если есть
  if (reviewData.media && reviewData.media.length > 0) {
    console.log('Starting media upload for review:', review.id)
    console.log('Media files to upload:', reviewData.media)
    await uploadReviewMedia(review.id, reviewData.media)
  }

  return review
}

// Обновить отзыв
export const updateReview = async (reviewId: string, updates: Partial<ProductReview>): Promise<ProductReview> => {
  const { data, error } = await supabase
    .from('product_reviews')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', reviewId)
    .select()
    .single()

  if (error) {
    console.error('Error updating review:', error)
    throw error
  }

  return data
}

// Удалить отзыв
export const deleteReview = async (reviewId: string): Promise<void> => {
  const { error } = await supabase
    .from('product_reviews')
    .delete()
    .eq('id', reviewId)

  if (error) {
    console.error('Error deleting review:', error)
    throw error
  }
}

// Получить комментарии для отзыва
export const getReviewComments = async (reviewId: string): Promise<ReviewComment[]> => {
  console.log('Fetching comments for review ID:', reviewId)
  
  const { data, error } = await supabase
    .from('review_comments')
    .select(`
      *,
      user:profiles(id, email, first_name, last_name, image_url),
      replies:review_comments(
        *,
        user:profiles(id, email, first_name, last_name, image_url)
      )
    `)
    .eq('review_id', reviewId)
    .is('parent_comment_id', null) // Только основные комментарии
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching comments:', error)
    throw error
  }

  console.log('Fetched comments data:', data)
  return (data || []) as ReviewComment[]
}

// Создать комментарий
export const createComment = async (commentData: CreateCommentData): Promise<ReviewComment> => {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  console.log('Creating comment with data:', commentData)

  const { data, error } = await supabase
    .from('review_comments')
    .insert({
      review_id: commentData.review_id,
      user_id: user.id, // Добавляем user_id
      text: commentData.text,
      parent_comment_id: commentData.parent_comment_id
    })
    .select(`
      *,
      user:profiles(id, email, first_name, last_name, image_url)
    `)
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw error
  }

  // Обновляем счетчик ответов для родительского комментария
  if (commentData.parent_comment_id) {
    await updateCommentReplyCount(commentData.parent_comment_id)
  }

  return data
}

// Обновить комментарий
export const updateComment = async (commentId: string, text: string): Promise<ReviewComment> => {
  const { data, error } = await supabase
    .from('review_comments')
    .update({
      text,
      updated_at: new Date().toISOString()
    })
    .eq('id', commentId)
    .select(`
      *,
      user:profiles(id, email, first_name, last_name, image_url)
    `)
    .single()

  if (error) {
    console.error('Error updating comment:', error)
    throw error
  }

  return data
}

// Удалить комментарий
export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from('review_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

// Создать реакцию
export const createReaction = async (reactionData: CreateReactionData): Promise<ReviewReaction> => {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    // Сначала удаляем существующую реакцию пользователя на этот отзыв
    await deleteUserReaction(reactionData.review_id)

    const { data, error } = await supabase
      .from('review_reactions')
      .insert({
        review_id: reactionData.review_id,
        user_id: user.id,
        reaction_type: reactionData.reaction_type
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') { // table doesn't exist
        console.warn('Table review_reactions does not exist, skipping reaction creation')
        // Возвращаем заглушку
        return {
          id: 'temp',
          review_id: reactionData.review_id,
          user_id: user.id,
          reaction_type: reactionData.reaction_type,
          created_at: new Date().toISOString()
        } as ReviewReaction
      } else {
        console.error('Error creating reaction:', error)
        throw error
      }
    }

    return data
  } catch (error) {
    console.error('Unexpected error in createReaction:', error)
    throw error
  }
}

// Удалить реакцию пользователя
export const deleteUserReaction = async (reviewId: string): Promise<void> => {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    const { error } = await supabase
      .from('review_reactions')
      .delete()
      .eq('review_id', reviewId)
      .eq('user_id', user.id)

    if (error) {
      if (error.code === '42P01') { // table doesn't exist
        console.warn('Table review_reactions does not exist, skipping reaction deletion')
        return
      } else {
        console.error('Error deleting reaction:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Unexpected error in deleteUserReaction:', error)
    throw error
  }
}

// Получить реакцию пользователя на отзыв
export const getUserReaction = async (reviewId: string): Promise<'like' | 'dislike' | null> => {
  // Получаем текущего пользователя
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('review_reactions')
      .select('reaction_type')
      .eq('review_id', reviewId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // no rows returned
        return null
      } else if (error.code === '42P01') { // table doesn't exist
        console.warn('Table review_reactions does not exist, skipping reaction loading')
        return null
      } else {
        console.error('Error fetching user reaction:', error)
        return null
      }
    }

    return data?.reaction_type || null
  } catch (error) {
    console.error('Unexpected error in getUserReaction:', error)
    return null
  }
}

// Создать лайк на комментарий
export const createCommentLike = async (commentId: string): Promise<any> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    const { data, error } = await supabase
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        user_id: user.id,
        reaction_type: 'like'
      })
      .select()
      .single()

    if (error) {
      if (error.code === '42P01') { // table doesn't exist
        console.warn('Table comment_reactions does not exist, skipping comment like creation')
        return {
          id: 'temp',
          comment_id: commentId,
          user_id: user.id,
          reaction_type: 'like',
          created_at: new Date().toISOString()
        }
      } else {
        console.error('Error creating comment like:', error)
        throw error
      }
    }

    return data
  } catch (error) {
    console.error('Unexpected error in createCommentLike:', error)
    throw error
  }
}

// Удалить лайк на комментарий
export const deleteCommentLike = async (commentId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    const { error } = await supabase
      .from('comment_reactions')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', user.id)

    if (error) {
      if (error.code === '42P01') { // table doesn't exist
        console.warn('Table comment_reactions does not exist, skipping comment like deletion')
        return
      } else {
        console.error('Error deleting comment like:', error)
        throw error
      }
    }
  } catch (error) {
    console.error('Unexpected error in deleteCommentLike:', error)
    throw error
  }
}

// Получить лайк пользователя на комментарий
export const getUserCommentLike = async (commentId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  try {
    const { data, error } = await supabase
      .from('comment_reactions')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // no rows returned
        return false
      } else if (error.code === '42P01') { // table doesn't exist
        console.warn('Table comment_reactions does not exist, skipping comment like loading')
        return false
      } else {
        console.error('Error fetching user comment like:', error)
        return false
      }
    }

    return !!data
  } catch (error) {
    console.error('Unexpected error in getUserCommentLike:', error)
    return false
  }
}

// Загрузить медиа для отзыва
const uploadReviewMedia = async (reviewId: string, files: File[]): Promise<void> => {
  console.log('Starting media upload for review:', reviewId)
  console.log('Files to upload:', files.length)
  
  // Проверяем bucket
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  if (bucketError) {
    console.error('Error listing buckets:', bucketError)
  } else {
    console.log('Available buckets:', buckets)
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileExt = file.name.split('.').pop()
    const fileName = `${reviewId}/${Date.now()}-${i}.${fileExt}`
    
    try {
      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)
      
      console.log('Attempting to upload to bucket: review-media')
      const { error: uploadError } = await supabase.storage
        .from('review-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading media:', uploadError)
        continue
      }

      console.log('File uploaded successfully:', fileName)

      const { data: { publicUrl } } = supabase.storage
        .from('review-media')
        .getPublicUrl(fileName)

      console.log('Public URL:', publicUrl)

      // Определяем тип медиа
      const mediaType = file.type.startsWith('image/') ? 'image' : 'video'
      
      // Получаем метаданные файла
      let width, height, duration_ms
      if (mediaType === 'image') {
        try {
          const img = new window.Image()
          img.src = URL.createObjectURL(file)
          await new Promise((resolve, reject) => {
            img.onload = () => {
              width = img.naturalWidth
              height = img.naturalHeight
              resolve(null)
            }
            img.onerror = reject
            // Таймаут на случай, если изображение не загрузится
            setTimeout(() => reject(new Error('Image load timeout')), 5000)
          })
        } catch (error) {
          console.warn('Could not get image dimensions:', error)
          width = null
          height = null
        }
      }

      // Создаем запись в базе данных
      const { error: insertError } = await supabase
        .from('review_media')
        .insert({
          review_id: reviewId,
          media_type: mediaType,
          media_url: publicUrl,
          storage_path: fileName,
          file_size: file.size,
          width,
          height,
          duration_ms,
          order_index: i
        })

      if (insertError) {
        console.error('Error inserting media record:', insertError)
      } else {
        console.log('Media record inserted successfully')
      }
    } catch (error) {
      console.error('Error processing media file:', error)
    }
  }
}

// Обновить счетчик ответов для комментария
const updateCommentReplyCount = async (commentId: string): Promise<void> => {
  const { count, error } = await supabase
    .from('review_comments')
    .select('*', { count: 'exact', head: true })
    .eq('parent_comment_id', commentId)

  if (error) {
    console.error('Error counting replies:', error)
    return
  }

  await supabase
    .from('review_comments')
    .update({ reply_count: count || 0 })
    .eq('id', commentId)
}

// Проверить, может ли пользователь оставить отзыв (купил ли товар)
export const canUserReviewProduct = async (productId: string): Promise<boolean> => {
  // Здесь можно добавить логику проверки покупки
  // Пока возвращаем true для демонстрации
  return true
} 