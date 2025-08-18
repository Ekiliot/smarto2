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

interface QuickActionsProps {
  onSendMessage: (message: string) => void
  className?: string
}

export function QuickActions({ onSendMessage, className = '' }: QuickActionsProps) {
  const {
    isExpanded,
    setIsExpanded,
    selectedOrder,
    selectedItem,
    selectedProblem,
    step,
    mockOrders,
    problemTypes,
    handleOrderSelect,
    handleItemSelect,
    handleProblemSelect,
    generateMessage,
    resetSelection,
    closeQuickActions,
    goBack
  } = useQuickActions()

  const handleSendQuickMessage = () => {
    const message = generateMessage()
    if (message) {
      onSendMessage(message)
      closeQuickActions()
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Заголовок */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Быстрые действия
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Выберите заказ и опишите проблему
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Содержимое */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {/* Шаг 1: Выбор заказа */}
              {step === 'order' && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Выберите заказ:
                  </h4>
                  <div className="space-y-2">
                    {mockOrders.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => handleOrderSelect(order)}
                        className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {order.number}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {order.date} • {order.total} MDL
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              Статус: {order.status}
                            </div>
                          </div>
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 2: Выбор товара */}
              {step === 'item' && selectedOrder && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Выберите товар из заказа {selectedOrder.number}:
                    </h4>
                    <button
                      onClick={resetSelection}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Изменить заказ
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Количество: {item.quantity} • Цена: {item.price} MDL
                            </div>
                          </div>
                          <ShoppingCart className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                                         <button
                       onClick={() => handleItemSelect(null)}
                       className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                     >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            Весь заказ
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Вопрос по заказу в целом
                          </div>
                        </div>
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Шаг 3: Выбор типа проблемы */}
              {step === 'problem' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Выберите тип проблемы:
                    </h4>
                                         <button
                       onClick={goBack}
                       className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                     >
                       Назад
                     </button>
                  </div>
                  <div className="space-y-2">
                    {problemTypes.map((problem) => (
                      <button
                        key={problem.id}
                        onClick={() => handleProblemSelect(problem)}
                        className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {problem.title}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {problem.description}
                            </div>
                          </div>
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Шаг 4: Предварительный просмотр */}
              {step === 'preview' && selectedOrder && selectedProblem && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Предварительный просмотр:
                    </h4>
                                         <button
                       onClick={goBack}
                       className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                     >
                       Назад
                     </button>
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Заказ:</strong> {selectedOrder.number}
                    </div>
                    {selectedItem && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Товар:</strong> {selectedItem.name}
                      </div>
                    )}
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <strong>Проблема:</strong> {selectedProblem.title}
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200 p-2 bg-white dark:bg-gray-600 rounded border">
                      {selectedProblem.template
                        .replace('{orderNumber}', selectedOrder.number)
                        .replace('{itemName}', selectedItem?.name || 'товар')
                        .replace('{problemDescription}', 'Пожалуйста, помогите решить эту проблему.')}
                    </div>
                  </div>

                  <button
                    onClick={handleSendQuickMessage}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Отправить сообщение
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