'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Send, Heart, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { ProductReview, ReviewComment } from '@/lib/types/reviews'
import { createComment, getUserReaction, createReaction, deleteUserReaction, getReviewComments, createCommentLike, deleteCommentLike, getUserCommentLike } from '@/lib/supabase/reviews'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'


interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  review: ProductReview
  productName: string
}

export default function CommentsModal({ 
  isOpen, 
  onClose, 
  review, 
  productName 
}: CommentsModalProps) {
  const { user } = useAuth()

  const [comments, setComments] = useState<ReviewComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<ReviewComment | null>(null)
  const [replyText, setReplyText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [highlightedComment, setHighlightedComment] = useState<string | null>(null)
  const [commentLikes, setCommentLikes] = useState<Record<string, boolean>>({}) // Лайки на комментарии
  const [commentLikeCounts, setCommentLikeCounts] = useState<Record<string, number>>({}) // Счетчики лайков
  
  const modalRef = useRef<HTMLDivElement>(null)
  const commentsContainerRef = useRef<HTMLDivElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  // Управляем скролл при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Загружаем комментарии при открытии
  useEffect(() => {
    if (isOpen && review.id) {
      loadComments()
    }
  }, [isOpen, review.id])

  const loadComments = async () => {
    if (!review.id) return
    
    console.log('Loading comments for review ID:', review.id)
    
    try {
      const commentsData = await getReviewComments(review.id)
      console.log('Loaded comments:', commentsData)
      setComments(commentsData)
      
      // Загружаем лайки для всех комментариев
      await loadCommentLikes(commentsData)
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  // Загружаем лайки для комментариев
  const loadCommentLikes = async (commentsData: ReviewComment[]) => {
    if (!user) return
    
    const likes: Record<string, boolean> = {}
    const counts: Record<string, number> = {}
    
    // Рекурсивная функция для обработки всех комментариев и ответов
    const processComment = async (comment: ReviewComment) => {
      try {
        const isLiked = await getUserCommentLike(comment.id)
        likes[comment.id] = isLiked
        
        // Используем total_likes из базы данных
        counts[comment.id] = comment.total_likes || 0
        
        // Обрабатываем ответы рекурсивно
        if (comment.replies && comment.replies.length > 0) {
          for (const reply of comment.replies) {
            await processComment(reply)
          }
        }
      } catch (error) {
        console.warn(`Не удалось загрузить лайк для комментария ${comment.id}:`, error)
        likes[comment.id] = false
        counts[comment.id] = comment.total_likes || 0
      }
    }
    
    // Обрабатываем все комментарии
    for (const comment of commentsData) {
      await processComment(comment)
    }
    
    setCommentLikes(likes)
    setCommentLikeCounts(counts)
  }

  // Обрабатываем лайк на комментарий
  const handleCommentLike = async (commentId: string) => {
    if (!user) return
    
    try {
      const isCurrentlyLiked = commentLikes[commentId]
      
      if (isCurrentlyLiked) {
        // Убираем лайк
        await deleteCommentLike(commentId)
        console.log(`Убран лайк с комментария ${commentId}`)
      } else {
        // Ставим лайк
        await createCommentLike(commentId)
        console.log(`Добавлен лайк на комментарий ${commentId}`)
      }
      
      // Перезагружаем комментарии чтобы получить актуальные счетчики
      await loadComments()
    } catch (error) {
      console.error('Error toggling comment like:', error)
      // Показываем пользователю ошибку
      alert('Ошибка при изменении лайка')
    }
  }

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen && replyInputRef.current) {
      setTimeout(() => replyInputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user) return

    console.log('Submitting comment for review:', review)

    setIsSubmitting(true)
    try {
      const comment = await createComment({
        review_id: review.id,
        text: newComment.trim(),
        parent_comment_id: undefined
      })

      // Перезагружаем комментарии и лайки
      await loadComments()
      setNewComment('')
    } catch (error) {
      console.error('Error creating comment:', error)
      alert('Ошибка при создании комментария')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !user || !replyingTo) return
    
    console.log('Submitting reply to comment:', replyingTo)
    setIsSubmitting(true)
    
    try {
      await createComment({
        review_id: review.id,
        text: replyText.trim(),
        parent_comment_id: replyingTo.id
      })
      
      setReplyText('')
      setReplyingTo(null) // Убираем состояние ответа
      await loadComments()
    } catch (error) {
      console.error('Error creating reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    if (!user) return

    try {
      // TODO: Добавить таблицу comment_reactions для лайков комментариев
      // Пока что просто показываем уведомление
      alert('Функция лайков комментариев будет добавлена позже')
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const highlightComment = (commentId: string) => {
    setHighlightedComment(commentId)
    setTimeout(() => setHighlightedComment(null), 2000)
    
    // Прокручиваем к комментарию
    const commentElement = document.getElementById(`comment-${commentId}`)
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
    setComments([])
    setNewComment('')
    setReplyingTo(null)
    setReplyText('')
    setHighlightedComment(null)
    setCommentLikes({})
    setCommentLikeCounts({})
  }

  const renderComment = (comment: ReviewComment, isReply = false, parentComment?: ReviewComment) => {
    const isHighlighted = highlightedComment === comment.id
    
    return (
      <motion.div
        key={comment.id}
        id={`comment-${comment.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${isReply ? 'ml-2' : ''} ${isHighlighted ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} transition-colors duration-500`}
      >
        <div className={`flex gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          isReply ? 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700' : ''
        }`}>
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {comment.user?.first_name?.[0] || comment.user?.last_name?.[0] || comment.user?.email?.[0] || 'U'}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Заголовок комментария */}
            <div className="flex items-center gap-1 mb-1">
              <span className="font-medium text-gray-900 dark:text-white text-xs">
                {comment.user?.first_name && comment.user?.last_name 
                  ? `${comment.user.first_name} ${comment.user.last_name}` 
                  : comment.user?.email}
              </span>
              
              {isReply && parentComment && (
                <span className="text-xs text-gray-500">
                  →{' '}
                  <button
                    onClick={() => highlightComment(parentComment.id)}
                    className="text-primary-600 hover:text-primary-700 underline text-xs"
                  >
                    {parentComment.user?.first_name?.[0] || parentComment.user?.last_name?.[0] || 'U'}
                  </button>
                </span>
              )}
            </div>
            
            {/* Текст комментария */}
            <p className="text-gray-700 dark:text-gray-300 text-xs mb-1 leading-relaxed break-words overflow-hidden">
              {comment.text}
            </p>
            
            {/* Действия */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="text-xs">
                {formatDistanceToNow(new Date(comment.created_at), { 
                  addSuffix: true, 
                  locale: ru 
                })}
              </span>
              
              {/* Кнопка лайка - показывается всегда */}
              <button
                onClick={() => handleCommentLike(comment.id)}
                className={`flex items-center gap-1 transition-colors p-1 ${
                  commentLikes[comment.id] 
                    ? 'text-red-500' 
                    : 'text-gray-500 hover:text-red-500'
                }`}
                title={commentLikes[comment.id] ? 'Убрать лайк' : 'Поставить лайк'}
              >
                <Heart className={`w-3 h-3 ${commentLikes[comment.id] ? 'fill-current' : ''}`} />
                <span className="text-xs">{commentLikeCounts[comment.id] || 0}</span>
              </button>
              
              {/* Кнопка ответа - показывается только для основных комментариев */}
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment)}
                  className="flex items-center gap-1 hover:text-blue-500 transition-colors p-1"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs">Ответить</span>
                </button>
              )}
            </div>
            
            {/* Ответы на комментарий */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-2 space-y-1 ml-3 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                {comment.replies.map((reply) => renderComment(reply, true, comment))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
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
            className="w-full bg-white dark:bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClose}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                      Комментарии
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {productName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Индикатор свайпа */}
              <div className="flex justify-center">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
            </div>

            {/* Список комментариев */}
            <div 
              ref={commentsContainerRef}
              className="px-4 py-2 overflow-y-auto max-h-[calc(90vh-180px)]"
            >
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                    Пока нет комментариев
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Будьте первым, кто оставит комментарий!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {comments.map((comment) => renderComment(comment))}
                </div>
              )}
            </div>

            {/* Форма для нового комментария */}
            <form onSubmit={replyingTo ? handleSubmitReply : handleSubmitComment} className="sticky bottom-0 bg-white dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              {/* Индикатор ответа */}
              {replyingTo && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <MessageCircle className="w-4 h-4" />
                      <span>Ответ на комментарий:</span>
                      <span className="font-medium">
                        {replyingTo.user?.first_name && replyingTo.user?.last_name 
                          ? `${replyingTo.user.first_name} ${replyingTo.user.last_name}` 
                          : replyingTo.user?.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <textarea
                    ref={replyingTo ? replyInputRef : undefined}
                    value={replyingTo ? replyText : newComment}
                    onChange={(e) => replyingTo ? setReplyText(e.target.value) : setNewComment(e.target.value)}
                    placeholder={replyingTo ? "Написать ответ..." : "Написать комментарий..."}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 break-words"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={(replyingTo ? !replyText.trim() : !newComment.trim()) || isSubmitting}
                  className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 flex-shrink-0 ${
                    (replyingTo ? replyText.trim() : newComment.trim()) && !isSubmitting
                      ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 ml-0.5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 