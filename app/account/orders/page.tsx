'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Eye, 
  Loader2,
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  User,
  ShoppingCart,
  RotateCcw
} from 'lucide-react'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'
import { getUserOrders, Order } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useNavbarVisibility } from '@/components/NavbarVisibilityProvider'

const statusConfig = {
  pending: {
    label: 'Ожидает подтверждения',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: Clock
  },
  confirmed: {
    label: 'Подтвержден',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: CheckCircle
  },
  processing: {
    label: 'В обработке',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    icon: Package
  },
  shipped: {
    label: 'Отправлен',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    icon: Truck
  },
  delivered: {
    label: 'Доставлен',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Отменен',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: XCircle
  },
  refunded: {
    label: 'Возврат',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    icon: RotateCcw
  }
}

const paymentStatusConfig = {
  pending: {
    label: 'Ожидает оплаты',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
  },
  paid: {
    label: 'Оплачен',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
  },
  failed: {
    label: 'Ошибка оплаты',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  },
  refunded: {
    label: 'Возвращен',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }
}

export default function UserOrdersPage() {
  const { user } = useAuth()
  const { hideNavbar, showNavbar } = useNavbarVisibility()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  // Управление скроллом body при открытии/закрытии модального окна
  useEffect(() => {
    if (showOrderModal) {
      // Блокируем скролл body и скрываем навбар
      document.body.style.overflow = 'hidden'
      hideNavbar()
    } else {
      // Восстанавливаем скролл body и показываем навбар
      document.body.style.overflow = ''
      showNavbar()
    }
  }, [showOrderModal, hideNavbar, showNavbar])

  // Загружаем заказы пользователя
  useEffect(() => {
    const loadOrders = async () => {
      if (!user) return

      try {
        setLoading(true)
        const { data, error } = await getUserOrders(user.id)
        
        if (error) {
          console.error('Error loading orders:', error)
          setError('Ошибка загрузки заказов')
        } else {
          setOrders(data || [])
        }
      } catch (err) {
        console.error('Orders load error:', err)
        setError('Ошибка загрузки заказов')
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [user])

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

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Войдите в аккаунт
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              Для просмотра заказов необходимо войти в аккаунт
            </p>
            <Link
              href="/login"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Войти
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      <Header />
      
      {/* Мобильная версия заказов */}
      <div className="md:hidden">
        <main className="px-4 py-6 space-y-6">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <Link
                href="/account"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm">Назад</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Мои заказы
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              История всех ваших заказов
            </p>
          </motion.div>

          {/* Баннер с информацией */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">📦 Ваши заказы</h3>
                <p className="text-blue-100 text-sm">
                  {orders.length > 0 
                    ? `${orders.length} заказов в истории` 
                    : 'У вас пока нет заказов'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {orders.length > 0 ? orders.length : '0'}
                </div>
                <div className="text-blue-100 text-sm">Всего заказов</div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin mr-3" />
                <span className="text-gray-600 dark:text-gray-400">Загрузка заказов...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Ошибка загрузки
                </h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  У вас пока нет заказов
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Сделайте свой первый заказ, чтобы увидеть его здесь
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Перейти к товарам
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => {
                  const StatusIcon = statusConfig[order.status].icon
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
                    >
                      {/* Заголовок заказа */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Заказ {order.order_number}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {getTotalItems(order)} товаров
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOrderModal(true)
                          }}
                          className="p-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                          title="Просмотреть детали"
                        >
                          <Eye className="h-5 w-5" />
                        </motion.button>
                      </div>

                      {/* Информация о заказе */}
                      <div className="space-y-3">
                        {/* Дата */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {formatDate(order.created_at)}
                          </span>
                        </div>

                        {/* Статус */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <StatusIcon className="h-4 w-4 text-gray-400" />
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                            {statusConfig[order.status].label}
                          </span>
                        </div>

                        {/* Сумма и способ оплаты */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatPrice(order.total_amount)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {order.payment_method === 'cash' ? 'Наличные' : 'Карта'}
                            </div>
                          </div>
                        </div>

                        {/* Статус оплаты */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[order.payment_status].color}`}>
                            {paymentStatusConfig[order.payment_status].label}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

          {/* Кнопка "Назад в аккаунт" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Link
              href="/account"
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад в аккаунт</span>
            </Link>
          </motion.div>
        </main>
      </div>

      {/* Десктопная версия - оставляем как есть */}
      <div className="hidden md:block">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/account"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Назад в аккаунт</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Мои заказы
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              История всех ваших заказов
            </p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin mr-3" />
                <span className="text-gray-600 dark:text-gray-400">Загрузка заказов...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Ошибка загрузки
                </h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  У вас пока нет заказов
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Сделайте свой первый заказ, чтобы увидеть его здесь
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Перейти к товарам
                </Link>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Заказ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Дата
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Сумма
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Оплата
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      <AnimatePresence>
                        {orders.map((order) => {
                          const StatusIcon = statusConfig[order.status].icon
                          return (
                            <motion.tr
                              key={order.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
                                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-900 dark:text-white">
                                    {formatDate(order.created_at)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[order.status].label}
                                </span>
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
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[order.payment_status].color}`}>
                                  {paymentStatusConfig[order.payment_status].label}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {showOrderModal && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowOrderModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100) {
                  setShowOrderModal(false)
                }
              }}
              dragMomentum={false}
            >
              {/* Handle для свайпа */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Заголовок */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Заказ {selectedOrder.order_number}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Детали заказа
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Контент */}
              <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]" style={{ overscrollBehavior: 'contain' }}>
                <div className="space-y-6">
                  {/* Order Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Информация о заказе
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Номер заказа:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.order_number}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Дата создания:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatDate(selectedOrder.created_at)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Статус:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig[selectedOrder.status].color}`}>
                          {statusConfig[selectedOrder.status].label}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Оплата:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${paymentStatusConfig[selectedOrder.payment_status].color}`}>
                          {paymentStatusConfig[selectedOrder.payment_status].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Контактная информация
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Имя:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {selectedOrder.contact_info.first_name} {selectedOrder.contact_info.last_name}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.contact_info.email}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-400">Телефон:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{selectedOrder.contact_info.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Адрес доставки
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-2">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.shipping_address.street}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.postal_code}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedOrder.shipping_address.country}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Товары в заказе
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.product?.name || 'Товар'}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Количество: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(item.unit_price)}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatPrice(item.total_price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        Итого:
                      </span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatPrice(selectedOrder.total_amount)}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Примечания
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {selectedOrder.notes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 