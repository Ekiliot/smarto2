'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  value: string
  onChange: (url: string, file?: File) => void
  onFileSelect?: (file: File) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  placeholder = "Загрузить изображение",
  className = "",
  disabled = false
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file) return

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    // Создаем временный URL для предпросмотра
    const tempUrl = URL.createObjectURL(file)
    onChange(tempUrl, file)

    // Вызываем callback для обработки файла
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
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
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      {!value ? (
        <motion.div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
            ${isDragging 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <div className="space-y-3">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              {isUploading ? (
                <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
              ) : (
                <Upload className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {isDragging ? 'Отпустите файл здесь' : placeholder}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PNG, JPG, GIF до 5MB
              </p>
            </div>
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
                  <p className="text-primary-600 font-medium">Отпустите файл</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        /* Image preview */
        <div className="relative group">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={value}
              alt="Preview"
              className="w-full h-48 object-cover"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                <motion.button
                  onClick={handleClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  title="Заменить изображение"
                >
                  <ImageIcon className="h-4 w-4" />
                </motion.button>
                
                <motion.button
                  onClick={clearImage}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/90 dark:bg-gray-800/90 rounded-lg text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Удалить изображение"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Loading indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-white animate-spin mx-auto mb-2" />
                <p className="text-white text-sm">Загрузка...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* URL input fallback */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Или введите URL изображения
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          disabled={disabled}
        />
      </div>
    </div>
  )
} 