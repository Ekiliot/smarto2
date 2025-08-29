import { useState } from 'react'
import { useOrders, type QuickOrder, type QuickOrderItem } from './useOrders'

// Алиасы для совместимости
type Order = QuickOrder
type OrderItem = QuickOrderItem

export interface ProblemType {
  id: string
  title: string
  description: string
  template: string
}

export function useQuickActions() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null)
  const [selectedProblem, setSelectedProblem] = useState<ProblemType | null>(null)
  const [step, setStep] = useState<'order' | 'item' | 'problem' | 'preview'>('order')

  // Получаем реальные данные о заказах
  const { orders, loading, error } = useOrders()

  const problemTypes: ProblemType[] = [
    {
      id: '1',
      title: 'Проблема с доставкой',
      description: 'Заказ не доставлен или доставлен с задержкой',
      template: 'У меня проблема с доставкой заказа {orderNumber}. {problemDescription}'
    },
    {
      id: '2',
      title: 'Проблема с товаром',
      description: 'Товар не работает или имеет дефекты',
      template: 'У меня проблема с товаром "{itemName}" из заказа {orderNumber}. {problemDescription}'
    },
    {
      id: '3',
      title: 'Проблема с оплатой',
      description: 'Ошибка при оплате или двойное списание',
      template: 'У меня проблема с оплатой заказа {orderNumber}. {problemDescription}'
    },
    {
      id: '4',
      title: 'Возврат товара',
      description: 'Хочу вернуть товар или обменять',
      template: 'Хочу вернуть товар "{itemName}" из заказа {orderNumber}. Причина: {problemDescription}'
    },
    {
      id: '5',
      title: 'Другой вопрос',
      description: 'Другой вопрос по заказу',
      template: 'У меня вопрос по заказу {orderNumber}: {problemDescription}'
    }
  ]

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order)
    setSelectedItem(null)
    setSelectedProblem(null)
    setStep('item')
  }

  const handleItemSelect = (item: OrderItem | null) => {
    setSelectedItem(item)
    setStep('problem')
  }

  const handleProblemSelect = (problem: ProblemType) => {
    setSelectedProblem(problem)
    setStep('preview')
  }

  const generateMessage = () => {
    if (!selectedOrder || !selectedProblem) return ''

    return selectedProblem.template
      .replace('{orderNumber}', selectedOrder.number)
      .replace('{itemName}', selectedItem?.name || 'товар')
      .replace('{problemDescription}', 'Пожалуйста, помогите решить эту проблему.')
  }

  const resetSelection = () => {
    setSelectedOrder(null)
    setSelectedItem(null)
    setSelectedProblem(null)
    setStep('order')
  }

  const closeQuickActions = () => {
    setIsExpanded(false)
    resetSelection()
  }

  const goBack = () => {
    if (step === 'problem') {
      setStep('item')
    } else if (step === 'item') {
      setStep('order')
    }
  }

  return {
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
  }
} 