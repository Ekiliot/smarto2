'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, ChevronRight } from 'lucide-react'
import { getProductReviews } from '@/lib/supabase/reviews'
import { ProductReview } from '@/lib/types/reviews'
import MobileReviewsModal from './MobileReviewsModal'

interface MobileReviewsBlockProps {
  productId: string
  productName: string
  onOpenReviews: () => void
  onOpenMediaViewer: (review: any) => void // Изменено: принимаем отзыв
  onOpenComments: (review: any) => void
}

export default function MobileReviewsBlock({ 
  productId, 
  productName, 
  onOpenReviews, 
  onOpenMediaViewer, 
  onOpenComments 
}: MobileReviewsBlockProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Загружаем отзывы для отображения статистики
  useEffect(() => {
    loadReviews()
  }, [productId])

  const loadReviews = async () => {
    try {
      setLoading(true)
      setError('')
      const fetchedReviews = await getProductReviews(productId)
      setReviews(fetchedReviews)
    } catch (err) {
      console.error('Error loading reviews:', err)
      setError('Ошибка при загрузке отзывов')
    } finally {
      setLoading(false)
    }
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenReviews}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Отзывы
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(averageRating)}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {reviews.length > 0 ? `${averageRating.toFixed(1)} из 5` : 'Нет отзывов'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reviews.length} отзывов
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </motion.div>


    </>
  )
} 