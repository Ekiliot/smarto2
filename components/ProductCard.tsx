'use client'

import { Heart, ShoppingCart, Eye, Loader2, Share2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import { useLoyalty } from './LoyaltyProvider'
import { useAuth } from './AuthProvider'
import { useState } from 'react'

interface ProductCardProps {
  product: {
    id: string
    name: string
    price: number
    original_price?: number
    image_url: string
    brand: string
    in_stock: boolean
    stock_quantity?: number
  }
  variant?: 'default' | 'horizontal'
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { addItemsToCartTask, shareProductTask } = useLoyalty()
  const { user } = useAuth()
  const [addingToCart, setAddingToCart] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  
  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const isInWishlistState = isInWishlist(product.id)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!product.in_stock) return
    
    setAddingToCart(true)
    try {
      await addToCart(product.id, 1)
      // Вызываем задание лояльности для отслеживания добавления товаров
      if (user) {
        await addItemsToCartTask()
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!user) {
      // Перенаправляем на страницу входа
      window.location.href = '/login'
      return
    }
    
    setWishlistLoading(true)
    try {
      if (isInWishlistState) {
        await removeFromWishlist(product.id)
      } else {
        await addToWishlist(product.id)
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const url = `${window.location.origin}/product/${product.id}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Посмотрите этот товар: ${product.name} от ${product.brand}`,
          url: url
        })
        
        // Выполняем задание лояльности
        if (user) {
          await shareProductTask()
        }
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback для браузеров без поддержки Web Share API
      try {
        await navigator.clipboard.writeText(url)
        alert('Ссылка скопирована в буфер обмена!')
        
        // Выполняем задание лояльности
        if (user) {
          await shareProductTask()
        }
      } catch (error) {
        console.error('Error copying to clipboard:', error)
        // Если и копирование не сработало, показываем ссылку
        prompt('Скопируйте эту ссылку:', url)
        
        // Все равно засчитываем попытку поделиться
        if (user) {
          await shareProductTask()
        }
      }
    }
  }

  return (
    <>
      {variant === 'horizontal' ? (
        // Горизонтальная версия для мобильных
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: 2 }}
          whileTap={{ x: 0 }}
          className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          <a href={`/product/${product.id}`} className="block">
            <div className="flex">
              {/* Product Image */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-xs">Нет фото</span>
                  </div>
                )}
                
                {/* Discount Badge */}
                {discount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 left-1 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg"
                  >
                    -{discount}%
                  </motion.div>
                )}

                {/* Stock Badge */}
                {!product.in_stock && (
                  <div className="absolute top-1 right-1 z-10 bg-gray-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    Нет
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight mb-1">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {product.brand}
                    </p>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      {formatPrice(product.price)}
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between">
                  {/* Quick Actions */}
                  <div className="flex items-center space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleWishlistToggle}
                      disabled={wishlistLoading}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title={isInWishlistState ? 'Удалить из избранного' : 'Добавить в избранное'}
                    >
                      {wishlistLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart 
                          className={`h-4 w-4 ${
                            isInWishlistState 
                              ? 'text-red-500 fill-current' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`} 
                        />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      title="Поделиться товаром"
                    >
                      <Share2 className="h-4 w-4" />
                    </motion.button>
                    
                    <motion.a
                      href={`/product/${product.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                      title="Посмотреть детали"
                    >
                      <Eye className="h-4 w-4" />
                    </motion.a>
                  </div>

                  {/* Add to Cart Button */}
                  <motion.button
                    onClick={handleAddToCart}
                    disabled={!product.in_stock || addingToCart}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 text-xs ${
                      product.in_stock
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {addingToCart ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-3 w-3" />
                    )}
                    <span>
                      {product.in_stock 
                        ? (addingToCart ? '...' : 'В корзину')
                        : 'Нет'
                      }
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>
          </a>
        </motion.div>
      ) : (
        // Обычная вертикальная версия
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
          <a href={`/product/${product.id}`} className="block">
            {/* Discount Badge */}
            {discount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-1 sm:px-3 sm:py-1 rounded-full shadow-lg"
              >
                <span className="sm:hidden">-{discount}%</span>
                <span className="hidden sm:inline">🔥 -{discount}%</span>
              </motion.div>
            )}

            {/* Stock Badge */}
            {!product.in_stock && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                <span className="sm:hidden">Нет</span>
                <span className="hidden sm:inline">Нет в наличии</span>
              </div>
            )}

            {/* Product Image */}
            <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-xs sm:text-sm">Нет фото</span>
                </div>
              )}
              
              {/* Quick Actions Overlay - скрыт на мобильных */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    title={isInWishlistState ? 'Удалить из избранного' : 'Добавить в избранное'}
                  >
                    {wishlistLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                    ) : (
                      <Heart 
                        className={`h-4 w-4 ${
                          isInWishlistState 
                            ? 'text-red-500 fill-current' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`} 
                      />
                    )}
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleShare}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Поделиться товаром"
                  >
                    <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </motion.button>
                  
                  <motion.a
                    href={`/product/${product.id}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Посмотреть детали"
                  >
                    <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </motion.a>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-3 sm:p-4">
              {/* Product Header */}
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                  {product.name}
                </h3>
                {product.brand && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    {product.brand}
                  </p>
                )}
              </div>

              {/* Price Section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
                
                {/* Stock Status */}
                {!product.in_stock && (
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Нет в наличии
                  </span>
                )}
              </div>

              {/* Mobile Quick Actions - только на мобильных */}
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  title={isInWishlistState ? 'Удалить из избранного' : 'Добавить в избранное'}
                >
                  {wishlistLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart 
                      className={`h-4 w-4 ${
                        isInWishlistState 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} 
                    />
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 mx-2"
                  title="Поделиться товаром"
                >
                  <Share2 className="h-4 w-4" />
                </motion.button>
                
                <motion.a
                  href={`/product/${product.id}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 flex items-center justify-center py-2.5 px-3 text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  title="Посмотреть детали"
                >
                  <Eye className="h-4 w-4" />
                </motion.a>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                onClick={handleAddToCart}
                disabled={!product.in_stock || addingToCart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3 sm:py-2.5 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base ${
                  product.in_stock
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {addingToCart ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                <span>
                  {product.in_stock 
                    ? (addingToCart ? 'Добавление...' : 'В корзину')
                    : 'Нет в наличии'
                  }
                </span>
              </motion.button>
            </div>
          </a>
        </motion.div>
      )}
    </>
  )
} 