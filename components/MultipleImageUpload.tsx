'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2, Plus } from 'lucide-react'

interface MultipleImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  onFileSelect?: (files: File[]) => void
  onFileRemove?: (index: number) => void
  maxImages?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function MultipleImageUpload({
  value = [],
  onChange,
  onFileSelect,
  onFileRemove,
  maxImages = 5,
  placeholder = "Загрузить изображения",
  className = "",
  disabled = false
}: MultipleImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | File[]) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      alert('Пожалуйста, выберите изображения')
      return
    }

    // Проверяем размер файлов (максимум 5MB каждый)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      alert('Размер файлов не должен превышать 5MB')
      return
    }

    // Проверяем лимит изображений
    if (value.length + imageFiles.length > maxImages) {
      alert(`Максимальное количество изображений: ${maxImages}`)
      return
    }

    // Создаем временные URL для предпросмотра
    const tempUrls = imageFiles.map(file => URL.createObjectURL(file))
    const newUrls = [...value, ...tempUrls]
    onChange(newUrls)

    // Вызываем callback для обработки файлов
    if (onFileSelect) {
      onFileSelect(imageFiles)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    if (!disabled && value.length < maxImages) {
      fileInputRef.current?.click()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)
    
    // Уведомляем о удалении файла
    if (onFileRemove) {
      onFileRemove(index)
    }
  }

  const canAddMore = value.length < maxImages

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Existing Images */}
        {value.map((url, index) => (
          <div key={index} className="relative group aspect-square">
            <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
              <img
                src={url}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                  <motion.button
                    onClick={() => removeImage(index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    title="Удалить изображение"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Main image indicator */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Главное
                </div>
              )}
            </div>

            {/* Loading indicator */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
        ))}

        {/* Add Image Button */}
        {canAddMore && (
          <motion.div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-200
              ${isDragging 
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <div className="text-center">
              <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragging ? 'Отпустите файлы' : 'Добавить фото'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {value.length}/{maxImages}
              </p>
            </div>

            {/* Drag overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-primary-500/10 rounded-lg flex items-center justify-center"
                >
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-primary-600 font-medium">Отпустите файлы</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>• Первое изображение будет главным</p>
        <p>• Максимум {maxImages} изображений</p>
        <p>• Поддерживаются форматы: JPG, PNG, GIF, WebP</p>
        <p>• Максимальный размер файла: 5MB</p>
      </div>
    </div>
  )
} 