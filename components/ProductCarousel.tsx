'use client'

import { ChevronLeft, ChevronRight, Sparkles, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ProductCard } from './ProductCard'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  price: number
  original_price?: number
  image_url: string
  brand: string
  in_stock: boolean
  stock_quantity?: number
}

interface ProductCarouselProps {
  title: string
  products: Product[]
  itemsPerView?: number
}

export function ProductCarousel({ title, products, itemsPerView = 4 }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentItemsPerView, setCurrentItemsPerView] = useState(itemsPerView)
  
  // Адаптивное количество товаров в зависимости от размера экрана
  const getItemsPerView = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 2 // sm: 2 товара на мобильных
      if (window.innerWidth < 1024) return 3 // lg: 3 товара на планшетах
      return itemsPerView // 4 товара на десктопе
    }
    return itemsPerView
  }
  
  // Обновляем количество товаров при изменении размера экрана
  useEffect(() => {
    const updateItemsPerView = () => {
      setCurrentItemsPerView(getItemsPerView())
    }
    
    updateItemsPerView()
    window.addEventListener('resize', updateItemsPerView)
    
    return () => window.removeEventListener('resize', updateItemsPerView)
  }, [itemsPerView])
  
  const totalSlides = Math.ceil(products.length / currentItemsPerView)

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const currentProducts = products.slice(
    currentIndex * currentItemsPerView,
    (currentIndex + 1) * currentItemsPerView
  )

  // Определяем тип карусели по заголовку
  const isNewArrivals = title.includes('Новинки')
  const isOnSale = title.includes('Распродажа')

  return (
    <div className="py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          {isNewArrivals && (
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          )}
          {isOnSale && (
            <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
              <Flame className="h-5 w-5 text-white" />
            </div>
          )}
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {isOnSale && (
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-full">
              SALE
            </span>
          )}
        </motion.div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={nextSlide}
            disabled={currentIndex === totalSlides - 1}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
          >
            {currentProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/product/${product.id}`}>
                <ProductCard 
                  product={product} 
                />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
          {Array.from({ length: totalSlides }, (_, i) => (
            <motion.button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex 
                  ? 'bg-primary-600 dark:bg-primary-400' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
            />
          ))}
        </div>
      )}
    </div>
  )
} 