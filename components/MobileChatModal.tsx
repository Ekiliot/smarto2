'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Image as ImageIcon, 
  Video, 
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Send
} from 'lucide-react'
import { QuickActions } from './QuickActions'

interface MobileChatModalProps {
  isOpen: boolean
  onClose: () => void
  onSendMessage: (message: string) => Promise<void>
  onFileSelect: (files: FileList | null) => void
}

export function MobileChatModal({ 
  isOpen, 
  onClose, 
  onSendMessage,
  onFileSelect 
}: MobileChatModalProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'quick'>('media')
  const [showExtendedPanel, setShowExtendedPanel] = useState(false)
  const [messageText, setMessageText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)



  const handleFileSelect = (files: FileList | null) => {
    onFileSelect(files)
    onClose()
  }

  const handleQuickMessage = async (message: string) => {
    await onSendMessage(message)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl max-h-96 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Стрелочка вверх/вниз по центру */}
          <div className="flex justify-center pt-2 pb-1">
            <button
              onClick={() => setShowExtendedPanel(!showExtendedPanel)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {showExtendedPanel ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Расширенная панель с медиа и быстрыми ответами */}
          <AnimatePresence>
            {showExtendedPanel && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-gray-200 dark:border-gray-700"
              >
                {/* Вкладки */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('media')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'media'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>Медиа</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('quick')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      activeTab === 'quick'
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Быстрые ответы</span>
                    </div>
                  </button>
                </div>

                {/* Содержимое вкладок */}
                <div className="max-h-48 overflow-y-auto">
                  {activeTab === 'media' ? (
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-3">
                        {/* Фото */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          <ImageIcon className="h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Фото</span>
                        </button>

                        {/* Видео */}
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          <Video className="h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Видео</span>
                        </button>
                      </div>

                      {/* Скрытый input для файлов */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="p-3">
                      <QuickActions onSendMessage={handleQuickMessage} isMobile={true} />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Поле ввода и кнопка отправки */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows={1}
                  style={{
                    minHeight: '40px',
                    maxHeight: '100px',
                    lineHeight: '1.4'
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 100) + 'px'
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (messageText.trim()) {
                    onSendMessage(messageText)
                    setMessageText('')
                    onClose()
                  }
                }}
                disabled={!messageText.trim()}
                className="flex-shrink-0 p-2 bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center rounded-full"
                title="Отправить"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
} 