'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Play, X, Loader2, FileVideo, Clock, HardDrive } from 'lucide-react'

interface VideoUploadProps {
  value: string
  onChange: (url: string) => void
  onFileSelect?: (file: File) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function VideoUpload({ 
  value, 
  onChange, 
  onFileSelect,
  placeholder = "Загрузить видео",
  disabled = false,
  className = ""
}: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file)
      
      // Создаем предпросмотр для выбранного файла
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      
      if (onFileSelect) {
        onFileSelect(file)
      } else {
        // Если нет обработчика файлов, устанавливаем URL для предпросмотра
        onChange(url)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    onChange('')
    setSelectedFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i) || url.startsWith('blob:')
  }

  // Определяем что показывать: URL видео, выбранный файл, или загрузку
  const showVideo = value || previewUrl
  const videoSource = value || previewUrl

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Video Preview */}
      {showVideo && (
        <div className="relative">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <video
              src={videoSource}
              controls
              className="w-full h-48 object-cover"
              onError={(e) => {
                console.error('Video error:', e)
              }}
            />
          </div>
          
          {/* File Info */}
          {selectedFile && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileVideo className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Выбранный файл
                </span>
              </div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-3 w-3" />
                  <span>{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-3 w-3" />
                  <span>{selectedFile.name}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
            title="Удалить видео"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      {!showVideo && (
        <motion.div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${isDragOver 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          whileTap={!disabled ? { scale: 0.98 } : {}}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileInputChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-3">
            <div className="flex justify-center">
              <div className={`
                p-3 rounded-full
                ${isDragOver 
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }
              `}>
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </div>
            </div>
            
            <div>
              <p className={`
                font-medium
                ${isDragOver 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}>
                {isDragOver ? 'Отпустите для загрузки' : placeholder}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Поддерживаемые форматы: MP4, WebM, OGG, MOV, AVI, MKV
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* URL Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Или введите URL видео
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setSelectedFile(null)
            setPreviewUrl('')
          }}
          placeholder="https://example.com/video.mp4"
          disabled={disabled}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
        />
      </div>
    </div>
  )
} 