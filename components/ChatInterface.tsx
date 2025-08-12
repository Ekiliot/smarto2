'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Paperclip, 
  X, 
  Image as ImageIcon, 
  Video, 
  File, 
  Music,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useChat } from '@/lib/hooks/useChat'
import { Message, FileUpload } from '@/lib/types/chat'
import { formatFileSize, isImageFile, isVideoFile, isAudioFile } from '@/lib/supabase/chat'

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className = '' }: ChatInterfaceProps) {
  const {
    currentChat,
    loading,
    sending,
    uploading,
    messages,
    fileUploads,
    typing,
    sendTextMessage,
    sendFileMessage,
    removeFileUpload,
    isFileUploading
  } = useChat()

  const [messageText, setMessageText] = useState('')
  const [showFileInput, setShowFileInput] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Автофокус на поле ввода
  useEffect(() => {
    if (currentChat && !loading) {
      textareaRef.current?.focus()
    }
  }, [currentChat, loading])

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return
    
    try {
      await sendTextMessage(messageText)
      setMessageText('')
      setError(null)
    } catch (err) {
      setError('Ошибка при отправке сообщения')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    Array.from(files).forEach(file => {
      // Проверяем размер файла (20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер: 20MB')
        return
      }
      
      sendFileMessage(file)
    })
    
    setShowFileInput(false)
    setError(null)
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === currentChat?.user_id
    const hasFile = message.file_url && message.file_type

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
          <div className={`rounded-2xl px-4 py-3 ${
            isOwnMessage 
              ? 'bg-primary-600 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}>
            {/* Текст сообщения */}
            {message.text && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.text}
              </p>
            )}
            
            {/* Файл */}
            {hasFile && (
              <div className="mt-2">
                {message.file_type === 'image' && (
                  <img
                    src={message.file_url}
                    alt={message.file_name || 'Изображение'}
                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(message.file_url, '_blank')}
                  />
                )}
                
                {message.file_type === 'video' && (
                  <video
                    src={message.file_url}
                    controls
                    className="max-w-full h-auto rounded-lg"
                    preload="metadata"
                  >
                    <source src={message.file_url} type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                )}
                
                {message.file_type === 'audio' && (
                  <audio
                    src={message.file_url}
                    controls
                    className="w-full"
                    preload="metadata"
                  >
                    <source src={message.file_url} type="audio/mpeg" />
                    Ваш браузер не поддерживает аудио.
                  </audio>
                )}
                
                {message.file_type === 'document' && (
                  <div className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg">
                    <File className="h-5 w-5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {message.file_name}
                      </p>
                      <p className="text-xs opacity-75">
                        {formatFileSize(message.file_size || 0)}
                      </p>
                    </div>
                    <a
                      href={message.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs underline hover:no-underline"
                    >
                      Скачать
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* Время */}
            <div className={`text-xs mt-2 ${
              isOwnMessage ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {new Date(message.created_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderFileUpload = (fileUpload: FileUpload) => (
    <motion.div
      key={fileUpload.file.name}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center space-x-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-3"
    >
      {/* Иконка типа файла */}
      <div className="flex-shrink-0">
        {fileUpload.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-500" />}
        {fileUpload.type === 'video' && <Video className="h-5 w-5 text-red-500" />}
        {fileUpload.type === 'audio' && <Music className="h-5 w-5 text-green-500" />}
        {fileUpload.type === 'document' && <File className="h-5 w-5 text-gray-500" />}
      </div>
      
      {/* Информация о файле */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {fileUpload.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(fileUpload.file.size)}
        </p>
      </div>
      
      {/* Статус загрузки */}
      <div className="flex-shrink-0">
        {isFileUploading(fileUpload.file) ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
        ) : (
          <button
            onClick={() => removeFileUpload(fileUpload.file)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!currentChat) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Чат не найден
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Заголовок чата */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            💬 Поддержка
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {typing ? 'Печатает...' : 'Онлайн'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600 dark:text-green-400">Онлайн</span>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Начните диалог
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Напишите нам, и мы обязательно ответим!
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {/* Индикатор печати */}
        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Загружаемые файлы */}
      <AnimatePresence>
        {fileUploads.map(renderFileUpload)}
      </AnimatePresence>

      {/* Ошибка */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
          </div>
        </motion.div>
      )}

      {/* Поле ввода */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-end space-x-3">
          {/* Кнопка прикрепления файла */}
          <button
            onClick={() => setShowFileInput(!showFileInput)}
            className="flex-shrink-0 p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            title="Прикрепить файл"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Поле ввода текста */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={1}
              style={{
                minHeight: '44px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
          </div>

          {/* Кнопка отправки */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || sending}
            className="flex-shrink-0 p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Отправить"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Выбор файла */}
        {showFileInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Выбрать файлы
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Максимум 20MB
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Drag & Drop зона */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity ${
          dragActive ? 'opacity-100' : 'opacity-0'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-full h-full bg-primary-500/10 border-2 border-dashed border-primary-500 rounded-lg flex items-center justify-center">
          <div className="text-center text-primary-600">
            <Paperclip className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Отпустите файлы здесь</p>
            <p className="text-sm">Для загрузки в чат</p>
          </div>
        </div>
      </div>
    </div>
  )
} 