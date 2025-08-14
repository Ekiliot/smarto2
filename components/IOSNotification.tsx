'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { CheckCircle, ShoppingCart, Heart, Package, User, AlertCircle, X } from 'lucide-react'

export interface NotificationData {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  icon?: 'cart' | 'heart' | 'order' | 'auth' | 'check' | 'error'
  duration?: number
}

interface IOSNotificationProps {
  notifications: NotificationData[]
  onRemove: (id: string) => void
}

const getIcon = (iconType?: string) => {
  switch (iconType) {
    case 'cart':
      return <ShoppingCart className="w-5 h-5" />
    case 'heart':
      return <Heart className="w-5 h-5" />
    case 'order':
      return <Package className="w-5 h-5" />
    case 'auth':
      return <User className="w-5 h-5" />
    case 'error':
      return <AlertCircle className="w-5 h-5" />
    case 'check':
    default:
      return <CheckCircle className="w-5 h-5" />
  }
}

const getIconColors = (type: string) => {
  switch (type) {
    case 'error':
      return 'text-red-500'
    case 'info':
      return 'text-blue-500'
    case 'success':
    default:
      return 'text-green-500'
  }
}

export default function IOSNotification({ notifications, onRemove }: IOSNotificationProps) {
  const handleDragEnd = (event: any, info: PanInfo, notificationId: string) => {
    // Свайп вверх или сильный свайп в сторону - удаляем уведомление
    if (info.offset.y < -50 || Math.abs(info.offset.x) > 100) {
      onRemove(notificationId)
    }
  }

  return (
    <div className="fixed top-12 left-0 right-0 z-[9999] pointer-events-none px-4">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ 
              opacity: 0, 
              y: -100,
              scale: 0.8,
              rotateX: -90
            }}
            animate={{ 
              opacity: 1, 
              y: index * 55,
              scale: 1,
              rotateX: 0
            }}
            exit={{ 
              opacity: 0, 
              y: -100,
              scale: 0.8,
              rotateX: -90
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.6
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => handleDragEnd(event, info, notification.id)}
            className="mb-1 pointer-events-auto"
          >
            <div className="
              bg-white/90 dark:bg-gray-900/90
              backdrop-blur-2xl
              border border-gray-200/20 dark:border-gray-700/20
              rounded-2xl shadow-2xl
              mx-auto max-w-sm
              overflow-hidden
            ">
              {/* Индикатор свайпа */}
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-1.5 opacity-60"></div>
              
              <div className="px-4 py-2.5 flex items-center gap-4">
                {/* Иконка */}
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center
                  bg-gray-100/80 dark:bg-gray-800/80
                  ${getIconColors(notification.type)}
                `}>
                  {getIcon(notification.icon)}
                </div>
                
                {/* Контент */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                    {notification.title}
                  </p>
                  {notification.message && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 leading-tight">
                      {notification.message}
                    </p>
                  )}
                </div>
                
                {/* Кнопка закрытия */}
                <button
                  onClick={() => onRemove(notification.id)}
                  className="w-7 h-7 rounded-full bg-gray-200/60 dark:bg-gray-700/60 hover:bg-gray-300/80 dark:hover:bg-gray-600/80 transition-colors flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
} 