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
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-8">
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