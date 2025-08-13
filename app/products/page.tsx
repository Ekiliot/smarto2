'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, ShoppingCart, Heart, Eye } from 'lucide-react'
import { Header } from '@/components/Header'
import { ProductCard } from '@/components/ProductCard'
import { getAllProducts, getAllCategories, Product, Category } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useNavbarVisibility } from '@/components/NavbarVisibilityProvider'
import Link from 'next/link'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'newest'>('featured')
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [minPrice, setMinPrice] = useState<number>(0)
  const [maxPrice, setMaxPrice] = useState<number>(15000)
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const [dragY, setDragY] = useState(0)
  const { hideNavbar, showNavbar } = useNavbarVisibility()

  // Загружаем данные
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          getAllProducts(),
          getAllCategories()
        ])

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

  // Обрабатываем параметр category из URL
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [searchParams])

  // Функция для закрытия модального окна свайпом
  const handleSwipeToClose = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (direction === 'down') {
      setIsFiltersModalOpen(false)
      // Восстанавливаем скролл body
      document.body.style.overflow = ''
    }
  }

  // Функция для открытия модального окна
  const openFiltersModal = () => {
    setIsFiltersModalOpen(true)
    hideNavbar()
    // Блокируем скролл body
    document.body.style.overflow = 'hidden'
  }

  // Функция для закрытия модального окна
  const closeFiltersModal = () => {
    setIsFiltersModalOpen(false)
    showNavbar()
    // Восстанавливаем скролл body
    document.body.style.overflow = ''
  }

  // Обработка свайпа для закрытия модального окна
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 100) {
      closeFiltersModal()
    }
    setDragY(0)
  }

  // Фильтрация и сортировка продуктов
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products

    // Фильтр по категории
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => {
        const category = categories.find(c => c.id === product.category_id)
        return category?.name === selectedCategory
      })
    }

    // Фильтр по цене
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    )

    // Сортировка
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered = [...filtered].sort((a, b) => b.id.localeCompare(a.id))
        break
      default:
        // featured - оставляем как есть
        break
    }

    return filtered
  }, [products, categories, selectedCategory, sortBy, priceRange])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      <Header />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {selectedCategory === 'all' ? 'Все продукты' : selectedCategory}
            </h1>
            {selectedCategory !== 'all' && (
              <motion.a
                href="/products"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors self-start sm:self-auto"
              >
                Показать все
              </motion.a>
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            {selectedCategory === 'all' 
              ? 'Откройте для себя лучшие умные устройства и электронику'
              : `Товары в категории "${selectedCategory}"`
            }
          </p>
        </motion.div>

        {/* Mobile Filters Button - только на мобильных */}
        <div className="sm:hidden mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openFiltersModal}
            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Filter className="h-5 w-5 text-primary-600" />
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              Фильтры и сортировка
            </span>
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.button>
        </div>

        {/* Desktop Filters and Controls - скрыты на мобильных */}
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          {/* Category Filter Row */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Категории
            </h3>
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900'
                }`}
              >
                Все категории
              </motion.button>
              
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === category.name
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900'
                  }`}
                >
                  {category.name}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Price Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Цена:
              </span>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    setMinPrice(value)
                    setPriceRange([value, priceRange[1]])
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Мин"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 15000
                    setMaxPrice(value)
                    setPriceRange([priceRange[0], value])
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Макс"
                />
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Сортировка:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-low' | 'price-high' | 'newest')}
                  className="appearance-none bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-2 pr-10 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer text-sm font-medium transition-all duration-200"
                >
                  <option value="featured">Популярные</option>
                  <option value="price-low">Цена: по возрастанию</option>
                  <option value="price-high">Цена: по убыванию</option>
                  <option value="newest">Новые</option>
                </select>
              </div>
            </div>
          </div>
        </div>



        {/* Results Count */}
        <div className="mb-4 sm:mb-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Найдено {filteredAndSortedProducts.length} товаров
            {selectedCategory !== 'all' && ` в категории "${selectedCategory}"`}
          </p>
        </div>

        {/* Products Grid/List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedCategory}-${sortBy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
          >
            {filteredAndSortedProducts.map((product, index) => (
              <Link key={product.id} href={`/product/${product.id}`}>
                <ProductCard
                  product={product}
                />
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredAndSortedProducts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Filter className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Товары не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Попробуйте изменить фильтры или категорию
            </p>
          </motion.div>
        )}
      </main>

      {/* Модальное окно с фильтрами */}
      <AnimatePresence>
        {isFiltersModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={closeFiltersModal}
          >
            <motion.div
              ref={modalRef}
              initial={{ y: '100%' }}
              animate={{ y: dragY }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              dragMomentum={false}
            >
              {/* Handle для свайпа */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Заголовок */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Фильтры и сортировка
                  </h2>
                  <button
                    onClick={closeFiltersModal}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Содержимое фильтров */}
              <div className="px-6 py-4 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
                {/* Категории */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Категории
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCategory('all')}
                      className={`p-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                        selectedCategory === 'all'
                          ? 'bg-primary-600 text-white shadow-lg'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900'
                      }`}
                    >
                      Все категории
                    </motion.button>
                    
                    {categories.map((category) => (
                      <motion.button
                        key={category.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`p-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                          selectedCategory === category.name
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900'
                        }`}
                      >
                        {category.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Диапазон цен */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Диапазон цен
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">От</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0
                          setMinPrice(value)
                          setPriceRange([value, priceRange[1]])
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">До</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 15000
                          setMaxPrice(value)
                          setPriceRange([priceRange[0], value])
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="15000"
                      />
                    </div>
                  </div>
                </div>

                {/* Сортировка */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Сортировка
                  </h3>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'featured' | 'price-low' | 'price-high' | 'newest')}
                      className="w-full appearance-none bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-4 py-3 pr-10 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary-500 focus:outline-none cursor-pointer text-sm font-medium transition-all duration-200"
                    >
                      <option value="featured">Популярные</option>
                      <option value="price-low">Цена: по возрастанию</option>
                      <option value="price-high">Цена: по убыванию</option>
                      <option value="newest">Новые</option>
                    </select>
                  </div>
                </div>

                {/* Кнопка применить */}
                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeFiltersModal}
                    className="w-full bg-primary-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg"
                  >
                    Применить фильтры
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 