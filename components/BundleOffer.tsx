'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Package, 
  ShoppingCart, 
  Percent,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { 
  getActiveBundlesForProduct, 
  getBundlesWithSuggestedProduct,
  BundleWithProducts,
  BundleWithTrigger,
  Product 
} from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/CartProvider'
import Link from 'next/link'

interface BundleOfferProps {
  product: Product
}

export function BundleOffer({ product }: BundleOfferProps) {
  const [bundles, setBundles] = useState<BundleWithProducts[]>([])
  const [triggerBundles, setTriggerBundles] = useState<BundleWithTrigger[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const { addToCart } = useCart()

  useEffect(() => {
    const loadBundles = async () => {
      try {
        setLoading(true)
        
        // Загружаем бандлы, где этот товар является триггерным
        const [activeBundles, suggestedBundles] = await Promise.all([
          getActiveBundlesForProduct(product.id),
          getBundlesWithSuggestedProduct(product.id)
        ])
        
        if (activeBundles.data) {
          setBundles(activeBundles.data)
        }
        if (suggestedBundles.data) {
          setTriggerBundles(suggestedBundles.data)
        }
      } catch (error) {
        console.error('Error loading bundles:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBundles()
  }, [product.id])

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId)
    try {
      await addToCart(productId, 1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  if (bundles.length === 0 && triggerBundles.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Active Bundles - где этот товар триггерный */}
      {bundles.map((bundle) => (
        <motion.div
          key={bundle.bundle_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 text-sm">
                  Специальное предложение!
                </h3>
                <p className="text-xs text-green-600 dark:text-green-300">
                  Добавьте товар ниже и получите скидку
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <Percent className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-300">
                -{bundle.discount_percentage}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bundle.suggested_products.slice(0, 2).map((suggestedProduct) => (
              <div
                key={suggestedProduct.id}
                className="group bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-colors"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {suggestedProduct.image_url ? (
                      <img
                        src={suggestedProduct.image_url}
                        alt={suggestedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-xs truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {suggestedProduct.name}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                        {formatPrice(suggestedProduct.price)}
                      </span>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {formatPrice(suggestedProduct.price * (1 - bundle.discount_percentage / 100))}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <motion.button
                    onClick={() => handleAddToCart(suggestedProduct.id)}
                    disabled={addingToCart === suggestedProduct.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs font-medium rounded transition-colors"
                  >
                    {addingToCart === suggestedProduct.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-3 w-3" />
                    )}
                    <span>
                      {addingToCart === suggestedProduct.id ? '...' : 'В корзину'}
                    </span>
                  </motion.button>
                  
                  <Link
                    href={`/product/${suggestedProduct.id}`}
                    className="flex items-center justify-center p-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                    title="Посмотреть детали"
                  >
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
            {bundle.suggested_products.length > 2 && (
              <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  +{bundle.suggested_products.length - 2} еще товаров
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      {/* Trigger Bundles - где этот товар предложенный */}
      {triggerBundles.map((bundle) => (
        <motion.div
          key={bundle.bundle_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">
                  Добавьте в корзину и получите скидку!
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  При покупке вместе с товаром ниже
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              <Percent className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                -{bundle.discount_percentage}%
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {bundle.trigger_product.image_url ? (
                  <img
                    src={bundle.trigger_product.image_url}
                    alt={bundle.trigger_product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 dark:text-white text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {bundle.trigger_product.name}
                </h4>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {formatPrice(product.price * (1 - bundle.discount_percentage / 100))}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-1">
              <motion.button
                onClick={() => handleAddToCart(bundle.trigger_product.id)}
                disabled={addingToCart === bundle.trigger_product.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-medium rounded transition-colors"
              >
                {addingToCart === bundle.trigger_product.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ShoppingCart className="h-3 w-3" />
                )}
                <span>
                  {addingToCart === bundle.trigger_product.id ? '...' : 'В корзину'}
                </span>
              </motion.button>
              
              <Link
                href={`/product/${bundle.trigger_product.id}`}
                className="flex items-center justify-center p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Посмотреть детали"
              >
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 