'use client'

import { useState } from 'react'
import { ChatInterface } from './ChatInterface'
import { QuickActions } from './QuickActions'
import { useChat } from '@/lib/hooks/useChat'

interface IntegratedChatInterfaceProps {
  isMobile?: boolean
  className?: string
}

export function IntegratedChatInterface({ isMobile = false, className = '' }: IntegratedChatInterfaceProps) {
  const { sendTextMessage } = useChat()
  const [error, setError] = useState<string | null>(null)

  const handleQuickMessage = async (message: string) => {
    try {
      await sendTextMessage(message)
      setError(null)
    } catch (error) {
      console.error('Ошибка при отправке быстрого сообщения:', error)
      setError('Ошибка при отправке быстрого сообщения')
    }
  }

  return (
    <div className={`flex flex-col ${isMobile ? 'min-h-screen' : 'h-full'} ${className}`}>
      {/* Ошибка */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Быстрые действия - только для десктопа */}
      {!isMobile && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <QuickActions onSendMessage={handleQuickMessage} isMobile={isMobile} />
        </div>
      )}

      {/* Интерфейс чата */}
      <div className={isMobile ? 'flex-1' : 'flex-1'}>
        <ChatInterface isMobile={isMobile} />
      </div>
    </div>
  )
} 