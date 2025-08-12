'use client'

import { useEffect } from 'react'
import { useServiceWorker } from '@/lib/useServiceWorker'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const { isSupported, isInstalled, isActive } = useServiceWorker()

  useEffect(() => {
    if (isSupported && isInstalled && isActive) {
      console.log('Service Worker активен и готов к работе')
    }
  }, [isSupported, isInstalled, isActive])

  // Этот компонент не рендерит ничего видимого
  return <>{children}</>
} 