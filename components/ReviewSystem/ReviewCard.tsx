'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ThumbsUp, ThumbsDown, MessageCircle, Image as ImageIcon, Video, MoreVertical, Edit, Trash2, Heart, Reply } from 'lucide-react'
import { ProductReview, ReviewComment } from '@/lib/types/reviews'
import { useAuth } from '@/components/AuthProvider'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface ReviewCardProps {
  review: ProductReview
  onUpdate: (review: ProductReview) => void
  onDelete: (reviewId: string) => void
  onReaction: (reviewId: string, type: 'like' | 'dislike') => void
  onComment: (reviewId: string, parentCommentId?: string) => void
}

export default function ReviewCard({ 
  review, 
  onUpdate, 
  onDelete, 
  onReaction, 
  onComment 
}: ReviewCardProps) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isOwner = user?.id === review.user_id
  const userReaction = review.user_reaction

  const handleReaction = (type: 'like' | 'dislike') => {
    if (!user) return
    onReaction(review.id, type)
  }

  const handleReply = async (parentCommentId?: string) => {
    if (!replyText.trim() || !user) return
    
    setIsSubmitting(true)
    try {
      // Здесь будет вызов функции создания комментария
      setReplyText('')
      setShowReplyForm(null)
    } catch (error) {
      console.error('Error creating reply:', error)
    } finally {
      setIsSubmitting(false)
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

  const renderMedia = () => {
    if (!review.media || review.media.length === 0) return null

    return (
      <div className="flex gap-2 mt-3 overflow-x-auto">
        {review.media.map((media) => (
          <div key={media.id} className="relative flex-shrink-0">
            {media.media_type === 'image' ? (
              <img
                src={media.media_url}
                alt="Review media"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
            {media.media_type === 'video' && (
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderComments = () => {
    if (!review.comments || review.comments.length === 0) return null

    return (
      <div className="mt-4 space-y-3">
        {review.comments
          .filter(comment => !comment.parent_comment_id) // Только корневые комментарии
          .map(comment => (
            <div key={comment.id} className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {comment.user?.first_name?.[0] || comment.user?.last_name?.[0] || comment.user?.email?.[0] || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.user?.first_name && comment.user?.last_name 
                      ? `${comment.user.first_name} ${comment.user.last_name}` 
                      : comment.user?.email}
                  </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.created_at), { 
                        addSuffix: true, 
                        locale: ru 
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 break-words overflow-hidden">
                    {comment.text}
                  </p>
                  
                  {/* Кнопка ответа */}
                  <button
                    onClick={() => setShowReplyForm(comment.id)}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-1"
                  >
                    <Reply className="w-3 h-3" />
                    Ответить
                  </button>

                  {/* Форма ответа */}
                  {showReplyForm === comment.id && (
                    <div className="mt-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Написать ответ..."
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white break-words"
                        rows={2}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={isSubmitting || !replyText.trim()}
                          className="px-3 py-1 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Отправка...' : 'Отправить'}
                        </button>
                        <button
                          onClick={() => {
                            setShowReplyForm(null)
                            setReplyText('')
                          }}
                          className="px-3 py-1 text-xs bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ответы на комментарий */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {comment.replies.map(reply => (
                        <div key={reply.id} className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-3">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {reply.user?.first_name?.[0] || reply.user?.last_name?.[0] || reply.user?.email?.[0] || 'U'}
                  </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {reply.user?.first_name && reply.user?.last_name 
                      ? `${reply.user.first_name} ${reply.user.last_name}` 
                      : reply.user?.email}
                  </span>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(reply.created_at), { 
                                    addSuffix: true, 
                                    locale: ru 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 break-words overflow-hidden">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {/* Заголовок отзыва */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {review.user?.first_name?.[0] || review.user?.last_name?.[0] || review.user?.email?.[0] || 'U'}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
              {review.user?.first_name && review.user?.last_name 
                ? `${review.user.first_name} ${review.user.last_name}` 
                : review.user?.email}
            </span>
              {review.is_verified_purchase && (
                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  ✓ Подтвержденная покупка
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {renderStars(review.rating)}
              </div>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(review.created_at), { 
                  addSuffix: true, 
                  locale: ru 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Меню действий для владельца */}
        {isOwner && (
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <MoreVertical className="w-4 h-4" />
            </button>
            {/* Здесь можно добавить выпадающее меню с Edit/Delete */}
          </div>
        )}
      </div>

      {/* Текст отзыва */}
      <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed break-words overflow-hidden">
        {review.text}
      </p>

      {/* Медиа файлы */}
      {renderMedia()}

      {/* Действия */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Реакции */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleReaction('like')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                userReaction === 'like'
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-sm">{review.total_likes}</span>
            </button>
            <button
              onClick={() => handleReaction('dislike')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                userReaction === 'dislike'
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-sm">{review.total_dislikes}</span>
            </button>
          </div>

          {/* Комментарии */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">
              {review.comments?.length || 0} комментариев
            </span>
          </button>
        </div>

        {/* Полезность */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Heart className="w-4 h-4" />
          <span>{review.helpful_count} полезно</span>
        </div>
      </div>

      {/* Комментарии */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            {/* Форма добавления комментария */}
            <div className="mb-4">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Добавить комментарий..."
                className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white break-words"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => handleReply()}
                  disabled={isSubmitting || !replyText.trim()}
                  className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
              </div>
            </div>

            {/* Список комментариев */}
            {renderComments()}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
} 