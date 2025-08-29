'use client'

import { useEffect, useState } from 'react'
import { useServiceWorker } from '@/lib/useServiceWorker'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Trash2, Info, Wifi, WifiOff } from 'lucide-react'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const {
    isSupported,
    isInstalled,
    isActive,
    isOnline,
    updateInfo,
    notifications,
    cacheInfo,
    updateServiceWorker,
    clearCache,
    getCacheInfo,
    getCacheStats,
    dismissNotification
  } = useServiceWorker()

  const [showCacheInfo, setShowCacheInfo] = useState(false)
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Проверяем, является ли устройство мобильным
  useEffect(() => {
    const checkMobile = () => {
      const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined'
      const mobile = isBrowser && (window.matchMedia('(max-width: 768px)').matches || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      setIsMobile(!!mobile)
    }
    
    checkMobile()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Показываем промпт для обновления только на мобильных устройствах
  useEffect(() => {
    if (updateInfo.hasUpdate && !updateInfo.isUpdating && isMobile) {
      setShowUpdatePrompt(true)
    } else if (updateInfo.hasUpdate && !isMobile) {
      // На веб-версии просто скрываем промпт
      setShowUpdatePrompt(false)
    }
  }, [updateInfo.hasUpdate, updateInfo.isUpdating, isMobile])

  // Скрываем промпт обновления на веб-версии
  useEffect(() => {
    if (!isMobile) {
      setShowUpdatePrompt(false)
    }
  }, [isMobile])

  // Автоматически обновляем информацию о кеше
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        getCacheInfo()
      }, 30000) // Каждые 30 секунд

      return () => clearInterval(interval)
    }
  }, [isActive, getCacheInfo])

  const handleUpdate = async () => {
    setShowUpdatePrompt(false)
    await updateServiceWorker()
  }

  const handleClearCache = async () => {
    if (confirm('Вы уверены, что хотите очистить весь кеш? Это может замедлить загрузку приложения.')) {
      await clearCache()
      setShowCacheInfo(false)
    }
  }

  const cacheStats = getCacheStats()

  return (
    <>
      {children}
      
      {/* Статус подключения */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white p-3 text-center"
          >
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span>Нет подключения к интернету</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Уведомления */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification, index) => (
            <motion.div
              key={`${notification}-${index}`}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg max-w-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{notification}</span>
                <button
                  onClick={() => dismissNotification(notification)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Промпт обновления - только для мобильных устройств */}
      <AnimatePresence>
        {showUpdatePrompt && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Доступно обновление
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Новая версия приложения готова
                  </p>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6 text-sm">
                Обновите приложение, чтобы получить новые функции и исправления.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={handleUpdate}
                  disabled={updateInfo.isUpdating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  {updateInfo.isUpdating ? 'Обновление...' : 'Обновить'}
                </button>
                <button
                  onClick={() => setShowUpdatePrompt(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
                >
                  Позже
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>





      {/* Модальное окно информации о кеше */}
      <AnimatePresence>
        {showCacheInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full shadow-xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Информация о кеше
                </h3>
                <button
                  onClick={() => setShowCacheInfo(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Общая статистика */}
              {cacheStats && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Общая статистика
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {cacheStats.totalSize}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Элементов в кеше
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {cacheStats.utilization}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Заполненность
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Детальная информация по кешам */}
              {cacheInfo && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Детали кешей
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(cacheInfo).map(([name, info]) => (
                      <div key={name} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {info.size}/{info.maxSize}
                          </span>
                        </div>
                        
                        {/* Прогресс бар */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((info.size / info.maxSize) * 100, 100)}%` }}
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          TTL: {Math.round(info.ttl / (1000 * 60))} мин
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Статус Service Worker */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Статус Service Worker
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Поддержка:</span>
                    <span className={`text-sm ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                      {isSupported ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Установлен:</span>
                    <span className={`text-sm ${isInstalled ? 'text-green-600' : 'text-red-600'}`}>
                      {isInstalled ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Активен:</span>
                    <span className={`text-sm ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {isActive ? 'Да' : 'Нет'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Онлайн:</span>
                    <span className={`text-sm flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {isOnline ? 'Да' : 'Нет'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Действия */}
              <div className="flex gap-3">
                <button
                  onClick={handleClearCache}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Очистить кеш
                </button>
                <button
                  onClick={getCacheInfo}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Обновить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 