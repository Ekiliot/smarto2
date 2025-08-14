'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import IOSNotification, { NotificationData } from './IOSNotification'

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void
  showSuccess: (title: string, message?: string, icon?: NotificationData['icon']) => void
  showError: (title: string, message?: string) => void
  showInfo: (title: string, message?: string, icon?: NotificationData['icon']) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: NotificationData = {
      ...notification,
      id,
      duration: notification.duration || 4000
    }

    setNotifications(prev => [...prev, newNotification])

    // Автоматическое удаление
    setTimeout(() => {
      removeNotification(id)
    }, newNotification.duration)
  }

  const showSuccess = (title: string, message?: string, icon?: NotificationData['icon']) => {
    showNotification({
      type: 'success',
      title,
      message,
      icon: icon || 'check'
    })
  }

  const showError = (title: string, message?: string) => {
    showNotification({
      type: 'error',
      title,
      message,
      icon: 'error'
    })
  }

  const showInfo = (title: string, message?: string, icon?: NotificationData['icon']) => {
    showNotification({
      type: 'info',
      title,
      message,
      icon: icon || 'check'
    })
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const value: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showInfo,
    removeNotification,
    clearAll
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <IOSNotification 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
} 