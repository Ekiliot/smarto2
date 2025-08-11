'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Loader2,
  Search,
  X,
  Percent
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { 
  getAllProducts, 
  getBundleById,
  updateBundle,
  Product 
} from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface EditBundlePageProps {
  params: {
    id: string
  }
}

export default function EditBundlePage({ params }: EditBundlePageProps) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [suggestedSearchTerm, setSuggestedSearchTerm] = useState('')
  
  const [form, setForm] = useState({
    trigger_product_id: '',
    discount_percentage: 20,
    suggested_product_ids: [] as string[]
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Загружаем товары и бандл параллельно
        const [productsData, bundleData] = await Promise.all([
          getAllProducts(),
          getBundleById(params.id)
        ])
        
        if (productsData.data) {
          setProducts(productsData.data)
        }
        
        if (bundleData.data) {
          const bundle = bundleData.data
          setForm({
            trigger_product_id: bundle.trigger_product_id,
            discount_percentage: bundle.discount_percentage,
            suggested_product_ids: bundle.bundle_products?.map((bp: any) => bp.suggested_product_id) || []
          })
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.trigger_product_id || form.suggested_product_ids.length === 0) {
      alert('Пожалуйста, выберите триггерный товар и хотя бы один предложенный товар')
      return
    }

    setSaving(true)
    try {
      const { error } = await updateBundle(params.id, {
        trigger_product_id: form.trigger_product_id,
        discount_percentage: form.discount_percentage,
        suggested_product_ids: form.suggested_product_ids
      })
      
      if (error) {
        console.error('Error updating bundle:', error)
        alert('Ошибка при обновлении бандла')
      } else {
        alert('Бандл успешно обновлен!')
        router.push('/admin/bundles')
      }
    } catch (err) {
      console.error('Update bundle error:', err)
      alert('Ошибка при обновлении бандла')
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredSuggestedProducts = products.filter(product => 
    product.id !== form.trigger_product_id &&
    (product.name.toLowerCase().includes(suggestedSearchTerm.toLowerCase()) ||
     product.brand.toLowerCase().includes(suggestedSearchTerm.toLowerCase()))
  )

  const selectedTriggerProduct = products.find(p => p.id === form.trigger_product_id)
  const selectedSuggestedProducts = products.filter(p => form.suggested_product_ids.includes(p.id))

  const addSuggestedProduct = (productId: string) => {
    if (!form.suggested_product_ids.includes(productId)) {
      setForm(prev => ({
        ...prev,
        suggested_product_ids: [...prev.suggested_product_ids, productId]
      }))
    }
  }

  const removeSuggestedProduct = (productId: string) => {
    setForm(prev => ({
      ...prev,
      suggested_product_ids: prev.suggested_product_ids.filter(id => id !== productId)
    }))
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Загрузка бандла...</p>
          </div>
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/admin/bundles"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Назад к бандлам</span>
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Редактировать бандл
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Измените настройки бандла товаров
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Trigger Product Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Триггерный товар
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Выберите товар, который будет активировать бандл при добавлении в корзину
              </p>
              
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Products List */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                      Товары не найдены
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, trigger_product_id: product.id }))}
                          className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            form.trigger_product_id === product.id 
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500' 
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {product.brand}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {product.price} MDL
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Trigger Product */}
                {selectedTriggerProduct && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      Выбранный триггерный товар:
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {selectedTriggerProduct.image_url ? (
                          <img
                            src={selectedTriggerProduct.image_url}
                            alt={selectedTriggerProduct.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium text-green-800 dark:text-green-200">
                          {selectedTriggerProduct.name}
                        </h5>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          {selectedTriggerProduct.brand}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Percentage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Percent className="h-5 w-5 mr-2" />
                Скидка
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Укажите процент скидки для предложенных товаров
              </p>
              
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={form.discount_percentage}
                  onChange={(e) => setForm(prev => ({ ...prev, discount_percentage: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                <span className="text-gray-600 dark:text-gray-400">%</span>
              </div>
            </div>

            {/* Suggested Products Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Предложенные товары
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Выберите товары, которые будут предлагаться со скидкой при наличии триггерного товара в корзине
              </p>
              
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    value={suggestedSearchTerm}
                    onChange={(e) => setSuggestedSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Products List */}
                <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  {filteredSuggestedProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-600 dark:text-gray-400">
                      Товары не найдены
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredSuggestedProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addSuggestedProduct(product.id)}
                          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {product.brand}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {product.price} MDL
                              </div>
                              <div className="text-sm text-green-600 dark:text-green-400">
                                -{form.discount_percentage}%
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Suggested Products */}
                {selectedSuggestedProducts.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Выбранные товары ({selectedSuggestedProducts.length}):
                    </h4>
                    <div className="space-y-2">
                      {selectedSuggestedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {product.name}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {product.brand}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              -{form.discount_percentage}%
                            </span>
                            <button
                              type="button"
                              onClick={() => removeSuggestedProduct(product.id)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={saving || !form.trigger_product_id || form.suggested_product_ids.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                <span>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </span>
              </motion.button>
            </div>
          </motion.form>
        </main>
      </div>
    </AdminGuard>
  )
} 