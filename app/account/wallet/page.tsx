'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Flame,
  CheckCircle,
  Clock,
  Star,
  Trophy,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Zap,
  X
} from 'lucide-react'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'
import { useLoyalty } from '@/components/LoyaltyProvider'
import { 
  performDailyCheckin,
  canCheckinToday,
  getCheckinCalendar,
  getUserStreak,
  CheckinResult,
  CheckinStatus,
  CheckinCalendar
} from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

export default function WalletPage() {
  const { user } = useAuth()
  const { loyaltyPoints, transactions, loading, refreshLoyalty } = useLoyalty()
  
  const [activeTab, setActiveTab] = useState<'checkin' | 'calendar' | 'history'>('checkin')
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus | null>(null)
  const [calendar, setCalendar] = useState<CheckinCalendar | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isChecking, setIsChecking] = useState(false)
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      // Временно загружаем только статус отметки
      const statusData = await canCheckinToday(user.id)
      setCheckinStatus(statusData)
      
      // Календарь временно отключен из-за SQL ошибки
      // const calendarData = await getCheckinCalendar(user.id, currentDate.getFullYear(), currentDate.getMonth() + 1)
      // setCalendar(calendarData)
      
      // Устанавливаем пустой календарь
      setCalendar({
        checkins: [],
        current_streak: statusData.current_streak,
        longest_streak: 0,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      })
    } catch (error) {
      console.error('Error loading checkin data:', error)
    }
  }

  const handleCheckin = async () => {
    if (!user) return

    setIsChecking(true)
    try {
      const result = await performDailyCheckin(user.id)
      setCheckinResult(result)
      setShowResult(true)
      
      if (result.success) {
        await refreshLoyalty()
        await loadData()
      }
    } catch (error) {
      console.error('Error performing checkin:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const formatTransactionReason = (reason: string) => {
    const translations: { [key: string]: string } = {
      'Покупка товара': '🛍️ Покупка товара',
      'Ежедневная отметка': '📅 Ежедневная отметка',
      'Супер отметка дня': '⭐ Супер отметка',
      'Оплата заказа баллами': '💳 Оплата баллами',
      'Истечение срока действия баллов': '⏰ Баллы истекли'
    }
    
    // Проверяем на содержание ключевых слов
    for (const [key, translation] of Object.entries(translations)) {
      if (reason.includes(key)) {
        return translation
      }
    }
    
    return reason
  }

  const calculateNextGoldenDay = (currentStreak: number, lastCheckinDate: string | null) => {
    if (!lastCheckinDate) return null
    
    const lastDate = new Date(lastCheckinDate)
    const today = new Date()
    
    // Если последняя отметка была не вчера, стрейк сбросится
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (lastDate.toDateString() !== yesterday.toDateString() && lastDate.toDateString() !== today.toDateString()) {
      // Стрейк сброшен, следующий золотой день будет на 10-й день от сегодня
      return 10
    }
    
    // Рассчитываем сколько дней осталось до золотого дня
    const daysUntilGolden = 10 - (currentStreak % 10)
    return daysUntilGolden === 10 ? 0 : daysUntilGolden // 0 означает что сегодня золотой день
  }

  const isGoldenDayPredicted = (day: number, currentStreak: number, calendar: CheckinCalendar | null) => {
    if (!calendar || !checkinStatus) return false
    
    const today = new Date()
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const todayInCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), today.getDate())
    
    // Только для будущих дней в текущем месяце
    if (targetDate <= todayInCurrentMonth) return false
    
    const daysFromToday = Math.ceil((targetDate.getTime() - todayInCurrentMonth.getTime()) / (1000 * 60 * 60 * 24))
    
    // Используем данные из checkinStatus
    const daysUntilSuper = checkinStatus.days_until_super
    
    // Если следующая отметка будет супер-днем
    if (checkinStatus.next_is_super && daysFromToday === 1) {
      return true
    }
    
    // Проверяем попадает ли день на золотой
    return daysFromToday === daysUntilSuper || (daysFromToday - daysUntilSuper) % 10 === 0
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Доступ запрещен
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Войдите в аккаунт для просмотра кошелька
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto">
        {/* Мобильная версия - банковский стиль */}
        <div className="md:hidden">
          {/* Банковская карта с балансом */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden"
          >
            {/* Фоновая карта */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 h-64 relative">
              {/* Декоративные элементы */}
              <div className="absolute top-4 right-4 w-16 h-16 bg-white/20 rounded-full"></div>
              <div className="absolute bottom-8 left-6 w-8 h-8 bg-white/20 rounded-full"></div>
              <div className="absolute top-20 left-8 w-12 h-12 bg-white/10 rounded-full"></div>
              
              {/* Логотип */}
              <div className="absolute top-6 left-6">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Coins className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Информация о карте */}
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-blue-100 text-sm mb-2">Кошелёк лояльности</p>
                <div className="text-3xl font-bold mb-2">
                  {loyaltyPoints} баллов
                </div>
                <div className="text-blue-100 text-sm">
                  = {formatPrice(loyaltyPoints)} экономии
                </div>
              </div>
            </div>
            
            {/* Статистика под картой */}
            <div className="px-6 -mt-4 relative z-10">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Стрейк */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Flame className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {checkinStatus?.current_streak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Дней стрейка</div>
                  </div>
                  
                  {/* Рекорд */}
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {calendar?.longest_streak || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Рекорд</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="px-6 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Быстрые действия
                </h3>
                
                {/* Кнопка отметки дня */}
                <motion.button
                  onClick={handleCheckin}
                  disabled={isChecking || checkinStatus?.already_checked}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full rounded-xl p-4 font-semibold transition-all duration-200 ${
                    checkinStatus?.already_checked
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                  }`}
                >
                  {isChecking ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Отмечаемся...</span>
                    </div>
                  ) : checkinStatus?.already_checked ? (
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Уже отметились сегодня!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Отметить день</span>
                    </div>
                  )}
                </motion.button>
                
                {/* Информация о следующем супер-дне */}
                {checkinStatus && !checkinStatus.already_checked && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                      <Star className="h-4 w-4" />
                      <span className="text-sm">
                        {checkinStatus.next_is_super 
                          ? 'Сегодня супер-день! +5-15 баллов!' 
                          : `До супер-дня: ${checkinStatus.days_until_super} дней`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Табы в стиле банковского приложения - только 2 вкладки */}
            <div className="px-6 mt-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                <div className="flex">
                  {[
                    { id: 'checkin', label: 'Отметка', icon: CheckCircle },
                    { id: 'history', label: 'История', icon: TrendingUp }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex flex-col items-center py-4 transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <tab.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Контент табов */}
            <div className="px-6 mt-6 mb-24">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'checkin' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Календарь отметок
                    </h3>
                    
                    {/* Мини-календарь */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                          {day}
                        </div>
                      ))}
                      
                      {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1) }, (_, i) => (
                        <div key={`empty-${i}`} className="p-2"></div>
                      ))}
                      
                      {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1) }, (_, i) => {
                        const day = i + 1
                        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                        const isToday = new Date().toDateString() === dayDate.toDateString()
                        const isPast = dayDate < new Date() && !isToday
                        const isFuture = dayDate > new Date()
                        
                        // Ищем отметку для этого дня
                        const checkin = calendar?.checkins.find(checkin => 
                          new Date(checkin.checkin_date).toDateString() === dayDate.toDateString()
                        )
                        
                        // Определяем стиль дня
                        let dayStyle = ''
                        let bgStyle = ''
                        let indicator = null
                        
                        if (isToday) {
                          // Сегодня
                          dayStyle = 'text-white font-semibold'
                          bgStyle = 'bg-primary-600'
                        } else if (checkin) {
                          if (checkin.is_super_bonus) {
                            // Золотой день (супер-день)
                            dayStyle = 'text-yellow-800 dark:text-yellow-200 font-bold'
                            bgStyle = 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400'
                            indicator = <Star className="h-3 w-3 text-yellow-700 absolute -top-1 -right-1" />
                          } else {
                            // Обычный отмеченный день
                            dayStyle = 'text-green-800 dark:text-green-200 font-medium'
                            bgStyle = 'bg-green-200 dark:bg-green-800/50'
                            indicator = <div className="w-2 h-2 bg-green-600 rounded-full absolute -top-1 -right-1"></div>
                          }
                        } else if (isPast) {
                          // Пропущенный день
                          dayStyle = 'text-red-600 dark:text-red-400'
                          bgStyle = 'bg-red-100 dark:bg-red-900/30'
                          indicator = <div className="w-1.5 h-1.5 bg-red-500 rounded-full absolute -top-1 -right-1"></div>
                        } else if (isFuture) {
                          // Будущий день
                          dayStyle = 'text-gray-400 dark:text-gray-600'
                          bgStyle = ''
                        }
                        
                        return (
                          <div
                            key={day}
                            className={`relative p-2 text-center text-sm rounded-lg transition-all duration-200 ${bgStyle} ${dayStyle}`}
                            title={
                              isToday ? 'Сегодня' :
                              checkin ? (checkin.is_super_bonus ? `Золотой день! +${checkin.points_earned} баллов` : `Отмечен! +${checkin.points_earned} баллов`) :
                              isPast ? 'Пропущен' :
                              'Будущий день'
                            }
                          >
                            <span className="text-xs font-medium">{day}</span>
                            {checkin && (
                              <span className="text-[10px] leading-none mt-0.5 opacity-80 block">
                                +{checkin.points_earned}
                              </span>
                            )}
                            {indicator}
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Легенда календаря */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-200 dark:bg-green-800/50 rounded flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">Отмечен</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 rounded flex items-center justify-center">
                          <Star className="h-2 w-2 text-yellow-700" />
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">Золотой день</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded flex items-center justify-center">
                          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">Пропущен</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-primary-600 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Сегодня</span>
                      </div>
                    </div>
                    
                    {/* Навигация по месяцам */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => changeMonth('prev')}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {currentDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                      </span>
                      
                      <button
                        onClick={() => changeMonth('next')}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      История транзакций
                    </h3>
                    
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Пока нет транзакций
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.points_change > 0 
                                  ? 'bg-green-100 dark:bg-green-900/20' 
                                  : 'bg-red-100 dark:bg-red-900/20'
                              }`}>
                                {transaction.points_change > 0 ? (
                                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatTransactionReason(transaction.reason)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(transaction.created_at).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`text-sm font-semibold ${
                              transaction.points_change > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Десктопная версия - оставляем как есть */}
        <div className="hidden md:block">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Заголовок */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Кошелёк лояльности
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ежедневные отметки, стрейки и баллы
              </p>
            </motion.div>

            {/* Баланс и стрейк */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Баланс */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Coins className="h-6 w-6" />
                  <span className="text-yellow-100 font-medium">Ваш баланс</span>
                </div>
                <div className="text-3xl font-bold">
                  {loyaltyPoints} баллов
                </div>
                <div className="text-yellow-100 text-sm mt-1">
                  = {formatPrice(loyaltyPoints)} экономии
                </div>
              </motion.div>

              {/* Стрейк */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="h-6 w-6" />
                  <span className="text-red-100 font-medium">Стрейк</span>
                </div>
                <div className="text-3xl font-bold">
                  {checkinStatus?.current_streak || 0} дней
                </div>
                <div className="text-red-100 text-sm mt-1">
                  Рекорд: {calendar?.longest_streak || 0} дней
                </div>
              </motion.div>
            </div>

            {/* Табы */}
            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-800 rounded-lg p-1 mb-6">
              {[
                { id: 'checkin', label: 'Отметка', icon: CheckCircle },
                { id: 'calendar', label: 'Календарь', icon: Calendar },
                { id: 'history', label: 'История', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Контент табов */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'checkin' && (
                <div className="space-y-6">
                  {/* Статус и кнопка отметки */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Мини-календарь */}
                      <div className="lg:col-span-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                          {currentDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                        </h3>
                        
                        {/* Календарь */}
                        <div className="grid grid-cols-7 gap-1">
                          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                              {day}
                            </div>
                          ))}
                          
                          {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth() + 1) }, (_, i) => (
                            <div key={`empty-${i}`} className="p-2"></div>
                          ))}
                          
                          {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1) }, (_, i) => {
                            const day = i + 1
                            const isChecked = calendar?.checkins.some(checkin => 
                              new Date(checkin.checkin_date).getDate() === day
                            )
                            const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() &&
                              currentDate.getFullYear() === new Date().getFullYear()
                            
                            return (
                              <div
                                key={day}
                                className={`p-2 text-center text-sm rounded-lg ${
                                  isToday 
                                    ? 'bg-primary-600 text-white font-semibold'
                                    : isChecked
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                      : 'text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {day}
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Навигация по месяцам */}
                        <div className="flex items-center justify-between mt-4">
                          <button
                            onClick={() => changeMonth('prev')}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {currentDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                          </span>
                          
                          <button
                            onClick={() => changeMonth('next')}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Кнопка отметки */}
                      <div className="flex flex-col justify-center">
                        <motion.button
                          onClick={handleCheckin}
                          disabled={isChecking || checkinStatus?.already_checked}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full rounded-xl p-4 font-semibold transition-all duration-200 ${
                            checkinStatus?.already_checked
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                          }`}
                        >
                          {isChecking ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span>Отмечаемся...</span>
                            </div>
                          ) : checkinStatus?.already_checked ? (
                            <div className="flex items-center justify-center space-x-2">
                              <CheckCircle className="h-5 w-5" />
                              <span>Уже отметились сегодня!</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <Zap className="h-5 w-5" />
                              <span>Отметить день</span>
                            </div>
                          )}
                        </motion.button>
                        
                        {/* Информация о следующем супер-дне */}
                        {checkinStatus && !checkinStatus.already_checked && (
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-400">
                              <Star className="h-4 w-4" />
                              <span className="text-sm">
                                {checkinStatus.next_is_super 
                                  ? 'Сегодня супер-день! +5-15 баллов!' 
                                  : `До супер-дня: ${checkinStatus.days_until_super} дней`
                                }
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="space-y-6">
                  {/* Детальный календарь */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Детальный календарь
                    </h3>
                    
                    {/* Календарь с отметками */}
                    <div className="space-y-4">
                      {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth() + 1) }, (_, i) => {
                        const day = i + 1
                        const checkin = calendar?.checkins.find(checkin => 
                          new Date(checkin.checkin_date).getDate() === day
                        )
                        const isToday = day === new Date().getDate() && 
                          currentDate.getMonth() === new Date().getMonth() &&
                          currentDate.getFullYear() === new Date().getFullYear()
                        
                        return (
                          <div
                            key={day}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              isToday 
                                ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                                : 'bg-gray-50 dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                isToday 
                                  ? 'bg-primary-600 text-white'
                                  : checkin
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                              }`}>
                                {day}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {day} {currentDate.toLocaleDateString('ru-RU', { month: 'long' })}
                                </div>
                                {checkin && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    +{checkin.points_earned} баллов
                                    {checkin.is_super_bonus && ' (супер-день!)'}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {checkin && (
                              <div className="text-green-600 dark:text-green-400">
                                <CheckCircle className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* История транзакций */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      История транзакций
                    </h3>
                    
                    {transactions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <TrendingUp className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Пока нет транзакций
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                transaction.points_change > 0 
                                  ? 'bg-green-100 dark:bg-green-900/20' 
                                  : 'bg-red-100 dark:bg-red-900/20'
                              }`}>
                                {transaction.points_change > 0 ? (
                                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {formatTransactionReason(transaction.reason)}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">
                                  {new Date(transaction.created_at).toLocaleDateString('ru-RU')}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`text-sm font-semibold ${
                              transaction.points_change > 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Модальное окно с результатом отметки */}
      <AnimatePresence>
        {showResult && checkinResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResult(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
                  checkinResult.is_super_day 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}>
                  {checkinResult.is_super_day ? (
                    <Star className="h-8 w-8 text-white" />
                  ) : (
                    <CheckCircle className="h-8 w-8 text-white" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {checkinResult.is_super_day ? 'Супер отметка!' : 'Отметка засчитана!'}
                  </h3>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    +{checkinResult.points_earned} баллов
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Flame className="h-4 w-4 text-red-500" />
                      <span>Стрейк: {checkinResult.current_streak} дней</span>
                    </div>
                    {checkinResult.longest_streak && checkinResult.current_streak === checkinResult.longest_streak && (
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>Новый рекорд!</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowResult(false)}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Отлично!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 