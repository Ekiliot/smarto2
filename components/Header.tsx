'use client'

import { ShoppingCart, Search, User, LogOut, Heart, Coins } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeToggle } from './ThemeToggle'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import { useLoyalty } from './LoyaltyProvider'
import { SearchDropdown } from './SearchDropdown'

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, signOut } = useAuth()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { loyaltyPoints } = useLoyalty()
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
              <motion.a
                href="/login"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
              >
                <User className="h-5 w-5" />
              </motion.a>
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