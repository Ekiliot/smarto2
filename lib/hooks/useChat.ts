'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { 
  Chat, 
  Message, 
  ChatWithMessages, 
  FileUpload,
  ChatFilters 
} from '@/lib/types/chat'
import {
  getUserActiveChat,
  createUserChat,
  getChatWithMessages,
  sendMessage,
  uploadChatFile,
  subscribeToChatMessages,
  markChatMessagesAsRead,
  formatFileSize,
  isImageFile,
  isVideoFile,
  isAudioFile
} from '@/lib/supabase/chat'

export function useChat() {
  const { user } = useAuth()
  const [currentChat, setCurrentChat] = useState<ChatWithMessages | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])
  const [typing, setTyping] = useState(false)
  
  const subscriptionRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Инициализация чата
  useEffect(() => {
    if (user) {
      initializeChat()
    }
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [user])

  // Подписка на новые сообщения
  useEffect(() => {
    if (currentChat?.id && user) {
      subscribeToMessages(currentChat.id)
    }
  }, [currentChat?.id, user])

  const initializeChat = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Получаем активный чат пользователя
      let chat = await getUserActiveChat(user.id)
      
      if (!chat) {
        // Создаем новый чат
        const chatId = await createUserChat(user.id)
        if (chatId) {
          chat = await getUserActiveChat(user.id)
        }
      }
      
      if (chat) {
        // Получаем чат с сообщениями
        const chatWithMessages = await getChatWithMessages(chat.id)
        if (chatWithMessages) {
          setCurrentChat(chatWithMessages)
          setMessages(chatWithMessages.messages || [])
          
          // Отмечаем сообщения как прочитанные
          if (chatWithMessages.messages?.length) {
            await markChatMessagesAsRead(chat.id, user.id)
          }
        }
      }
    } catch (error) {
      console.error('Error initializing chat:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = useCallback((chatId: string) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    subscriptionRef.current = subscribeToChatMessages(chatId, (newMessage) => {
      setMessages(prev => [...prev, newMessage])
      
      // Отмечаем как прочитанное, если это не наше сообщение
      if (newMessage.sender_id !== user?.id) {
        markMessageAsRead(newMessage.id)
      }
    })
  }, [user?.id])

  const sendTextMessage = async (text: string) => {
    if (!currentChat || !user || !text.trim()) return
    
    setSending(true)
    try {
      const message = await sendMessage(currentChat.id, user.id, text.trim())
      if (message) {
        setMessages(prev => [...prev, message])
        setTyping(false)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const sendFileMessage = async (file: File) => {
    if (!currentChat || !user) return
    
    setUploading(true)
    try {
      // Создаем превью для изображений
      let preview: string | undefined
      if (isImageFile(file.type)) {
        preview = URL.createObjectURL(file)
      }

      // Добавляем файл в список загрузок
      const fileUpload: FileUpload = {
        file,
        type: isImageFile(file.type) ? 'image' : 
              isVideoFile(file.type) ? 'video' : 
              isAudioFile(file.type) ? 'audio' : 'document',
        preview
      }

      setFileUploads(prev => [...prev, fileUpload])

      // Загружаем файл
      const fileData = await uploadChatFile(file, user.id, currentChat.id)
      if (fileData) {
        // Отправляем сообщение с файлом
        const message = await sendMessage(currentChat.id, user.id, undefined, fileData)
        if (message) {
          setMessages(prev => [...prev, message])
        }
      }

      // Убираем файл из списка загрузок
      setFileUploads(prev => prev.filter(f => f.file !== file))
      
      // Очищаем превью
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    } catch (error) {
      console.error('Error sending file:', error)
      // Убираем файл из списка загрузок при ошибке
      setFileUploads(prev => prev.filter(f => f.file !== file))
    } finally {
      setUploading(false)
    }
  }

  const handleTyping = useCallback((isTyping: boolean) => {
    setTyping(isTyping)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false)
      }, 3000)
    }
  }, [])

  const markMessageAsRead = async (messageId: string) => {
    try {
      await markChatMessagesAsRead(currentChat!.id, user!.id)
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const refreshChat = async () => {
    if (currentChat) {
      await initializeChat()
    }
  }

  const closeChat = async () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    setCurrentChat(null)
    setMessages([])
    setFileUploads([])
  }

  const removeFileUpload = (file: File) => {
    setFileUploads(prev => {
      const filtered = prev.filter(f => f.file !== file)
      // Очищаем превью
      const removed = prev.find(f => f.file === file)
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview)
      }
      return filtered
    })
  }

  const getFileUploadProgress = (file: File) => {
    const upload = fileUploads.find(f => f.file === file)
    return upload?.uploadProgress || 0
  }

  const isFileUploading = (file: File) => {
    return fileUploads.some(f => f.file === file)
  }

  return {
    // Состояние
    currentChat,
    loading,
    sending,
    uploading,
    messages,
    fileUploads,
    typing,
    
    // Действия
    sendTextMessage,
    sendFileMessage,
    handleTyping,
    refreshChat,
    closeChat,
    removeFileUpload,
    getFileUploadProgress,
    isFileUploading,
    
    // Утилиты
    formatFileSize,
    isImageFile,
    isVideoFile,
    isAudioFile
  }
} 