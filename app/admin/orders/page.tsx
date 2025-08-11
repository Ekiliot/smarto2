'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Loader2,
  Calendar,
  User,
  MapPin,
  CreditCard,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RotateCcw
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { getAllOrders, updateOrderStatus, Order } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

const statusConfig = {
  pending: { label: 'Ожидает подтверждения', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
  confirmed: { label: 'Подтвержден', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
  processing: { label: 'В обработке', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Package },
  shipped: { label: 'Отправлен', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200', icon: Truck },
  delivered: { label: 'Доставлен', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
  cancelled: { label: 'Отменен', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
  refunded: { label: 'Возврат', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: RotateCcw }
}

const paymentStatusConfig = {
  pending: { label: 'Ожидает оплаты', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  paid: { label: 'Оплачен', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  failed: { label: 'Ошибка оплаты', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  refunded: { label: 'Возврат', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await getAllOrders()
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(orderId)
    try {
      const { error } = await updateOrderStatus(orderId, newStatus)
      if (error) throw error
      
      // Обновляем локальное состояние
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ))
    } catch (error) {
      console.error('Error updating order status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contact_info.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contact_info.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contact_info.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTotalItems = (order: Order) => {
    return order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Заказы
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Управление заказами магазина
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Всего заказов</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : orders.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск по номеру заказа, имени или email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">Ожидает подтверждения</option>
                  <option value="confirmed">Подтвержден</option>
                  <option value="processing">В обработке</option>
                  <option value="shipped">Отправлен</option>
                  <option value="delivered">Доставлен</option>
                  <option value="cancelled">Отменен</option>
                  <option value="refunded">Возврат</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Orders List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Заказы не найдены
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Попробуйте изменить фильтры поиска'
                    : 'В системе пока нет заказов'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Заказ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Клиент
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Сумма
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Дата
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    <AnimatePresence>
                      {filteredOrders.map((order, index) => {
                        const StatusIcon = statusConfig[order.status].icon
                        return (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-primary-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {order.order_number}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {getTotalItems(order)} товаров
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {order.contact_info.first_name} {order.contact_info.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {order.contact_info.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[order.status].label}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[order.payment_status].color}`}>
                                  {paymentStatusConfig[order.payment_status].label}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatPrice(order.total_amount)}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {order.payment_method === 'cash' ? 'Наличные' : 'Карта'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setShowOrderModal(true)
                                  }}
                                  className="p-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                                  title="Просмотреть детали"
                                >
                                  <Eye className="h-4 w-4" />
                                </motion.button>
                                
                                <select
                                  value={order.status}
                                  onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                                  disabled={actionLoading === order.id}
                                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                                >
                                  <option value="pending">Ожидает</option>
                                  <option value="confirmed">Подтвержден</option>
                                  <option value="processing">В обработке</option>
                                  <option value="shipped">Отправлен</option>
                                  <option value="delivered">Доставлен</option>
                                  <option value="cancelled">Отменен</option>
                                  <option value="refunded">Возврат</option>
                                </select>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>

        {/* Order Details Modal */}
        <AnimatePresence>
          {showOrderModal && selectedOrder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowOrderModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Заказ {selectedOrder.order_number}
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Информация о заказе
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Статус:</span>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status].color}`}>
                            {statusConfig[selectedOrder.status].label}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Сумма:</span>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatPrice(selectedOrder.total_amount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Способ оплаты:</span>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.payment_method === 'cash' ? 'Наличными при получении' : 'Банковской картой'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Дата заказа:</span>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(selectedOrder.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Информация о клиенте
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Имя:</span>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.contact_info.first_name} {selectedOrder.contact_info.last_name}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Email:</span>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.contact_info.email}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Телефон:</span>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.contact_info.phone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Адрес доставки
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {selectedOrder.shipping_address.street}<br />
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.postal_code}<br />
                      {selectedOrder.shipping_address.country}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Товары в заказе
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="w-16 h-16 bg-white dark:bg-gray-600 rounded-lg flex items-center justify-center">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {item.product?.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Количество: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {formatPrice(item.total_price)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatPrice(item.unit_price)} за шт.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Комментарии к заказу
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AdminGuard>
  )
} 