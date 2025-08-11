'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Truck,
  Shield,
  RotateCcw,
  Check,
  Minus,
  Plus,
  Loader2,
  FileText
} from 'lucide-react'
import { Header } from '@/components/Header'
import { ProductCard } from '@/components/ProductCard'
import { BundleOffer } from '@/components/BundleOffer'
import { getAllProducts, getAllCategories, Product, Category } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/CartProvider'
import { useWishlist } from '@/components/WishlistProvider'

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedTab, setSelectedTab] = useState<'description' | 'features' | 'reviews'>('description')
  const [addingToCart, setAddingToCart] = useState(false)
  const { addToCart } = useCart()
  const { wishlistItems, isInWishlist } = useWishlist()
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [swipeStartY, setSwipeStartY] = useState(0)
  const [swipeDeltaY, setSwipeDeltaY] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ])
        
        if (productsResult.data) {
          setProducts(productsResult.data)
        }
        
        if (categoriesResult.data) {
          setCategories(categoriesResult.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Блокировка скролла страницы при открытом модальном окне
  useEffect(() => {
    if (showDescriptionModal) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }

    // Очистка при размонтировании
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [showDescriptionModal])

  const product = products.find(p => p.id === params.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка товара...</p>
        </div>
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Товар не найден
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Запрашиваемый товар не существует или был удален.
          </p>
        </div>
      </div>
    )
  }

  // Реальные изображения товара из базы данных
  const productImages = [
    product.image_url, // Главное изображение
    ...product.images // Дополнительные изображения
  ].filter(Boolean) // Убираем пустые значения





  // Похожие товары (показываем товары из той же категории)
  const similarProducts = products
    .filter(p => p.category_id === product.category_id && p.id !== product.id)
    .slice(0, 4)

  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length)
  }

  const handleAddToCart = async () => {
    if (!product.in_stock) return
    
    setAddingToCart(true)
    try {
      await addToCart(product.id, quantity)
      // Можно добавить уведомление об успешном добавлении
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleSwipeStart = (e: React.TouchEvent) => {
    setSwipeStartY(e.touches[0].clientY)
    setSwipeDeltaY(0)
  }

  const handleSwipeMove = (e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY
    const deltaY = currentY - swipeStartY
    
    if (deltaY > 0) { // Только свайп вниз
      setSwipeDeltaY(deltaY)
    }
  }

  const handleSwipeEnd = () => {
    if (swipeDeltaY > 100) { // Если свайп больше 100px
      setShowDescriptionModal(false)
    }
    setSwipeDeltaY(0)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a href="/" className="hover:text-primary-600 transition-colors">Главная</a></li>
            <li>/</li>
            <li><a href="/products" className="hover:text-primary-600 transition-colors">Продукты</a></li>
            <li>/</li>
            <li><a href="/products" className="hover:text-primary-600 transition-colors">Категория</a></li>
            <li>/</li>
            <li className="text-gray-900 dark:text-white font-medium">{product.name}</li>
          </ol>
        </motion.nav>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Desktop Product Gallery - только для десктопа */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 hidden lg:block"
          >
            {/* Main Image */}
            <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3">
              {productImages.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === index
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Mobile Product Gallery - только для мобильных */}
          <div className="lg:hidden">
            <div className="py-6 px-4">
              {/* Main Image */}
              <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg mb-4">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discount}%
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              <div className="flex space-x-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                {productImages.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? 'border-primary-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Product Info - только для десктопа */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 hidden lg:block"
          >
            {/* Brand and Rating */}
            <div>
              <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                {product.brand}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {product.name}
              </h1>
              

            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && (
                  <span className="text-xl text-gray-500 line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
              {discount > 0 && (
                <p className="text-green-600 dark:text-green-400 font-medium">
                  Экономия {formatPrice(product.original_price! - product.price)}
                </p>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {product.description}
            </p>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Количество:
                </span>
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!product.in_stock || addingToCart}
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {addingToCart ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                  <span>
                    {addingToCart 
                      ? 'Добавляется...' 
                      : product.in_stock 
                        ? 'Добавить в корзину' 
                        : 'Нет в наличии'
                    }
                  </span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-all duration-200"
                >
                  <Share2 className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Bundle Offers */}
              <BundleOffer product={product} />
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Основные возможности:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-primary-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Бесплатная доставка по Молдове от 1000 MDL
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Гарантия 2 года на все товары
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="h-5 w-5 text-primary-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Возврат в течение 14 дней
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Product Info - только для мобильных */}
        <div className="lg:hidden">
          <div className="py-6 px-4 space-y-6">
            {/* Основная информация в плитках */}
            <div className="grid grid-cols-1 gap-4">
              {/* Бренд, название, цена и кнопка корзины - все в одной карточке */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                  {product.brand}
                </p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {product.name}
                </h1>
                
                {/* Цена */}
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && (
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-green-600 dark:text-green-400 font-medium mb-4">
                    Экономия {formatPrice(product.original_price! - product.price)}
                  </p>
                )}

                {/* Количество и кнопка корзины */}
                <div className="space-y-4">
                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Количество:
                    </span>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 text-gray-900 dark:text-white font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Кнопка корзины */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!product.in_stock || addingToCart}
                    onClick={handleAddToCart}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {addingToCart ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-5 w-5" />
                    )}
                    <span>
                      {addingToCart 
                        ? 'Добавляется...' 
                        : product.in_stock 
                          ? 'Добавить в корзину' 
                          : 'Нет в наличии'
                      }
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Описание */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <button
                  onClick={() => setShowDescriptionModal(true)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Описание
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Подробная информация о товаре
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              </div>

              {/* Бандлы и предложения - прямо под описанием */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <BundleOffer product={product} />
              </div>

              {/* Основные возможности */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Основные возможности
                </h3>
                <div className="space-y-3">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Информация о доставке */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Информация о доставке
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Бесплатная доставка</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">По Молдове от 1000 MDL</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Гарантия 2 года</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">На все товары</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Возврат 14 дней</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Без объяснения причин</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - только для десктопа */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 hidden lg:block"
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { id: 'description', label: 'Описание' },
                { id: 'features', label: 'Характеристики' },
                { id: 'reviews', label: 'Отзывы' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    selectedTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            <AnimatePresence mode="wait">
              {selectedTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="prose prose-gray dark:prose-invert max-w-none"
                >
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {product.description}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                    Этот продукт разработан с использованием передовых технологий и материалов высшего качества. 
                    Он обеспечивает надежную работу и длительный срок службы, что делает его отличным выбором 
                    для вашего умного дома.
                  </p>
                </motion.div>
              )}

              {selectedTab === 'features' && (
                <motion.div
                  key="features"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Технические характеристики</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Бренд</span>
                        <span className="font-medium">{product.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Категория</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {categories.find(c => c.id === product.category_id)?.name || 'Неизвестно'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400">Наличие</span>
                        <span className="font-medium">{product.in_stock ? 'В наличии' : 'Нет в наличии'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Возможности</h3>
                    <div className="space-y-2">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}


            </AnimatePresence>
          </div>
        </motion.div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Похожие товары
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Модальное окно с описанием - только для мобильных */}
      <AnimatePresence>
        {showDescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ 
              // Скрываем нижнее меню при открытом модальном окне
              '--hide-bottom-nav': 'true'
            } as React.CSSProperties}
            onTouchStart={handleSwipeStart}
            onTouchMove={handleSwipeMove}
            onTouchEnd={handleSwipeEnd}
          >
            {/* Блюр на фоне */}
            <motion.div
              initial={{ backdropFilter: 'blur(0px)' }}
              animate={{ backdropFilter: 'blur(10px)' }}
              exit={{ backdropFilter: 'blur(0px)' }}
              className="absolute inset-0 bg-black/20"
              onClick={() => setShowDescriptionModal(false)}
            />
            
            {/* Контент модального окна */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: swipeDeltaY > 0 ? swipeDeltaY : 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl"
              style={{ 
                maxHeight: '90vh',
                touchAction: 'pan-y'
              }}
              onTouchStart={handleSwipeStart}
              onTouchMove={handleSwipeMove}
              onTouchEnd={handleSwipeEnd}
            >
              {/* Индикатор свайпа */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Заголовок */}
              <div className="px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      Описание товара
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {product.brand} - {product.name}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Контент */}
              <div className="px-6 py-6 overflow-y-auto max-h-[70vh]">
                <div className="space-y-6">
                  {/* Описание */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Описание
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {product.description}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-4">
                      Этот продукт разработан с использованием передовых технологий и материалов высшего качества. 
                      Он обеспечивает надежную работу и длительный срок службы, что делает его отличным выбором 
                      для вашего умного дома.
                    </p>
                  </div>
                  
                  {/* Характеристики */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Характеристики
                    </h3>
                    <div className="space-y-3">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Технические детали */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Технические детали
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Бренд</span>
                        <span className="font-medium text-gray-900 dark:text-white">{product.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Категория</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {categories.find(c => c.id === product.category_id)?.name || 'Неизвестно'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Наличие</span>
                        <span className={`font-medium ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                          {product.in_stock ? 'В наличии' : 'Нет в наличии'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 