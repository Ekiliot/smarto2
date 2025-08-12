'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { AdminChatList } from '@/components/AdminChatList'
import { AdminChatInterface } from '@/components/AdminChatInterface'
import { Chat } from '@/lib/types/chat'
import { 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

export default function AdminSupportPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chatStats, setChatStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    closed: 0
  })

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat)
  }

  const handleChatUpdate = (updatedChat: Chat) => {
    setSelectedChat(updatedChat)
  }

  const handleStatsUpdate = (stats: any) => {
    setChatStats(stats)
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Назад к админ-панели</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              💬 Управление поддержкой
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управляйте чатами с пользователями и отвечайте на их вопросы
            </p>
          </motion.div>

          {/* Статистика */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {chatStats.total}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Всего чатов
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {chatStats.open}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Открытые
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {chatStats.pending}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Ожидают
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {chatStats.closed}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Закрытые
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Основной контент */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Список чатов */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{ height: '700px' }}
            >
              <AdminChatList 
                onSelectChat={handleChatSelect}
                selectedChatId={selectedChat?.id}
                onStatsUpdate={handleStatsUpdate}
              />
            </motion.div>

            {/* Интерфейс чата */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={{ height: '700px' }}
            >
              {selectedChat ? (
                <AdminChatInterface 
                  chat={selectedChat}
                  onChatUpdate={handleChatUpdate}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Выберите чат
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Выберите чат из списка слева для начала диалога
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Инструкции */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📋 Инструкции по работе с поддержкой
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Открытые чаты</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Активные диалоги с пользователями, требующие ответа
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium text-yellow-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Ожидающие чаты</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Чаты, которые требуют дополнительной информации от пользователя
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium text-green-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Закрытые чаты</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Завершенные диалоги, которые можно использовать для анализа
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium text-purple-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Файлы</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Поддерживаются изображения, видео, аудио и документы до 20MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </AdminGuard>
  )
} 