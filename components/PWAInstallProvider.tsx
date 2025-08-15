'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Monitor } from 'lucide-react'

interface PWAInstallContextType {
  canInstall: boolean
  showInstallPrompt: () => void
  hideInstallPrompt: () => void
  installApp: () => Promise<void>
  isInstalled: boolean
  isMobile: boolean
}

const PWAInstallContext = createContext<PWAInstallContextType | undefined>(undefined)

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Проверяем, что мы в браузере
    if (typeof window === 'undefined') return

    // Проверяем, запущено ли приложение как PWA
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
      const isMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      
      setIsInstalled(isStandalone || isFullscreen || isMinimalUi || isIOSStandalone)
    }

    // Определяем платформу и проверяем мобильность
    const detectPlatform = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isMobileDevice = /iphone|ipad|ipod|android/.test(userAgent)
      
      setIsMobile(isMobileDevice)
      
      if (isMobileDevice) {
        if (/iphone|ipad|ipod/.test(userAgent)) {
          setPlatform('ios')
        } else if (/android/.test(userAgent)) {
          setPlatform('android')
        }
      } else {
        setPlatform('desktop')
      }
    }

    checkIfInstalled()
    detectPlatform()

    // Слушаем событие beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Устанавливаем canInstall только для мобильных устройств
      if (isMobile) {
        setCanInstall(true)
        
        // Показываем промпт через некоторое время только на мобильных
        setTimeout(() => {
          if (!isInstalled) {
            setShowPrompt(true)
          }
        }, 30000) // Показываем через 30 секунд
      } else {
        // На ПК не показываем предложение установки вообще
        setCanInstall(false)
      }
    }

    // Слушаем событие установки
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      setShowPrompt(false)
      setDeferredPrompt(null)
      console.log('PWA установлено успешно!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled, isMobile])

  const showInstallPrompt = () => {
    // Показываем промпт только на мобильных устройствах
    if (isMobile) {
      setShowPrompt(true)
    }
  }

  const hideInstallPrompt = () => {
    setShowPrompt(false)
  }

  const installApp = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('Пользователь согласился на установку')
      } else {
        console.log('Пользователь отклонил установку')
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error('Ошибка при установке PWA:', error)
    }
  }

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Установить Smarto',
          steps: [
            'Нажмите кнопку "Поделиться" в Safari',
            'Выберите "На экран Домой"',
            'Нажмите "Добавить"'
          ],
          icon: <Smartphone className="h-8 w-8" />
        }
      case 'android':
        return {
          title: 'Установить приложение Smarto',
          steps: [
            'Нажмите "Установить" ниже',
            'Подтвердите установку',
            'Приложение появится на экране'
          ],
          icon: <Smartphone className="h-8 w-8" />
        }
      case 'desktop':
        return {
          title: 'Установить Smarto на компьютер',
          steps: [
            'Нажмите "Установить" ниже',
            'Подтвердите установку',
            'Приложение появится в меню'
          ],
          icon: <Monitor className="h-8 w-8" />
        }
      default:
        return {
          title: 'Установить приложение',
          steps: ['Следуйте инструкциям браузера'],
          icon: <Download className="h-8 w-8" />
        }
    }
  }

  const value: PWAInstallContextType = {
    canInstall,
    showInstallPrompt,
    hideInstallPrompt,
    installApp,
    isInstalled,
    isMobile
  }

  const instructions = getInstallInstructions()

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
      
      {/* Промпт для установки PWA */}
      <AnimatePresence>
        {showPrompt && canInstall && !isInstalled && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 p-4"
            onClick={hideInstallPrompt}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Индикатор свайпа для мобильных */}
              <div className="md:hidden flex justify-center mb-4">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Кнопка закрытия */}
              <button
                onClick={hideInstallPrompt}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Контент */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-600">
                  {instructions.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {instructions.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Получите быстрый доступ к Smarto прямо с экрана устройства
                </p>

                {/* Преимущества */}
                <div className="text-left space-y-2 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Быстрый запуск</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Работает офлайн</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Как нативное приложение</span>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="space-y-3">
                  {platform === 'ios' ? (
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Как установить:
                      </p>
                      <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {instructions.steps.map((step, index) => (
                          <li key={index}>
                            {index + 1}. {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  ) : (
                    <motion.button
                      onClick={installApp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <Download className="h-5 w-5" />
                      <span>Установить приложение</span>
                    </motion.button>
                  )}
                  
                  <button
                    onClick={hideInstallPrompt}
                    className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-2 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Продолжить в браузере
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PWAInstallContext.Provider>
  )
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext)
  if (context === undefined) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider')
  }
  return context
}