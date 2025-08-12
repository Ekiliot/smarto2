'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  Eye
} from 'lucide-react'
import { Chat, ChatFilters } from '@/lib/types/chat'
import { getAllChats, updateChatStatus } from '@/lib/supabase/chat'
import { supabase } from '@/lib/supabase'

interface AdminChatListProps {
  onSelectChat: (chat: Chat) => void
  selectedChatId?: string
  onStatsUpdate?: (stats: any) => void
}

export function AdminChatList({ onSelectChat, selectedChatId, onStatsUpdate }: AdminChatListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ChatFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const subscriptionRef = useRef<any>(null)

  useEffect(() => {
    loadChats()
  }, [filters])

  // Real-time подписка на новые чаты и обновления
  useEffect(() => {
    subscribeToRealTimeUpdates()
    
    // Запасной вариант - обновление каждые 30 секунд
    const interval = setInterval(() => {
      loadChats()
    }, 30000)
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
      clearInterval(interval)
    }
  }, [])

  const loadChats = async () => {
    setLoading(true)
    try {
      console.log('Loading chats with filters:', filters)
      const chatList = await getAllChats(filters)
      console.log('Loaded chats:', chatList)
      console.log('Chats count:', chatList.length)
      
      // Проверяем структуру первого чата
      if (chatList.length > 0) {
        console.log('First chat structure:', {
          id: chatList[0].id,
          user_id: chatList[0].user_id,
          user: chatList[0].user,
          hasUser: !!chatList[0].user,
          userType: typeof chatList[0].user
        })
      }
      
      setChats(chatList)
      
      // Обновляем статистику
      if (onStatsUpdate) {
        const stats = {
          total: chatList.length,
          open: chatList.filter(chat => chat.status === 'open').length,
          pending: chatList.filter(chat => chat.status === 'pending').length,
          closed: chatList.filter(chat => chat.status === 'closed').length
        }
        onStatsUpdate(stats)
      }
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Real-time подписка на обновления чатов
  const subscribeToRealTimeUpdates = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    // Подписываемся на изменения в таблице chats
    subscriptionRef.current = supabase
      .channel('admin-chats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats'
        },
        async (payload) => {
          console.log('Real-time chat update:', payload)
          
          // Обновляем список чатов
          await loadChats()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('Real-time message update:', payload)
          
          // Обновляем список чатов (для обновления last_message_at)
          await loadChats()
        }
      )
      .subscribe()
  }

  const handleStatusChange = async (chatId: string, newStatus: 'open' | 'closed' | 'pending') => {
    try {
      const success = await updateChatStatus(chatId, newStatus)
      if (success) {
        setChats(prev => prev.map(chat => 
          chat.id === chatId ? { ...chat, status: newStatus } : chat
        ))
        
        // Обновляем статистику после изменения статуса
        if (onStatsUpdate) {
          const updatedChats = chats.map(chat => 
            chat.id === chatId ? { ...chat, status: newStatus } : chat
          )
          const stats = {
            total: updatedChats.length,
            open: updatedChats.filter(chat => chat.status === 'open').length,
            pending: updatedChats.filter(chat => chat.status === 'pending').length,
            closed: updatedChats.filter(chat => chat.status === 'closed').length
          }
          onStatsUpdate(stats)
        }
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

  const filteredChats = chats.filter(chat => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        chat.subject.toLowerCase().includes(query) ||
        chat.user?.email.toLowerCase().includes(query) ||
        chat.last_message?.text?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const getUnreadCount = (chat: Chat) => {
    return chat.unread_count || 0
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Только что'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}ч назад`
    } else {
      return date.toLocaleDateString('ru-RU')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Чаты с поддержкой
        </h2>
        
        {/* Поиск */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по чатам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Фильтры */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showFilters 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Фильтры</span>
          </button>
          
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setFilters({})}
              className="px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              Очистить
            </button>
          )}
        </div>

        {/* Панель фильтров */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Все статусы</option>
                  <option value="open">Открытые</option>
                  <option value="pending">Ожидающие</option>
                  <option value="closed">Закрытые</option>
                </select>
                
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value || undefined }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Дата от"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Чаты не найдены
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Нет активных чатов'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  selectedChatId === chat.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => onSelectChat(chat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Заголовок и статус */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chat.status)}`}>
                        {getStatusIcon(chat.status)}
                        <span className="ml-1">{getStatusText(chat.status)}</span>
                      </span>
                      
                      {/* Показываем непрочитанные сообщения */}
                      {getUnreadCount(chat) > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                          {getUnreadCount(chat)} непрочитанных
                        </span>
                      )}
                    </div>

                    {/* Тема чата */}
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                      {chat.subject}
                    </h4>

                    {/* Пользователь */}
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {chat.user?.email || 'Загрузка...'}
                        {chat.user?.first_name && ` (${chat.user.first_name}`}
                        {chat.user?.last_name && ` ${chat.user.last_name}`}
                        {chat.user?.first_name && ')'}
                      </span>
                    </div>

                    {/* Последнее сообщение */}
                    {chat.last_message ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {chat.last_message.text || (chat.last_message.file_url ? 'Файл' : 'Сообщение')}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                        Нет сообщений
                      </p>
                    )}

                    {/* Время */}
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {chat.last_message_at ? formatDate(chat.last_message_at) : 'Нет сообщений'}
                      </span>
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-col items-end space-y-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectChat(chat)
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Открыть чат"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {/* Быстрое изменение статуса */}
                    <select
                      value={chat.status}
                      onChange={(e) => handleStatusChange(chat.id, e.target.value as any)}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="open">Открыть</option>
                      <option value="pending">В ожидание</option>
                      <option value="closed">Закрыть</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-primary-600">
              {chats.filter(c => c.status === 'open').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Открытые</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-yellow-600">
              {chats.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Ожидают</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-600">
              {chats.filter(c => c.status === 'closed').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Закрытые</div>
          </div>
        </div>
      </div>
    </div>
  )
} 