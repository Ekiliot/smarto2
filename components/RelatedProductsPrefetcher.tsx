'use client'

import { useEffect } from 'react'
import { useSmartPrefetch } from '@/lib/useSmartPrefetch'

interface RelatedProductsPrefetcherProps {
  productIds: string[]
  delay?: number
}

export function RelatedProductsPrefetcher({ 
  productIds, 
  delay = 1000 
}: RelatedProductsPrefetcherProps) {
  const { prefetchRelatedProduct } = useSmartPrefetch()

  useEffect(() => {
    // Prefetch связанные товары с задержкой
    const timer = setTimeout(() => {
      productIds.forEach(productId => {
        prefetchRelatedProduct(productId)
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [productIds, delay, prefetchRelatedProduct])

  // Этот компонент не рендерит ничего видимого
  return null
} 