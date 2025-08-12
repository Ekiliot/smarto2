'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { supabase } from '@/lib/supabase'
import { 
  Database, 
  Users, 
  Table, 
  CheckCircle, 
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'

interface TableInfo {
  name: string
  exists: boolean
  rowCount?: number
  error?: string
}

interface DatabaseStatus {
  connected: boolean
  tables: TableInfo[]
  error?: string
}

export default function DatabaseDebugPage() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    tables: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkDatabaseStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    setLoading(true)
    try {
      // Проверяем подключение
      const { data, error } = await supabase.from('products').select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('Database connection error:', error)
        setStatus({
          connected: false,
          tables: [],
          error: error.message
        })
        return
      }

      // Получаем список таблиц
      const tables = await getTablesInfo()
      
      setStatus({
        connected: true,
        tables
      })
    } catch (error) {
      console.error('Unexpected error:', error)
      setStatus({
        connected: false,
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getTablesInfo = async (): Promise<TableInfo[]> => {
    const tableNames = [
      'users',
      'profiles', 
      'products',
      'categories',
      'orders',
      'order_items',
      'cart_items',
      'wishlist_items',
      'chats',
      'messages'
    ]

    const tablesInfo: TableInfo[] = []

    for (const tableName of tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          tablesInfo.push({
            name: tableName,
            exists: false,
            error: error.message
          })
        } else {
          tablesInfo.push({
            name: tableName,
            exists: true,
            rowCount: count || 0
          })
        }
      } catch (error) {
        tablesInfo.push({
          name: tableName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return tablesInfo
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await checkDatabaseStatus()
    setRefreshing(false)
  }

  const testUserFunctions = async () => {
    try {
      console.log('Testing user functions...')
      
      // Тестируем RPC функцию
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_all_users')
      console.log('RPC get_all_users result:', { data: rpcData, error: rpcError })
      
      // Тестируем прямой запрос к profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      console.log('Profiles table result:', { data: profilesData, error: profilesError })
      
      // Тестируем auth.users (если доступно)
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
        console.log('Auth users result:', { data: authData, error: authError })
      } catch (authError) {
        console.log('Auth users not accessible:', authError)
      }
      
    } catch (error) {
      console.error('Error testing user functions:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                🗄️ Отладка базы данных
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Проверка подключения и состояния базы данных
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Обновить</span>
            </button>
          </div>
        </motion.div>

        {/* Статус подключения */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Database className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Статус подключения
            </h2>
          </div>
          
          <div className="flex items-center space-x-3">
            {status.connected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Подключение установлено
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Ошибка подключения
                </span>
              </>
            )}
          </div>
          
          {status.error && (
            <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                <strong>Ошибка:</strong> {status.error}
              </p>
            </div>
          )}
        </motion.div>

        {/* Информация о таблицах */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Table className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Состояние таблиц
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status.tables.map((table) => (
              <div
                key={table.name}
                className={`p-4 rounded-lg border ${
                  table.exists
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {table.name}
                  </h3>
                  {table.exists ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                
                {table.exists ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Записей: {table.rowCount}
                  </p>
                ) : (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {table.error || 'Таблица не найдена'}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Тестирование функций */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Тестирование функций
            </h2>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={testUserFunctions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Тестировать функции пользователей
            </button>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Нажмите кнопку выше и проверьте консоль браузера для детальной информации.</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
} 