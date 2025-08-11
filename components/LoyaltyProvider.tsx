'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { 
  getUserLoyaltyPoints, 
  getLoyaltyTransactions, 
  getActiveLoyaltyTasks, 
  getTodayCompletedTasks,
  completeLoyaltyTask,
  LoyaltyTransaction,
  LoyaltyTask,
  UserTaskCompletion
} from '@/lib/supabase'

interface LoyaltyContextType {
  loyaltyPoints: number
  transactions: LoyaltyTransaction[]
  tasks: LoyaltyTask[]
  completedTasks: UserTaskCompletion[]
  loading: boolean
  refreshLoyalty: () => Promise<void>
  completeTask: (taskName: string) => Promise<boolean>
  addItemsToCartTask: () => Promise<void>
  shareProductTask: () => Promise<void>
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined)

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [tasks, setTasks] = useState<LoyaltyTask[]>([])
  const [completedTasks, setCompletedTasks] = useState<UserTaskCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [cartItemsAddedToday, setCartItemsAddedToday] = useState(0)

  const loadLoyaltyData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const [points, transactionsData, tasksData, completedTasksData] = await Promise.all([
        getUserLoyaltyPoints(user.id),
        getLoyaltyTransactions(user.id, 20),
        getActiveLoyaltyTasks(),
        getTodayCompletedTasks(user.id)
      ])

      setLoyaltyPoints(points)
      setTransactions(transactionsData)
      setTasks(tasksData)
      setCompletedTasks(completedTasksData)

      // Отмечаем ежедневный вход
      await completeTask('daily_login')

    } catch (error) {
      console.error('Error loading loyalty data:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskName: string): Promise<boolean> => {
    if (!user?.id) return false

    try {
      const success = await completeLoyaltyTask(user.id, taskName)
      if (success) {
        await loadLoyaltyData() // Обновляем данные
        return true
      }
      return false
    } catch (error) {
      console.error('Error completing task:', error)
      return false
    }
  }

  const addItemsToCartTask = async () => {
    const newCount = cartItemsAddedToday + 1
    setCartItemsAddedToday(newCount)
    
    // Проверяем, добавили ли мы 5 товаров за день
    if (newCount >= 5) {
      const completed = await completeTask('add_5_items_to_cart')
      if (completed) {
        setCartItemsAddedToday(0) // Сбрасываем счетчик
      }
    }
  }

  const shareProductTask = async () => {
    await completeTask('share_product')
  }

  const refreshLoyalty = async () => {
    await loadLoyaltyData()
  }

  useEffect(() => {
    loadLoyaltyData()
  }, [user])

  // Проверяем выполнение всех ежедневных заданий
  useEffect(() => {
    const checkAllDailyTasksComplete = async () => {
      if (!user?.id || tasks.length === 0 || completedTasks.length === 0) return

      const dailyTasks = tasks.filter(task => 
        task.task_type === 'daily' && 
        task.task_name !== 'complete_all_daily'
      )
      
      const completedDailyTasks = completedTasks.filter(completion => 
        tasks.find(task => 
          task.id === completion.task_id && 
          task.task_type === 'daily' && 
          task.task_name !== 'complete_all_daily'
        )
      )

      // Если выполнены все ежедневные задания (кроме бонусного)
      if (dailyTasks.length > 0 && completedDailyTasks.length === dailyTasks.length) {
        await completeTask('complete_all_daily')
      }
    }

    checkAllDailyTasksComplete()
  }, [completedTasks, tasks, user])

  const value: LoyaltyContextType = {
    loyaltyPoints,
    transactions,
    tasks,
    completedTasks,
    loading,
    refreshLoyalty,
    completeTask,
    addItemsToCartTask,
    shareProductTask
  }

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  )
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext)
  if (context === undefined) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider')
  }
  return context
} 