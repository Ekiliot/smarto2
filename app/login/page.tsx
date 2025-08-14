'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Header } from '@/components/Header'
import { signInWithMagicLink } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  // Определяем домен почты при вводе email
  useEffect(() => {
    if (email.includes('@')) {
      const domain = email.split('@')[1]
      setEmailDomain(domain)
    } else {
      setEmailDomain('')
    }
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { error } = await signInWithMagicLink(email)
      
      if (error) {
        setError(error.message)
      } else {
        setIsSuccess(true)
        // Автоматически перенаправляем на почтовый домен
        if (emailDomain) {
          setTimeout(() => {
            window.open(`https://${emailDomain}`, '_blank')
          }, 1000)
        }
      }
    } catch (err) {
      setError('Произошла ошибка при отправке ссылки')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setError('')

    try {
      await signInWithGoogle()
    } catch (err) {
      setError('Произошла ошибка при входе через Google')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const getEmailProviderUrl = (domain: string) => {
    const providers: Record<string, string> = {
      'gmail.com': 'https://gmail.com',
      'yahoo.com': 'https://mail.yahoo.com',
      'outlook.com': 'https://outlook.live.com',
      'hotmail.com': 'https://outlook.live.com',
      'yandex.ru': 'https://mail.yandex.ru',
      'mail.ru': 'https://mail.ru',
      'rambler.ru': 'https://mail.rambler.ru',
      'icloud.com': 'https://www.icloud.com/mail',
      'protonmail.com': 'https://mail.proton.me',
      'tutanota.com': 'https://mail.tutanota.com'
    }
    
    return providers[domain] || `https://${domain}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area login-page-mobile">
      {/* Header только для десктопа */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 md:py-12 min-h-screen md:min-h-0 flex flex-col justify-start md:justify-center login-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl md:rounded-xl rounded-t-3xl md:rounded-t-xl shadow-lg p-6 md:p-8 mx-auto w-full"
        >
          {/* Back Button - только для мобильных */}
          <motion.a
            href="/"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors p-2 -ml-2 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="text-base font-medium">Назад</span>
          </motion.a>

          {/* Back Button - для десктопа */}
          <motion.a
            href="/"
            whileHover={{ x: -5 }}
            className="hidden md:inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад на главную
          </motion.a>

          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Mail className="h-7 w-7 md:h-8 md:w-8 text-primary-600" />
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Войти в аккаунт
            </h1>
            
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              Войдите через Google или получите ссылку на email
            </p>
          </div>

          {/* Google Sign In Button */}
          <motion.button
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isGoogleLoading}
            className="w-full bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3.5 md:py-3 px-6 rounded-xl md:rounded-lg border-2 border-gray-300 dark:border-gray-600 transition-all duration-200 flex items-center justify-center space-x-2 mb-4 md:mb-6 text-base shadow-sm active:shadow-none"
          >
            {isGoogleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <span>Вход...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Войти через Google</span>
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center mb-4 md:mb-6">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">или</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email адрес
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3.5 md:py-3 border border-gray-300 dark:border-gray-600 rounded-xl md:rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors text-base"
                />
              </div>

              {/* Email Provider Preview */}
              {emailDomain && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl md:rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Почтовый провайдер
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {emailDomain}
                      </p>
                    </div>
                    <a
                      href={getEmailProviderUrl(emailDomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      Открыть почту
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </span>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || !email}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3.5 md:py-3 px-6 rounded-xl md:rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 text-base shadow-lg active:shadow-md"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5" />
                    <span>Отправить ссылку</span>
                  </>
                )}
              </motion.button>
            </form>
          ) : (
            /* Success State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-14 h-14 md:w-16 md:h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                <CheckCircle className="h-7 w-7 md:h-8 md:w-8 text-green-600" />
              </div>
              
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ссылка отправлена!
              </h2>
              
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 md:mb-6">
                Проверьте вашу почту и перейдите по ссылке для входа в аккаунт
              </p>

              {emailDomain && (
                                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4 md:mb-6"
                  >
                    <a
                      href={getEmailProviderUrl(emailDomain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl md:rounded-lg transition-colors text-base font-medium shadow-sm"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Открыть {emailDomain}
                    </a>
                  </motion.div>
              )}

              <motion.button
                onClick={() => {
                  setIsSuccess(false)
                  setEmail('')
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors text-base px-4 py-2 rounded-lg"
              >
                Отправить еще раз
              </motion.button>
            </motion.div>
          )}

          {/* Info */}
          <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-2">
                Как это работает?
              </p>
              <div className="space-y-1.5 md:space-y-2 text-xs md:text-xs text-gray-500 dark:text-gray-400">
                <p>1. Введите ваш email адрес</p>
                <p>2. Получите ссылку для входа на почту</p>
                <p>3. Перейдите по ссылке для авторизации</p>
                <p className="hidden md:block">4. Если вы новый пользователь, заполните профиль</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
} 