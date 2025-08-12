'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'
import { useLoyalty } from './LoyaltyProvider'
import { useSmartPrefetch } from '@/lib/useSmartPrefetch'
import { 
  CartItem, 
  getCartItems, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearCart, 
  getCartItemsCount,
  getBundlesForCart,
  ProductBundle
} from '@/lib/supabase'

interface CartContextType {
  cartItems: CartItem[]
  cartCount: number
  loading: boolean
  activeBundles: ProductBundle[]
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeFromCart: (cartItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  refreshCart: () => Promise<void>
  getBundleDiscount: (productId: string) => number
  getBundlePair: (productId: string) => {
    bundle: ProductBundle;
    triggerProduct: CartItem;
    suggestedProduct: CartItem;
    discount: number;
  } | null
  isProductInBundle: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { prefetchOnAddToCart } = useSmartPrefetch()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [activeBundles, setActiveBundles] = useState<ProductBundle[]>([])

  // Загружаем корзину при изменении пользователя
  useEffect(() => {
    if (user) {
      loadCart()
    } else {
      setCartItems([])
      setCartCount(0)
      setActiveBundles([])
    }
  }, [user])

  const loadCart = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: items } = await getCartItems(user.id)
      const { count } = await getCartItemsCount(user.id)
      
      setCartItems(items || [])
      setCartCount(count)

      // Загружаем активные бандлы для товаров в корзине
      if (items && items.length > 0) {
        const productIds = items.map(item => item.product_id)
        const { data: bundles } = await getBundlesForCart(productIds)
        
        if (bundles) {
          // Фильтруем только активные бандлы (где есть и триггерный, и предложенный товар)
          const activeBundles = bundles.filter(bundle => {
            const triggerInCart = items.some(item => item.product_id === bundle.trigger_product_id)
            const suggestedInCart = bundle.bundle_products?.some((bp: any) => 
              items.some(item => item.product_id === bp.suggested_product_id)
            )
            return triggerInCart && suggestedInCart
          })
          
          setActiveBundles(activeBundles)
        }
      } else {
        setActiveBundles([])
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      window.location.href = '/login'
      return
    }

    // Prefetch страницу корзины при добавлении товара
    prefetchOnAddToCart()

    try {
      await addToCart(user.id, productId, quantity)
      await loadCart() // Перезагружаем корзину
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    if (!user) return

    try {
      await updateCartItemQuantity(cartItemId, quantity)
      await loadCart() // Перезагружаем корзину
    } catch (error) {
      console.error('Error updating cart item:', error)
    }
  }

  const handleRemoveFromCart = async (cartItemId: string) => {
    if (!user) return

    try {
      await removeFromCart(cartItemId)
      await loadCart() // Перезагружаем корзину
    } catch (error) {
      console.error('Error removing from cart:', error)
    }
  }

  const handleClearCart = async () => {
    if (!user) return

    try {
      await clearCart(user.id)
      setCartItems([])
      setCartCount(0)
      setActiveBundles([])
    } catch (error) {
      console.error('Error clearing cart:', error)
    }
  }

  const getBundleDiscount = (productId: string): number => {
    // Ищем бандл, где этот товар участвует (либо как триггерный, либо как предложенный)
    const bundle = activeBundles.find(b => 
      b.trigger_product_id === productId ||
      b.bundle_products?.some((bp: any) => bp.suggested_product_id === productId)
    )
    return bundle ? bundle.discount_percentage : 0
  }

  const getBundlePair = (productId: string) => {
    // Возвращаем информацию о паре товаров в бандле
    const bundle = activeBundles.find(b => 
      b.trigger_product_id === productId ||
      b.bundle_products?.some((bp: any) => bp.suggested_product_id === productId)
    )
    
    if (!bundle) return null
    
    const triggerInCart = cartItems.find(item => item.product_id === bundle.trigger_product_id)
    const suggestedInCart = cartItems.find(item => 
      bundle.bundle_products?.some((bp: any) => bp.suggested_product_id === item.product_id)
    )
    
    if (triggerInCart && suggestedInCart) {
      return {
        bundle,
        triggerProduct: triggerInCart,
        suggestedProduct: suggestedInCart,
        discount: bundle.discount_percentage
      }
    }
    
    return null
  }

  const isProductInBundle = (productId: string): boolean => {
    return activeBundles.some(bundle => 
      bundle.trigger_product_id === productId || 
      bundle.bundle_products?.some((bp: any) => bp.suggested_product_id === productId)
    )
  }

  const value: CartContextType = {
    cartItems,
    cartCount,
    loading,
    activeBundles,
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeFromCart: handleRemoveFromCart,
    clearCart: handleClearCart,
    refreshCart: loadCart,
    getBundleDiscount,
    getBundlePair,
    isProductInBundle
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
} 