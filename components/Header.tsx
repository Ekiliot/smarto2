'use client'

import { ShoppingCart, Search, User, LogOut, Heart, Coins } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import { useLoyalty } from './LoyaltyProvider'
import { useNavbarVisibility } from './NavbarVisibilityProvider'
import { SearchDropdown } from './SearchDropdown'
import { PWAInstallButton } from './PWAInstallButton'

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, signOut, signInWithGoogle } = useAuth()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { loyaltyPoints } = useLoyalty()
  const { isNavbarHidden } = useNavbarVisibility()
  const searchRef = useRef<HTMLDivElement>(null)

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

  // Скрываем header если navbar скрыт
  if (isNavbarHidden) {
    return null
  }

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 hidden md:block"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-10 md:h-16">
          {/* Logo - скрыт на мобильных */}
          <motion.a 
            href="/"
            whileHover={{ scale: 1.05 }}
            className="hidden md:flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Smarto
            </span>
          </motion.a>

          {/* Search Bar - скрыт на мобильных */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer"
                  readOnly
                />
              </div>
              <SearchDropdown 
                isOpen={isSearchOpen} 
                onClose={() => setIsSearchOpen(false)} 
              />
            </div>
          </div>

          {/* Right side actions - скрыты на мобильных */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <motion.a
                  href="/account"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  title={user.email}
                >
                  <User className="h-5 w-5" />
                </motion.a>
                <motion.button
                  onClick={signOut}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                  title="Выйти"
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <motion.button
                  onClick={async () => {
                    try {
                      await signInWithGoogle()
                    } catch (error) {
                      console.error('Error signing in with Google:', error)
                    }
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  title="Войти через Google"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </motion.button>
              <motion.a
                href="/login"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  title="Войти"
              >
                <User className="h-5 w-5" />
              </motion.a>
              </div>
            )}

            <motion.a
              href="/wishlist"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </motion.a>

            {/* PWA Install Button */}
            <PWAInstallButton variant="minimal" size="sm" className="hidden md:flex" />

            <motion.a
              href="/cart"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </motion.a>

            {user && (
              <motion.a
                href="/account/wallet"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-200"
                title={`${loyaltyPoints} баллов`}
              >
                <Coins className="h-5 w-5" />
                {loyaltyPoints > 0 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {loyaltyPoints > 999 ? '999+' : loyaltyPoints}
                  </span>
                )}
              </motion.a>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>
    </motion.header>
  )
} 