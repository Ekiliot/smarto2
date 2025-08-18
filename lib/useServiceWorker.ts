'use client'

import { useEffect, useState, useCallback } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isInstalled: boolean
  isActive: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
  version: string | null
  cacheInfo: CacheInfo | null
}

interface CacheInfo {
  STATIC: { size: number; maxSize: number; ttl: number }
  DYNAMIC: { size: number; maxSize: number; ttl: number }
  IMAGES: { size: number; maxSize: number; ttl: number }
  API: { size: number; maxSize: number; ttl: number }
}

interface UpdateInfo {
  hasUpdate: boolean
  isUpdating: boolean
}

const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined'

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isInstalled: false,
    isActive: false,
    isOnline: isBrowser ? navigator.onLine : true,
    registration: null,
    version: '1.1.9',
    cacheInfo: null
  })

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>({
    hasUpdate: false,
    isUpdating: false
  })

  const [notifications, setNotifications] = useState<string[]>([])

  // Регистрация Service Worker
  useEffect(() => {
    if (!isBrowser) {
      return
    }

    if (!('serviceWorker' in navigator)) {
      console.log('🚫 Service Worker не поддерживается')
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Всегда проверяем обновления
        })

        console.log('✅ Service Worker зарегистрирован:', registration)

        setState(prev => ({
          ...prev,
          registration,
          isInstalled: true,
          isActive: !!registration.active
        }))

        // Слушаем события обновления
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Обновление Service Worker найдено')
          
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Проверяем, действительно ли есть обновление
                // Показываем уведомление только если есть waiting worker и это мобильное устройство
                if (registration.waiting && isMobileDevice()) {
                  setUpdateInfo(prev => ({ ...prev, hasUpdate: true }))
                  addNotification('Доступно обновление приложения')
                } else if (registration.waiting && !isMobileDevice()) {
                  // На веб-версии просто логируем, но не показываем уведомления
                  console.log('🔄 Обновление Service Worker доступно, но это веб-версия')
                  // Не устанавливаем hasUpdate на веб-версии
                }
              }
            })
          }
        })

        // Слушаем изменения контроллера
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Service Worker активирован')
          setState(prev => ({ ...prev, isActive: true }))
          setUpdateInfo({ hasUpdate: false, isUpdating: false })
          
          // Показываем уведомление только на мобильных устройствах
          if (isMobileDevice()) {
            addNotification('Приложение обновлено')
          }
          
          // Перезагружаем страницу после обновления только на мобильных устройствах
          if (updateInfo.isUpdating && isMobileDevice()) {
            window.location.reload()
          }
        })

        // Слушаем сообщения от Service Worker
        navigator.serviceWorker.addEventListener('message', handleSWMessage)

        // Получаем информацию о кеше
        getCacheInfo()

      } catch (error) {
        console.error('❌ Ошибка регистрации Service Worker:', error)
      }
    }

    // Слушаем изменения состояния сети
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }))
      addNotification('Соединение восстановлено')
    }
    
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }))
      addNotification('Нет соединения с интернетом')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    registerSW()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage)
    }
  }, [])

  // Обработка сообщений от Service Worker
  const handleSWMessage = useCallback((event: MessageEvent) => {
    const { type, data } = event.data
    
    switch (type) {
      case 'CACHE_INFO_RESPONSE':
        setState(prev => ({ ...prev, cacheInfo: data }))
        break
      
      case 'SW_VERSION':
        setState(prev => ({ ...prev, version: data.version }))
        break
      
      case 'CACHE_UPDATED':
        addNotification(`Кеш обновлен: ${data.url}`)
        break
      
      case 'PREFETCH_COMPLETE':
        addNotification(`Предзагрузка завершена: ${data.count} файлов`)
        break
    }
  }, [])

  // Добавление уведомления
  const addNotification = useCallback((message: string) => {
    // Не показываем уведомления об обновлении на веб-версии
    if (message.includes('обновление') && !isMobileDevice()) {
      return
    }
    
    setNotifications(prev => [...prev, message])
    
    // Автоматически удаляем уведомление через 5 секунд
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== message))
    }, 5000)
  }, [])

  // Проверка на мобильное устройство
  const isMobileDevice = useCallback(() => {
    if (!isBrowser) return false
    return window.matchMedia('(max-width: 768px)').matches || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }, [])

  // Обновление Service Worker
  const updateServiceWorker = useCallback(async () => {
    if (!state.registration) return

    // Не обновляем Service Worker на веб-версии
    if (!isMobileDevice()) {
      console.log('🚫 Обновление Service Worker недоступно на веб-версии')
      setUpdateInfo(prev => ({ ...prev, hasUpdate: false }))
      return
    }

    try {
      setUpdateInfo(prev => ({ ...prev, isUpdating: true }))
      
      // Проверяем обновления
      await state.registration.update()
      
      // Если есть waiting worker, активируем его
      if (state.registration.waiting) {
        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }
      
      console.log('🔄 Service Worker обновлен')
    } catch (error) {
      console.error('❌ Ошибка обновления Service Worker:', error)
      setUpdateInfo(prev => ({ ...prev, isUpdating: false }))
    }
  }, [state.registration])

  // Отправка сообщения в Service Worker
  const sendMessageToSW = useCallback((message: any) => {
    if (!isBrowser) return
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    }
  }, [])

  // Кеширование страницы
  const cachePage = useCallback(async (url: string) => {
    sendMessageToSW({
          type: 'CACHE_PAGE',
      data: { url }
        })
    console.log(`📱 Запрошено кеширование: ${url}`)
  }, [sendMessageToSW])

  // Предварительная загрузка ресурсов
  const prefetchResources = useCallback(async (urls: string[]) => {
    sendMessageToSW({
      type: 'PREFETCH_RESOURCES',
      data: { urls }
    })
    console.log(`🚀 Запрошена предзагрузка ${urls.length} ресурсов`)
  }, [sendMessageToSW])

  // Очистка кеша
  const clearCache = useCallback(async () => {
    try {
      sendMessageToSW({ type: 'CLEAR_CACHE' })
      
      // Также очищаем локальные кеши
      if (isBrowser && 'caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      setState(prev => ({ ...prev, cacheInfo: null }))
      addNotification('Кеш очищен')
      console.log('🧹 Кеш очищен')
    } catch (error) {
      console.error('❌ Ошибка очистки кеша:', error)
    }
  }, [sendMessageToSW, addNotification])

  // Получение информации о кеше
  const getCacheInfo = useCallback(async () => {
    if (!isBrowser) return
    if (!navigator.serviceWorker.controller) return

    try {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_INFO_RESPONSE') {
          setState(prev => ({ ...prev, cacheInfo: event.data.data }))
        }
      }

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_INFO' },
        [messageChannel.port2]
      )
      } catch (error) {
      console.error('❌ Ошибка получения информации о кеше:', error)
    }
  }, [])

  // Принудительная регистрация фоновой синхронизации
  const scheduleBackgroundSync = useCallback(async (tag: string) => {
    if (!state.registration) return

    try {
      if ('sync' in state.registration && state.registration.sync) {
        await (state.registration.sync as any).register(tag)
        console.log(`🔄 Фоновая синхронизация запланирована: ${tag}`)
      }
    } catch (error) {
      console.error('❌ Ошибка планирования фоновой синхронизации:', error)
    }
  }, [state.registration])

  // Запрос разрешения на уведомления
  const requestNotificationPermission = useCallback(async () => {
    if (!isBrowser || !('Notification' in window)) {
      console.log('🚫 Push уведомления не поддерживаются')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  // Подписка на push уведомления
  const subscribeToPush = useCallback(async (vapidPublicKey: string) => {
    if (!state.registration) return null

    try {
      const subscription = await state.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      })
      
      console.log('📧 Подписка на push уведомления создана')
      return subscription
    } catch (error) {
      console.error('❌ Ошибка подписки на push уведомления:', error)
      return null
      }
  }, [state.registration])

  // Получение статистики производительности кеша
  const getCacheStats = useCallback(() => {
    if (!state.cacheInfo) return null

    const totalSize = Object.values(state.cacheInfo).reduce((sum, cache) => sum + cache.size, 0)
    const totalMaxSize = Object.values(state.cacheInfo).reduce((sum, cache) => sum + cache.maxSize, 0)
    const utilization = totalMaxSize > 0 ? (totalSize / totalMaxSize) * 100 : 0

    return {
      totalSize,
      totalMaxSize,
      utilization: Math.round(utilization),
      caches: state.cacheInfo
    }
  }, [state.cacheInfo])

  // Удаление уведомления
  const dismissNotification = useCallback((message: string) => {
    setNotifications(prev => prev.filter(n => n !== message))
  }, [])

  return {
    // Состояние
    ...state,
    updateInfo,
    notifications,
    
    // Функции управления
    updateServiceWorker,
    sendMessageToSW,
    cachePage,
    prefetchResources,
    clearCache,
    getCacheInfo,
    scheduleBackgroundSync,
    
    // Push уведомления
    requestNotificationPermission,
    subscribeToPush,
    
    // Статистика
    getCacheStats,
    
    // UI
    dismissNotification
  }
} 