export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  rating: number
  text: string
  created_at: string
  updated_at: string
  is_verified_purchase: boolean
  helpful_count: number
  total_likes: number
  total_dislikes: number
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    image_url?: string
  }
  media?: ReviewMedia[]
  comments?: ReviewComment[]
  user_reaction?: 'like' | 'dislike' | null
}

export interface ReviewComment {
  id: string
  review_id: string
  user_id: string
  text: string
  created_at: string
  updated_at: string
  parent_comment_id?: string
  reply_count: number
  total_likes: number
  user?: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    image_url?: string
  }
  replies?: ReviewComment[]
}

export interface ReviewMedia {
  id: string
  review_id: string
  media_type: 'image' | 'video'
  media_url: string
  thumbnail_url?: string
  storage_path: string
  file_size?: number
  duration_ms?: number
  width?: number
  height?: number
  created_at: string
  order_index: number
}

export interface ReviewReaction {
  id: string
  review_id: string
  user_id: string
  reaction_type: 'like' | 'dislike'
  created_at: string
}

export interface CreateReviewData {
  product_id: string
  rating: number
  text: string
  media?: File[]
}

export interface CreateCommentData {
  review_id: string
  text: string
  parent_comment_id?: string
}

export interface CreateReactionData {
  review_id: string
  reaction_type: 'like' | 'dislike'
} 