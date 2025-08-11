'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Sun, Moon, Monitor, Settings } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import Link from 'next/link'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/account"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-primary-600" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Настройки
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Внешний вид
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">Светлая тема</span>
                </div>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    theme === 'light' 
                      ? 'bg-primary-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    theme === 'light' ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Moon className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Темная тема</span>
                </div>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    theme === 'dark' 
                      ? 'bg-primary-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Системная тема</span>
                </div>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                    theme === 'system' 
                      ? 'bg-primary-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
                    theme === 'system' ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Выберите предпочитаемую тему оформления. Системная тема автоматически подстраивается под настройки вашего устройства.
            </p>
          </motion.div>

          {/* Other Settings Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Другие настройки
            </h2>
            
            <p className="text-gray-500 dark:text-gray-400">
              Дополнительные настройки будут добавлены в будущих обновлениях.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  )
} 