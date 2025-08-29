import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { getUserOrders, type Order, type OrderItem } from '@/lib/supabase'

// Интерфейс для быстрых действий
export interface QuickOrder {
  id: string
  number: string
  date: string
  total: number
  status: string
  items: QuickOrderItem[]
}

export interface QuickOrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

export function useOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<QuickOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setOrders([])
      setLoading(false)
      return
    }

    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Получаем заказы пользователя через правильную функцию
      const { data: ordersData, error: ordersError } = await getUserOrders(user!.id)

      if (ordersError) {
        throw ordersError
      }

      // Преобразуем данные в нужный формат для быстрых действий
      const formattedOrders: QuickOrder[] = (ordersData || []).map((order: Order) => ({
        id: order.id,
        number: order.order_number,
        date: new Date(order.created_at).toLocaleDateString('ru-RU'),
        total: order.total_amount,
        status: getStatusText(order.status),
        items: (order.order_items || []).map((item: OrderItem) => ({
          id: item.id,
          name: item.product?.name || 'Товар',
          quantity: item.quantity,
          price: item.unit_price
        }))
      }))

      setOrders(formattedOrders)
    } catch (err) {
      console.error('Ошибка при получении заказов:', err)
      setError('Не удалось загрузить заказы')
      
      // Fallback на mock данные если API недоступен
      setOrders(getMockOrders())
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Ожидает подтверждения',
      'confirmed': 'Подтвержден',
      'processing': 'В обработке',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен',
      'refunded': 'Возвращен'
    }
    return statusMap[status] || status
  }

  const getMockOrders = (): QuickOrder[] => [
    {
      id: '1',
      number: 'ORD-2024-001',
      date: '15.01.2024',
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
      date: '20.01.2024',
      total: 1800,
      status: 'В обработке',
      items: [
        { id: '3', name: 'Умный термостат Nest', quantity: 1, price: 1800 }
      ]
    }
  ]

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders
  }
} 