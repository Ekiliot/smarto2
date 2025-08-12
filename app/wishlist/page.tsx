'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Trash2, 
  ShoppingCart, 
  Eye, 
  Loader2,
  Package,
  ArrowLeft
} from 'lucide-react'
import { Header } from '@/components/Header'
import { useAuth } from '@/components/AuthProvider'
import { useWishlist } from '@/components/WishlistProvider'
import { useCart } from '@/components/CartProvider'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'

export default function WishlistPage() {
  const { user } = useAuth()
  const { wishlistItems, loading, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [clearLoading, setClearLoading] = useState(false)

  const handleRemoveFromWishlist = async (productId: string) => {
    setActionLoading(productId)
    try {
      await removeFromWishlist(productId)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddToCart = async (productId: string) => {
    setActionLoading(`cart-${productId}`)
    try {
      await addToCart(productId, 1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleClearWishlist = async () => {
    setClearLoading(true)
    try {
      await clearWishlist()
    } catch (error) {
      console.error('Error clearing wishlist:', error)
    } finally {
      setClearLoading(false)
    }
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col items-center justify-center py-8 sm:py-12">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Войдите в аккаунт
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 text-center px-4">
              Чтобы просматривать избранные товары, необходимо войти в аккаунт
            </p>
            <Link
              href="/login"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Войти
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      <Header />
      
      {/* Мобильная версия wishlist */}
      <div className="md:hidden">
        <main className="px-4 py-6 space-y-6">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Избранное
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {wishlistItems.length} товаров в избранном
            </p>
          </motion.div>

          {/* Баннер с информацией */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">💖 Ваши избранные товары</h3>
                <p className="text-pink-100 text-sm">
                  {wishlistItems.length > 0 
                    ? `Добавлено ${wishlistItems.length} товаров` 
                    : 'Добавьте товары в избранное'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatPrice(wishlistItems.reduce((total, item) => total + (item.product?.price || 0), 0))}
                </div>
                <div className="text-pink-100 text-sm">Общая стоимость</div>
              </div>
            </div>
          </motion.div>



          {/* Список товаров */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center py-8"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-8 w-8 text-primary-600" />
              </motion.div>
            </motion.div>
          ) : wishlistItems.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              >
                <Heart className="h-16 w-16 text-gray-400 mb-4" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center"
              >
                Избранное пусто
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-gray-600 dark:text-gray-400 mb-6 text-center px-4"
              >
                Добавьте товары в избранное, чтобы они появились здесь
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link
                  href="/products"
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Перейти к товарам
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              {wishlistItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      {/* Изображение товара */}
                      <div className="relative w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">Нет фото</span>
                          </div>
                        )}
                      </div>

                      {/* Информация о товаре */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                          {item.product?.name}
                        </h3>
                        {item.product?.brand && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            {item.product.brand}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatPrice(item.product?.price || 0)}
                          </span>
                          {item.product?.original_price && item.product.original_price > (item.product?.price || 0) && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              {formatPrice(item.product.original_price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="flex flex-col space-y-2 flex-shrink-0">
                        {/* Кнопка добавления в корзину */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddToCart(item.product_id)}
                          disabled={actionLoading === `cart-${item.product_id}`}
                          className="w-10 h-10 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          title="Добавить в корзину"
                        >
                          {actionLoading === `cart-${item.product_id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ShoppingCart className="h-4 w-4" />
                          )}
                        </motion.button>

                        {/* Кнопка удаления из избранного */}
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRemoveFromWishlist(item.product_id)}
                          disabled={actionLoading === item.product_id}
                          className="w-10 h-10 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                          title="Удалить из избранного"
                        >
                          {actionLoading === item.product_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>

      {/* Десктопная версия */}
      <main className="hidden md:block max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors self-start sm:self-auto"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm sm:text-base">Назад</span>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Избранное
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Ваши избранные товары
                </p>
              </div>
            </div>
            
            {wishlistItems.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearWishlist}
                disabled={clearLoading}
                className="px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base self-start sm:self-auto"
              >
                {clearLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Очистить</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Wishlist Content */}
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-8 sm:py-12"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </motion.div>
        ) : wishlistItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-8 sm:py-12"
          >
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center">
              Избранное пусто
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 text-center px-4">
              Добавьте товары в избранное, чтобы они появились здесь
            </p>
            <Link
              href="/products"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base"
            >
              Перейти к товарам
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {wishlistItems.map((item) => (
              <ProductCard
                key={item.id}
                product={item.product!}
                variant="default"
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 