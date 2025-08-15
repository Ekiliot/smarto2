'use client'

import { motion } from 'framer-motion'
import { Download, Smartphone } from 'lucide-react'
import { usePWAInstall } from './PWAInstallProvider'

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function PWAInstallButton({ 
  variant = 'primary', 
  size = 'md', 
  className = '' 
}: PWAInstallButtonProps) {
  const { canInstall, showInstallPrompt, isInstalled, isMobile } = usePWAInstall()

  // Не показываем кнопку если приложение уже установлено или это не мобильное устройство
  if (isInstalled || !canInstall || !isMobile) {
    return null
  }

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600',
    minimal: 'text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20'
  }

  return (
    <motion.button
      onClick={showInstallPrompt}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center space-x-2 rounded-lg font-medium transition-all duration-200
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        ${className}
      `}
      title="Установить приложение Smarto"
    >
      <Download className="h-4 w-4" />
      <span>Установить приложение</span>
    </motion.button>
  )
}

// Компонент для показа в мобильном меню
export function PWAInstallMenuItem() {
  const { canInstall, showInstallPrompt, isInstalled, isMobile } = usePWAInstall()

  if (isInstalled || !canInstall || !isMobile) {
    return null
  }

  return (
    <motion.button
      onClick={showInstallPrompt}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center space-x-3 p-4 text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
    >
      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
        <Smartphone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <div className="font-medium">Установить приложение</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Быстрый доступ с экрана</div>
      </div>
    </motion.button>
  )
} 