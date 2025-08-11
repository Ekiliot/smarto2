'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertTriangle, Loader2 } from 'lucide-react'
import { useAuth } from './AuthProvider'
import { checkIsAdmin } from '@/lib/supabase'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setChecking(false)
        return
      }

      try {
        const { isAdmin: adminStatus } = await checkIsAdmin(user.id)
        setIsAdmin(adminStatus)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setChecking(false)
      }
    }

    if (!loading) {
      checkAdminStatus()
    }
  }, [user, loading])

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Проверка прав доступа...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Пожалуйста, подождите
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Требуется авторизация
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Войдите в аккаунт для доступа к админ панели
          </p>
          <motion.a
            href="/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Войти в аккаунт
          </motion.a>
        </motion.div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Доступ запрещен
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            У вас нет прав администратора для доступа к этой странице
          </p>
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            Вернуться на главную
          </motion.a>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
} 