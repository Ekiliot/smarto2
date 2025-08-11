'use client'

import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

declare global {
  interface Window {
    Tawk_API?: any
  }
}

export default function SupportPage() {
  // Дополнительная проверка для открытия виджета
  useEffect(() => {
    // Проверяем и показываем виджет при загрузке страницы
    const showWidget = () => {
      if (window.Tawk_API && window.Tawk_API.showWidget) {
        try {
          window.Tawk_API.showWidget()
          console.log('Виджет показан со страницы support')
        } catch (error) {
          console.log('Ошибка при показе виджета:', error)
        }
      }
    }

    // Показываем виджет сразу
    showWidget()

    // Дополнительная проверка через небольшую задержку
    const timer = setTimeout(() => {
      showWidget()
    }, 1000)

    // Еще одна проверка через 2 секунды
    const timer2 = setTimeout(() => {
      showWidget()
    }, 2000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      {/* Хедер только для десктопа */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      {/* Мобильная версия */}
      <div className="md:hidden">
        <main className="px-4 py-6">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              💬 Техподдержка
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Напишите нам, мы всегда готовы помочь!
            </p>
          </motion.div>

          {/* Информационная карточка */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">💬</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Онлайн чат с поддержкой
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Наш специалист ответит на все ваши вопросы в режиме реального времени
                </p>
              </div>
            </div>
          </motion.div>

          {/* Кнопка "Назад в аккаунт" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <Link
              href="/account"
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад в аккаунт</span>
            </Link>
          </motion.div>
        </main>
      </div>

      {/* Десктопная версия */}
      <div className="hidden md:block">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/account"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Назад в аккаунт</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Техподдержка
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Напишите нам, мы всегда готовы помочь!
            </p>
          </motion.div>

          {/* Информационная карточка */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
          >
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Онлайн чат с поддержкой
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Наш специалист ответит на все ваши вопросы в режиме реального времени. 
              Просто начните диалог в чате ниже.
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ⏰ Время работы: Пн-Пт 9:00-18:00
            </div>
          </motion.div>
        </main>
      </div>

      {/* Контейнер для чата Tawk.to */}
      <div 
        id="tawkto-container"
        className="w-full min-h-screen bg-white dark:bg-gray-900"
      >
        {/* Чат Tawk.to будет загружен здесь */}
      </div>
    </div>
  )
} 