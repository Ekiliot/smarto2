'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  Play, 
  X, 
  Loader2, 
  FileVideo, 
  Image as ImageIcon,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

/**
 * Компонент галереи товара
 * 
 * Особенности:
 * - URL поля скрыты от пользователя (класс "hidden") но работают в фоне
 * - Поддерживает drag & drop для всех типов файлов
 * - Автоматически создает предпросмотр для выбранных файлов
 * - Крестики позиционированы точно в правом верхнем углу каждого медиа
 */
interface ProductGalleryProps {
  mainImage: string
  onMainImageChange: (url: string) => void
  additionalImages: string[]
  onAdditionalImagesChange: (urls: string[]) => void
  videoUrl: string
  onVideoUrlChange: (url: string) => void
  onMainImageFileSelect?: (file: File) => void
  onAdditionalImagesFileSelect?: (files: File[]) => void
  onVideoFileSelect?: (file: File) => void
  disabled?: boolean
  className?: string
}

export function ProductGallery({
  mainImage,
  onMainImageChange,
  additionalImages,
  onAdditionalImagesChange,
  videoUrl,
  onVideoUrlChange,
  onMainImageFileSelect,
  onAdditionalImagesFileSelect,
  onVideoFileSelect,
  disabled = false,
  className = ""
}: ProductGalleryProps) {
  const [selectedMainFile, setSelectedMainFile] = useState<File | null>(null)
  const [selectedAdditionalFiles, setSelectedAdditionalFiles] = useState<File[]>([])
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [previewMainUrl, setPreviewMainUrl] = useState<string>('')
  const [previewAdditionalUrls, setPreviewAdditionalUrls] = useState<string[]>([])
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragOverType, setDragOverType] = useState<'main' | 'additional' | 'video' | null>(null)
  
  const mainImageInputRef = useRef<HTMLInputElement>(null)
  const additionalImagesInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Обработка главного изображения
  const handleMainImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedMainFile(file)
      const url = URL.createObjectURL(file)
      setPreviewMainUrl(url)
      onMainImageChange(url)
      if (onMainImageFileSelect) {
        onMainImageFileSelect(file)
      }
    }
  }

  // Обработка дополнительных изображений
  const handleAdditionalImagesSelect = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length > 0) {
      setSelectedAdditionalFiles(prev => [...prev, ...imageFiles])
      const urls = imageFiles.map(file => URL.createObjectURL(file))
      setPreviewAdditionalUrls(prev => [...prev, ...urls])
      onAdditionalImagesChange([...additionalImages, ...urls])
      if (onAdditionalImagesFileSelect) {
        onAdditionalImagesFileSelect(imageFiles)
      }
    }
  }

  // Обработка видео
  const handleVideoSelect = (file: File) => {
    if (file && file.type.startsWith('video/')) {
      setSelectedVideoFile(file)
      const url = URL.createObjectURL(file)
      setPreviewVideoUrl(url)
      onVideoUrlChange(url)
      if (onVideoFileSelect) {
        onVideoFileSelect(file)
      }
    }
  }

  // Drag & Drop обработчики
  const handleDrop = (e: React.DragEvent, type: 'main' | 'additional' | 'video') => {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverType(null)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      switch (type) {
        case 'main':
          handleMainImageSelect(files[0])
          break
        case 'additional':
          handleAdditionalImagesSelect(files)
          break
        case 'video':
          handleVideoSelect(files[0])
          break
      }
    }
  }

  const handleDragOver = (e: React.DragEvent, type: 'main' | 'additional' | 'video') => {
    e.preventDefault()
    setIsDragOver(true)
    setDragOverType(type)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragOverType(null)
  }

  // Удаление элементов
  const removeMainImage = () => {
    onMainImageChange('')
    setSelectedMainFile(null)
    setPreviewMainUrl('')
    if (mainImageInputRef.current) {
      mainImageInputRef.current.value = ''
    }
  }

  const removeAdditionalImage = (index: number) => {
    const newImages = additionalImages.filter((_, i) => i !== index)
    onAdditionalImagesChange(newImages)
    setSelectedAdditionalFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewAdditionalUrls(prev => prev.filter((_, i) => i !== index))
  }

  const removeVideo = () => {
    onVideoUrlChange('')
    setSelectedVideoFile(null)
    setPreviewVideoUrl('')
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Определяем что показывать
  const showMainImage = mainImage || previewMainUrl
  const showVideo = videoUrl || previewVideoUrl
  const allImages = [showMainImage, ...additionalImages, ...previewAdditionalUrls].filter(Boolean)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Главное изображение */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Главное изображение товара *
        </label>
        <div className="relative">
          {showMainImage ? (
            <div className="relative group w-48 h-48">
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={showMainImage}
                  alt="Главное изображение"
                  className="w-full h-full object-cover"
                />
                {/* Кнопка удаления в правом верхнем углу */}
                <button
                  type="button"
                  onClick={removeMainImage}
                  disabled={disabled}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 disabled:opacity-50 transform scale-90 group-hover:scale-100 shadow-lg"
                  title="Удалить изображение"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              onDrop={(e) => handleDrop(e, 'main')}
              onDragOver={(e) => handleDragOver(e, 'main')}
              onDragLeave={handleDragLeave}
              className={`
                relative w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 group
                ${dragOverType === 'main'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              <input
                ref={mainImageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleMainImageSelect(file)
                }}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="text-center group-hover:scale-105 transition-transform duration-200">
                <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-primary-500 transition-colors duration-200 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  {dragOverType === 'main' ? 'Отпустите для загрузки' : 'Главное изображение'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Видео */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Видео товара
        </label>
        <div className="relative">
          {showVideo ? (
            <div className="relative group w-48 h-48">
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <video
                  src={showVideo}
                  controls
                  className="w-full h-full object-cover"
                  onError={() => removeVideo()}
                />
                {/* Кнопка удаления в правом верхнем углу */}
                <button
                  type="button"
                  onClick={removeVideo}
                  disabled={disabled}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 disabled:opacity-50 transform scale-90 group-hover:scale-100 shadow-lg"
                  title="Удалить видео"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* File Info */}
              {selectedVideoFile && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                  <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                    <FileVideo className="h-3 w-3" />
                    <span>{formatFileSize(selectedVideoFile.size)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              onDrop={(e) => handleDrop(e, 'video')}
              onDragOver={(e) => handleDragOver(e, 'video')}
              onDragLeave={handleDragLeave}
              className={`
                relative w-48 h-48 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 group
                ${dragOverType === 'video'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleVideoSelect(file)
                }}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="text-center group-hover:scale-105 transition-transform duration-200">
                <Play className="h-8 w-8 text-gray-400 group-hover:text-primary-500 transition-colors duration-200 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                  {dragOverType === 'video' ? 'Отпустите для загрузки' : 'Видео товара'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Дополнительные изображения */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Дополнительные изображения (до 5)
        </label>
        <div className="flex flex-wrap gap-1">
          {/* Существующие изображения */}
          {allImages.map((image, index) => (
            <div key={index} className="relative group w-24 h-24 flex-shrink-0">
              <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Изображение ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Кнопка удаления в правом верхнем углу */}
                <button
                  type="button"
                  onClick={() => removeAdditionalImage(index)}
                  disabled={disabled}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-200 disabled:opacity-50 transform scale-90 group-hover:scale-100 shadow-lg"
                  title="Удалить изображение"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
          
          {/* Кнопка добавления */}
          {allImages.length < 5 && (
            <motion.div
              onDrop={(e) => handleDrop(e, 'additional')}
              onDragOver={(e) => handleDragOver(e, 'additional')}
              onDragLeave={handleDragLeave}
              className={`
                relative w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-200 group flex-shrink-0
                ${dragOverType === 'additional'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              whileHover={!disabled ? { scale: 1.02 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
            >
              <input
                ref={additionalImagesInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length > 0) handleAdditionalImagesSelect(files)
                }}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <Plus className="h-6 w-6 text-gray-400 group-hover:text-primary-500 transition-colors duration-200" />
            </motion.div>
          )}
        </div>
      </div>

      {/* URL вводы - скрыты от пользователя, работают в фоне */}
      <div className="hidden">
        <div>
          <input
            type="url"
            value={mainImage}
            onChange={(e) => onMainImageChange(e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm"
          />
        </div>
        
        <div>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            placeholder="https://example.com/video.mp4"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm"
          />
        </div>
        
        <div>
          <input
            type="text"
            value={additionalImages.join(', ')}
            onChange={(e) => onAdditionalImagesChange(e.target.value.split(',').map(url => url.trim()).filter(Boolean))}
            placeholder="url1, url2, url3"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 text-sm"
          />
        </div>
      </div>
    </div>
  )
} 