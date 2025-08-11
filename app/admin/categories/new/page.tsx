'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Loader2, 
  Image as ImageIcon,
  X,
  Home,
  Smartphone,
  Laptop,
  Headphones,
  Camera,
  Gamepad2,
  Watch,
  Speaker,
  Lightbulb,
  Wifi,
  Shield,
  Settings,
  Palette,
  Music,
  Video,
  Monitor,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Mic,
  Tv,
  Radio,
  Fan,
  Thermometer,
  Lock,
  Bell,
  Clock,
  Star,
  Heart,
  Gift,
  Tag,
  Bookmark,
  Flag,
  Award,
  Trophy,
  Medal,
  Crown,
  Diamond,
  Flame,
  Leaf,
  Sun,
  Moon,
  Cloud,
  Droplets,
  Snowflake,
  Zap,
  Wind
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { ImageUpload } from '@/components/ImageUpload'
import { createCategory, uploadCategoryImage, updateCategory } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import React from 'react'

const iconOptions = [
  { name: 'Home', icon: Home },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Laptop', icon: Laptop },
  { name: 'Headphones', icon: Headphones },
  { name: 'Camera', icon: Camera },
  { name: 'Gamepad2', icon: Gamepad2 },
  { name: 'Watch', icon: Watch },
  { name: 'Speaker', icon: Speaker },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Wifi', icon: Wifi },
  { name: 'Zap', icon: Zap },
  { name: 'Shield', icon: Shield },
  { name: 'Settings', icon: Settings },
  { name: 'Palette', icon: Palette },
  { name: 'Music', icon: Music },
  { name: 'Video', icon: Video },
  { name: 'Monitor', icon: Monitor },
  { name: 'Tablet', icon: Tablet },
  { name: 'Printer', icon: Printer },
  { name: 'Keyboard', icon: Keyboard },
  { name: 'Mouse', icon: Mouse },
  { name: 'Mic', icon: Mic },
  { name: 'Tv', icon: Tv },
  { name: 'Radio', icon: Radio },
  { name: 'Fan', icon: Fan },
  { name: 'Thermometer', icon: Thermometer },
  { name: 'Lock', icon: Lock },
  { name: 'Bell', icon: Bell },
  { name: 'Clock', icon: Clock },
  { name: 'Star', icon: Star },
  { name: 'Heart', icon: Heart },
  { name: 'Gift', icon: Gift },
  { name: 'Tag', icon: Tag },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'Flag', icon: Flag },
  { name: 'Award', icon: Award },
  { name: 'Trophy', icon: Trophy },
  { name: 'Medal', icon: Medal },
  { name: 'Crown', icon: Crown },
  { name: 'Diamond', icon: Diamond },
  { name: 'Flame', icon: Flame },
  { name: 'Leaf', icon: Leaf },
  { name: 'Sun', icon: Sun },
  { name: 'Moon', icon: Moon },
  { name: 'Cloud', icon: Cloud },
  { name: 'Droplets', icon: Droplets },
  { name: 'Snowflake', icon: Snowflake },
  { name: 'Wind', icon: Wind }
]

export default function NewCategoryPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    icon: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showIconSelector, setShowIconSelector] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      let finalImageUrl = formData.image_url

      // Если есть выбранный файл, загружаем его в Supabase Storage
      if (selectedFile) {
        // Сначала создаем категорию без изображения, чтобы получить ID
        const tempCategoryData = {
          name: formData.name,
          description: formData.description,
          image_url: '', // Временно пустое
          icon: formData.icon
        }

        const { data: category, error: createError } = await createCategory(tempCategoryData)
        if (createError) throw createError

        // Теперь загружаем изображение, используя полученный ID
        const { data: imageUrl, error: uploadError } = await uploadCategoryImage(selectedFile, category.id)
        if (uploadError) throw uploadError

        // Обновляем категорию с правильным URL изображения
        const { error: updateError } = await updateCategory(category.id, {
          image_url: imageUrl
        })
        if (updateError) throw updateError

        finalImageUrl = imageUrl
      } else if (formData.image_url && !formData.image_url.startsWith('blob:')) {
        // Если изображение уже загружено (не blob), используем его
        finalImageUrl = formData.image_url
      } else {
        // Если нет изображения, создаем категорию без него
        finalImageUrl = ''
      }

      // Если не было файла для загрузки, создаем категорию обычным способом
      if (!selectedFile) {
        const categoryData = {
          name: formData.name,
          description: formData.description,
          image_url: finalImageUrl,
          icon: formData.icon
        }

        const { error: createError } = await createCategory(categoryData)
        if (createError) throw createError
      }

      router.push('/admin/categories')
    } catch (error: any) {
      console.error('Error creating category:', error)
      setError(error.message || 'Ошибка при создании категории')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (imageUrl: string, file?: File) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }))
    if (file) {
      setSelectedFile(file)
    }
  }

  const selectIcon = (iconName: string) => {
    setFormData(prev => ({ ...prev, icon: iconName }))
    setShowIconSelector(false)
  }

  const removeIcon = () => {
    setFormData(prev => ({ ...prev, icon: '' }))
  }

  const selectedIconComponent = iconOptions.find(option => option.name === formData.icon)?.icon

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href="/admin/categories"
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Назад к категориям</span>
                </a>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Создать новую категорию
              </h1>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название категории *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Введите название категории"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Описание
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder="Введите описание категории"
                  />
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Иконка
                  </label>
                  <div className="space-y-3">
                    {formData.icon && selectedIconComponent && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {React.createElement(selectedIconComponent, { 
                          className: "h-6 w-6 text-primary-600" 
                        })}
                        <span className="text-gray-900 dark:text-white font-medium">
                          {formData.icon}
                        </span>
                        <button
                          type="button"
                          onClick={removeIcon}
                          className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => setShowIconSelector(!showIconSelector)}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 transition-colors text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {formData.icon ? 'Изменить иконку' : 'Выбрать иконку'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Изображение категории
                  </label>
                  <ImageUpload
                    value={formData.image_url}
                    onChange={handleImageUpload}
                    placeholder="Загрузить изображение категории"
                  />
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Предварительный просмотр
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      {formData.icon && selectedIconComponent ? (
                        React.createElement(selectedIconComponent, { 
                          className: "h-8 w-8 text-primary-600" 
                        })
                      ) : formData.image_url ? (
                        <img
                          src={formData.image_url}
                          alt="Category preview"
                          className="h-8 w-8 object-cover rounded"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {formData.name || 'Название категории'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formData.description || 'Описание категории'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
                <span>{saving ? 'Создание...' : 'Создать категорию'}</span>
              </motion.button>
            </div>
          </motion.form>

          {/* Icon Selector Modal */}
          {showIconSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowIconSelector(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Выберите иконку
                  </h3>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="grid grid-cols-6 gap-3">
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon
                      return (
                        <button
                          key={option.name}
                          type="button"
                          onClick={() => selectIcon(option.name)}
                          className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          <IconComponent className="h-6 w-6 text-gray-600 dark:text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                            {option.name}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowIconSelector(false)}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </main>
      </div>
    </AdminGuard>
  )
} 