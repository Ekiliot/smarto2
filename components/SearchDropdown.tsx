'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2, Package } from 'lucide-react'
import { searchProducts } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface SearchResult {
  id: string
  name: string
  price: number
  image_url: string | null
  brand: string | null
  in_stock: boolean
}

interface SearchDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchDropdown({ isOpen, onClose }: SearchDropdownProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Enter':
          event.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            window.location.href = `/product/${results[selectedIndex].id}`
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, onClose])

  useEffect(() => {
    // Очищаем предыдущий таймаут
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Если запрос пустой, очищаем результаты
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(-1)
      return
    }

    // Устанавливаем новый таймаут для поиска
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data, error } = await searchProducts(query, 8)
        if (error) throw error
        setResults(data || [])
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300) // Задержка 300мс для предотвращения частых запросов

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query])

  const handleResultClick = (productId: string) => {
    window.location.href = `/product/${productId}`
  }

  const handleClearSearch = () => {
    setQuery('')
    setResults([])
    setSelectedIndex(-1)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 z-50 mt-2"
        >
          <div
            ref={searchRef}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Поиск товаров..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white dark:focus:bg-gray-600"
                />
                {query && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Поиск...
                  </span>
                </div>
              ) : query && results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Товары не найдены
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Попробуйте изменить запрос
                  </p>
                </div>
              ) : results.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {results.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        selectedIndex === index ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                      }`}
                      onClick={() => handleResultClick(product.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {product.name}
                          </h4>
                          {product.brand && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.brand}
                            </p>
                          )}
                          <div className="flex items-center mt-1">
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                              {formatPrice(product.price)}
                            </span>
                            {!product.in_stock && (
                              <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                                Нет в наличии
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {query && results.length > 0 && (
              <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Найдено {results.length} товаров • Используйте ↑↓ для навигации, Enter для выбора
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 