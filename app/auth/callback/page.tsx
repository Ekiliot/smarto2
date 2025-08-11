'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase, getCurrentUser, updateUserProfile } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [profile, setProfile] = useState({ first_name: '', last_name: '' })

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Получаем параметры из hash fragment
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        const error = params.get('error')
        const error_description = params.get('error_description')

        console.log('Auth callback params:', { access_token: !!access_token, refresh_token: !!refresh_token, error, error_description })

        if (error) {
          setError(error_description || 'Ошибка аутентификации')
          setStatus('error')
          return
        }

        if (access_token && refresh_token) {
          // Устанавливаем сессию
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError(sessionError.message)
            setStatus('error')
            return
          }

          console.log('Session set successfully:', data)

          // Проверяем, новый ли это пользователь
          const { user } = await getCurrentUser()
          if (user) {
            console.log('User authenticated:', user.email)
            
            try {
              // Проверяем, есть ли профиль пользователя
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', user.id)
                .single()

              if (profileError && profileError.code !== 'PGRST116') {
                console.error('Profile error:', profileError)
              }

              if (!profileData || (!profileData.first_name && !profileData.last_name)) {
                console.log('New user, showing profile form')
                setIsNewUser(true)
                setShowProfileForm(true)
              } else {
                console.log('Existing user, redirecting')
                setStatus('success')
                // Перенаправляем на главную страницу
                setTimeout(() => {
                  router.push('/')
                }, 2000)
              }
            } catch (profileErr) {
              console.error('Profile check error:', profileErr)
              // Если таблица profiles не существует, считаем пользователя новым
              setIsNewUser(true)
              setShowProfileForm(true)
            }
          } else {
            setError('Не удалось получить данные пользователя')
            setStatus('error')
          }
        } else {
          setError('Отсутствуют токены аутентификации')
          setStatus('error')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Произошла ошибка при обработке входа')
        setStatus('error')
      }
    }

    handleAuthCallback()
  }, [router])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile.first_name.trim() || !profile.last_name.trim()) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    try {
      const { user } = await getCurrentUser()
      if (user) {
        await updateUserProfile(user.id, {
          ...profile,
          email: user.email || undefined
        })
        setStatus('success')
        // Перенаправляем на главную страницу
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err) {
      setError('Ошибка при сохранении профиля')
    }
  }

  if (showProfileForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Добро пожаловать!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              Заполните ваш профиль для завершения регистрации
            </p>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Имя
              </label>
              <input
                type="text"
                id="first_name"
                value={profile.first_name}
                onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                placeholder="Ваше имя"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Фамилия
              </label>
              <input
                type="text"
                id="last_name"
                value={profile.last_name}
                onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                placeholder="Ваша фамилия"
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </span>
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Завершить регистрацию
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Обработка входа...
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              Пожалуйста, подождите
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Успешный вход!
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400">
              Перенаправление на главную страницу...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ошибка входа
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Попробовать снова
            </motion.a>
          </>
        )}
      </motion.div>
    </div>
  )
} 