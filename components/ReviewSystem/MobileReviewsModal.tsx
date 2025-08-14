'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Star, MessageSquare, Plus, ChevronDown, Loader2, ThumbsUp, ThumbsDown, Heart, MessageCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProductReview, ReviewMedia } from '@/lib/types/reviews'
import { getProductReviews, createReaction, deleteUserReaction, getUserReaction } from '@/lib/supabase/reviews'
import { useAuth } from '@/components/AuthProvider'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import MediaViewer from './MediaViewer'

interface MobileReviewsModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  onOpenMediaViewer: (review: ProductReview) => void // Изменено: передаем отзыв
  onOpenComments: (review: any) => void
}

const REVIEWS_PER_PAGE = 5

export default function MobileReviewsModal({ 
  isOpen, 
  onClose, 
  productId, 
  productName,
  onOpenMediaViewer,
  onOpenComments
}: MobileReviewsModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [error, setError] = useState('')
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [selectedMedia, setSelectedMedia] = useState<{ media: ReviewMedia; review: ProductReview } | null>(null)
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null)
  
  // Состояния для лайков/дизлайков
  const [userReactions, setUserReactions] = useState<Record<string, 'like' | 'dislike' | null>>({})
  const [reactionCounts, setReactionCounts] = useState<Record<string, { likes: number; dislikes: number }>>({})
  const [forceUpdate, setForceUpdate] = useState(0) // Для принудительного обновления
  
  const modalRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastReviewRef = useCallback((node: HTMLDivElement) => {
    if (loadingMore) return
    
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreReviews()
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loadingMore, hasMore])

  // Управляем navbar и загружаем отзывы при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      openModal()
      loadInitialReviews()
    } else {
      closeModal()
    }
  }, [isOpen])

  // Отладочная информация
  useEffect(() => {
    console.log('Состояние реакций обновлено:', {
      userReactions,
      reactionCounts,
      forceUpdate
    })
  }, [userReactions, reactionCounts, forceUpdate])

  // Перезагружаем реакции при изменении отзывов
  useEffect(() => {
    if (reviews.length > 0 && user) {
      console.log('Отзывы изменились, перезагружаем реакции для', reviews.length, 'отзывов')
      loadUserReactionsForReviews(reviews)
    }
  }, [reviews, user])

  const loadInitialReviews = async () => {
    try {
      setLoading(true)
      setError('')
      console.log('Начинаем загрузку отзывов для продукта:', productId)
      
      const fetchedReviews = await getProductReviews(productId)
      console.log('Получены отзывы:', fetchedReviews.length)
      
      // Сначала устанавливаем отзывы
      setReviews(fetchedReviews.slice(0, REVIEWS_PER_PAGE))
      setHasMore(fetchedReviews.length > REVIEWS_PER_PAGE)
      setCurrentPage(1)
      
      // Вычисляем средний рейтинг
      if (fetchedReviews.length > 0) {
        const avgRating = fetchedReviews.reduce((sum, review) => sum + review.rating, 0) / fetchedReviews.length
        setAverageRating(avgRating)
        setTotalReviews(fetchedReviews.length)
      }
      
      // Загружаем реакции пользователя для загруженных отзывов
      console.log('Загружаем реакции пользователя для', fetchedReviews.slice(0, REVIEWS_PER_PAGE).length, 'отзывов')
      await loadUserReactionsForReviews(fetchedReviews.slice(0, REVIEWS_PER_PAGE))
      console.log('Реакции пользователя загружены')
      
    } catch (err) {
      console.error('Error loading reviews:', err)
      setError('Ошибка при загрузке отзывов')
    } finally {
      setLoading(false)
    }
  }

  const loadMoreReviews = async () => {
    if (loadingMore || !hasMore) return
    
    try {
      setLoadingMore(true)
      const startIndex = currentPage * REVIEWS_PER_PAGE
      const endIndex = startIndex + REVIEWS_PER_PAGE
      const newReviews = reviews.slice(startIndex, endIndex)
      
      setReviews(prev => [...prev, ...newReviews])
      setCurrentPage(prev => prev + 1)
      setHasMore(endIndex < reviews.length)
      
      // Загружаем реакции для новых отзывов
      console.log('Загружаем реакции для новых отзывов:', newReviews.length)
      await loadUserReactionsForReviews(newReviews)
    } catch (err) {
      console.error('Error loading more reviews:', err)
    } finally {
      setLoadingMore(false)
    }
  }

  const handleClose = () => {
    closeModal()
    onClose()
    // Сбрасываем состояние при закрытии
    setReviews([])
    setCurrentPage(0)
    setHasMore(true)
    setError('')
  }

  const handleCreateReview = () => {
    router.push(`/review/create?productId=${productId}&productName=${encodeURIComponent(productName)}`)
  }

  // Функция для открытия модального окна
  const openModal = () => {
    document.body.style.overflow = 'hidden'
  }

  // Функция для закрытия модального окна
  const closeModal = () => {
    document.body.style.overflow = 'unset'
  }

  const handleMediaClick = (media: ReviewMedia, review: ProductReview) => {
    // Находим индекс текущего отзыва в списке
    const reviewIndex = reviews.findIndex(r => r.id === review.id)
    
    // Открываем MediaViewer с правильными данными
    onOpenMediaViewer(review)
    
    // Закрываем текущий модал отзывов
    onClose()
  }

  // Функция для обработки лайков/дизлайков
  const handleReaction = async (reviewId: string, reactionType: 'like' | 'dislike') => {
    if (!user) return
    
    console.log('Обрабатываем реакцию:', { reviewId, reactionType, user: user.id })
    
    try {
      const currentReaction = userReactions[reviewId]
      console.log('Текущая реакция пользователя:', currentReaction)
      
      let newReaction: 'like' | 'dislike' | null = null
      
      if (currentReaction === reactionType) {
        // Убираем реакцию
        console.log('Убираем реакцию:', reactionType)
        await deleteUserReaction(reviewId)
        newReaction = null
      } else {
        // Ставим новую реакцию
        console.log('Ставим новую реакцию:', reactionType)
        await createReaction({
          review_id: reviewId,
          reaction_type: reactionType
        })
        newReaction = reactionType
      }
      
      // Обновляем состояние пользовательских реакций
      setUserReactions(prev => ({
        ...prev,
        [reviewId]: newReaction
      }))
      
      // Обновляем счетчики
      setReactionCounts(prev => {
        const current = prev[reviewId] || { likes: 0, dislikes: 0 }
        let newLikes = current.likes
        let newDislikes = current.dislikes
        
        if (currentReaction === 'like') {
          // Убираем лайк
          newLikes = Math.max(0, newLikes - 1)
        } else if (currentReaction === 'dislike') {
          // Убираем дизлайк
          newDislikes = Math.max(0, newDislikes - 1)
        }
        
        if (newReaction === 'like') {
          // Добавляем лайк
          newLikes += 1
        } else if (newReaction === 'dislike') {
          // Добавляем дизлайк
          newDislikes += 1
        }
        
        console.log('Обновляем счетчики:', {
          reviewId,
          oldReaction: currentReaction,
          newReaction,
          oldCounts: current,
          newCounts: { likes: newLikes, dislikes: newDislikes }
        })
        
        return {
          ...prev,
          [reviewId]: {
            likes: newLikes,
            dislikes: newDislikes
          }
        }
      })
      
      // Принудительно обновляем UI
      setForceUpdate(prev => prev + 1)
      
    } catch (error) {
      console.error('Error handling reaction:', error)
    }
  }

  // Загружаем реакции пользователя для всех отзывов
  const loadUserReactions = async () => {
    if (!user) {
      console.log('Пользователь не авторизован, пропускаем загрузку реакций')
      return
    }
    
    console.log('Загружаем реакции пользователя для отзывов:', reviews.length)
    console.log('ID пользователя:', user.id)
    
    try {
      const reactions: Record<string, 'like' | 'dislike' | null> = {}
      const counts: Record<string, { likes: number; dislikes: number }> = {}
      
      for (const review of reviews) {
        try {
          console.log(`Загружаем реакцию для отзыва ${review.id}...`)
          const reaction = await getUserReaction(review.id)
          reactions[review.id] = reaction
          
          // Исправляем отрицательные счетчики
          const likes = review.total_likes ?? 0
          const dislikes = review.total_dislikes ?? 0
          
          if (likes < 0 || dislikes < 0) {
            console.warn(`Отрицательные счетчики для отзыва ${review.id}:`, { likes, dislikes })
          }
          
          // Исправляем счетчики с учетом реакции пользователя
          let correctedLikes = Math.max(0, likes)
          let correctedDislikes = Math.max(0, dislikes)
          
          // Если у пользователя есть реакция, но счетчик 0, устанавливаем минимум 1
          if (reaction === 'like' && correctedLikes === 0) {
            correctedLikes = 1
          }
          if (reaction === 'dislike' && correctedDislikes === 0) {
            correctedDislikes = 1
          }
          
          counts[review.id] = {
            likes: correctedLikes,
            dislikes: correctedDislikes
          }
          
          console.log(`Отзыв ${review.id}:`, {
            reaction,
            total_likes: review.total_likes,
            total_dislikes: review.total_dislikes,
            correctedLikes,
            correctedDislikes,
            calculatedCounts: counts[review.id]
          })
        } catch (error) {
          console.warn(`Не удалось загрузить реакцию для отзыва ${review.id}:`, error)
          reactions[review.id] = null
          counts[review.id] = {
            likes: Math.max(0, review.total_likes || 0),
            dislikes: Math.max(0, review.total_dislikes || 0)
          }
        }
      }
      
      console.log('Устанавливаем состояния реакций:', { reactions, counts })
      setUserReactions(reactions)
      setReactionCounts(counts)
      
      console.log('Реакции загружены:', { reactions, counts })
    } catch (error) {
      console.error('Error loading user reactions:', error)
      // Устанавливаем пустые значения, если не удалось загрузить реакции
      const emptyReactions: Record<string, 'like' | 'dislike' | null> = {}
      const emptyCounts: Record<string, { likes: number; dislikes: number }> = {}
      
      for (const review of reviews) {
        emptyReactions[review.id] = null
        emptyCounts[review.id] = {
          likes: Math.max(0, review.total_likes || 0),
          dislikes: Math.max(0, review.total_dislikes || 0)
        }
      }
      
      setUserReactions(emptyReactions)
      setReactionCounts(emptyCounts)
    }
  }

  // Загружаем реакции пользователя для конкретных отзывов
  const loadUserReactionsForReviews = async (reviewsToProcess: ProductReview[]) => {
    if (!user) {
      console.log('Пользователь не авторизован, пропускаем загрузку реакций')
      return
    }
    
    console.log('Загружаем реакции пользователя для отзывов:', reviewsToProcess.length)
    console.log('ID пользователя:', user.id)
    
    try {
      const reactions: Record<string, 'like' | 'dislike' | null> = {}
      const counts: Record<string, { likes: number; dislikes: number }> = {}
      
      for (const review of reviewsToProcess) {
        try {
          console.log(`Загружаем реакцию для отзыва ${review.id}...`)
          const reaction = await getUserReaction(review.id)
          reactions[review.id] = reaction
          
          // Исправляем отрицательные счетчики
          const likes = review.total_likes ?? 0
          const dislikes = review.total_dislikes ?? 0
          
          if (likes < 0 || dislikes < 0) {
            console.warn(`Отрицательные счетчики для отзыва ${review.id}:`, { likes, dislikes })
          }
          
          // Исправляем счетчики с учетом реакции пользователя
          let correctedLikes = Math.max(0, likes)
          let correctedDislikes = Math.max(0, dislikes)
          
          // Если у пользователя есть реакция, но счетчик 0, устанавливаем минимум 1
          if (reaction === 'like' && correctedLikes === 0) {
            correctedLikes = 1
          }
          if (reaction === 'dislike' && correctedDislikes === 0) {
            correctedDislikes = 1
          }
          
          counts[review.id] = {
            likes: correctedLikes,
            dislikes: correctedDislikes
          }
          
          console.log(`Отзыв ${review.id}:`, {
            reaction,
            total_likes: review.total_likes,
            total_dislikes: review.total_dislikes,
            correctedLikes,
            correctedDislikes,
            calculatedCounts: counts[review.id]
          })
        } catch (error) {
          console.warn(`Не удалось загрузить реакцию для отзыва ${review.id}:`, error)
          reactions[review.id] = null
          counts[review.id] = {
            likes: Math.max(0, review.total_likes || 0),
            dislikes: Math.max(0, review.total_dislikes || 0)
          }
        }
      }
      
      console.log('Устанавливаем состояния реакций:', { reactions, counts })
      setUserReactions(reactions)
      setReactionCounts(counts)
      
      console.log('Реакции загружены:', { reactions, counts })
    } catch (error) {
      console.error('Error loading user reactions:', error)
      // Устанавливаем пустые значения, если не удалось загрузить реакции
      const emptyReactions: Record<string, 'like' | 'dislike' | null> = {}
      const emptyCounts: Record<string, { likes: number; dislikes: number }> = {}
      
      for (const review of reviewsToProcess) {
        emptyReactions[review.id] = null
        emptyCounts[review.id] = {
          likes: Math.max(0, review.total_likes || 0),
          dislikes: Math.max(0, review.total_dislikes || 0)
        }
      }
      
      setUserReactions(emptyReactions)
      setReactionCounts(emptyCounts)
    }
  }

  const handleReviewChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < reviews.length) {
      const newReview = reviews[newIndex]
      if (newReview.media && newReview.media.length > 0) {
        setSelectedMedia({ 
          media: newReview.media[0], 
          review: newReview 
        })
      }
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      closeModal()
      onClose()
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ))
  }

  const renderReview = (review: ProductReview, index: number) => {
    const isLast = index === reviews.length - 1
    
    return (
      <motion.div
        key={review.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        ref={isLast ? lastReviewRef : null}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        {/* Заголовок отзыва */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {review.user?.first_name?.[0] || review.user?.last_name?.[0] || review.user?.email?.[0] || 'U'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {review.user?.first_name && review.user?.last_name 
                    ? `${review.user.first_name} ${review.user.last_name}` 
                    : review.user?.email}
                </span>
                {review.is_verified_purchase && (
                  <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(review.created_at), { 
                    addSuffix: true, 
                    locale: ru 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Текст отзыва */}
        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed text-sm break-words overflow-hidden">
          {review.text}
        </p>

        {/* Медиа файлы */}
        {review.media && review.media.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {review.media.map((media) => (
              <button
                key={media.id}
                onClick={() => handleMediaClick(media, review)}
                className="relative flex-shrink-0 hover:scale-105 transition-transform duration-200"
              >
                {media.media_type === 'image' ? (
                  <img
                    src={media.media_url}
                    alt="Review media"
                    className="w-16 h-16 object-cover rounded-lg cursor-pointer"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center cursor-pointer">
                    <div className="w-8 h-8 text-gray-400">🎥</div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Статистика отзыва */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6">
            {/* Кнопка лайка */}
            <button
              onClick={() => handleReaction(review.id, 'like')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                userReactions[review.id] === 'like' 
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${userReactions[review.id] === 'like' ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">
                {(() => {
                  const baseCount = reactionCounts[review.id]?.likes ?? 0
                  const userHasLiked = userReactions[review.id] === 'like'
                  
                  // Если у пользователя есть лайк, но счетчик 0 или отрицательный, показываем минимум 1
                  if (userHasLiked && baseCount <= 0) {
                    return 1
                  }
                  
                  return baseCount
                })()}
              </span>
            </button>
            
            {/* Кнопка дизлайка */}
            <button
              onClick={() => handleReaction(review.id, 'dislike')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                userReactions[review.id] === 'dislike' 
                  ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${userReactions[review.id] === 'dislike' ? 'fill-current' : ''}`} />
              <span className="text-sm font-medium">
                {(() => {
                  const baseCount = reactionCounts[review.id]?.dislikes ?? 0
                  const userHasDisliked = userReactions[review.id] === 'dislike'
                  
                  // Если у пользователя есть дизлайк, но счетчик 0 или отрицательный, показываем минимум 1
                  if (userHasDisliked && baseCount <= 0) {
                    return 1
                  }
                  
                  return baseCount
                })()}
              </span>
            </button>
            
            {/* Кнопка комментариев */}
            <button
              onClick={() => onOpenComments(review)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-medium">{review.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end"
            onClick={handleClose}
          >
            <motion.div
              ref={modalRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="w-full bg-gray-50 dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Отзывы
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {totalReviews} отзывов • {averageRating.toFixed(1)} из 5
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Кнопка создания отзыва */}
                {user && (
                  <button
                    onClick={handleCreateReview}
                    className="w-full bg-primary-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Оставить отзыв
                  </button>
                )}

                {/* Индикатор свайпа */}
                <div className="flex justify-center mt-3">
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Свайп вниз для закрытия
                  </p>
              </div>

              {/* Содержимое */}
              <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                ) : reviews.length === 0 ? (
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
                    {reviews.map((review, index) => renderReview(review, index))}
                    
                    {/* Индикатор загрузки */}
                    {loadingMore && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          Загружаем еще отзывы...
                        </span>
                      </div>
                    )}
                    
                    {/* Сообщение о конце списка */}
                    {!hasMore && reviews.length > 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          Вы просмотрели все отзывы
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

               {/* MediaViewer для просмотра медиа */}
     {selectedMedia && (
       <MediaViewer
         isOpen={!!selectedMedia}
         onClose={() => setSelectedMedia(null)}
         media={selectedMedia.media}
         review={selectedMedia.review}
         productName={productName}
         allReviews={reviews.filter(r => r.media && r.media.length > 0)}
         currentReviewIndex={reviews.findIndex(r => r.id === selectedMedia.review.id)}
         onReviewChange={handleReviewChange}
         onOpenComments={onOpenComments}
       />
     )}
    </>
  )
}