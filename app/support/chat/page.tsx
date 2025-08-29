'use client'

import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { ChatInterface } from '@/components/ChatInterface'
import { IntegratedChatInterface } from '@/components/IntegratedChatInterface'
import { useAuth } from '@/components/AuthProvider'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function ChatPage() {
  const { user } = useAuth()

  // Если пользователь не авторизован, показываем сообщение
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Войдите в аккаунт
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Чтобы начать чат с поддержкой, необходимо войти в аккаунт
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Основной хедер: показываем только на десктопе, мобильный хедер глобальный */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Мобильная версия чата */}
      <div className="md:hidden">
        <div className="chat-mobile flex flex-col safe-area-top">
          {/* Интегрированный интерфейс чата с быстрыми действиями */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900">
            <IntegratedChatInterface isMobile={true} />
          </div>
        </div>
      </div>

      {/* Десктопная версия */}
      <div className="hidden md:block">
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/support"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Назад к поддержке</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              💬 Чат с поддержкой
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Напишите нам, и мы обязательно ответим! Время ответа: до 5 минут.
            </p>
          </motion.div>

          {/* Интерфейс чата */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ height: '600px' }}
          >
            <IntegratedChatInterface isMobile={false} />
          </motion.div>

          {/* Дополнительная информация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Быстрый ответ
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Мы отвечаем в течение 5 минут в рабочее время
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Поддержка файлов
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Отправляйте изображения, видео и документы до 20MB
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Безопасность
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Все сообщения защищены и видны только вам и поддержке
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  )
} 