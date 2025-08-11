'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { ProductCarousel } from '@/components/ProductCarousel'
import { ScrollingBanner } from '@/components/ScrollingBanner'
import { getAllProducts, getAllCategories, Product, Category } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProductCard } from '@/components/ProductCard'
import { useCart } from '@/components/CartProvider'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { cartItems } = useCart()

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data...')
        const [productsResult, categoriesResult] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ])

        console.log('Products result:', productsResult)
        console.log('Categories result:', categoriesResult)

        if (productsResult.data) {
          setProducts(productsResult.data)
        }
        if (categoriesResult.data) {
          setCategories(categoriesResult.data)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Группируем товары по категориям
  const getProductsByCategory = (categoryName: string) => {
    return products.filter(p => {
      const category = categories.find(c => c.id === p.category_id)
      return category?.name === categoryName
    })
  }

  // Новинки (последние добавленные товары)
  const newArrivals = products
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 8)

  // Распродажа (товары с original_price)
  const onSale = products.filter(p => p.original_price && p.original_price > p.price)

  // Товары по категориям
  const categoryProducts = categories.map(category => ({
    category,
    products: getProductsByCategory(category.name)
  })).filter(item => item.products.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      <Header />
      <ScrollingBanner />
      
      <main>
        {/* Desktop Hero Section - только на десктопе */}
        <div className="hidden md:block">
          <HeroSection categories={categories} />
        </div>
        
        {/* Mobile Categories Carousel - только на мобильных */}
        <div className="md:hidden">
          <div className="py-6 px-4">
            {/* Заголовок "Категории" */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                Категории
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
                Выберите интересующую вас категорию
              </p>
            </div>
            
            <div className="relative">
              <div className="flex space-x-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                {categories.map((category) => (
                  <motion.div
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-shrink-0 w-[calc(50%-6px)]"
                  >
                    <Link 
                      href={`/products?category=${encodeURIComponent(category.name)}`}
                      className="block bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden relative transition-all duration-300 hover:border-primary-200 dark:hover:border-primary-600"
                    >
                      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="text-2xl">{category.icon || '📁'}</span>
                          </div>
                        )}
                        
                        {/* Overlay с текстом поверх картинки */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="font-semibold text-white text-sm text-center drop-shadow-lg">
                              {category.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Cart Section - только на мобильных, под категориями */}
        <div className="md:hidden">
          <div className="py-6 px-4">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white shadow-lg mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01M9 13h6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Корзина</h3>
                    <p className="text-primary-100 text-sm">
                      {cartItems.length > 0 
                        ? `${cartItems.length} товар(ов) в корзине` 
                        : 'Добавьте товары и оформите заказ'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Мини-картинки товаров из корзины */}
              {cartItems.length > 0 && (
                <div className="mb-4">
                  <div className="flex space-x-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                    {cartItems.map((cartItem) => (
                      <motion.div
                        key={cartItem.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 w-12 h-12"
                      >
                        <div className="w-full h-full rounded-lg overflow-hidden border-2 border-white/30">
                          {cartItem.product?.image_url ? (
                            <img
                              src={cartItem.product.image_url}
                              alt={cartItem.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-white/20 flex items-center justify-center">
                              <span className="text-white/70 text-xs">📦</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              
              <Link
                href="/cart"
                className="w-full bg-white text-primary-600 hover:bg-gray-50 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <span>Завершить заказ</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Desktop Content - только на десктопе */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* New Arrivals */}
          {newArrivals.length > 0 && (
            <ProductCarousel 
              title="🆕 Новинки" 
              products={newArrivals}
            />
          )}
          
          {/* On Sale */}
          {onSale.length > 0 && (
            <ProductCarousel 
              title="🔥 Распродажа" 
              products={onSale}
            />
          )}
          
          {/* Category Products */}
          {categoryProducts.map(({ category, products }) => (
            products.length > 0 && (
              <ProductCarousel 
                key={category.id}
                title={category.name} 
                products={products}
              />
            )
          ))}
        </div>
        
        {/* Mobile Products Section - только на мобильных */}
        <div className="md:hidden">
          <div className="py-6 px-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Рекомендуемые товары
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 6).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="default"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer - только на десктопе */}
      <footer className="hidden md:block bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Smarto
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Ведущий магазин умного дома и электроники в Молдове.
              </p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Категории
              </h4>
              <ul className="space-y-2">
                {categories.slice(0, 5).map((category) => (
                  <li key={category.id}>
                    <a
                      href={`/products?category=${encodeURIComponent(category.name)}`}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {category.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Поддержка
              </h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Доставка
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Возврат
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    Гарантия
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Контакты
              </h4>
              <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                <li>+373 22 123 456</li>
                <li>info@smarto.md</li>
                <li>Кишинев, Молдова</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2024 Smarto. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 