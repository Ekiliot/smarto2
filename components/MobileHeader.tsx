'use client'

import { Search, ArrowLeft, Heart, Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import { useLoyalty } from './LoyaltyProvider'
import { useNavbarVisibility } from './NavbarVisibilityProvider'
import { SearchDropdown } from './SearchDropdown'
import { useRouter, usePathname } from 'next/navigation'

export function MobileHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { user } = useAuth()
  const { cartCount } = useCart()
  const { wishlistItems, isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { loyaltyPoints } = useLoyalty()
  const { isNavbarHidden } = useNavbarVisibility()
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Определяем тип страницы
  const isHomePage = pathname === '/'
  const isProductsPage = pathname === '/products'
  const isProductPage = pathname.startsWith('/product/')
  const isAccountPage = pathname === '/account'

  // Получаем ID товара из URL для проверки вишлиста
  const productId = isProductPage ? pathname.split('/').pop() : null
  const isProductWishlisted = productId ? isInWishlist(productId) : false

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Скрытие/показ хедера при скроллинге
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Скроллим вниз и прошли 100px - скрываем
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Скроллим вверх - показываем
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleBack = () => {
    router.back()
  }

  const handleWishlistToggle = async () => {
    if (!user || !productId) return
    
    try {
      if (isProductWishlisted) {
        await removeFromWishlist(productId)
      } else {
        await addToWishlist(productId)
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    }
  }

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({
        title: 'Посмотрите этот товар!',
        url: typeof window !== 'undefined' ? window.location.href : ''
      })
    } else if (typeof navigator !== 'undefined' && typeof window !== 'undefined' && navigator.clipboard) {
      // Fallback для браузеров без поддержки Web Share API
      navigator.clipboard.writeText(window.location.href)
      // Можно добавить уведомление о копировании ссылки
    }
  }

  return (
    <AnimatePresence>
      {isVisible && !isAccountPage && !isNavbarHidden && (
        <motion.header 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 md:hidden"
        >
          <div className="px-4">
            <div className="flex items-center h-12">
              {/* Кнопка "Назад" - показываем везде кроме главной и /products */}
              {!isHomePage && !isProductsPage && (
                <motion.button
                  onClick={handleBack}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </motion.button>
              )}
              
              {/* Поле поиска - скрываем на странице товара */}
              {!isProductPage && (
                <div className="flex-1 relative" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Поиск товаров..."
                    onClick={() => setIsSearchOpen(true)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer text-sm"
                    readOnly
                  />
                  <SearchDropdown 
                    isOpen={isSearchOpen} 
                    onClose={() => setIsSearchOpen(false)} 
                  />
                </div>
              )}
              
              {/* Кнопки действий - только на странице товара, справа */}
              {isProductPage && (
                <div className="flex items-center space-x-2 ml-auto">
                  {/* Кнопка "Добавить в вишлист" */}
                  <motion.button
                    onClick={handleWishlistToggle}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 transition-colors duration-200 ${
                      isProductWishlisted
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isProductWishlisted ? 'fill-current' : ''}`} />
                  </motion.button>
                  
                  {/* Кнопка "Поделиться" */}
                  <motion.button
                    onClick={handleShare}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  >
                    <Share2 className="h-5 w-5" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  )
} 