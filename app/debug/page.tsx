'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [envStatus, setEnvStatus] = useState<{
    supabaseUrl: boolean
    supabaseKey: boolean
  }>({ supabaseUrl: false, supabaseKey: false })

  useEffect(() => {
    setEnvStatus({
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Отладка настроек
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Переменные окружения:
          </h2>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${envStatus.supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                NEXT_PUBLIC_SUPABASE_URL: {envStatus.supabaseUrl ? '✅ Настроен' : '❌ Отсутствует'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${envStatus.supabaseKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-700 dark:text-gray-300">
                NEXT_PUBLIC_SUPABASE_ANON_KEY: {envStatus.supabaseKey ? '✅ Настроен' : '❌ Отсутствует'}
              </span>
            </div>
          </div>

          {envStatus.supabaseUrl && envStatus.supabaseKey && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400">
                ✅ Все переменные окружения настроены правильно!
              </p>
            </div>
          )}

          {(!envStatus.supabaseUrl || !envStatus.supabaseKey) && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 mb-2">
                ❌ Отсутствуют необходимые переменные окружения
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Создайте файл .env.local в корне проекта и добавьте:
              </p>
              <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-sm">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 