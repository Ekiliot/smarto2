'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'

interface PrefetchOptions {
  priority?: 'high' | 'low'
  delay?: number
}

export function usePrefetch() {
  const router = useRouter()
  const prefetchedUrls = useRef<Set<string>>(new Set())
  const prefetchTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const prefetch = useCallback((url: string, options: PrefetchOptions = {}) => {
    const { priority = 'low', delay = 0 } = options
    
    // Если уже prefetch'или, не делаем повторно
    if (prefetchedUrls.current.has(url)) return

    const doPrefetch = () => {
      try {
        router.prefetch(url)
        prefetchedUrls.current.add(url)
        console.log(`Prefetched: ${url}`)
      } catch (error) {
        console.warn(`Failed to prefetch ${url}:`, error)
      }
    }

    if (delay > 0) {
      const timeout = setTimeout(doPrefetch, delay)
      prefetchTimeouts.current.set(url, timeout)
    } else {
      doPrefetch()
    }
  }, [router])

  const prefetchOnHover = useCallback((url: string, options: PrefetchOptions = {}) => {
    const { delay = 100 } = options
    
    return {
      onMouseEnter: () => prefetch(url, { ...options, delay }),
      onTouchStart: () => prefetch(url, { ...options, delay: 0 }),
    }
  }, [prefetch])

  const prefetchOnClick = useCallback((url: string, options: PrefetchOptions = {}) => {
    return {
      onClick: () => prefetch(url, { ...options, priority: 'high', delay: 0 }),
    }
  }, [prefetch])

  // Очистка таймаутов при размонтировании
  useEffect(() => {
    return () => {
      prefetchTimeouts.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return {
    prefetch,
    prefetchOnHover,
    prefetchOnClick,
    isPrefetched: (url: string) => prefetchedUrls.current.has(url),
  }
} 