'use client'

import { usePrefetch } from './usePrefetch'
import { useCallback, useEffect } from 'react'

interface SmartPrefetchOptions {
  prefetchCart?: boolean
  prefetchWishlist?: boolean
  prefetchRelatedProducts?: boolean
  prefetchUserPages?: boolean
}

export function useSmartPrefetch(options: SmartPrefetchOptions = {}) {
  const { prefetch, prefetchOnHover } = usePrefetch()
  
  const {
    prefetchCart = true,
    prefetchWishlist = true,
    prefetchRelatedProducts = true,
    prefetchUserPages = true,
  } = options

  // Prefetch часто используемых страниц
  const prefetchCommonPages = useCallback(() => {
    if (prefetchCart) {
      prefetch('/cart', { priority: 'high' })
    }
    if (prefetchWishlist) {
      prefetch('/wishlist', { priority: 'high' })
    }
    if (prefetchUserPages) {
      prefetch('/account', { priority: 'low' })
      prefetch('/login', { priority: 'low' })
    }
  }, [prefetch, prefetchCart, prefetchWishlist, prefetchUserPages])

  // Prefetch связанных товаров
  const prefetchRelatedProduct = useCallback((productId: string) => {
    if (prefetchRelatedProducts) {
      prefetch(`/product/${productId}`, { priority: 'low' })
    }
  }, [prefetch, prefetchRelatedProducts])

  // Prefetch при добавлении в корзину
  const prefetchOnAddToCart = useCallback(() => {
    if (prefetchCart) {
      prefetch('/cart', { priority: 'high', delay: 0 })
    }
  }, [prefetch, prefetchCart])

  // Prefetch при добавлении в вишлист
  const prefetchOnAddToWishlist = useCallback(() => {
    if (prefetchWishlist) {
      prefetch('/wishlist', { priority: 'high', delay: 0 })
    }
  }, [prefetch, prefetchWishlist])

  // Prefetch при просмотре товара
  const prefetchProductPage = useCallback((productId: string) => {
    prefetch(`/product/${productId}`, { priority: 'high', delay: 0 })
  }, [prefetch])

  // Prefetch соседних страниц в списке товаров
  const prefetchProductListPages = useCallback((currentPage: number, totalPages: number) => {
    const pagesToPrefetch = []
    
    // Следующая страница
    if (currentPage < totalPages) {
      pagesToPrefetch.push(currentPage + 1)
    }
    
    // Предыдущая страница
    if (currentPage > 1) {
      pagesToPrefetch.push(currentPage - 1)
    }
    
    // Prefetch с низким приоритетом
    pagesToPrefetch.forEach(page => {
      prefetch(`/products?page=${page}`, { priority: 'low' })
    })
  }, [prefetch])

  // Prefetch при инициализации
  useEffect(() => {
    // Небольшая задержка для prefetch'а общих страниц
    const timer = setTimeout(prefetchCommonPages, 2000)
    return () => clearTimeout(timer)
  }, [prefetchCommonPages])

  return {
    prefetchCommonPages,
    prefetchRelatedProduct,
    prefetchOnAddToCart,
    prefetchOnAddToWishlist,
    prefetchProductPage,
    prefetchProductListPages,
    prefetchOnHover,
  }
} 