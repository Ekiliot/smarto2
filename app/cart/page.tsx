'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowLeft,
  Truck,
  Shield,
  CreditCard,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Header } from '@/components/Header'
import { ProductCard } from '@/components/ProductCard'
import { getAllProducts, Product } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/components/CartProvider'
import { useAuth } from '@/components/AuthProvider'
import { useLoyalty } from '@/components/LoyaltyProvider'
import { calculateMaxPointsForOrder } from '@/lib/supabase'
import { useShipping } from '@/lib/hooks/useShipping'

export default function CartPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { loyaltyPoints } = useLoyalty()
  const { activeShippingMethods, calculateShippingCost } = useShipping()
  const [pointsToUse, setPointsToUse] = useState(0)
  const [maxPointsAllowed, setMaxPointsAllowed] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('')
  const [selectionAnimation, setSelectionAnimation] = useState<string | null>(null)
  const [updatingQuantity, setUpdatingQuantity] = useState<Set<string>>(new Set())
  const { 
    cartItems, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getBundleDiscount,
    getBundlePair,
    isProductInBundle,
    activeBundles
  } = useCart()

  // Инициализируем выбранные товары при загрузке
  useEffect(() => {
    if (cartItems.length > 0) {
      const initialSelected = new Set(cartItems.map(item => item.id))
      setSelectedItems(initialSelected)
    }
  }, [cartItems])

  // Функция для обновления количества с анимацией
  const updateQuantityWithAnimation = async (itemId: string, newQuantity: number) => {
    // Добавляем товар в список обновляющихся
    setUpdatingQuantity(prev => {
      const newSet = new Set(prev)
      newSet.add(itemId)
      return newSet
    })
    
    try {
      await updateQuantity(itemId, newQuantity)
    } finally {
      // Убираем товар из списка обновляющихся через небольшую задержку для плавности
      setTimeout(() => {
        setUpdatingQuantity(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 300)
    }
  }

  // Функция для переключения выбора товара
  const toggleItemSelection = (itemId: string) => {
    console.log('=== TOGGLE ITEM SELECTION ===')
    console.log('Item ID:', itemId)
    console.log('Current selected items:', Array.from(selectedItems))
    console.log('Cart items:', cartItems.map(item => ({ id: item.id, name: item.product?.name })))
    console.log('Unselected items:', unselectedItems.map(item => ({ id: item.id, name: item.product?.name })))
    
    // Запускаем анимацию
    setSelectionAnimation(itemId)
    setTimeout(() => setSelectionAnimation(null), 300)
    
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
      console.log('✅ Removed item from selection')
    } else {
      newSelected.add(itemId)
      console.log('✅ Added item to selection')
    }
    setSelectedItems(newSelected)
    console.log('New selection:', Array.from(newSelected))
    console.log('=== END TOGGLE ===')
  }

  // Функция для проверки, активен ли бандл
  const isBundleActive = (pair: any) => {
    const triggerSelected = selectedItems.has(pair.triggerProduct.id)
    const suggestedSelected = selectedItems.has(pair.suggestedProduct.id)
    return triggerSelected && suggestedSelected
  }

  // Группируем товары по парам и отдельные товары с учетом выбора
  const { bundlePairs, singleItems, unselectedItems } = useMemo(() => {
    console.log('=== GROUPING ITEMS ===')
    console.log('Selected items:', Array.from(selectedItems))
    console.log('Cart items:', cartItems.map(item => ({ id: item.id, name: item.product?.name })))
    
    const processedItems = new Set<string>()
    const pairs: any[] = []
    const singles: any[] = []
    const unselected: any[] = []

    cartItems.forEach(item => {
      if (processedItems.has(item.id)) return

      const bundlePair = getBundlePair(item.product_id)
      
      if (bundlePair) {
        // Проверяем, что оба товара еще не обработаны
        if (!processedItems.has(bundlePair.triggerProduct.id) && 
            !processedItems.has(bundlePair.suggestedProduct.id)) {
          
          // Если бандл активен (оба товара выбраны), показываем как бандл
          if (isBundleActive(bundlePair)) {
            pairs.push(bundlePair)
            processedItems.add(bundlePair.triggerProduct.id)
            processedItems.add(bundlePair.suggestedProduct.id)
            console.log('📦 Added bundle pair:', bundlePair.triggerProduct.product?.name, '+', bundlePair.suggestedProduct.product?.name)
          } else {
            // Если бандл не активен, добавляем товары как отдельные (выбранные или невыбранные)
            if (selectedItems.has(bundlePair.triggerProduct.id)) {
              singles.push(bundlePair.triggerProduct)
              console.log('✅ Added trigger to singles:', bundlePair.triggerProduct.product?.name)
            } else {
              unselected.push(bundlePair.triggerProduct)
              console.log('⏸️ Added trigger to unselected:', bundlePair.triggerProduct.product?.name)
            }
            processedItems.add(bundlePair.triggerProduct.id)
            
            if (selectedItems.has(bundlePair.suggestedProduct.id)) {
              singles.push(bundlePair.suggestedProduct)
              console.log('✅ Added suggested to singles:', bundlePair.suggestedProduct.product?.name)
            } else {
              unselected.push(bundlePair.suggestedProduct)
              console.log('⏸️ Added suggested to unselected:', bundlePair.suggestedProduct.product?.name)
            }
            processedItems.add(bundlePair.suggestedProduct.id)
          }
        }
      } else {
        // Обычный товар - добавляем в выбранные или невыбранные
        if (selectedItems.has(item.id)) {
          singles.push(item)
          console.log('✅ Added regular item to singles:', item.product?.name)
        } else {
          unselected.push(item)
          console.log('⏸️ Added regular item to unselected:', item.product?.name)
        }
        processedItems.add(item.id)
      }
    })

    console.log('Final groups:')
    console.log('- Bundle pairs:', pairs.length)
    console.log('- Single items:', singles.length)
    console.log('- Unselected items:', unselected.length)
    console.log('=== END GROUPING ===')

    return { bundlePairs: pairs, singleItems: singles, unselectedItems: unselected }
  }, [cartItems, getBundlePair, selectedItems, isBundleActive])

  // Вычисляем общую стоимость с учетом скидок по парам (только выбранные товары)
  const subtotal = useMemo(() => {
    let total = 0
    
    // Считаем пары со скидкой (только активные бандлы)
    bundlePairs.forEach(pair => {
      const triggerPrice = (pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity
      const suggestedPrice = (pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity
      const discountMultiplier = (1 - pair.discount / 100)
      total += (triggerPrice + suggestedPrice) * discountMultiplier
    })
    
    // Считаем отдельные товары без скидки (только выбранные)
    singleItems.forEach(item => {
      total += (item.product?.price || 0) * item.quantity
    })
    
    return total
  }, [bundlePairs, singleItems])

  const shipping = selectedShippingMethod 
    ? (() => {
        // Используем локальный расчет для мгновенного отображения
        const method = activeShippingMethods.find(m => m.id === selectedShippingMethod)
        if (!method) return 0
        
        if (subtotal >= method.free_shipping_threshold) {
          return 0 // Бесплатная доставка
        }
        
        return method.price
      })()
    : (subtotal > 1000 ? 0 : 150) // Fallback для обратной совместимости
  const totalBeforePoints = subtotal + shipping
  const pointsDiscount = pointsToUse
  const finalTotal = Math.max(0, totalBeforePoints - pointsDiscount)

  // Рассчитываем максимальное количество баллов для использования
  useEffect(() => {
    const calculateMaxPoints = async () => {
      if (finalTotal > 0) {
        const maxPoints = await calculateMaxPointsForOrder(finalTotal)
        setMaxPointsAllowed(maxPoints)
        
        // Сбрасываем выбранные баллы если они превышают лимит
        const maxAllowed = Math.min(maxPoints, loyaltyPoints)
        if (pointsToUse > maxAllowed) {
          setPointsToUse(maxAllowed)
        }
      }
    }
    calculateMaxPoints()
  }, [finalTotal, loyaltyPoints, pointsToUse])

  // Вычисляем общую скидку по парам
  const totalBundleDiscount = useMemo(() => {
    return bundlePairs.reduce((sum, pair) => {
      const triggerPrice = (pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity
      const suggestedPrice = (pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity
      const originalTotal = triggerPrice + suggestedPrice
      return sum + (originalTotal * pair.discount / 100)
    }, 0)
  }, [bundlePairs])

  // Оформление заказа
  const handleCheckout = () => {
    // Передаем информацию о баллах в sessionStorage для использования в checkout
    if (pointsToUse > 0) {
      sessionStorage.setItem('loyaltyPointsToUse', pointsToUse.toString())
    } else {
      sessionStorage.removeItem('loyaltyPointsToUse')
    }
    
    // Передаем информацию о выбранных товарах в sessionStorage
    const selectedItemsArray = Array.from(selectedItems)
    sessionStorage.setItem('selectedCartItems', JSON.stringify(selectedItemsArray))
    
    // Передаем информацию о выбранном способе доставки
    if (selectedShippingMethod) {
      sessionStorage.setItem('selectedShippingMethod', selectedShippingMethod)
    } else {
      sessionStorage.removeItem('selectedShippingMethod')
    }
    
    // Переходим на страницу оформления заказа
    router.push('/checkout')
  }

  // Если пользователь не авторизован
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Войдите в аккаунт
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Для просмотра корзины необходимо войти в аккаунт
            </p>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Войти в аккаунт
            </motion.a>
          </motion.div>
        </div>
      </div>
    )
  }

  // Загрузка
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 text-center">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Загрузка корзины...</p>
        </div>
      </div>
    )
  }

  // Пустая корзина
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Корзина пуста
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <motion.a
              href="/products"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Перейти к товарам
            </motion.a>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      <Header />
      
      {/* Мобильная версия корзины */}
      <div className="md:hidden">
        <main className="px-2 py-4 space-y-4">
          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Корзина
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {cartItems.length} товаров в корзине • {selectedItems.size} выбрано
            </p>
          </motion.div>

          {/* Баннер с информацией */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-4 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Выгодные предложения!</h3>
                <p className="text-blue-100 text-sm">
                  {selectedItems.size > 0 
                    ? `Выбрано ${selectedItems.size} товаров` 
                    : 'Выберите товары для покупки'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatPrice(finalTotal)}</div>
                <div className="text-blue-100 text-sm">Итого к оплате</div>
              </div>
            </div>
          </motion.div>

          {/* Выбор способа доставки */}
          {activeShippingMethods.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Способ доставки
              </h2>
              
              <div className="space-y-3">
                {activeShippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedShippingMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                    onClick={() => setSelectedShippingMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShippingMethod === method.id}
                            onChange={() => setSelectedShippingMethod(method.id)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {method.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {method.estimated_days}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {subtotal >= method.free_shipping_threshold ? (
                          <div className="text-green-600 font-semibold text-sm">
                            Бесплатно
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-gray-900 dark:text-white">
                            {formatPrice(method.price)}
                          </div>
                        )}
                        {subtotal < method.free_shipping_threshold && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Бесплатно от {formatPrice(method.free_shipping_threshold)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Бандлы с товарами */}
          {bundlePairs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Выгодные пары
              </h2>
              
              {bundlePairs.map((pair, index) => (
                <div
                  key={`pair-${pair.bundle.id}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-200 dark:border-green-700 overflow-hidden"
                >
                  {/* Заголовок бандла */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-semibold">Скидка -{pair.discount}%</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-90">Экономия</div>
                        <div className="font-bold">
                          {formatPrice(
                            (pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity * (pair.discount / 100) +
                            (pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity * (pair.discount / 100)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Товары в бандле */}
                  <div className="p-4 space-y-3">
                    {/* Триггерный товар */}
                    <div 
                      onClick={() => toggleItemSelection(pair.triggerProduct.id)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer cart-item-clickable relative ${
                        selectedItems.has(pair.triggerProduct.id)
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 md:bg-gray-50 md:dark:bg-gray-700 md:border-0'
                          : 'bg-gray-50 dark:bg-gray-700'
                      } ${selectionAnimation === pair.triggerProduct.id ? 'cart-item-selection-animation' : ''}`}>
                      

                      <img
                        src={pair.triggerProduct.product?.image_url}
                        alt={pair.triggerProduct.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {pair.triggerProduct.product?.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {pair.triggerProduct.product?.brand}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(pair.triggerProduct.product?.price)}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(pair.triggerProduct.product?.price * (1 - pair.discount / 100))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateQuantityWithAnimation(pair.triggerProduct.id, pair.triggerProduct.quantity - 1)}
                          disabled={updatingQuantity.has(pair.triggerProduct.id)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button disabled:opacity-50"
                        >
                          {updatingQuantity.has(pair.triggerProduct.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <Minus className="h-3 w-3" />
                          )}
                        </button>
                        <motion.span 
                          key={`quantity-${pair.triggerProduct.id}-${pair.triggerProduct.quantity}`}
                          initial={{ scale: 1.2, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="w-6 text-center font-medium text-sm"
                        >
                          {pair.triggerProduct.quantity}
                        </motion.span>
                        <button
                          onClick={() => updateQuantityWithAnimation(pair.triggerProduct.id, pair.triggerProduct.quantity + 1)}
                          disabled={updatingQuantity.has(pair.triggerProduct.id)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button disabled:opacity-50"
                        >
                          {updatingQuantity.has(pair.triggerProduct.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <Plus className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Предложенный товар */}
                    <div 
                      onClick={() => toggleItemSelection(pair.suggestedProduct.id)}
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer cart-item-clickable relative ${
                        selectedItems.has(pair.suggestedProduct.id)
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 md:bg-gray-50 md:dark:bg-gray-700 md:border-0'
                          : 'bg-gray-50 dark:bg-gray-700'
                      } ${selectionAnimation === pair.suggestedProduct.id ? 'cart-item-selection-animation' : ''}`}>
                      

                      <img
                        src={pair.suggestedProduct.product?.image_url}
                        alt={pair.suggestedProduct.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {pair.suggestedProduct.product?.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {pair.suggestedProduct.product?.brand}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 line-through">
                            {formatPrice(pair.suggestedProduct.product?.price)}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {formatPrice(pair.suggestedProduct.product?.price * (1 - pair.discount / 100))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateQuantity(pair.suggestedProduct.id, pair.suggestedProduct.quantity - 1)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-medium text-sm">
                          {pair.triggerProduct.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(pair.suggestedProduct.id, pair.suggestedProduct.quantity + 1)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Отдельные товары */}
          {singleItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                🛍️ Отдельные товары
              </h2>
              
              {singleItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 transition-all duration-200 cursor-pointer cart-item-clickable relative ${
                    selectedItems.has(item.id)
                      ? 'border-2 border-green-200 dark:border-green-700 md:border-0'
                      : ''
                  } ${selectionAnimation === item.id ? 'cart-item-selection-animation' : ''}`}
                >

                  <div className="flex items-center space-x-3">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {item.product?.brand}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.product?.price)}
                        </span>
                        {item.product?.original_price && item.product.original_price > item.product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.product?.original_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full remove-button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateQuantityWithAnimation(item.id, item.quantity - 1)}
                          disabled={updatingQuantity.has(item.id)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button disabled:opacity-50"
                        >
                          {updatingQuantity.has(item.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <Minus className="h-3 w-3" />
                          )}
                        </button>
                        <motion.span 
                          key={`quantity-${item.id}-${item.quantity}`}
                          initial={{ scale: 1.2, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="w-6 text-center font-medium text-sm"
                        >
                          {item.quantity}
                        </motion.span>
                        <button
                          onClick={() => updateQuantityWithAnimation(item.id, item.quantity + 1)}
                          disabled={updatingQuantity.has(item.id)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button disabled:opacity-50"
                        >
                          {updatingQuantity.has(item.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <Plus className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Невыбранные товары */}
          {unselectedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                ⏸️ Невыбранные товары
              </h2>
              
              {unselectedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  onClick={() => toggleItemSelection(item.id)}
                  className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 opacity-80 hover:opacity-100 transition-all duration-200 cursor-pointer cart-item-clickable relative ${selectionAnimation === item.id ? 'cart-item-selection-animation' : ''}`}
                >

                  
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.product?.image_url}
                      alt={item.product?.name}
                      className="w-20 h-20 object-cover rounded-xl"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.product?.brand}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.product?.price)}
                        </span>
                        {item.product?.original_price && item.product.original_price > item.product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(item.product?.original_price)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full remove-button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => updateQuantityWithAnimation(item.id, item.quantity - 1)}
                          disabled={updatingQuantity.has(item.id)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button disabled:opacity-50"
                        >
                          {updatingQuantity.has(item.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <Minus className="h-3 w-3" />
                          )}
                        </button>
                        <motion.span 
                          key={`quantity-${item.id}-${item.quantity}`}
                          initial={{ scale: 1.2, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          className="w-6 text-center font-medium text-sm text-gray-900 dark:text-white"
                        >
                          {item.quantity}
                        </motion.span>
                        <button
                          onClick={() => updateQuantityWithAnimation(item.id, item.quantity + 1)}
                          disabled={updatingQuantity.has(item.id)}
                          className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button disabled:opacity-50"
                        >
                          {updatingQuantity.has(item.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                          <Plus className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Итоговая информация */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Итого к оплате
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Товары</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              
              {shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Доставка</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
              )}
              
              {shipping === 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Доставка</span>
                  <span>Бесплатно</span>
                </div>
              )}
              
              {pointsToUse > 0 && (
                <div className="flex justify-between text-sm text-yellow-600">
                  <span>Списание баллов</span>
                  <span>-{formatPrice(pointsToUse)}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                  <span>Итого</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Баллы лояльности */}
            {user && loyaltyPoints > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Использовать баллы
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      У вас: {loyaltyPoints} баллов
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max={Math.min(maxPointsAllowed, loyaltyPoints)}
                      value={pointsToUse}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        const maxAllowed = Math.min(maxPointsAllowed, loyaltyPoints)
                        setPointsToUse(Math.min(value, maxAllowed))
                      }}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <input
                      type="number"
                      min="0"
                      max={Math.min(maxPointsAllowed, loyaltyPoints)}
                      value={pointsToUse}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0
                        const maxAllowed = Math.min(maxPointsAllowed, loyaltyPoints)
                        setPointsToUse(Math.min(value, maxAllowed))
                      }}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Максимум {Math.min(maxPointsAllowed, loyaltyPoints)} баллов (40% от суммы)
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка оформления заказа */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <CreditCard className="h-5 w-5" />
              <span>Оформить заказ</span>
            </motion.button>

            {/* Информация о доставке */}
            <div className="grid grid-cols-1 gap-3 pt-4">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Бесплатная доставка от 1000 MDL
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Гарантия 2 года
                </span>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <span className="text-sm text-purple-700 dark:text-purple-300">
                  Возврат 14 дней
                </span>
              </div>
            </div>
          </motion.div>

          {/* Кнопка "Продолжить покупки" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <a
              href="/products"
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Продолжить покупки</span>
            </a>
          </motion.div>
        </main>
      </div>

      {/* Десктопная версия - оставляем как есть */}
      <div className="hidden md:block">
        <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <a
                  href="/products"
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Продолжить покупки</span>
                </a>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Корзина ({cartItems.length} товаров • {selectedItems.size} выбрано)
              </h1>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence>
                {bundlePairs.map((pair, index) => (
                  <motion.div
                    key={`pair-${pair.bundle.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl shadow-lg p-6"
                  >
                    {/* Заголовок пары */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-green-800 dark:text-green-200">
                            Поздравляем! Вы собрали выгодную пару!
                          </h3>
                          <p className="text-sm text-green-600 dark:text-green-300">
                            Получаете скидку -{pair.discount}% на оба товара
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Товары в паре */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Триггерный товар */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(pair.triggerProduct.id)}
                            onChange={() => toggleItemSelection(pair.triggerProduct.id)}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />
                          <img
                            src={pair.triggerProduct.product?.image_url}
                            alt={pair.triggerProduct.product?.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {pair.triggerProduct.product?.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {pair.triggerProduct.product?.brand}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(pair.triggerProduct.product?.price)}
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {formatPrice(pair.triggerProduct.product?.price * (1 - pair.discount / 100))}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(pair.triggerProduct.id, pair.triggerProduct.quantity - 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {pair.triggerProduct.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(pair.triggerProduct.id, pair.triggerProduct.quantity + 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Предложенный товар */}
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(pair.suggestedProduct.id)}
                            onChange={() => toggleItemSelection(pair.suggestedProduct.id)}
                            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />
                          <img
                            src={pair.suggestedProduct.product?.image_url}
                            alt={pair.suggestedProduct.product?.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {pair.suggestedProduct.product?.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {pair.triggerProduct.product?.brand}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(pair.suggestedProduct.product?.price)}
                              </span>
                              <span className="text-sm font-bold text-green-600">
                                {formatPrice(pair.suggestedProduct.product?.price * (1 - pair.discount / 100))}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateQuantity(pair.suggestedProduct.id, pair.suggestedProduct.quantity - 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {pair.suggestedProduct.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(pair.suggestedProduct.id, pair.suggestedProduct.quantity + 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Итого по паре */}
                    <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800 dark:text-green-200">
                          Итого за комплект:
                        </span>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(
                              (pair.triggerProduct.product?.price * pair.triggerProduct.quantity) +
                              (pair.suggestedProduct.product?.price * pair.suggestedProduct.quantity)
                            )}
                          </div>
                          <div className="text-lg font-bold text-green-800 dark:text-green-200">
                            {formatPrice(
                              ((pair.triggerProduct.product?.price * pair.triggerProduct.quantity) +
                              (pair.suggestedProduct.product?.price * pair.suggestedProduct.quantity)) * 
                              (1 - pair.discount / 100)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {singleItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: bundlePairs.length * 0.1 + index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.product?.image_url}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {item.product?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {item.product?.brand}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {item.product?.original_price && item.product?.original_price > item.product?.price && (
                            <span className="text-sm text-gray-500 line-through">
                              {formatPrice(item.product?.original_price)}
                            </span>
                          )}
                          <span className="text-lg font-bold text-primary-600">
                            {formatPrice(item.product?.price)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center text-gray-900 dark:text-white font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors remove-button"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Невыбранные товары */}
            {unselectedItems.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ⏸️ Невыбранные товары ({unselectedItems.length})
                </h3>
                <div className="space-y-4">
                  {unselectedItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => toggleItemSelection(item.id)}
                      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 transition-all duration-200 cursor-pointer cart-item-clickable relative opacity-80 hover:opacity-100 ${selectionAnimation === item.id ? 'cart-item-selection-animation' : ''}`}
                    >
                      
                      
                      <div className="flex items-center space-x-3">
                          <img
                            src={item.product?.image_url}
                            alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-xl"
                          />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {item.product?.brand}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            {item.product?.original_price && item.product?.original_price > item.product?.price && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.product?.original_price)}
                              </span>
                            )}
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice(item.product?.price)}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full remove-button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="flex items-center space-x-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button"
                          >
                              <Minus className="h-3 w-3" />
                          </button>
                            <span className="w-6 text-center font-medium text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors quantity-button"
                          >
                              <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Выбор способа доставки */}
            {activeShippingMethods.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Способ доставки
                </h3>
                <div className="space-y-3">
                  {activeShippingMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        selectedShippingMethod === method.id
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                      }`}
                      onClick={() => setSelectedShippingMethod(method.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShippingMethod === method.id}
                            onChange={() => setSelectedShippingMethod(method.id)}
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500"
                          />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {method.name}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {method.description}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {method.estimated_days}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {subtotal >= method.free_shipping_threshold ? (
                            <div className="text-green-600 font-semibold text-sm">
                              Бесплатно
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatPrice(method.price)}
                            </div>
                          )}
                          {subtotal < method.free_shipping_threshold && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Бесплатно от {formatPrice(method.free_shipping_threshold)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Итого заказа
                </h2>

                {/* Summary */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Товары ({selectedItems.size} выбрано)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {totalBundleDiscount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Скидка за комплекты</span>
                      <span>-{formatPrice(totalBundleDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Доставка</span>
                    <span>{shipping === 0 ? 'Бесплатно' : formatPrice(shipping)}</span>
                  </div>
                  
                  {/* Баллы лояльности */}
                  {user && loyaltyPoints > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Использовать баллы
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            У вас: {loyaltyPoints} баллов
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max={Math.min(maxPointsAllowed, loyaltyPoints)}
                            value={pointsToUse}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              const maxAllowed = Math.min(maxPointsAllowed, loyaltyPoints)
                              setPointsToUse(Math.min(value, maxAllowed))
                            }}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                          />
                          <input
                            type="number"
                            min="0"
                            max={Math.min(maxPointsAllowed, loyaltyPoints)}
                            value={pointsToUse}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0
                              const maxAllowed = Math.min(maxPointsAllowed, loyaltyPoints)
                              setPointsToUse(Math.min(value, maxAllowed))
                            }}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Максимум {Math.min(maxPointsAllowed, loyaltyPoints)} баллов (40% от суммы)
                        </div>
                      </div>
                      {pointsToUse > 0 && (
                        <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                          <span>Списание баллов</span>
                          <span>-{formatPrice(pointsToUse)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {totalBundleDiscount > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>Без скидок</span>
                        <span>{formatPrice(subtotal + totalBundleDiscount + shipping)}</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                      <span>Итого</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>
                    Оформить заказ
                  </span>
                </motion.button>

                {/* Shipping Info */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Truck className="h-5 w-5 text-primary-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Бесплатная доставка от 1000 MDL
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-primary-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Гарантия 2 года
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-primary-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Возврат 14 дней
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
} 