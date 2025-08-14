'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Star, Image as ImageIcon, Video, X, Upload, Loader2, Check } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useNavbarVisibility } from '@/components/NavbarVisibilityProvider'
import { createReview } from '@/lib/supabase/reviews'
import { CreateReviewData } from '@/lib/types/reviews'

export default function CreateReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { hideNavbar, showNavbar } = useNavbarVisibility()
  
  const productId = searchParams.get('productId')
  const productName = searchParams.get('productName')
  
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [media, setMedia] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Проверяем авторизацию
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (!productId || !productName) {
      router.push('/')
      return
    }
  }, [user, productId, productName, router])

  // Автофокус на текстовое поле
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Скрываем navbar на этой странице
  useEffect(() => {
    hideNavbar()
    return () => showNavbar()
  }, [hideNavbar, showNavbar])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !text.trim()) return

    setIsSubmitting(true)
    try {
      // Создаем отзыв с медиа файлами
      await createReview({
        product_id: productId!,
        rating,
        text: text.trim(),
        media
      })
      
      // Перенаправляем обратно на страницу товара
      router.push(`/product/${productId}`)
    } catch (error) {
      console.error('Error creating review:', error)
      alert('Ошибка при создании отзыва')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })
    
    setMedia(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB
      return isValidType && isValidSize
    })
    
    setMedia(prev => [...prev, ...validFiles])
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setRating(i + 1)}
        className={`w-10 h-10 transition-all duration-200 ${
          i < rating 
            ? 'text-yellow-400 fill-current scale-110' 
            : 'text-gray-300 hover:text-yellow-300 hover:scale-105'
        }`}
      >
        <Star className="w-full h-full" />
      </button>
    ))
  }

  const renderMediaPreview = () => {
    if (media.length === 0) return null

    return (
      <div className="grid grid-cols-3 gap-3">
        {media.map((file, index) => (
          <div key={index} className="relative group">
            {file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-full h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            {/* Кнопка удаления */}
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Индикатор типа файла */}
            <div className="absolute bottom-1 left-1">
              {file.type.startsWith('image/') ? (
                <ImageIcon className="w-4 h-4 text-white drop-shadow-lg" />
              ) : (
                <Video className="w-4 h-4 text-white drop-shadow-lg" />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!user || !productId || !productName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Оставить отзыв
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {productName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Рейтинг */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Ваша оценка *
              </label>
              <div className="flex items-center justify-center gap-2">
                {renderStars()}
              </div>
              {rating > 0 && (
                <p className="text-center mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {rating} из 5 звезд
                </p>
              )}
            </div>

            {/* Текст отзыва */}
            <div>
              <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ваш отзыв *
              </label>
              <textarea
                ref={textareaRef}
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Расскажите о вашем опыте использования товара..."
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              />
            </div>

            {/* Загрузка медиа */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Добавить фото или видео
              </label>
              
              {/* Drag & Drop зона */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Перетащите файлы сюда или
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  выберите файлы
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  До 10 файлов, максимум 10MB каждый
                </p>
                <p className="text-xs text-gray-500">
                  Поддерживаются изображения и видео
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Превью загруженных файлов */}
              {media.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Загруженные файлы ({media.length})
                  </h4>
                  {renderMediaPreview()}
                </div>
              )}
            </div>

            {/* Кнопки */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || !text.trim()}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Опубликовать отзыв
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
} 