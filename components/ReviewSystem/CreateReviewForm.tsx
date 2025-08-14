'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Star, Image as ImageIcon, Video, X, Upload } from 'lucide-react'
import { CreateReviewData } from '@/lib/types/reviews'

interface CreateReviewFormProps {
  productId: string
  onSubmit: (data: CreateReviewData) => Promise<void>
  onCancel: () => void
}

export default function CreateReviewForm({ productId, onSubmit, onCancel }: CreateReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [media, setMedia] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0 || !text.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        product_id: productId,
        rating,
        text: text.trim(),
        media
      })
      // Форма будет закрыта родительским компонентом
    } catch (error) {
      console.error('Error creating review:', error)
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

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => setRating(i + 1)}
        className={`w-8 h-8 transition-colors ${
          i < rating 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300 hover:text-yellow-300'
        }`}
      >
        <Star className="w-full h-full" />
      </button>
    ))
  }

  const renderMediaPreview = () => {
    if (media.length === 0) return null

    return (
      <div className="flex gap-2 mt-3 overflow-x-auto">
        {media.map((file, index) => (
          <div key={index} className="relative flex-shrink-0">
            {file.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => removeFile(index)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Написать отзыв
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Рейтинг */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Ваша оценка *
          </label>
          <div className="flex items-center gap-1">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                {rating} из 5
              </span>
            )}
          </div>
        </div>

        {/* Текст отзыва */}
        <div>
          <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ваш отзыв *
          </label>
          <textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Расскажите о вашем опыте использования товара..."
            required
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none break-words"
          />
        </div>

        {/* Загрузка медиа */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Добавить фото или видео
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <Upload className="w-4 h-4" />
              <span>Выбрать файлы</span>
            </button>
            <span className="text-sm text-gray-500">
              До 10 файлов, максимум 10MB каждый
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {renderMediaPreview()}
        </div>

        {/* Кнопки */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting || rating === 0 || !text.trim()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Отправка...' : 'Опубликовать отзыв'}
          </button>
        </div>
      </form>
    </motion.div>
  )
} 