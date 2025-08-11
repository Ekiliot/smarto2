'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  Folder, 
  BarChart3, 
  Users, 
  Settings,
  Plus,
  ArrowRight,
  Loader2,
  ShoppingBag,
  Gift,
  Grid,
  Coins
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { getAdminStats, getOrdersStats } from '@/lib/supabase'

interface AdminStats {
  products: number
  categories: number
  users: number
  orders: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats>({
    products: 0,
    categories: 0,
    users: 0,
    orders: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [basicStats, ordersStats] = await Promise.all([
          getAdminStats(),
          getOrdersStats()
        ])
        
        setStats({
          products: basicStats.products,
          categories: basicStats.categories,
          users: basicStats.users,
          orders: ordersStats.data?.total_orders || 0
        })
      } catch (error) {
        console.error('Error loading admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const adminMenuItems = [
    {
      title: 'Товары',
      description: 'Управление товарами магазина',
      icon: Package,
      href: '/admin/products',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      count: stats.products
    },
    {
      title: 'Категории',
      description: 'Управление категориями товаров',
      icon: Folder,
      href: '/admin/categories',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      count: stats.categories
    },
    {
      title: 'Статистика',
      description: 'Аналитика и отчеты',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      count: stats.orders
    },
    {
      title: 'Пользователи',
      description: 'Управление пользователями',
      icon: Users,
      href: '/admin/users',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      count: stats.users
    },
    {
      title: 'Заказы',
      description: 'Управление заказами',
      icon: ShoppingBag,
      href: '/admin/orders',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      count: stats.orders
    },
    {
      title: 'Бандлы',
      description: 'Управление бандлами',
      icon: Gift,
      href: '/admin/bundles',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      count: 0
    },
    {
      title: 'Лояльность',
      description: 'Система баллов и заданий',
      icon: Coins,
      href: '/admin/loyalty',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      count: 0
    },
    {
      title: 'Настройки',
      description: 'Настройки магазина',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      count: 0
    }
  ]

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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Админ панель
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление магазином Smarto
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Всего товаров</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.products}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Категории</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.categories}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Folder className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Пользователи</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Заказы</p>
                  {loading ? (
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.orders}</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Admin Menu */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {adminMenuItems.map((item, index) => (
              <motion.a
                key={item.title}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                    <item.icon className={`h-6 w-6 bg-gradient-to-r ${item.color} bg-clip-text text-transparent`} />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `${item.count} ${item.count === 1 ? 'элемент' : item.count < 5 ? 'элемента' : 'элементов'}`
                    )}
                  </span>
                  {item.title === 'Товары' && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = '/admin/products/new'
                      }}
                    >
                      <Plus className="h-4 w-4 text-primary-600" />
                    </motion.div>
                  )}
                  {item.title === 'Категории' && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault()
                        window.location.href = '/admin/categories/new'
                      }}
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </motion.div>
                  )}
                </div>
              </motion.a>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Быстрые действия
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.a
                href="/admin/products/new"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-700 dark:text-blue-300">
                  Добавить товар
                </span>
              </motion.a>
              
              <motion.a
                href="/admin/categories/new"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-300">
                  Создать категорию
                </span>
              </motion.a>
              
              <motion.a
                href="/admin/analytics"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
              >
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-700 dark:text-purple-300">
                  Посмотреть статистику
                </span>
              </motion.a>
            </div>
          </motion.div>
        </main>
      </div>
    </AdminGuard>
  )
} 