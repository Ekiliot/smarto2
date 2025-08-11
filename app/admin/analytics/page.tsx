'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Users,
  Calendar,
  Filter
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  averageOrder: number
  activeUsers: number
  dailySales: Array<{
    date: string
    amount: number
  }>
}

interface OrderWithItems {
  id: string
  total_amount: number
  created_at: string
  order_items?: Array<{
    quantity: number
    unit_price: number
    product?: {
      purchase_price: number
    }
  }>
}

type Period = 'day' | 'week' | 'month' | 'year'
type ChartPeriod = 'week' | 'month' | '3months'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    activeUsers: 0,
    dailySales: []
  })
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month')
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('month')
  const [periodRevenue, setPeriodRevenue] = useState(0)
  const [periodRevenueChart, setPeriodRevenueChart] = useState<Array<{date: string, amount: number}>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod, chartPeriod])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      // Загружаем общие метрики
      const [ordersData, usersData, dailySalesData] = await Promise.all([
        loadOrdersData(),
        loadUsersData(),
        loadDailySales()
      ])

      // Рассчитываем метрики с учетом реальной прибыли
      let totalRevenue = 0
      let totalProfit = 0
      
      ordersData.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const salePrice = item.unit_price * item.quantity
          const purchasePrice = (item.product?.purchase_price || 0) * item.quantity
          totalRevenue += salePrice
          totalProfit += (salePrice - purchasePrice)
        })
      })

      const totalOrders = ordersData.length
      const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setData({
        totalRevenue: totalProfit, // Показываем прибыль как "выручку"
        totalOrders,
        averageOrder,
        activeUsers: usersData.length,
        dailySales: dailySalesData
      })

      // Загружаем выручку за выбранный период
      const periodRevenueData = await loadPeriodRevenue(selectedPeriod)
      setPeriodRevenue(periodRevenueData)

      // Загружаем данные графика выручки за период
      const periodChartData = await loadPeriodRevenueChart(selectedPeriod)
      setPeriodRevenueChart(periodChartData)

    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrdersData = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount, 
        created_at,
        order_items (
          quantity,
          unit_price,
          product:products (
            purchase_price
          )
        )
      `)
      .eq('payment_status', 'paid')
      .neq('status', 'refunded') // Исключаем возвращенные заказы

    if (error) throw error
    return data || []
  }

  const loadUsersData = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, created_at')

    if (error) throw error
    return data || []
  }

  const loadDailySales = async () => {
    let daysBack = 30
    
    switch (chartPeriod) {
      case 'week':
        daysBack = 7
        break
      case 'month':
        daysBack = 30
        break
      case '3months':
        daysBack = 90
        break
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        created_at,
        order_items (
          quantity,
          unit_price,
          product:products (
            purchase_price
          )
        )
      `)
      .eq('payment_status', 'paid')
      .neq('status', 'refunded') // Исключаем возвращенные заказы
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Группируем по дням и считаем прибыль
    const dailyData: { [key: string]: number } = {}
    
    data?.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      let orderProfit = 0
      
      order.order_items?.forEach((item: any) => {
        const salePrice = item.unit_price * item.quantity
        const purchasePrice = (item.product?.purchase_price || 0) * item.quantity
        orderProfit += (salePrice - purchasePrice)
      })
      
      dailyData[date] = (dailyData[date] || 0) + orderProfit
    })

    // Создаем массив за выбранный период
    const result = []
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      result.push({
        date: dateStr,
        amount: dailyData[dateStr] || 0
      })
    }

    return result
  }

  const loadPeriodRevenue = async (period: Period) => {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_items (
          quantity,
          unit_price,
          product:products (
            purchase_price
          )
        )
      `)
      .eq('payment_status', 'paid')
      .neq('status', 'refunded') // Исключаем возвращенные заказы
      .gte('created_at', startDate.toISOString())

    if (error) throw error

    // Рассчитываем прибыль
    let totalProfit = 0
    data?.forEach((order: any) => {
      order.order_items?.forEach((item: any) => {
        const salePrice = item.unit_price * item.quantity
        const purchasePrice = (item.product?.purchase_price || 0) * item.quantity
        totalProfit += (salePrice - purchasePrice)
      })
    })

    return totalProfit
  }

  const loadPeriodRevenueChart = async (period: Period) => {
    const now = new Date()
    let startDate = new Date()
    let daysCount = 7

    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        daysCount = 1
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        daysCount = 7
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        daysCount = 30
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        daysCount = 365
        break
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        created_at,
        order_items (
          quantity,
          unit_price,
          product:products (
            purchase_price
          )
        )
      `)
      .eq('payment_status', 'paid')
      .neq('status', 'refunded') // Исключаем возвращенные заказы
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    // Группируем по дням и считаем прибыль
    const dailyData: { [key: string]: number } = {}
    
    data?.forEach((order: any) => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      let orderProfit = 0
      
      order.order_items?.forEach((item: any) => {
        const salePrice = item.unit_price * item.quantity
        const purchasePrice = (item.product?.purchase_price || 0) * item.quantity
        orderProfit += (salePrice - purchasePrice)
      })
      
      dailyData[date] = (dailyData[date] || 0) + orderProfit
    })

    // Создаем массив за выбранный период
    const result = []
    // Для больших периодов группируем данные для лучшей читаемости графика
    let stepDays = 1
    let displayDays = daysCount
    
    if (period === 'month') {
      stepDays = 1  // Показываем каждый день для месяца
      displayDays = 30
    } else if (period === 'year') {
      stepDays = 7  // Показываем каждую неделю для года
      displayDays = Math.ceil(365 / 7)
    }
    
    for (let i = displayDays - 1; i >= 0; i -= stepDays) {
      const date = new Date()
      if (period === 'year') {
        date.setDate(date.getDate() - (i * 7))
      } else {
        date.setDate(date.getDate() - i)
      }
      const dateStr = date.toISOString().split('T')[0]
      
      let amount = 0
      if (period === 'year') {
        // Для года суммируем неделю
        for (let j = 0; j < 7; j++) {
          const weekDate = new Date(date)
          weekDate.setDate(weekDate.getDate() + j)
          const weekDateStr = weekDate.toISOString().split('T')[0]
          amount += dailyData[weekDateStr] || 0
        }
      } else {
        amount = dailyData[dateStr] || 0
      }
      
      result.push({
        date: dateStr,
        amount: amount
      })
    }

    return result.reverse()
  }

  const getChartPeriodLabel = (period: ChartPeriod) => {
    switch (period) {
      case 'week': return 'Неделя'
      case 'month': return 'Месяц' 
      case '3months': return '3 месяца'
    }
  }

  const getPeriodLabel = (period: Period) => {
    switch (period) {
      case 'day': return 'Сегодня'
      case 'week': return 'За неделю'
      case 'month': return 'За месяц'
      case 'year': return 'За год'
    }
  }

  const maxSale = Math.max(...data.dailySales.map(d => d.amount), 0)
  const maxPeriodRevenue = Math.max(...periodRevenueChart.map(d => d.amount), 0)

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Аналитика продаж
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Обзор ключевых показателей эффективности магазина
            </p>
          </motion.div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Чистая прибыль
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(data.totalRevenue)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    продажи - закупка
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Количество заказов
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.totalOrders}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Средний чек
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(data.averageOrder)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Активные пользователи
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.activeUsers}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Period Filter and Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Чистая прибыль за период
              </h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as Period)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="day">День</option>
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="year">Год</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-full">
                <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {getPeriodLabel(selectedPeriod)}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(periodRevenue)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  цена продажи - закупочная цена
                </p>
              </div>
            </div>

            <div className="h-32 flex items-end justify-between space-x-1">
              {periodRevenueChart.map((revenue, index) => {
                const height = maxPeriodRevenue > 0 ? (revenue.amount / maxPeriodRevenue) * 100 : 0
                return (
                  <motion.div
                    key={revenue.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-green-500 to-green-300 rounded-t-sm min-h-[4px] relative group"
                    title={`${selectedPeriod === 'year' 
                      ? `Неделя ${new Date(revenue.date).toLocaleDateString('ru-RU')}` 
                      : new Date(revenue.date).toLocaleDateString('ru-RU')
                    }: ${formatPrice(revenue.amount)}`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {selectedPeriod === 'year' 
                        ? `Неделя ${new Date(revenue.date).toLocaleDateString('ru-RU')}`
                        : new Date(revenue.date).toLocaleDateString('ru-RU')
                      }
                      <br />
                      {formatPrice(revenue.amount)}
                      <br />
                      <span className="text-gray-300">
                        {selectedPeriod === 'year' ? 'за неделю' : 'чистая прибыль'}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Sales Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Продажи по дням
              </h2>
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={chartPeriod}
                  onChange={(e) => setChartPeriod(e.target.value as ChartPeriod)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="week">Неделя</option>
                  <option value="month">Месяц</option>
                  <option value="3months">3 месяца</option>
                </select>
              </div>
            </div>
            
            <div className="h-64 flex items-end justify-between space-x-1">
              {data.dailySales.map((sale, index) => {
                const height = maxSale > 0 ? (sale.amount / maxSale) * 100 : 0
                return (
                  <motion.div
                    key={sale.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: index * 0.02, duration: 0.5 }}
                    className="flex-1 bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-sm min-h-[4px] relative group"
                    title={`${new Date(sale.date).toLocaleDateString('ru-RU')}: ${formatPrice(sale.amount)}`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {new Date(sale.date).toLocaleDateString('ru-RU')}
                      <br />
                      {formatPrice(sale.amount)}
                    </div>
                  </motion.div>
                )
              })}
            </div>
            
            <div className="flex justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{getChartPeriodLabel(chartPeriod)} назад</span>
              <span>Сегодня</span>
            </div>
          </motion.div>
        </main>
      </div>
    </AdminGuard>
  )
}