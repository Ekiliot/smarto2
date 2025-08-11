'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  ShoppingCart,
  Loader2,
  Search
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { 
  getAllBundles, 
  deleteBundle, 
  ProductBundle,
  Product 
} from '@/lib/supabase'
import Link from 'next/link'

export default function BundlesPage() {
  const [bundles, setBundles] = useState<ProductBundle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingBundle, setDeletingBundle] = useState<string | null>(null)

  useEffect(() => {
    loadBundles()
  }, [])

  const loadBundles = async () => {
    try {
      setLoading(true)
      const { data, error } = await getAllBundles()
      
      if (error) {
        console.error('Error loading bundles:', error)
      } else {
        setBundles(data || [])
      }
    } catch (err) {
      console.error('Bundles load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBundle = async (bundleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот бандл?')) return

    setDeletingBundle(bundleId)
    try {
      const { error } = await deleteBundle(bundleId)
      
      if (error) {
        console.error('Error deleting bundle:', error)
        alert('Ошибка при удалении бандла')
      } else {
        setBundles(prev => prev.filter(bundle => bundle.id !== bundleId))
      }
    } catch (err) {
      console.error('Delete bundle error:', err)
      alert('Ошибка при удалении бандла')
    } finally {
      setDeletingBundle(null)
    }
  }

  const filteredBundles = bundles.filter(bundle => {
    const triggerProduct = bundle.trigger_product
    const searchLower = searchTerm.toLowerCase()
    
    return (
      triggerProduct?.name.toLowerCase().includes(searchLower) ||
      triggerProduct?.brand.toLowerCase().includes(searchLower) ||
      bundle.discount_percentage.toString().includes(searchLower)
    )
  })

  const getSuggestedProducts = (bundle: ProductBundle): Product[] => {
    return bundle.bundle_products?.map((bp: any) => bp.suggested_product).filter(Boolean) || []
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Управление бандлами
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Создавайте и управляйте бандлами товаров со скидками
                </p>
              </div>
              
              <Link
                href="/admin/bundles/new"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Создать бандл
              </Link>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Поиск по товарам или скидке..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin mr-3" />
                <span className="text-gray-600 dark:text-gray-400">Загрузка бандлов...</span>
              </div>
            ) : filteredBundles.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'Бандлы не найдены' : 'Бандлы не созданы'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm 
                    ? 'Попробуйте изменить поисковый запрос'
                    : 'Создайте первый бандл для увеличения продаж'
                  }
                </p>
                {!searchTerm && (
                  <Link
                    href="/admin/bundles/new"
                    className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Создать первый бандл
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredBundles.map((bundle) => {
                    const suggestedProducts = getSuggestedProducts(bundle)
                    return (
                      <motion.div
                        key={bundle.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                      >
                        {/* Bundle Header */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
                                <ShoppingCart className="h-5 w-5 text-primary-600" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  Бандл #{bundle.id.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Скидка {bundle.discount_percentage}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/admin/bundles/${bundle.id}`}
                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Редактировать"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDeleteBundle(bundle.id)}
                                disabled={deletingBundle === bundle.id}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                title="Удалить"
                              >
                                {deletingBundle === bundle.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Trigger Product */}
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Триггерный товар:
                          </h4>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              {bundle.trigger_product?.image_url ? (
                                <img
                                  src={bundle.trigger_product.image_url}
                                  alt={bundle.trigger_product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {bundle.trigger_product?.name || 'Товар не найден'}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {bundle.trigger_product?.brand}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Suggested Products */}
                        <div className="p-6">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Предложенные товары ({suggestedProducts.length}):
                          </h4>
                          <div className="space-y-2">
                            {suggestedProducts.map((product) => (
                              <div key={product.id} className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <Package className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h6 className="font-medium text-gray-900 dark:text-white text-xs">
                                    {product.name}
                                  </h6>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {product.brand}
                                  </p>
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  -{bundle.discount_percentage}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </AdminGuard>
  )
} 