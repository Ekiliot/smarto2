'use client'

import { useEffect, useState } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isInstalled: boolean
  isActive: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isInstalled: false,
    isActive: false,
    isOnline: navigator.onLine,
    registration: null
  })

  useEffect(() => {
    // Проверяем поддержку Service Worker
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker не поддерживается')
      return
    }

    setState(prev => ({ ...prev, isSupported: true }))

    // Регистрируем Service Worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('Service Worker зарегистрирован:', registration)

        setState(prev => ({
          ...prev,
          registration,
          isInstalled: true
        }))

        // Слушаем изменения состояния
        registration.addEventListener('updatefound', () => {
          console.log('Обновление Service Worker найдено')
        })

        // Слушаем активацию
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service Worker активирован')
          setState(prev => ({ ...prev, isActive: true }))
        })

        // Слушаем сообщения от Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          console.log('Сообщение от Service Worker:', event.data)
        })

      } catch (error) {
        console.error('Ошибка регистрации Service Worker:', error)
      }
    }

    // Слушаем изменения состояния сети
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Регистрируем Service Worker
    registerSW()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Функция для обновления Service Worker
  const updateServiceWorker = async () => {
    if (state.registration) {
      try {
        await state.registration.update()
        console.log('Service Worker обновлен')
      } catch (error) {
        console.error('Ошибка обновления Service Worker:', error)
      }
    }
  }

  // Функция для отправки сообщений в Service Worker
  const sendMessageToSW = (message: any) => {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message)
    }
  }

  // Функция для кеширования страницы
  const cachePage = async (url: string) => {
    if (state.registration && state.registration.active) {
      try {
        await state.registration.active.postMessage({
          type: 'CACHE_PAGE',
          url
        })
        console.log(`Страница ${url} добавлена в кеш`)
      } catch (error) {
        console.error('Ошибка кеширования страницы:', error)
      }
    }
  }

  // Функция для очистки кеша
  const clearCache = async () => {
    if (state.registration) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('Кеш очищен')
      } catch (error) {
        console.error('Ошибка очистки кеша:', error)
      }
    }
  }

  return {
    ...state,
    updateServiceWorker,
    sendMessageToSW,
    cachePage,
    clearCache
  }
} 