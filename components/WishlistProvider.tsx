'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { 
  WishlistItem, 
  getWishlistItems, 
  addToWishlist, 
  removeFromWishlist, 
  isInWishlist, 
  getWishlistItemsCount,
  clearWishlist 
} from '@/lib/supabase'

interface WishlistContextType {
  wishlistItems: WishlistItem[]
  wishlistCount: number
  loading: boolean
  addToWishlist: (productId: string) => Promise<void>
  removeFromWishlist: (productId: string) => Promise<void>
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => Promise<void>
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadWishlist = async () => {
    if (!user) {
      setWishlistItems([])
      setWishlistCount(0)
      setLoading(false)
      return
    }

    try {
      const [wishlistResponse, countResponse] = await Promise.all([
        getWishlistItems(user.id),
        getWishlistItemsCount(user.id)
      ])

      if (wishlistResponse.error) throw wishlistResponse.error
      if (countResponse.error) throw countResponse.error

      setWishlistItems(wishlistResponse.data || [])
      setWishlistCount(countResponse.count)
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [user])

  const handleAddToWishlist = async (productId: string) => {
    if (!user) return

    try {
      const { error } = await addToWishlist(user.id, productId)
      if (error) throw error

      // Обновляем локальное состояние
      await loadWishlist()
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      throw error
    }
  }

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) return

    try {
      const { error } = await removeFromWishlist(user.id, productId)
      if (error) throw error

      // Обновляем локальное состояние
      setWishlistItems(prev => prev.filter(item => item.product_id !== productId))
      setWishlistCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      throw error
    }
  }

  const checkIsInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.product_id === productId)
  }

  const handleClearWishlist = async () => {
    if (!user) return

    try {
      const { error } = await clearWishlist(user.id)
      if (error) throw error

      setWishlistItems([])
      setWishlistCount(0)
    } catch (error) {
      console.error('Error clearing wishlist:', error)
      throw error
    }
  }

  const refreshWishlist = async () => {
    await loadWishlist()
  }

  const value: WishlistContextType = {
    wishlistItems,
    wishlistCount,
    loading,
    addToWishlist: handleAddToWishlist,
    removeFromWishlist: handleRemoveFromWishlist,
    isInWishlist: checkIsInWishlist,
    clearWishlist: handleClearWishlist,
    refreshWishlist
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
} 