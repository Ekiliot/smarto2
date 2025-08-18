import { useState } from 'react'

export interface Order {
  id: string
  number: string
  date: string
  total: number
  status: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

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

  // Моковые данные для демонстрации
  const mockOrders: Order[] = [
    {
      id: '1',
      number: 'ORD-2024-001',
      date: '2024-01-15',
      total: 2500,
      status: 'Доставлен',
      items: [
        { id: '1', name: 'Умная лампочка Philips Hue', quantity: 2, price: 800 },
        { id: '2', name: 'Умная розетка TP-Link', quantity: 1, price: 900 }
      ]
    },
    {
      id: '2',
      number: 'ORD-2024-002',
      date: '2024-01-20',
      total: 1800,
      status: 'В обработке',
      items: [
        { id: '3', name: 'Умный термостат Nest', quantity: 1, price: 1800 }
      ]
    }
  ]

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
    mockOrders,
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