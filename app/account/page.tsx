'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  LogOut,
  Shield,
  Settings,
  CreditCard,
  Package,
  Heart,
  Coins,
  Camera,
  MessageCircle
} from 'lucide-react'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'
import { supabase, updateUserProfile, uploadProfileImage } from '@/lib/supabase'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  image_url?: string
  is_admin?: boolean
}

export default function AccountPage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: ''
  })
  
  // Новые состояния для мобильного редактирования
  const [isMobileEditing, setIsMobileEditing] = useState(false)
  const [mobileEditForm, setMobileEditForm] = useState({
    first_name: '',
    last_name: ''
  })
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Загружаем профиль пользователя
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error)
          setError('Ошибка загрузки профиля')
        } else if (data) {
          setProfile({
            id: user.id,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: user.email || '',
            created_at: user.created_at || '',
            image_url: data.image_url || '',
            is_admin: data.is_admin || false
          })
          setEditForm({
            first_name: data.first_name || '',
            last_name: data.last_name || ''
          })
        } else {
          // Если профиль не найден, создаем базовый
          setProfile({
            id: user.id,
            first_name: '',
            last_name: '',
            email: user.email || '',
            created_at: user.created_at || '',
            image_url: '',
            is_admin: false
          })
        }

        // Загружаем роль пользователя из profiles
        if (data?.is_admin) {
          setUserRole('admin')
        } else {
          setUserRole('user')
        }
      } catch (err) {
        console.error('Profile load error:', err)
        setError('Ошибка загрузки профиля')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user])

  // Загружаем баллы лояльности
  useEffect(() => {
    const loadLoyaltyPoints = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('loyalty_points')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading loyalty points:', error)
        } else if (data) {
          setLoyaltyPoints(data.loyalty_points || 0)
        }
      } catch (err) {
        console.error('Loyalty points load error:', err)
      }
    }

    loadLoyaltyPoints()
  }, [user])

  const handleEdit = () => {
    setIsEditing(true)
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || ''
    })
    setError('')
  }

  const handleSave = async () => {
    if (!user || !editForm.first_name.trim() || !editForm.last_name.trim()) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await updateUserProfile(user.id, editForm)
      
      setProfile(prev => prev ? {
        ...prev,
        first_name: editForm.first_name,
        last_name: editForm.last_name
      } : null)
      
      setIsEditing(false)
    } catch (err) {
      console.error('Save error:', err)
      setError('Ошибка сохранения профиля')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    }
  }

  // Функция загрузки изображения профиля
  const handleProfileImageUpload = async (file: File) => {
    if (!user) return
    
    setIsUploadingImage(true)
    setError('')
    
    try {
      console.log('Starting image upload for user:', user.id)
      
      const { data: imageUrl, error } = await uploadProfileImage(file, user.id)
      
      if (error) {
        console.error('Upload error:', error)
        throw error
      }
      
      console.log('Image uploaded successfully, URL:', imageUrl)
      
      // Обновляем профиль с новым изображением
      console.log('Updating profile with image_url:', imageUrl)
      const updateResult = await updateUserProfile(user.id, { 
        first_name: profile?.first_name || '', 
        last_name: profile?.last_name || '',
        image_url: imageUrl 
      })
      
      if (updateResult.error) {
        console.error('Profile update error:', updateResult.error)
        throw updateResult.error
      }
      
      console.log('Profile updated successfully')
      
      setProfile(prev => prev ? { ...prev, image_url: imageUrl } : null)
      setSelectedProfileImage(null)
      
    } catch (err) {
      console.error('Image upload error:', err)
      setError('Ошибка загрузки изображения')
    } finally {
      setIsUploadingImage(false)
    }
  }

  // Функция мобильного редактирования
  const handleMobileEdit = () => {
    setIsMobileEditing(true)
    setMobileEditForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || ''
    })
    setError('')
  }

  const handleMobileCancel = () => {
    setIsMobileEditing(false)
    setMobileEditForm({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || ''
    })
    setError('')
  }

  const handleMobileSave = async () => {
    if (!user || !mobileEditForm.first_name.trim() || !mobileEditForm.last_name.trim()) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      await updateUserProfile(user.id, mobileEditForm)
      
      setProfile(prev => prev ? {
        ...prev,
        first_name: mobileEditForm.first_name,
        last_name: mobileEditForm.last_name
      } : null)
      
      setIsMobileEditing(false)
    } catch (err) {
      console.error('Save error:', err)
      setError('Ошибка сохранения профиля')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Необходима авторизация
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Войдите в аккаунт для доступа к профилю
            </p>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Войти в аккаунт
            </motion.a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      {/* Хедер только для десктопа */}
      <div className="hidden md:block">
        <Header />
      </div>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header - только для десктопа */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 hidden md:block"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Мой аккаунт
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Управление профилем и настройками
          </p>
        </motion.div>

        {/* Мобильная карточка профиля */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:hidden mb-6"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-4">
              {/* Фото профиля с возможностью загрузки */}
              <div className="relative">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile?.image_url ? (
                    <img
                      src={profile.image_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary-600" />
                  )}
                </div>
                
                {/* Кнопка загрузки фото */}
                <motion.button
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Camera className="h-3 w-3 text-white" />
                </motion.button>
                
                {/* Скрытый input для загрузки файла */}
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedProfileImage(file)
                      handleProfileImageUpload(file)
                    }
                  }}
                />
              </div>
              
              {/* Имя и баллы с возможностью редактирования */}
              <div className="flex-1">
                {isMobileEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={mobileEditForm.first_name}
                      onChange={(e) => setMobileEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold"
                      placeholder="Имя"
                    />
                    <input
                      type="text"
                      value={mobileEditForm.last_name}
                      onChange={(e) => setMobileEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-semibold"
                      placeholder="Фамилия"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {profile?.first_name && profile?.last_name 
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile?.first_name || profile?.last_name || 'Пользователь'
                      }
                    </h2>
                    <motion.button
                      onClick={handleMobileEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Edit3 className="h-4 w-4" />
                    </motion.button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 mt-1">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    {loyaltyPoints || 0} баллов
                  </span>
                </div>
              </div>
            </div>
            
            {/* Кнопки редактирования */}
            {isMobileEditing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <motion.button
                  onClick={handleMobileCancel}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Отмена</span>
                </motion.button>
                
                <motion.button
                  onClick={handleMobileSave}
                  disabled={isSaving}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="text-sm">Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span className="text-sm">Сохранить</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
            
            {/* Индикатор загрузки изображения */}
            {isUploadingImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center mt-4 py-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                Загрузка изображения...
              </motion.div>
            )}
            
            {/* Ошибки */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <span className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card - только для десктопа */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hidden lg:block"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Профиль
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Личная информация
                    </p>
                  </div>
                </div>
                
                {!isEditing && (
                  <motion.button
                    onClick={handleEdit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="text-sm font-medium">Редактировать</span>
                  </motion.button>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <span className="text-sm text-red-700 dark:text-red-400">
                    {error}
                  </span>
                </motion.div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {profile?.email}
                    </p>
                  </div>
                </div>

                {/* First Name */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Имя</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.first_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Введите имя"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profile?.first_name || 'Не указано'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Last Name */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Фамилия</p>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.last_name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Введите фамилию"
                      />
                    ) : (
                      <p className="font-medium text-gray-900 dark:text-white">
                        {profile?.last_name || 'Не указано'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Created At */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Дата регистрации</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <motion.button
                    onClick={handleCancel}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span className="text-sm font-medium">Отмена</span>
                  </motion.button>
                  
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Сохранение...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span className="text-sm">Сохранить</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            {/* Мобильные карточки действий */}
            <div className="md:hidden space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Админ панель - только для админов */}
                {userRole === 'admin' && (
                  <motion.a
                    href="/admin"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                        <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <span className="font-semibold text-sm">Админ панель</span>
                    </div>
                  </motion.a>
                )}

                {/* Мои заказы */}
                <motion.a
                  href="/account/orders"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-semibold text-sm">Мои заказы</span>
                  </div>
                </motion.a>

                {/* Кошелек лояльности */}
                <motion.a
                  href="/account/wallet"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                      <Coins className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="font-semibold text-sm">Кошелек</span>
                  </div>
                </motion.a>

                {/* Избранное */}
                <motion.a
                  href="/wishlist"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-full flex items-center justify-center">
                      <Heart className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <span className="font-semibold text-sm">Избранное</span>
                  </div>
                </motion.a>

                {/* Настройки */}
                <motion.a
                  href="/account/settings"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="font-semibold text-sm">Настройки</span>
                  </div>
                </motion.a>

                {/* Способы оплаты */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="font-semibold text-sm">Оплата</span>
                  </div>
                </motion.button>

                {/* Техподдержка */}
                <motion.a
                  href="/support"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="font-semibold text-sm">Техподдержка</span>
                  </div>
                </motion.a>
              </div>

              {/* Кнопка выхода */}
              <motion.button
                onClick={handleSignOut}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-center space-x-3">
                  <LogOut className="h-5 w-5" />
                  <span className="font-semibold">Выйти из аккаунта</span>
                </div>
              </motion.button>
            </div>

            {/* Десктопная боковая панель */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Быстрые действия
              </h3>
              
              <div className="space-y-3">
                {/* Админ панель - только для админов */}
                {userRole === 'admin' && (
                  <motion.a
                    href="/admin"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm font-medium">Админ панель</span>
                  </motion.a>
                )}
                
                <motion.a
                  href="/account/orders"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <Package className="h-5 w-5" />
                  <span className="text-sm font-medium">Мои заказы</span>
                </motion.a>
                
                <motion.a
                  href="/account/wallet"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors"
                >
                  <Coins className="h-5 w-5" />
                  <span className="text-sm font-medium">Кошелёк лояльности</span>
                </motion.a>
                
                <motion.a
                  href="/wishlist"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <Heart className="h-5 w-5" />
                  <span className="text-sm font-medium">Избранное</span>
                </motion.a>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm font-medium">Способы оплаты</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  <span className="text-sm font-medium">Безопасность</span>
                </motion.button>
                
                <motion.a
                  href="/support"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Техподдержка</span>
                </motion.a>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-sm font-medium">Настройки</span>
                </motion.button>


              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={handleSignOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Выйти из аккаунта</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
} 