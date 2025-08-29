'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  HelpCircle, 
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react'
import { useQuickActions } from '@/lib/hooks/useQuickActions'
import { type QuickOrder, type QuickOrderItem } from '@/lib/hooks/useOrders'

// Алиасы для совместимости
type Order = QuickOrder
type OrderItem = QuickOrderItem

interface QuickActionsProps {
  onSendMessage: (message: string) => void
  className?: string
  isMobile?: boolean
}

export function QuickActions({ onSendMessage, className = '', isMobile = false }: QuickActionsProps) {
  const {
    isExpanded,
    setIsExpanded,
    selectedOrder,
    selectedItem,
    selectedProblem,
    step,
    orders,
    loading,
    error,
    problemTypes,
    handleOrderSelect,
    handleItemSelect,
    handleProblemSelect,
    generateMessage,
    resetSelection,
    closeQuickActions,
    goBack
  } = useQuickActions()

  const handleSendQuickMessage = async () => {
    const message = generateMessage()
    if (message && onSendMessage) {
      try {
        await onSendMessage(message)
        closeQuickActions()
      } catch (error) {
        console.error('Ошибка при отправке быстрого сообщения:', error)
      }
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Заголовок */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full ${isMobile ? 'p-3' : 'p-4'} flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-xl`}
      >
        <div className="flex items-center space-x-3">
          <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center`}>
            <MessageSquare className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600 dark:text-blue-400`} />
          </div>
          <div>
            <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-white`}>
              {isMobile ? 'Быстрые ответы' : 'Быстрые действия'}
            </h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
              {isMobile ? 'Выберите проблему' : 'Выберите заказ и опишите проблему'}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
        ) : (
          <ChevronDown className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
        )}
      </button>

      {/* Содержимое */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ 
              height: 0, 
              opacity: 0, 
              y: isMobile ? 10 : 0,
              scale: isMobile ? 0.95 : 1
            }}
            animate={{ 
              height: 'auto', 
              opacity: 1, 
              y: 0,
              scale: 1
            }}
            exit={{ 
              height: 0, 
              opacity: 0, 
              y: isMobile ? 10 : 0,
              scale: isMobile ? 0.95 : 1
            }}
            transition={{ 
              duration: 0.3,
              ease: isMobile ? "easeOut" : "easeInOut"
            }}
            className={`overflow-hidden ${isMobile ? 'origin-bottom' : ''}`}
            style={isMobile ? { transformOrigin: 'bottom' } : {}}
          >
            <div className={`${isMobile ? 'p-3' : 'p-4'} border-t border-gray-200 dark:border-gray-700`}>
              {/* Шаг 1: Выбор заказа */}
              {step === 'order' && (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                    {isMobile ? 'Заказ:' : 'Выберите заказ:'}
                  </h4>
                                    <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'}`}>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Загрузка заказов...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                          onClick={() => window.location.reload()}
                          className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Попробовать снова
                        </button>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">У вас пока нет заказов</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <button
                          key={order.id}
                          onClick={() => handleOrderSelect(order)}
                          className={`w-full ${isMobile ? 'p-2' : 'p-3'} text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                                {order.number}
                              </div>
                              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                                {order.date} • {order.total} MDL
                              </div>
                              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-500`}>
                                {isMobile ? order.status : `Статус: ${order.status}`}
                              </div>
                            </div>
                            <Package className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Шаг 2: Выбор товара */}
              {step === 'item' && selectedOrder && (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                      {isMobile ? `Товар из ${selectedOrder.number}:` : `Выберите товар из заказа ${selectedOrder.number}:`}
                    </h4>
                    <button
                      onClick={resetSelection}
                      className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 dark:text-blue-400 hover:underline`}
                    >
                      {isMobile ? 'Изменить' : 'Изменить заказ'}
                    </button>
                  </div>
                  <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'}`}>
                    {selectedOrder.items.map((item) => (
                                              <button
                          key={item.id}
                          onClick={() => handleItemSelect(item)}
                          className={`w-full ${isMobile ? 'p-2' : 'p-3'} text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                                {item.name}
                              </div>
                              <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                                {isMobile ? `${item.quantity} шт • ${item.price} MDL` : `Количество: ${item.quantity} • Цена: ${item.price} MDL`}
                              </div>
                            </div>
                            <ShoppingCart className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
                          </div>
                        </button>
                    ))}
                    <button
                      onClick={() => handleItemSelect(null)}
                      className={`w-full ${isMobile ? 'p-2' : 'p-3'} text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                            Весь заказ
                          </div>
                          <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                            {isMobile ? 'Вопрос по заказу' : 'Вопрос по заказу в целом'}
                          </div>
                        </div>
                        <Package className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Шаг 3: Выбор типа проблемы */}
              {step === 'problem' && (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                      {isMobile ? 'Тип проблемы:' : 'Выберите тип проблемы:'}
                    </h4>
                    <button
                      onClick={goBack}
                      className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 dark:text-blue-400 hover:underline`}
                    >
                      Назад
                    </button>
                  </div>
                  <div className={`${isMobile ? 'space-y-1.5' : 'space-y-2'}`}>
                    {problemTypes.map((problem) => (
                      <button
                        key={problem.id}
                        onClick={() => handleProblemSelect(problem)}
                        className={`w-full ${isMobile ? 'p-2' : 'p-3'} text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                              {problem.title}
                            </div>
                            <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
                              {problem.description}
                            </div>
                          </div>
                          <AlertTriangle className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 4: Предварительный просмотр */}
              {step === 'preview' && selectedOrder && selectedProblem && (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-3'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-gray-900 dark:text-white`}>
                      {isMobile ? 'Просмотр:' : 'Предварительный просмотр:'}
                    </h4>
                    <button
                      onClick={goBack}
                      className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 dark:text-blue-400 hover:underline`}
                    >
                      Назад
                    </button>
                  </div>
                  
                  <div className={`${isMobile ? 'p-2' : 'p-3'} bg-gray-50 dark:bg-gray-700 rounded-lg`}>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 mb-2`}>
                      <strong>{isMobile ? 'Заказ:' : 'Заказ:'}</strong> {selectedOrder.number}
                    </div>
                    {selectedItem && (
                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 mb-2`}>
                        <strong>{isMobile ? 'Товар:' : 'Товар:'}</strong> {selectedItem.name}
                      </div>
                    )}
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 mb-3`}>
                      <strong>{isMobile ? 'Проблема:' : 'Проблема:'}</strong> {selectedProblem.title}
                    </div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-800 dark:text-gray-200 ${isMobile ? 'p-1.5' : 'p-2'} bg-white dark:bg-gray-600 rounded border`}>
                      {selectedProblem.template
                        .replace('{orderNumber}', selectedOrder.number)
                        .replace('{itemName}', selectedItem?.name || 'товар')
                        .replace('{problemDescription}', 'Пожалуйста, помогите решить эту проблему.')}
                    </div>
                  </div>

                  <button
                    onClick={handleSendQuickMessage}
                    className={`w-full ${isMobile ? 'py-2.5 px-3' : 'py-3 px-4'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${isMobile ? 'text-sm' : 'text-base'}`}
                  >
                    {isMobile ? 'Отправить' : 'Отправить сообщение'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 