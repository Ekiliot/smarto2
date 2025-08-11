'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye,
  Filter,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { getAllProducts, deleteProduct } from '@/lib/supabase'

interface Product {
  id: string
  name: string
  description: string
  price: number
  purchase_price: number
  original_price?: number
  image_url: string
  category_id: string
  brand: string
  rating: number
  reviews_count: number
  in_stock: boolean
  stock_quantity: number
  features: string[]
  specifications: Record<string, string>
  created_at: string
  categories?: {
    id: string
    name: string
  }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStock, setFilterStock] = useState('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Загружаем товары
  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const { data, error } = await getAllProducts()
      if (error) {
        console.error('Error loading products:', error)
      } else {
        setProducts(data || [])
      }
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Фильтрация товаров
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || product.category_id === filterCategory
    const matchesStock = filterStock === 'all' || 
                        (filterStock === 'in_stock' && product.in_stock) ||
                        (filterStock === 'out_of_stock' && !product.in_stock)
    
    return matchesSearch && matchesCategory && matchesStock
  })

  // Удаление товара
  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return
    
    setDeletingId(id)
    try {
      const { error } = await deleteProduct(id)
      if (error) {
        console.error('Error deleting product:', error)
        alert('Ошибка при удалении товара')
      } else {
        setProducts(prev => prev.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Ошибка при удалении товара')
    } finally {
      setDeletingId(null)
    }
  }

  // Получаем уникальные категории для фильтра
  const categories = Array.from(new Set(products.map(p => p.categories?.name).filter(Boolean)))

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          </main>
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
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <motion.a
                    href="/admin"
                    whileHover={{ x: -5 }}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </motion.a>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Управление товарами
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {products.length} товаров в базе данных
                </p>
              </div>
              
              <motion.a
                href="/admin/products/new"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>Добавить товар</span>
              </motion.a>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Все товары</option>
                <option value="in_stock">В наличии</option>
                <option value="out_of_stock">Нет в наличии</option>
              </select>

              {/* Clear Filters */}
              <motion.button
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('')
                  setFilterStock('all')
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Очистить фильтры
              </motion.button>
            </div>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        product.in_stock 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {product.in_stock ? 'В наличии' : 'Нет в наличии'}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.rating}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {product.brand}
                    </p>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Price */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {product.price.toLocaleString('ru-RU')} MDL
                      </span>
                      {product.original_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {product.original_price.toLocaleString('ru-RU')} MDL
                        </span>
                      )}
                    </div>

                    {/* Category and Stock */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        {product.categories?.name || 'Без категории'}
                      </span>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        product.stock_quantity > 10 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : product.stock_quantity > 0
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {product.stock_quantity} шт.
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <motion.a
                          href={`/admin/products/${product.id}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </motion.a>
                        
                        <motion.a
                          href={`/admin/products/${product.id}/edit`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit3 className="h-4 w-4" />
                        </motion.a>
                      </div>
                      
                      <motion.button
                        onClick={() => handleDelete(product.id)}
                        disabled={deletingId === product.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Удалить"
                      >
                        {deletingId === product.id ? (
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
          {filteredProducts.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Товары не найдены
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {products.length === 0 
                  ? 'В базе данных пока нет товаров. Добавьте первый товар!'
                  : 'Попробуйте изменить фильтры поиска'
                }
              </p>
              {products.length === 0 && (
                <motion.a
                  href="/admin/products/new"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors duration-200"
                >
                  <Plus className="h-5 w-5" />
                  <span>Добавить первый товар</span>
                </motion.a>
              )}
            </motion.div>
          )}
        </main>
      </div>
    </AdminGuard>
  )
} 