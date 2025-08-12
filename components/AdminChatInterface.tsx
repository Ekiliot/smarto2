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
  AlertCircle,
  User,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle
} from 'lucide-react'
import { Chat, Message, FileUpload } from '@/lib/types/chat'
import { 
  sendMessage, 
  uploadChatFile, 
  subscribeToChatMessages,
  markChatMessagesAsRead,
  updateChatStatus,
  formatFileSize,
  isImageFile,
  isVideoFile,
  isAudioFile
} from '@/lib/supabase/chat'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

interface AdminChatInterfaceProps {
  chat: Chat
  onChatUpdate: (chat: Chat) => void
  className?: string
}

export function AdminChatInterface({ chat, onChatUpdate, className = '' }: AdminChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const subscriptionRef = useRef<any>(null)

  // Загрузка сообщений
  useEffect(() => {
    if (chat) {
      console.log('Chat data:', chat)
      loadMessages()
    }
  }, [chat?.id])

  // Подписка на новые сообщения
  useEffect(() => {
    if (chat?.id && user) {
      subscribeToMessages(chat.id)
    }
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [chat?.id, user])

  // Real-time подписка на обновления чата
  useEffect(() => {
    if (chat?.id) {
      subscribeToChatUpdates(chat.id)
    }
    
    return () => {
      // Очистка подписки на обновления чата
    }
  }, [chat?.id])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    if (!chat) return
    
    setLoading(true)
    try {
      // Загружаем сообщения для чата через API
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error loading messages:', error)
        setError('Ошибка загрузки сообщений')
        setMessages([])
      } else {
        console.log('Loaded messages:', messagesData)
        setMessages(messagesData || [])
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setError('Ошибка загрузки сообщений')
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = (chatId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    subscriptionRef.current = subscribeToChatMessages(chatId, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
      
      // Отмечаем как прочитанное
      markMessageAsRead(newMessage.id)
    })
  }

  // Real-time подписка на обновления чата
  const subscribeToChatUpdates = (chatId: string) => {
    const chatSubscription = supabase
      .channel(`chat-updates-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `id=eq.${chatId}`
        },
        (payload) => {
          console.log('Chat updated:', payload)
          
          // Обновляем данные чата
          if (payload.new) {
            const updatedChat = { ...chat, ...payload.new }
            onChatUpdate(updatedChat)
          }
        }
      )
      .subscribe()

    return () => {
      chatSubscription.unsubscribe()
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || !user) return
    
    setSending(true)
    try {
      const message = await sendMessage(chat.id, user.id, messageText.trim())
      if (message) {
        setMessages(prev => [...prev, message])
        setMessageText('')
        setError(null)
      }
    } catch (err) {
      setError('Ошибка при отправке сообщения')
    } finally {
      setSending(false)
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
      if (file.size > 20 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер: 20MB')
        return
      }
      
      sendFileMessage(file)
    })
    
    setError(null)
  }

  const sendFileMessage = async (file: File) => {
    if (!user) return
    
    setUploading(true)
    try {
      let preview: string | undefined
      if (isImageFile(file.type)) {
        preview = URL.createObjectURL(file)
      }

      const fileUpload: FileUpload = {
        file,
        type: isImageFile(file.type) ? 'image' : 
              isVideoFile(file.type) ? 'video' : 
              isAudioFile(file.type) ? 'audio' : 'document',
        preview
      }

      setFileUploads(prev => [...prev, fileUpload])

      const fileData = await uploadChatFile(file, user.id, chat.id)
      if (fileData) {
        const message = await sendMessage(chat.id, user.id, undefined, fileData)
        if (message) {
          setMessages(prev => [...prev, message])
        }
      }

      setFileUploads(prev => prev.filter(f => f.file !== file))
      
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    } catch (error) {
      console.error('Error sending file:', error)
      setFileUploads(prev => prev.filter(f => f.file !== file))
    } finally {
      setUploading(false)
    }
  }

  const markMessageAsRead = async (messageId: string) => {
    try {
      await markChatMessagesAsRead(chat.id, user!.id)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleStatusChange = async (newStatus: 'open' | 'closed' | 'pending') => {
    try {
      const success = await updateChatStatus(chat.id, newStatus)
      if (success) {
        const updatedChat = { ...chat, status: newStatus }
        onChatUpdate(updatedChat)
      }
    } catch (error) {
      console.error('Error updating chat status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <MessageCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'closed':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Открыт'
      case 'pending':
        return 'Ожидает'
      case 'closed':
        return 'Закрыт'
      default:
        return status
    }
  }

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id
    const hasFile = message.file_url && message.file_type
    
    // Получаем имя отправителя
    const senderName = message.sender?.email || 'Неизвестный пользователь'

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
            {/* Имя отправителя */}
            <div className="text-xs opacity-75 mb-1">
              {isOwnMessage ? 'Вы' : senderName}
            </div>
            
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
      <div className="flex-shrink-0">
        {fileUpload.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-500" />}
        {fileUpload.type === 'video' && <Video className="h-5 w-5 text-red-500" />}
        {fileUpload.type === 'audio' && <Music className="h-5 w-5 text-green-500" />}
        {fileUpload.type === 'document' && <File className="h-5 w-5 text-gray-500" />}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {fileUpload.file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(fileUpload.file.size)}
        </p>
      </div>
      
      <div className="flex-shrink-0">
        <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Заголовок чата */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              💬 {chat.subject}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {chat.user?.email || 'Загрузка...'}
                {chat.user?.first_name && ` (${chat.user.first_name}`}
                {chat.user?.last_name && ` ${chat.user.last_name}`}
                {chat.user?.first_name && ')'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Статус чата */}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(chat.status)}`}>
              {getStatusIcon(chat.status)}
              <span className="ml-1">{getStatusText(chat.status)}</span>
            </span>
            
            {/* Изменение статуса */}
            <select
              value={chat.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="open">Открыть</option>
              <option value="pending">В ожидание</option>
              <option value="closed">Закрыть</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <span>Создан: {new Date(chat.created_at).toLocaleDateString('ru-RU')}</span>
          <span>Обновлен: {new Date(chat.updated_at).toLocaleDateString('ru-RU')}</span>
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
              Напишите сообщение пользователю
            </p>
          </div>
        ) : (
          messages.map(renderMessage)
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
            onClick={() => fileInputRef.current?.click()}
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

        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  )
} 