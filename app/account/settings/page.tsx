'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Smartphone, Download, Check } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { usePWAInstall } from '@/components/PWAInstallProvider'
import ToggleSwitchTailwind from '@/components/ToggleSwitchTailwind'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { canInstall, isInstalled, installApp, showInstallPrompt } = usePWAInstall()

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
                <ToggleSwitchTailwind
                  checked={theme === 'light'}
                  onChange={() => handleThemeChange('light')}
                  size="md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Moon className="h-5 w-5 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">Темная тема</span>
                </div>
                <ToggleSwitchTailwind
                  checked={theme === 'dark'}
                  onChange={() => handleThemeChange('dark')}
                  size="md"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Monitor className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Системная тема</span>
                </div>
                <ToggleSwitchTailwind
                  checked={theme === 'system'}
                  onChange={() => handleThemeChange('system')}
                  size="md"
                />
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Выберите предпочитаемую тему оформления. Системная тема автоматически подстраивается под настройки вашего устройства.
            </p>
          </motion.div>

          {/* PWA Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Приложение
            </h2>
            
            {isInstalled ? (
              /* Если уже установлено */
              <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Приложение установлено
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Вы используете Smarto как приложение
                  </p>
                </div>
              </div>
            ) : canInstall ? (
              /* Если можно установить - стиль App Store */
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                <div className="flex items-center space-x-3">
                  {/* Логотип приложения */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex items-center justify-center">
                    <span className="text-white text-lg font-bold">S</span>
                  </div>
                  
                  {/* Информация о приложении */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Smarto
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Установить приложение
                    </p>
                  </div>
                  
                  {/* Кнопка установки */}
                  <motion.button
                    onClick={showInstallPrompt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Установить</span>
                  </motion.button>
                </div>
                
                {/* Инструкция для iOS */}
                <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                    На iPhone: "Поделиться" → "На экран «Домой»"
                  </p>
                </div>
              </div>
            ) : (
              /* Если нельзя установить */
              <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    Установка недоступна
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ваш браузер не поддерживает установку
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
} 