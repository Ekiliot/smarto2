'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Coins, 
  Gift, 
  Settings, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Award
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { 
  getLoyaltyStats, 
  getAllUsersWithLoyaltyPoints,
  getAllLoyaltyTransactions,
  LoyaltyStats
} from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

export default function AdminLoyaltyPage() {
  const [stats, setStats] = useState<LoyaltyStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, usersData, transactionsData] = await Promise.all([
        getLoyaltyStats(),
        getAllUsersWithLoyaltyPoints(),
        getAllLoyaltyTransactions(20)
      ])

      setStats(statsData)
      setRecentUsers(usersData.slice(0, 10)) // Топ 10 пользователей
      setRecentTransactions(transactionsData)
    } catch (error) {
      console.error('Error loading loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTransactionReason = (reason: string) => {
    const translations: { [key: string]: string } = {
      'Покупка товара': '🛍️ Покупка товара',
      'Ежедневный вход на сайт': '🎯 Ежедневный вход',
      'Добавить 5 товаров в корзину за день': '🛒 Добавление товаров',
      'Поделиться товаром': '📤 Поделились товаром',
      'Выполнить все задания дня': '⭐ Все задания дня',
      'Оплата заказа баллами': '💳 Оплата баллами',
      'Истечение срока действия баллов': '⏰ Баллы истекли'
    }
    return translations[reason] || reason
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Система лояльности
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управление баллами, заданиями и настройками программы лояльности
            </p>
          </motion.div>

          {/* Быстрые действия */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Пользователи</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_users_with_points || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Начислено баллов</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats?.total_points_awarded || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                  <Gift className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Задания</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Активно
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-xl">
                  <Settings className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Настройки</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    Система
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Статистика */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Общая статистика */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Общая статистика
              </h3>
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Всего начислено</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {stats.total_points_awarded} баллов
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Всего потрачено</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {stats.total_points_spent} баллов
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Активных пользователей</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {stats.total_users_with_points}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                        <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Средний баланс</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                          {Math.round(stats.avg_points_per_user)} баллов
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Ошибка загрузки статистики</p>
              )}
            </motion.div>

            {/* Топ пользователей */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Топ пользователей
                </h3>
              </div>
              
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-yellow-600 dark:text-yellow-400">
                          {user.loyalty_points} баллов
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Последние транзакции */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Последние транзакции
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  Пока нет транзакций
                </div>
              ) : (
                recentTransactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          transaction.points_change > 0 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {transaction.points_change > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {transaction.profiles?.first_name} {transaction.profiles?.last_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatTransactionReason(transaction.reason)}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className={`font-bold text-right ${
                        transaction.points_change > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          баллов
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </main>
      </div>
    </AdminGuard>
  )
}