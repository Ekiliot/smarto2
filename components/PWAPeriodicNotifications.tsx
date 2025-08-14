'use client'

import { useEffect, useState } from 'react'
import { usePWAInstall } from './PWAInstallProvider'
import { useNotification } from './NotificationProvider'

interface PWAPeriodicNotificationsProps {
  // Интервал в днях между уведомлениями (по умолчанию 2 дня)
  intervalDays?: number
  // Максимальное количество показов (по умолчанию 5)
  maxShows?: number
}

export function PWAPeriodicNotifications({ 
  intervalDays = 2, 
  maxShows = 5 
}: PWAPeriodicNotificationsProps) {
  const { canInstall, isInstalled, showInstallPrompt } = usePWAInstall()
  const { showInfo } = useNotification()
  const [hasShownToday, setHasShownToday] = useState(false)

  useEffect(() => {
    // Если PWA уже установлено или нет возможности установки - не показываем уведомления
    if (isInstalled || !canInstall) {
      return
    }

    const checkAndShowNotification = () => {
      const now = Date.now()
      const lastShown = localStorage.getItem('pwa-notification-last-shown')
      const showCount = parseInt(localStorage.getItem('pwa-notification-count') || '0')
      const todayKey = new Date().toDateString()
      const lastShownToday = localStorage.getItem('pwa-notification-today') === todayKey

      // Проверяем, не показывали ли уже сегодня
      if (lastShownToday || hasShownToday) {
        return
      }

      // Проверяем, не превышен ли лимит показов
      if (showCount >= maxShows) {
        return
      }

      // Проверяем, прошло ли достаточно времени с последнего показа
      if (lastShown) {
        const daysSinceLastShown = (now - parseInt(lastShown)) / (1000 * 60 * 60 * 24)
        if (daysSinceLastShown < intervalDays) {
          return
        }
      }

      // Показываем уведомление
      showPWANotification()
    }

    const showPWANotification = () => {
      const now = Date.now()
      const showCount = parseInt(localStorage.getItem('pwa-notification-count') || '0')
      const todayKey = new Date().toDateString()

      // Показываем iOS-style уведомление
      showInfo(
        'Установить приложение?', 
        'Получите быстрый доступ к Smarto прямо с экрана вашего устройства. Быстрее, удобнее, всегда под рукой!',
        'auth'
      )

      // Помечаем что показали сегодня и увеличиваем счетчик
      localStorage.setItem('pwa-notification-last-shown', now.toString())
      localStorage.setItem('pwa-notification-count', (showCount + 1).toString())
      localStorage.setItem('pwa-notification-today', todayKey)
      setHasShownToday(true)
    }

    // Проверяем сразу (с небольшой задержкой чтобы приложение успело загрузиться)
    const initialTimeout = setTimeout(checkAndShowNotification, 3000)

    // Затем проверяем каждый час
    const interval = setInterval(checkAndShowNotification, 60 * 60 * 1000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [canInstall, isInstalled, intervalDays, maxShows, showInfo, showInstallPrompt, hasShownToday])

  // Сбрасываем флаг показа сегодня в полночь
  useEffect(() => {
    const resetDailyFlag = () => {
      const now = new Date()
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const msUntilMidnight = tomorrow.getTime() - now.getTime()

      setTimeout(() => {
        setHasShownToday(false)
        localStorage.removeItem('pwa-notification-today')
        
        // Устанавливаем интервал для ежедневного сброса
        setInterval(() => {
          setHasShownToday(false)
          localStorage.removeItem('pwa-notification-today')
        }, 24 * 60 * 60 * 1000)
      }, msUntilMidnight)
    }

    resetDailyFlag()
  }, [])

  // Этот компонент не рендерит UI - он только показывает уведомления
  return null
}

// Хук для управления PWA уведомлениями
export function usePWANotifications() {
  const resetNotifications = () => {
    localStorage.removeItem('pwa-notification-last-shown')
    localStorage.removeItem('pwa-notification-count')
    localStorage.removeItem('pwa-notification-today')
  }

  const getNotificationStats = () => {
    const lastShown = localStorage.getItem('pwa-notification-last-shown')
    const showCount = parseInt(localStorage.getItem('pwa-notification-count') || '0')
    const todayKey = new Date().toDateString()
    const lastShownToday = localStorage.getItem('pwa-notification-today') === todayKey

    return {
      lastShown: lastShown ? new Date(parseInt(lastShown)) : null,
      showCount,
      shownToday: lastShownToday,
      canShowMore: showCount < 5
    }
  }

  const forceShowNotification = () => {
    // Сбрасываем ограничения для принудительного показа
    localStorage.removeItem('pwa-notification-last-shown')
    localStorage.removeItem('pwa-notification-today')
    
    // Перезагружаем страницу для перезапуска логики
    window.location.reload()
  }

  return {
    resetNotifications,
    getNotificationStats,
    forceShowNotification
  }
} 