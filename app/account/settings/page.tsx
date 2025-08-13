'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import ToggleSwitchTailwind from '@/components/ToggleSwitchTailwind'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

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
        </div>
      </main>
    </div>
  )
} 