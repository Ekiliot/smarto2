'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { Download, X, Smartphone, Monitor } from 'lucide-react'

interface PWAInstallContextType {
  canInstall: boolean
  showInstallPrompt: () => void
  hideInstallPrompt: () => void
  installApp: () => Promise<void>
  isInstalled: boolean
  isMobile: boolean
  isInstalling: boolean
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
  const [isInstalling, setIsInstalling] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [isMobile, setIsMobile] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Настройка частоты показа (в миллисекундах)
  // Измените SHOW_INTERVAL для настройки частоты:
  // - 1 день: 24 * 60 * 60 * 1000
  // - 2 дня: 2 * 24 * 60 * 60 * 1000 (текущее значение)
  // - 3 дня: 3 * 24 * 60 * 60 * 1000
  // - 1 неделя: 7 * 24 * 60 * 60 * 1000
  const SHOW_INTERVAL = 2 * 24 * 60 * 60 * 1000 // 2 дня по умолчанию
  const INITIAL_DELAY = 30000 // 30 секунд до первого показа

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

    // Проверяем, когда в последний раз показывали промпт
    const checkLastShown = () => {
      const lastShown = localStorage.getItem('pwa_prompt_last_shown')
      const now = Date.now()
      
      if (!lastShown || (now - parseInt(lastShown)) > SHOW_INTERVAL) {
        return true // Можно показать
      }
      return false // Недавно показывали
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
        
        // Показываем промпт только если прошло достаточно времени
        if (checkLastShown()) {
        setTimeout(() => {
          if (!isInstalled) {
            setShowPrompt(true)
              // Записываем время показа
              localStorage.setItem('pwa_prompt_last_shown', Date.now().toString())
            }
          }, INITIAL_DELAY) // Показываем через 30 секунд
          }
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

  const showInstallPrompt = async () => {
    // Показываем промпт только на мобильных устройствах
    if (!isMobile) return
    
    // Показываем анимацию установки
    setShowPrompt(true)
    
    // Записываем время показа
    localStorage.setItem('pwa_prompt_last_shown', Date.now().toString())
    
    // Если это Android/Chrome, показываем анимацию загрузки
    if (platform === 'android' && deferredPrompt) {
      // Имитируем анимацию загрузки
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Показываем нативный промпт установки
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
        setShowPrompt(false)
      }
    }
    // Для iOS просто показываем инструкции
  }

  const hideInstallPrompt = () => {
    setShowPrompt(false)
  }

  // Обработка свайпа вниз
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y > 100) { // Если свайпнули вниз больше 100px
      hideInstallPrompt()
    }
  }

  const installApp = async () => {
    if (!deferredPrompt) return

    try {
      // Показываем анимацию загрузки
      setIsInstalling(true)
      setShowPrompt(true)
      
      // Имитируем анимацию загрузки (2 секунды)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Показываем нативный промпт установки
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
      setShowPrompt(false)
    } finally {
      setIsInstalling(false)
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
    isMobile,
    isInstalling
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
              ref={modalRef}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-2xl max-w-md w-full p-6 relative"
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              style={{ touchAction: 'pan-y' }}
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
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Получите быстрый доступ к Smarto прямо с экрана устройства
                </p>

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
                      disabled={isInstalling}
                      whileHover={{ scale: isInstalling ? 1 : 1.02 }}
                      whileTap={{ scale: isInstalling ? 1 : 0.98 }}
                      className={`w-full font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2 ${
                        isInstalling 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-primary-600 hover:bg-primary-700 text-white'
                      }`}
                    >
                      {isInstalling ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Установка...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5" />
                          <span>Установить приложение</span>
                        </>
                      )}
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