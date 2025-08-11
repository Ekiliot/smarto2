'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Folder, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  Filter,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Palette
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { getAllCategories, deleteCategory } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  description: string
  image_url: string
  icon?: string
  product_count: number
  created_at: string
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Загружаем категории
  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await getAllCategories()
      if (error) {
        console.error('Error loading categories:', error)
      } else {
        setCategories(data || [])
      }
    } catch (err) {
      console.error('Error loading categories:', err)
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация категорий
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || 
                       (filterType === 'with_image' && category.image_url) ||
                       (filterType === 'with_icon' && category.icon) ||
                       (filterType === 'empty' && !category.image_url && !category.icon)
    
    return matchesSearch && matchesType
  })

  // Удаление категории
  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию? Все товары в ней станут без категории.')) return
    
    setDeletingId(id)
    try {
      const { error } = await deleteCategory(id)
      if (error) {
        console.error('Error deleting category:', error)
        alert('Ошибка при удалении категории')
      } else {
        setCategories(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      alert('Ошибка при удалении категории')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <motion.a
                  href="/admin"
                  whileHover={{ x: -5 }}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.a>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Управление категориями
                </h1>
              </div>
              
              <motion.a
                href="/admin/categories/new"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>Создать категорию</span>
              </motion.a>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400">
              Управляйте категориями товаров и их визуальным представлением
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего категорий</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
                </div>
                <Folder className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">С изображениями</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {categories.filter(c => c.image_url).length}
                  </p>
                </div>
                <ImageIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">С иконками</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {categories.filter(c => c.icon).length}
                  </p>
                </div>
                <Palette className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Всего товаров</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {categories.reduce((sum, c) => sum + c.product_count, 0)}
                  </p>
                </div>
                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">P</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск категорий..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Все категории</option>
                <option value="with_image">С изображениями</option>
                <option value="with_icon">С иконками</option>
                <option value="empty">Без медиа</option>
              </select>

              {/* Clear Filters */}
              <motion.button
                onClick={() => {
                  setSearchTerm('')
                  setFilterType('all')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Очистить фильтры
              </motion.button>
            </div>
          </motion.div>

          {/* Categories Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredCategories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
                >
                  {/* Category Image/Icon */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : category.icon ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-6xl text-gray-400 dark:text-gray-500">
                          {category.icon}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Folder className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {category.product_count} товаров
                      </span>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {category.name}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {category.description || 'Описание отсутствует'}
                    </p>

                    {/* Media Type Indicator */}
                    <div className="mb-4">
                      {category.image_url && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full mr-2">
                          <ImageIcon className="h-3 w-3 inline mr-1" />
                          Изображение
                        </span>
                      )}
                      {category.icon && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          <Palette className="h-3 w-3 inline mr-1" />
                          Иконка
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <motion.a
                        href={`/admin/categories/${category.id}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Редактировать</span>
                      </motion.a>
                      
                      <motion.button
                        onClick={() => handleDelete(category.id)}
                        disabled={deletingId === category.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === category.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredCategories.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Folder className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Категории не найдены
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Попробуйте изменить фильтры или создайте новую категорию
              </p>
              <motion.a
                href="/admin/categories/new"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Создать категорию</span>
              </motion.a>
            </motion.div>
          )}
        </main>
      </div>
    </AdminGuard>
  )
} 