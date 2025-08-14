'use client'

import { usePWANotifications } from './PWAPeriodicNotifications'
import { usePWAInstall } from './PWAInstallProvider'

export function PWATestButton() {
  const { forceShowNotification, getNotificationStats, resetNotifications } = usePWANotifications()
  const { canInstall, isInstalled } = usePWAInstall()

  const stats = getNotificationStats()

  if (process.env.NODE_ENV !== 'development') {
    return null // Показываем только в development режиме
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">PWA Debug</h3>
      
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
        <p>Can Install: {canInstall ? '✅' : '❌'}</p>
        <p>Is Installed: {isInstalled ? '✅' : '❌'}</p>
        <p>Show Count: {stats.showCount}/5</p>
        <p>Shown Today: {stats.shownToday ? '✅' : '❌'}</p>
        {stats.lastShown && (
          <p>Last: {stats.lastShown.toLocaleDateString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={forceShowNotification}
          className="w-full text-xs bg-blue-600 text-white px-3 py-1 rounded"
        >
          Force Notification
        </button>
        
        <button
          onClick={resetNotifications}
          className="w-full text-xs bg-red-600 text-white px-3 py-1 rounded"
        >
          Reset Stats
        </button>
      </div>
    </div>
  )
} 