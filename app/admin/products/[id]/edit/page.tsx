'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  X, 
  Upload,
  Loader2,
  Edit3
} from 'lucide-react'
import { Header } from '@/components/Header'
import { AdminGuard } from '@/components/AdminGuard'
import { ImageUpload } from '@/components/ImageUpload'
import { MultipleImageUpload } from '@/components/MultipleImageUpload'
import { VideoUpload } from '@/components/VideoUpload'
import { ProductGallery } from '@/components/ProductGallery'
import { HTMLEditor } from '@/components/HTMLEditor'
import { getProduct, updateProduct, getAllCategories, uploadProductImage, uploadProductVideo } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
}

interface Specification {
  key: string
  value: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  purchase_price: number
  original_price?: number
  image_url: string
  images: string[]
  category_id: string
  brand: string
  in_stock: boolean
  stock_quantity: number
  features: string[]
  specifications: Record<string, string>
}

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    purchase_price: '',
    original_price: '',
    image_url: '',
    video_url: '',
    category_id: '',
    brand: '',
    in_stock: true,
    stock_quantity: '0'
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [images, setImages] = useState<string[]>([])

  const [features, setFeatures] = useState<string[]>([''])
  const [specifications, setSpecifications] = useState<Specification[]>([
    { key: '', value: '' }
  ])

  // Загружаем товар и категории
  useEffect(() => {
    loadData()
  }, [productId])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading data for product ID:', productId)
      console.log('Params:', params)
      
      const [productResult, categoriesResult] = await Promise.all([
        getProduct(productId),
        getAllCategories()
      ])

      console.log('Product result:', productResult)
      console.log('Categories result:', categoriesResult)

      if (productResult.error) {
        console.error('Product error:', productResult.error)
        throw productResult.error
      }

      if (categoriesResult.error) {
        console.error('Error loading categories:', categoriesResult.error)
      }

      const productData = productResult.data
      if (productData) {
        console.log('Product data loaded:', productData)
        setProduct(productData)
        setFormData({
          name: productData.name,
          description: productData.description,
          price: productData.price.toString(),
          purchase_price: productData.purchase_price.toString(),
          original_price: productData.original_price?.toString() || '',
          image_url: productData.image_url,
          video_url: productData.video_url || '',
          category_id: productData.category_id,
          brand: productData.brand,
          in_stock: productData.in_stock,
          stock_quantity: productData.stock_quantity.toString()
        })
        setImages(productData.images || [])
        setFeatures(productData.features?.length ? productData.features : [''])
        
        if (productData.specifications) {
          const specs = Object.entries(productData.specifications).map(([key, value]) => ({ 
            key, 
            value: String(value) 
          }))
          setSpecifications(specs.length ? specs : [{ key: '', value: '' }])
        }
      } else {
        console.log('No product data found')
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data)
      }
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Ошибка при загрузке данных товара')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFeature = () => {
    setFeatures(prev => [...prev, ''])
  }

  const removeFeature = (index: number) => {
    setFeatures(prev => prev.filter((_, i) => i !== index))
  }

  const updateFeature = (index: number, value: string) => {
    setFeatures(prev => prev.map((feature, i) => i === index ? value : feature))
  }

  const addSpecification = () => {
    setSpecifications(prev => [...prev, { key: '', value: '' }])
  }

  const removeSpecification = (index: number) => {
    setSpecifications(prev => prev.filter((_, i) => i !== index))
  }

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    setSpecifications(prev => prev.map((spec, i) => 
      i === index ? { ...spec, [field]: value } : spec
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    // Валидация
    if (!formData.name.trim() || !formData.description.trim() || !formData.price || !formData.category_id) {
      setError('Пожалуйста, заполните все обязательные поля')
      setSaving(false)
      return
    }

    try {
      let finalImageUrl = formData.image_url
      let finalImages: string[] = []

      // Загружаем главное изображение если выбран файл
      if (selectedFile) {
        setIsUploadingImage(true)
        const { data: imageUrl, error: uploadError } = await uploadProductImage(selectedFile, productId)
        
        if (uploadError) {
          throw uploadError
        }
        finalImageUrl = imageUrl
      }

      // Загружаем видео если выбран файл
      let finalVideoUrl = formData.video_url
      if (selectedVideoFile) {
        setIsUploadingImage(true)
        const { data: videoUrl, error: uploadError } = await uploadProductVideo(selectedVideoFile, productId)
        
        if (uploadError) {
          throw uploadError
        }
        finalVideoUrl = videoUrl
      }

      // Загружаем дополнительные изображения
      if (selectedFiles.length > 0) {
        setIsUploadingImage(true)
        const uploadPromises = selectedFiles.map(async (file) => {
          const { data: imageUrl, error } = await uploadProductImage(file, productId)
          if (error) throw error
          return imageUrl
        })

        try {
          const uploadedUrls = await Promise.all(uploadPromises)
          finalImages = uploadedUrls
        } catch (uploadError) {
          throw uploadError
        }
      }

      // Если есть изображения из URL (не blob), добавляем их
      const urlImages = images.filter(url => !url.startsWith('blob:'))
      finalImages = [...finalImages, ...urlImages]

      // Обновляем товар
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        purchase_price: parseFloat(formData.purchase_price || formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        image_url: finalImageUrl,
        video_url: finalVideoUrl,
        images: finalImages,
        category_id: formData.category_id,
        brand: formData.brand.trim(),
        in_stock: formData.in_stock,
        stock_quantity: parseInt(formData.stock_quantity),
        features: features.filter(f => f.trim()),
        specifications: specifications.filter(s => s.key.trim() && s.value.trim()).reduce((acc, spec) => {
          acc[spec.key] = spec.value
          return acc
        }, {} as Record<string, string>)
      }

      const { error: updateError } = await updateProduct(productId, updateData)

      if (updateError) {
        throw updateError
      }

      // Перенаправляем на список товаров
      router.push('/admin/products')
    } catch (err) {
      console.error('Error updating product:', err)
      setError('Ошибка при обновлении товара')
    } finally {
      setSaving(false)
      setIsUploadingImage(false)
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          </main>
        </div>
      </AdminGuard>
    )
  }

  if (!product) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />
          <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">Товар не найден</p>
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
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-2">
              <motion.button
                onClick={() => router.push('/admin/products')}
                whileHover={{ x: -5 }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Редактировать товар
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Измените информацию о товаре
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </motion.div>
            )}

            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Основная информация
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Название товара *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Введите название товара"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Бренд
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Введите бренд"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Категория *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Галерея товара
                  </label>
                  <ProductGallery
                    mainImage={formData.image_url}
                    onMainImageChange={(url) => handleInputChange('image_url', url)}
                    additionalImages={images}
                    onAdditionalImagesChange={setImages}
                    videoUrl={formData.video_url}
                    onVideoUrlChange={(url) => handleInputChange('video_url', url)}
                    onMainImageFileSelect={(file) => setSelectedFile(file)}
                    onAdditionalImagesFileSelect={(files) => setSelectedFiles(prev => [...prev, ...files])}
                    onVideoFileSelect={(file) => setSelectedVideoFile(file)}
                    disabled={saving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Цена продажи (MDL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Закупочная цена (MDL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Старая цена (MDL)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.original_price}
                    onChange={(e) => handleInputChange('original_price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>

                {/* Profit Calculator */}
                <div className="md:col-span-2">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Калькулятор прибыли
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Прибыль</p>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {formData.price && formData.purchase_price 
                            ? `${(parseFloat(formData.price) - parseFloat(formData.purchase_price)).toFixed(2)} MDL`
                            : '0.00 MDL'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Маржа</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {formData.price && formData.purchase_price && parseFloat(formData.price) > 0
                            ? `${(((parseFloat(formData.price) - parseFloat(formData.purchase_price)) / parseFloat(formData.price)) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Количество на складе *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Описание *
                </label>
                <HTMLEditor
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Подробное описание товара с поддержкой HTML разметки..."
                  disabled={saving}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Используйте панель инструментов для форматирования текста. Поддерживается HTML разметка.
                </p>
              </div>

              <div className="mt-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.in_stock}
                    onChange={(e) => handleInputChange('in_stock', e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Товар в наличии (автоматически обновляется на основе количества)
                  </span>
                </label>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Возможности товара
                </h2>
                <motion.button
                  type="button"
                  onClick={addFeature}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Добавить</span>
                </motion.button>
              </div>
              
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Введите возможность товара"
                    />
                    {features.length > 1 && (
                      <motion.button
                        type="button"
                        onClick={() => removeFeature(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Характеристики товара
                </h2>
                <motion.button
                  type="button"
                  onClick={addSpecification}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Добавить</span>
                </motion.button>
              </div>
              
              <div className="space-y-3">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={spec.key}
                      onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Название характеристики"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Значение"
                    />
                    {specifications.length > 1 && (
                      <motion.button
                        type="button"
                        onClick={() => removeSpecification(index)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4">
              <motion.button
                type="button"
                onClick={() => router.push('/admin/products')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Отмена
              </motion.button>
              
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Сохранение...</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="h-5 w-5" />
                    <span>Сохранить изменения</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
        </main>
      </div>
    </AdminGuard>
  )
} 