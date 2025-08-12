'use client'

import { Home, Package, ShoppingCart, Heart, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from './AuthProvider'
import { useCart } from './CartProvider'
import { useWishlist } from './WishlistProvider'
import { useNavbarVisibility } from './NavbarVisibilityProvider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNavigation() {
  const { user } = useAuth()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()
  const { isNavbarHidden } = useNavbarVisibility()
  const pathname = usePathname()

  // Убеждаемся, что счетчики являются числами
  const safeCartCount = typeof cartCount === 'number' ? cartCount : 0
  const safeWishlistCount = typeof wishlistCount === 'number' ? wishlistCount : 0

  const navItems = [
    {
      href: '/',
      icon: Home,
      label: 'Главная',
      isActive: pathname === '/'
    },
    {
      href: '/products',
      icon: Package,
      label: 'Товары',
      isActive: pathname === '/products'
    },
    {
      href: '/cart',
      icon: ShoppingCart,
      label: 'Корзина',
      isActive: pathname === '/cart',
      badge: safeCartCount > 0 ? safeCartCount : undefined
    },
    {
      href: '/wishlist',
      icon: Heart,
      label: 'Вишлист',
      isActive: pathname === '/wishlist',
      badge: safeWishlistCount > 0 ? safeWishlistCount : undefined
    },
    {
      href: user ? '/account' : '/login',
      icon: User,
      label: user ? 'Аккаунт' : 'Войти',
      isActive: pathname.startsWith('/account') || pathname === '/login'
    }
  ]

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: isNavbarHidden ? 100 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-lg"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 py-2 px-1"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="relative flex flex-col items-center"
              >
                <Icon 
                  className={`h-6 w-6 mb-1 ${
                    item.isActive 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} 
                />
                <span className={`text-xs font-medium ${
                  item.isActive 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {item.label}
                </span>
                
                {/* Badge для корзины и вишлиста */}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
} 