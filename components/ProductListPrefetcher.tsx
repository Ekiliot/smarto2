'use client'

import { useEffect } from 'react'
import { useSmartPrefetch } from '@/lib/useSmartPrefetch'

interface ProductListPrefetcherProps {
  currentPage: number
  totalPages: number
  productsPerPage: number
  totalProducts: number
}

export function ProductListPrefetcher({ 
  currentPage, 
  totalPages, 
  productsPerPage, 
  totalProducts 
}: ProductListPrefetcherProps) {
  const { prefetchProductListPages } = useSmartPrefetch()

  useEffect(() => {
    // Prefetch соседние страницы
    if (totalPages > 1) {
      prefetchProductListPages(currentPage, totalPages)
    }
  }, [currentPage, totalPages, prefetchProductListPages])

  // Этот компонент не рендерит ничего видимого
  return null
} 