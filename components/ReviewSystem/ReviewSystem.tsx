'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MessageSquare, Plus, Filter, SortAsc, SortDesc } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { ProductReview, CreateReviewData } from '@/lib/types/reviews'
import { getProductReviews, createReview, updateReview, deleteReview, createReaction, getUserReaction } from '@/lib/supabase/reviews'
import ReviewCard from './ReviewCard'
import CreateReviewForm from './CreateReviewForm'

interface ReviewSystemProps {
  productId: string
  productName: string
}

type SortOption = 'newest' | 'oldest' | 'rating-high' | 'rating-low'
type FilterOption = 'all' | 'verified' | 'with-media'

export default function ReviewSystem({ productId, productName }: ReviewSystemProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [error, setError] = useState('')

  // Загружаем отзывы при монтировании и изменении фильтров
  useEffect(() => {
    loadReviews()
  }, [productId, sortBy, filterBy])

  const loadReviews = async () => {
    try {
      setLoading(true)
      const fetchedReviews = await getProductReviews(productId)
      
      // Применяем фильтры
      let filteredReviews = fetchedReviews
      
      if (filterBy === 'verified') {
        filteredReviews = filteredReviews.filter(review => review.is_verified_purchase)
      } else if (filterBy === 'with-media') {
        filteredReviews = filteredReviews.filter(review => review.media && review.media.length > 0)
      }

      // Применяем сортировку
      const sortedReviews = [...filteredReviews].sort((a, b) => {
        switch (sortBy) {
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          case 'oldest':
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          case 'rating-high':
            return b.rating - a.rating
          case 'rating-low':
            return a.rating - b.rating
          default:
            return 0
        }
      })

      setReviews(sortedReviews)
    } catch (err) {
      console.error('Error loading reviews:', err)
      setError('Ошибка при загрузке отзывов')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async (reviewData: CreateReviewData) => {
    try {
      const newReview = await createReview(reviewData)
      setReviews(prev => [newReview, ...prev])
      setShowCreateForm(false)
    } catch (err) {
      console.error('Error creating review:', err)
      setError('Ошибка при создании отзыва')
    }
  }

  const handleUpdateReview = async (updatedReview: ProductReview) => {
    try {
      await updateReview(updatedReview.id, updatedReview)
      setReviews(prev => prev.map(review => 
        review.id === updatedReview.id ? updatedReview : review
      ))
    } catch (err) {
      console.error('Error updating review:', err)
      setError('Ошибка при обновлении отзыва')
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview(reviewId)
      setReviews(prev => prev.filter(review => review.id !== reviewId))
    } catch (err) {
      console.error('Error deleting review:', err)
      setError('Ошибка при удалении отзыва')
    }
  }

  const handleReaction = async (reviewId: string, type: 'like' | 'dislike') => {
    try {
      await createReaction({ review_id: reviewId, reaction_type: type })
      
      // Обновляем только user_reaction, счетчики обновятся через триггеры
      setReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
          return {
            ...review,
            user_reaction: type
          }
        }
        return review
      }))
      
      // Перезагружаем отзывы чтобы получить актуальные счетчики
      await loadReviews()
    } catch (err) {
      console.error('Error creating reaction:', err)
      setError('Ошибка при создании реакции')
    }
  }

  const handleComment = async (reviewId: string, parentCommentId?: string) => {
    // Здесь будет логика создания комментария
    console.log('Creating comment for review:', reviewId, 'parent:', parentCommentId)
  }

  // Вычисляем статистику
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0
  const verifiedReviews = reviews.filter(review => review.is_verified_purchase).length
  const reviewsWithMedia = reviews.filter(review => review.media && review.media.length > 0).length

  // Распределение рейтингов
  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const count = reviews.filter(review => review.rating === i + 1).length
    return { rating: i + 1, count, percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0 }
  }).reverse()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Отзывы о товаре
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {totalReviews} отзывов • {averageRating.toFixed(1)} из 5
            </p>
          </div>
          
          {user && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Написать отзыв
            </button>
          )}
        </div>

        {/* Статистика рейтингов */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Распределение оценок
            </h3>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Дополнительная информация
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Подтвержденные покупки</span>
                <span className="font-medium text-gray-900 dark:text-white">{verifiedReviews}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Отзывы с медиа</span>
                <span className="font-medium text-gray-900 dark:text-white">{reviewsWithMedia}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Фильтры и сортировка */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterOption)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">Все отзывы</option>
            <option value="verified">Подтвержденные покупки</option>
            <option value="with-media">С медиа</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {sortBy === 'newest' ? <SortDesc className="w-4 h-4 text-gray-500" /> : <SortAsc className="w-4 h-4 text-gray-500" />}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
            <option value="rating-high">По рейтингу (высокий)</option>
            <option value="rating-low">По рейтингу (низкий)</option>
          </select>
        </div>
      </div>

      {/* Форма создания отзыва */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateReviewForm
            productId={productId}
            onSubmit={handleCreateReview}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Список отзывов */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Пока нет отзывов
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Будьте первым, кто оставит отзыв об этом товаре!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onUpdate={handleUpdateReview}
              onDelete={handleDeleteReview}
              onReaction={handleReaction}
              onComment={handleComment}
            />
          ))}
        </div>
      )}
    </div>
  )
} 