'use client'

import { Heart, Loader2, ShoppingCart, Star } from 'lucide-react'
import { useState } from 'react'
import { useWishlist } from './WishlistProvider'
import { useAuth } from './AuthProvider'
import { useCart } from './CartProvider'
import { formatPrice } from '@/lib/utils'

interface ProductCardProps {
  product: {
    id: string
    name: string
    image_url: string
    original_price?: number
    price: number
    brand?: string
    rating?: number
    review_count?: number
    in_stock: boolean
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [cartLoading, setCartLoading] = useState(false)
  
  const discount = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const isInWishlistState = isInWishlist(product.id)

  const handleWishlistToggle = async () => {
    if (!user) {
      alert('Для добавления в избранное необходимо войти в аккаунт')
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
      alert('Произошла ошибка при работе с избранным')
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      alert('Для добавления в корзину необходимо войти в аккаунт')
      return
    }

    if (!product.in_stock) {
      alert('Товар отсутствует на складе')
      return
    }

    setCartLoading(true)
    try {
      await addToCart(product.id, 1)
      } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Произошла ошибка при добавлении в корзину')
    } finally {
      setCartLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden product-card">
      <div className="p-3">
        <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl overflow-hidden">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
              className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-xs">Нет фото</span>
                  </div>
                )}
                
          {/* Скидка */}
                {discount > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    -{discount}%
            </div>
          )}
          
          {/* Кнопка вишлиста */}
          <button
                    onClick={handleWishlistToggle}
                    disabled={wishlistLoading}
            className="absolute top-2 right-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center wishlist-button card-action-button disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {wishlistLoading ? (
              <Loader2 className="animate-spin text-gray-600" />
                    ) : (
                      <Heart 
                className={`${
                          isInWishlistState 
                            ? 'text-red-500 fill-current' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`} 
                      />
                    )}
          </button>
            </div>

        {/* Информация о товаре */}
        <div className="mt-3 space-y-2">
          {/* Название товара */}
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight">
                  {product.name}
                </h3>

          {/* Бренд */}
                {product.brand && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.brand}
                  </p>
                )}

          {/* Рейтинг */}
          {product.rating && (
            <div className="flex items-center space-x-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(product.rating!)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {product.rating.toFixed(1)}
                {product.review_count && ` (${product.review_count})`}
              </span>
            </div>
          )}

          {/* Цена */}
                <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price)}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(product.original_price)}
                    </span>
                  )}
                </div>
              </div>

        {/* Кнопка корзины в самом низу */}
        <div className="mt-4">
          <button
                onClick={handleAddToCart}
            disabled={!product.in_stock || cartLoading}
            className={`w-full px-3 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center space-x-2 text-sm ${
                  product.in_stock
                    ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
            {cartLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                <span>
                  {product.in_stock 
                ? (cartLoading ? 'Добавление...' : 'Добавить в корзину')
                    : 'Нет в наличии'
                  }
                </span>
          </button>
        </div>
      </div>
            </div>
  )
} 