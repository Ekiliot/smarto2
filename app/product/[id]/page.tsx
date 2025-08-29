'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
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
  FileText,
  Play,
  Star,
  Pause
} from 'lucide-react'
import { Header } from '@/components/Header'
import { ProductCard } from '@/components/ProductCard'
import ReviewSystem from '@/components/ReviewSystem/ReviewSystem'
import MobileReviewsBlock from '@/components/ReviewSystem/MobileReviewsBlock'
import MobileReviewsModal from '@/components/ReviewSystem/MobileReviewsModal'
import MediaViewer from '@/components/ReviewSystem/MediaViewer'
import CommentsModal from '@/components/ReviewSystem/CommentsModal'
import { getAllProducts, getAllCategories, Product, Category } from '@/lib/supabase'
import { getProductReviews } from '@/lib/supabase/reviews'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/CartProvider'
import { useWishlist } from '@/components/WishlistProvider'
import { useNavbarVisibility } from '@/components/NavbarVisibilityProvider'
import Link from 'next/link'

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
  const [showVideo, setShowVideo] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedTab, setSelectedTab] = useState<'description' | 'features' | 'reviews'>('description')
  const [addingToCart, setAddingToCart] = useState(false)
  const { addToCart } = useCart()
  const { wishlistItems, isInWishlist } = useWishlist()
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [showReviewsModal, setShowReviewsModal] = useState(false)
  const [showMediaViewer, setShowMediaViewer] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [currentReview, setCurrentReview] = useState<any>(null)
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([])

  const openComments = (review: any) => {
    setCurrentReview(review)
    setShowCommentsModal(true)
  }
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const { hideNavbar, showNavbar } = useNavbarVisibility()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResult, categoriesResult, reviewsResult] = await Promise.all([
          getAllProducts(),
          getAllCategories(),
          getProductReviews(params.id)
        ])
        
        if (productsResult.data) {
          setProducts(productsResult.data)
        }
        
        if (categoriesResult.data) {
          setCategories(categoriesResult.data)
        }

        if (reviewsResult) {
          setReviews(reviewsResult)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  // Управление навбаром при открытии/закрытии модальных окон
  useEffect(() => {
    if (showDescriptionModal || showReviewsModal || showMediaViewer || showCommentsModal) {
      hideNavbar()
      // Блокируем скролл body
      document.body.style.overflow = 'hidden'
    } else {
      showNavbar()
      // Восстанавливаем скролл body
      document.body.style.overflow = ''
    }
  }, [showDescriptionModal, showReviewsModal, showMediaViewer, showCommentsModal, hideNavbar, showNavbar])

  // Инициализация отображаемых товаров (исключая текущий)
  useEffect(() => {
    if (products.length > 0) {
      const filteredProducts = products.filter(p => p.id !== params.id)
      const shuffledProducts = [...filteredProducts].sort(() => Math.random() - 0.5)
      setDisplayedProducts(shuffledProducts.slice(0, 12)) // Начинаем с 12 товаров
      setHasMoreProducts(filteredProducts.length > 12)
    }
  }, [products, params.id])

  // Функция для загрузки дополнительных товаров
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMoreProducts) return

    setIsLoadingMore(true)
    
    setTimeout(() => {
      const currentCount = displayedProducts.length
      const filteredProducts = products.filter(p => p.id !== params.id)
      const shuffledProducts = [...filteredProducts].sort(() => Math.random() - 0.5)
      
      const nextBatch = shuffledProducts.slice(currentCount, currentCount + 8)
      
      if (nextBatch.length > 0) {
        setDisplayedProducts(prev => [...prev, ...nextBatch])
        setHasMoreProducts(currentCount + nextBatch.length < filteredProducts.length)
      } else {
        setHasMoreProducts(false)
      }
      
      setIsLoadingMore(false)
    }, 500) // Имитация загрузки
  }, [isLoadingMore, hasMoreProducts, displayedProducts.length, products, params.id])

  // Хук для отслеживания скролла и автоматической загрузки
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1000) {
        loadMoreProducts()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMoreProducts])

  const product = products.find(p => p.id === params.id)

  // Отладочная информация для текущего товара
  useEffect(() => {
    if (product) {
      console.log('🔍 Текущий товар:', {
        name: product.name,
        id: product.id,
        video_url: product.video_url,
        hasVideo: !!product.video_url,
        image_url: product.image_url,
        images: product.images
      })
    }
  }, [product])

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

  // Видео товара
  const productVideo = product.video_url





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



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-1 sm:px-2 md:px-4 lg:px-6 py-2 sm:py-4">
        {/* Breadcrumb - скрываем на мобильных */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 hidden md:block"
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

        {/* Мобильный заголовок - компактный */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 md:hidden"
        >
          <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {product.name}
          </h1>
        </motion.div>

        {/* Product Details */}
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-8 mb-6 lg:mb-8">
          {/* Desktop Product Gallery - только для десктопа */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 hidden lg:block"
          >
            {/* Main Image */}
            <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              {showVideo && productVideo ? (
                <video
                  src={productVideo}
                  controls
                  className="w-full h-full object-cover"
                  onError={() => setShowVideo(false)}
                />
              ) : (
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              )}
              
              {/* Navigation Arrows - только для изображений */}
              {!showVideo && productImages.length > 1 && (
                <>
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
                </>
              )}

              {/* Discount Badge */}
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                  -{discount}%
                </div>
              )}

              {/* Video Toggle Button */}
              {productVideo && (
                <button
                  onClick={() => setShowVideo(!showVideo)}
                  className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                  title={showVideo ? "Показать изображения" : "Показать видео"}
                >
                  {showVideo ? (
                    <Pause className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Play className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              )}

              {/* Image Counter - показываем текущее изображение */}
              {!showVideo && productImages.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                  {selectedImage + 1} / {productImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="grid grid-cols-4 gap-3">
              {/* Video Thumbnail */}
              {productVideo && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowVideo(true)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    showVideo
                      ? 'border-primary-500 shadow-lg'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }`}
                >
                  <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Play className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  </div>
                </motion.button>
              )}
              
              {/* Image Thumbnails */}
              {productImages.map((image, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedImage(index)
                    setShowVideo(false)
                  }}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                    !showVideo && selectedImage === index
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

            {/* Swipe Indicator for Desktop */}
            {productImages.length > 1 && (
              <div className="flex justify-center mt-3">
                <div className="flex space-x-2">
                  {productImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        !showVideo && selectedImage === index
                          ? 'bg-primary-500 w-6'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Mobile Product Gallery - только для мобильных */}
          <div className="lg:hidden">
            <div className="pb-2">
              {/* Main Image */}
              <div className="relative aspect-square bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg mb-2">
                {showVideo && productVideo ? (
                  <video
                    src={productVideo}
                    controls
                    className="w-full h-full object-cover"
                    onError={() => setShowVideo(false)}
                  />
                ) : (
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                )}
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    -{discount}%
                  </div>
                )}

                {/* Video Toggle Button */}
                {productVideo && (
                  <button
                    onClick={() => setShowVideo(!showVideo)}
                    className="absolute top-2 right-2 p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                    title={showVideo ? "Показать изображения" : "Показать видео"}
                  >
                    {showVideo ? (
                      <Pause className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <Play className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                )}

                {/* Navigation Arrows for Mobile - только для изображений */}
                {!showVideo && productImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-white/90 dark:bg-gray-800/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    </button>
                  </>
                )}

                {/* Image Counter - показываем текущее изображение */}
                {!showVideo && productImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {selectedImage + 1} / {productImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery - более компактная */}
              <div className="flex space-x-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                {/* Video Thumbnail */}
                {productVideo && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowVideo(true)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      showVideo
                        ? 'border-primary-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Play className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  </motion.button>
                )}
                
                {/* Image Thumbnails */}
                {productImages.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedImage(index)
                      setShowVideo(false)
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      !showVideo && selectedImage === index
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

              {/* Swipe Indicator */}
              {productImages.length > 1 && (
                <div className="flex justify-center mt-2">
                  <div className="flex space-x-1">
                    {productImages.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          !showVideo && selectedImage === index
                            ? 'bg-primary-500 w-4'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Product Info - только для десктопа */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6 hidden lg:block"
          >
            {/* Product Info */}
            <div>
              <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                {product.brand}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {product.name}
              </h1>

            {/* Price */}
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && (
                  <span className="text-2xl text-gray-500 line-through">
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
            <div className="space-y-3">
              <div 
                dangerouslySetInnerHTML={{ __html: product.description }}
                className="product-description-html line-clamp-2"
                data-tab="description"
              />
              <button
                onClick={() => {
                  // Прокручиваем к вкладке описания
                  const descriptionTab = document.querySelector('[data-tab="description"]')
                  if (descriptionTab) {
                    descriptionTab.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium hover:underline transition-colors"
              >
                Еще...
              </button>
            </div>

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
            </div>
          </motion.div>
        </div>

        {/* Mobile Product Info - только для мобильных */}
        <div className="lg:hidden">
          <div className="pt-1 pb-4 px-1 space-y-3">
            {/* Основная информация в плитках */}
            <div className="grid grid-cols-1 gap-3">
              {/* Бренд, название, цена и кнопка корзины - все в одной карточке */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-2">
                  {product.brand}
                </p>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {product.name}
                </h1>
                
                {/* Цена */}
                <div className="flex items-center space-x-3 mb-3">
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
                  <p className="text-green-600 dark:text-green-400 font-medium mb-3">
                    Экономия {formatPrice(product.original_price! - product.price)}
                  </p>
                )}

                {/* Количество и кнопка корзины */}
                <div className="space-y-3">
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
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
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

                            {/* Отзывы */}
              <MobileReviewsBlock
                productId={params.id}
                productName={product.name}
                onOpenReviews={() => setShowReviewsModal(true)}
                onOpenMediaViewer={(review) => {
                  setCurrentReview(review)
                  setShowMediaViewer(true)
                }}
                onOpenComments={openComments}
              />

              {/* Модальные окна */}
              <MobileReviewsModal
                isOpen={showReviewsModal}
                onClose={() => setShowReviewsModal(false)}
                productId={params.id}
                productName={product.name}
                onOpenMediaViewer={(review) => {
                  setCurrentReview(review)
                  setShowMediaViewer(true)
                }}
                onOpenComments={openComments}
              />

              <MediaViewer
                isOpen={showMediaViewer}
                onClose={() => setShowMediaViewer(false)}
                media={currentReview?.media?.[0] || {} as any}
                review={currentReview || {}}
                productName={product.name}
                allReviews={reviews.filter(r => r.media && r.media.length > 0)}
                currentReviewIndex={reviews.findIndex(r => r.id === currentReview?.id) || 0}
                onReviewChange={(index) => {
                  const reviewsWithMedia = reviews.filter(r => r.media && r.media.length > 0)
                  if (index >= 0 && index < reviewsWithMedia.length) {
                    setCurrentReview(reviewsWithMedia[index])
                  }
                }}
                onOpenComments={openComments}
                allProducts={products}
              />

              <CommentsModal
                isOpen={showCommentsModal}
                onClose={() => setShowCommentsModal(false)}
                review={currentReview || {}}
                productName={product.name}
              />

              {/* Основные возможности */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Основные возможности
                  </h3>
                  <div className="space-y-2">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Информация о доставке */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg">
                                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Информация о доставке
                  </h3>
                  <div className="space-y-3">
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

        {/* Отзывы для мобильной версии - УБИРАЕМ ОТСЮДА */}

        {/* Tabs - только для десктопа */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 hidden lg:block"
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

          <div className="py-6">
            <AnimatePresence mode="wait">
              {selectedTab === 'description' && (
                <motion.div
                  key="description"
                  data-tab="description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="prose prose-gray dark:prose-invert max-w-none"
                >
                  <div 
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="product-description-html"
                  />
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

              {selectedTab === 'reviews' && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ReviewSystem 
                    productId={params.id} 
                    productName={product.name} 
                  />
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
                <Link key={product.id} href={`/product/${product.id}`} className="block hover:scale-105 transition-transform duration-200">
                  <ProductCard
                    product={product}
                  />
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* Модальное окно с описанием - только для мобильных */}
      {/* Модальное окно с описанием товара */}
      <AnimatePresence>
        {showDescriptionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setShowDescriptionModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100) {
                  setShowDescriptionModal(false)
                }
              }}
              dragMomentum={false}
            >
              {/* Handle для свайпа */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Заголовок */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
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
                  <button
                    onClick={() => setShowDescriptionModal(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Контент */}
              <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-120px)]" style={{ overscrollBehavior: 'contain' }}>
                <div className="space-y-6">
                  {/* Описание */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Описание
                    </h3>
                    <div 
                      dangerouslySetInnerHTML={{ __html: product.description }}
                      className="product-description-html"
                    />
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

      {/* Может вам понравится */}
      <section className="py-4 sm:py-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-1 sm:px-2 md:px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Может вам понравится
            </h2>
          </motion.div>

          {/* Сетка товаров */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {displayedProducts.map((product, index) => (
              <motion.div
                key={`${product.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 20) * 0.05 }}
              >
                <Link href={`/product/${product.id}`} className="block hover:scale-105 transition-transform duration-200">
                <ProductCard
                  product={product}
                />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Индикатор загрузки */}
          {isLoadingMore && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-8"
            >
              <div className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Загружаем еще товары...</span>
              </div>
            </motion.div>
          )}

          {/* Сообщение о конце списка */}
          {!hasMoreProducts && displayedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-8"
            >
              <p className="text-gray-600 dark:text-gray-400">
                Вы просмотрели все доступные товары
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Отступ для нижнего навбара */}
      <div className="h-24 md:hidden" />
    </div>
  )
} 