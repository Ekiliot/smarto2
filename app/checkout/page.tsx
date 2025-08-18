'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, 
  User, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  Loader2,
  ArrowLeft,
  Package,
  Shield,
  Lock
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useCart } from '@/components/CartProvider'
import { useLoyalty } from '@/components/LoyaltyProvider'
import { createOrder, spendLoyaltyPoints } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import { useShipping } from '@/lib/hooks/useShipping'

interface CheckoutForm {
  // Контактная информация
  first_name: string
  last_name: string
  email: string
  phone: string
  
  // Адрес доставки
  street: string
  city: string
  postal_code: string
  country: string
  
  // Способ оплаты
  payment_method: 'cash' | 'card'
  
  // Данные банковской карты (если выбрана карта)
  card_number: string
  card_holder: string
  card_expiry: string
  card_cvv: string
  
  // Дополнительно
  notes: string
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const { cartItems, loading: cartLoading, clearCart, getBundleDiscount, getBundlePair } = useCart()
  const { refreshLoyalty } = useLoyalty()
  const { activeShippingMethods, calculateShippingCost } = useShipping()
  const [loading, setLoading] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [pointsToUse, setPointsToUse] = useState(0)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('')
  const [form, setForm] = useState<CheckoutForm>({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'Молдова',
    payment_method: 'cash',
    card_number: '',
    card_holder: '',
    card_expiry: '',
    card_cvv: '',
    notes: ''
  })

  // Состояния для валидации полей карты
  const [cardValidation, setCardValidation] = useState({
    card_number: { isValid: true, message: '' },
    card_holder: { isValid: true, message: '' },
    card_expiry: { isValid: true, message: '' },
    card_cvv: { isValid: true, message: '' }
  })

  // Получаем баллы и выбранные товары из sessionStorage
  useEffect(() => {
    const savedPoints = sessionStorage.getItem('loyaltyPointsToUse')
    if (savedPoints) {
      setPointsToUse(parseInt(savedPoints))
    }
    
    const savedSelectedItems = sessionStorage.getItem('selectedCartItems')
    if (savedSelectedItems) {
      try {
        const items = JSON.parse(savedSelectedItems)
        setSelectedItems(new Set(items))
      } catch (error) {
        console.error('Error parsing selected items:', error)
        // Если ошибка парсинга, выбираем все товары
        setSelectedItems(new Set(cartItems.map(item => item.id)))
      }
    } else {
      // Если нет сохраненных выбранных товаров, выбираем все
      if (cartItems.length > 0) {
      setSelectedItems(new Set(cartItems.map(item => item.id)))
      }
    }
    
    // Загружаем выбранный способ доставки
    const savedShippingMethod = sessionStorage.getItem('selectedShippingMethod')
    if (savedShippingMethod) {
      setSelectedShippingMethod(savedShippingMethod)
    } else if (activeShippingMethods.length > 0) {
      // Если нет сохраненного способа, выбираем первый доступный
      setSelectedShippingMethod(activeShippingMethods[0].id)
    }
  }, []) // Убираем зависимости, чтобы useEffect выполнялся только один раз при монтировании

  // Группируем товары по парам и отдельные товары
  const { bundlePairs, singleItems } = useMemo(() => {
    if (cartItems.length === 0 || selectedItems.size === 0) {
      return { bundlePairs: [], singleItems: [] }
    }

    const processedItems = new Set<string>()
    const pairs: any[] = []
    const singles: any[] = []

    // Фильтруем только выбранные товары
    const filteredCartItems = cartItems.filter(item => selectedItems.has(item.id))

    filteredCartItems.forEach(item => {
      if (processedItems.has(item.id)) return

      const bundlePair = getBundlePair(item.product_id)
      
      if (bundlePair) {
        // Проверяем, что оба товара еще не обработаны и оба выбраны
        if (!processedItems.has(bundlePair.triggerProduct.id) && 
            !processedItems.has(bundlePair.suggestedProduct.id) &&
            selectedItems.has(bundlePair.triggerProduct.id) &&
            selectedItems.has(bundlePair.suggestedProduct.id)) {
          pairs.push(bundlePair)
          processedItems.add(bundlePair.triggerProduct.id)
          processedItems.add(bundlePair.suggestedProduct.id)
        } else {
          // Если бандл не полный, добавляем товары как отдельные
          if (selectedItems.has(bundlePair.triggerProduct.id) && !processedItems.has(bundlePair.triggerProduct.id)) {
            singles.push(bundlePair.triggerProduct)
            processedItems.add(bundlePair.triggerProduct.id)
          }
          if (selectedItems.has(bundlePair.suggestedProduct.id) && !processedItems.has(bundlePair.suggestedProduct.id)) {
            singles.push(bundlePair.suggestedProduct)
            processedItems.add(bundlePair.suggestedProduct.id)
          }
        }
      } else {
        // Обычный товар
        singles.push(item)
        processedItems.add(item.id)
      }
    })

    return { bundlePairs: pairs, singleItems: singles }
  }, [cartItems, selectedItems])

  // Вычисляем правильную сумму с учетом скидок по парам
  const subtotal = useMemo(() => {
    let total = 0
    
    // Считаем пары со скидкой
    bundlePairs.forEach(pair => {
      const triggerPrice = (pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity
      const suggestedPrice = (pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity
      const discountMultiplier = (1 - pair.discount / 100)
      total += (triggerPrice + suggestedPrice) * discountMultiplier
    })
    
    // Считаем отдельные товары без скидки
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
  const finalTotal = Math.max(0, totalBeforePoints - pointsToUse) // Общая сумма к оплате

  // Функция для валидации полей карты в реальном времени
  const validateCardField = (field: keyof typeof cardValidation, value: string) => {
    let isValid = true
    let message = ''

    switch (field) {
      case 'card_number':
        const cleanNumber = value.replace(/\s/g, '')
        if (cleanNumber.length === 0) {
          isValid = false
          message = 'Номер карты обязателен'
        } else if (cleanNumber.length < 16) {
          isValid = false
          message = 'Номер карты должен содержать 16 цифр'
        } else if (!/^\d{16}$/.test(cleanNumber)) {
          isValid = false
          message = 'Номер карты должен содержать только цифры'
        }
        break
      
      case 'card_holder':
        if (value.trim().length === 0) {
          isValid = false
          message = 'Имя владельца обязательно'
        } else if (value.trim().length < 2) {
          isValid = false
          message = 'Имя владельца должно содержать минимум 2 символа'
        }
        break
      
      case 'card_expiry':
        if (value.length === 0) {
          isValid = false
          message = 'Срок действия обязателен'
        } else if (!/^\d{2}\/\d{2}$/.test(value)) {
          isValid = false
          message = 'Формат: MM/YY'
        } else {
          const [month, year] = value.split('/')
          const monthNum = parseInt(month)
          const yearNum = parseInt(year)
          const currentYear = new Date().getFullYear() % 100
          const currentMonth = new Date().getMonth() + 1
          
          if (monthNum < 1 || monthNum > 12) {
            isValid = false
            message = 'Месяц должен быть от 01 до 12'
          } else if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
            isValid = false
            message = 'Срок действия карты истек'
          }
        }
        break
      
      case 'card_cvv':
        if (value.length === 0) {
          isValid = false
          message = 'CVV код обязателен'
        } else if (value.length < 3) {
          isValid = false
          message = 'CVV код должен содержать 3-4 цифры'
        } else if (!/^\d{3,4}$/.test(value)) {
          isValid = false
          message = 'CVV код должен содержать только цифры'
        }
        break
    }

    setCardValidation(prev => ({
      ...prev,
      [field]: { isValid, message }
    }))

    return isValid
  }

  // Обновленная функция handleInputChange с валидацией
  const handleInputChange = (field: keyof CheckoutForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    // Валидируем поля карты в реальном времени
    if (['card_number', 'card_holder', 'card_expiry', 'card_cvv'].includes(field)) {
      validateCardField(field as keyof typeof cardValidation, value)
    }
    
    // Если меняется способ оплаты, сбрасываем валидацию карты
    if (field === 'payment_method') {
      if (value === 'cash') {
        setCardValidation({
          card_number: { isValid: true, message: '' },
          card_holder: { isValid: true, message: '' },
          card_expiry: { isValid: true, message: '' },
          card_cvv: { isValid: true, message: '' }
        })
        // Очищаем поля карты при выборе наличных
        setForm(prev => ({
          ...prev,
          card_number: '',
          card_holder: '',
          card_expiry: '',
          card_cvv: ''
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    // Валидация полей карты, если выбран способ оплаты картой
    if (form.payment_method === 'card') {
      // Проверяем все поля карты
      const isCardNumberValid = validateCardField('card_number', form.card_number)
      const isCardHolderValid = validateCardField('card_holder', form.card_holder)
      const isCardExpiryValid = validateCardField('card_expiry', form.card_expiry)
      const isCardCvvValid = validateCardField('card_cvv', form.card_cvv)
      
      if (!isCardNumberValid || !isCardHolderValid || !isCardExpiryValid || !isCardCvvValid) {
        alert('Пожалуйста, исправьте ошибки в данных карты')
        return
      }
    }
    
    setLoading(true)
    try {
      const orderData = {
        user_id: user.id,
        total_amount: finalTotal, // Используем финальную сумму с учетом баллов
        shipping_method: selectedShippingMethod || 'default', // Добавляем способ доставки
        shipping_cost: shipping, // Добавляем стоимость доставки
        shipping_address: {
          street: form.street,
          city: form.city,
          postal_code: form.postal_code,
          country: form.country
        },
        contact_info: {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone
        },
        payment_method: form.payment_method,
        payment_status: form.payment_method === 'card' ? 'paid' : 'pending',
        notes: form.notes,
        items: [
          // Товары из пар со скидками
          ...bundlePairs.flatMap(pair => [
            {
              product_id: pair.triggerProduct.product_id,
              quantity: pair.triggerProduct.quantity,
              unit_price: (pair.triggerProduct.product?.price || 0) * (1 - pair.discount / 100)
            },
            {
              product_id: pair.suggestedProduct.product_id,
              quantity: pair.suggestedProduct.quantity,
              unit_price: (pair.suggestedProduct.product?.price || 0) * (1 - pair.discount / 100)
            }
          ]),
          // Отдельные товары без скидок
          ...singleItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.product?.price || 0
          }))
        ]
      }

      const { data, error } = await createOrder(orderData)
      
      if (error) throw error
      
      // Если используем баллы, списываем их
      if (pointsToUse > 0) {
        await spendLoyaltyPoints(user.id, pointsToUse, data?.id)
        await refreshLoyalty() // Обновляем баланс баллов
      }
      
      setOrderNumber(data?.order_number || '')
      setOrderSuccess(true)
      
      // Очищаем только выбранные товары из корзины
      const selectedItemsArray = Array.from(selectedItems)
      selectedItemsArray.forEach(itemId => {
        // Здесь нужно вызвать функцию удаления конкретного товара
        // Пока что очищаем всю корзину, но в будущем можно улучшить
      })
      clearCart()
      
      // Очищаем информацию о баллах и выбранных товарах из sessionStorage
      sessionStorage.removeItem('loyaltyPointsToUse')
      sessionStorage.removeItem('selectedCartItems')
      sessionStorage.removeItem('selectedShippingMethod')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Ошибка при создании заказа. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center"
          >
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Заказ успешно оформлен!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Номер вашего заказа: <span className="font-semibold text-primary-600">{orderNumber}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {form.payment_method === 'card' 
                ? 'Оплата прошла успешно! Мы отправим вам подтверждение на email и свяжемся с вами для уточнения деталей доставки.'
                : 'Мы отправим вам подтверждение на email и свяжемся с вами для уточнения деталей доставки. Оплата производится при получении.'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Продолжить покупки
              </Link>
              <Link
                href="/account/orders"
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Мои заказы
              </Link>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 mobile-nav-safe-area">
      
      {/* Мобильная версия checkout */}
      <div className="md:hidden">
        <main className="px-2 py-4 space-y-4">
          {/* Кнопка "Назад к корзине" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2"
          >
            <Link
              href="/cart"
              className="inline-flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад к корзине</span>
            </Link>
          </motion.div>

          {/* Заголовок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Оформление заказа
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Заполните данные для доставки и оплаты • {selectedItems.size} товаров
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
                <h3 className="font-semibold text-lg">Ваш заказ</h3>
                <p className="text-blue-100 text-sm">
                  {selectedItems.size} {selectedItems.size === 1 ? 'товар' : selectedItems.size < 5 ? 'товара' : 'товаров'} выбрано
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatPrice(finalTotal)}</div>
                <div className="text-blue-100 text-sm">Итого к оплате</div>
              </div>
            </div>
          </motion.div>

          {/* Сводка заказа */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Сводка заказа ({selectedItems.size} товаров)
            </h2>
            
            <div className="space-y-4">
              {/* Бандлы */}
              {bundlePairs.map((pair, index) => (
                <div
                  key={`pair-${index}`}
                  className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                        Скидка -{pair.discount}%
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 dark:text-green-400">Экономия</div>
                      <div className="text-sm font-bold text-green-700 dark:text-green-300">
                        {formatPrice(
                          (pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity * (pair.discount / 100) +
                          (pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity * (pair.discount / 100)
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Товары в бандле */}
                  <div className="space-y-3">
                    {/* Триггерный товар */}
                    <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <img
                        src={pair.triggerProduct.product?.image_url}
                        alt={pair.triggerProduct.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {pair.triggerProduct.product?.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          x{pair.triggerProduct.quantity}
                        </div>
                      </div>
                    </div>

                    {/* Предложенный товар */}
                    <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                      <img
                        src={pair.suggestedProduct.product?.image_url}
                        alt={pair.suggestedProduct.product?.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {pair.suggestedProduct.product?.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          x{pair.suggestedProduct.quantity}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Отдельные товары */}
              {singleItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <img
                    src={item.product?.image_url}
                    alt={item.product?.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {item.product?.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.product?.brand}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {item.product?.original_price && item.product.original_price > item.product.price && (
                        <span className="text-xs text-gray-500 line-through">
                          {formatPrice(item.product.original_price)}
                        </span>
                      )}
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatPrice(item.product?.price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      x{item.quantity}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Итого */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <div className="space-y-2">
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
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Итого</span>
                    <span>{formatPrice(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Выбор способа доставки */}
          {activeShippingMethods.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Способ доставки
              </h2>
              
              <div className="space-y-3">
                {activeShippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedShippingMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
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
            </motion.div>
          )}

          {/* Форма оформления */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Контактная информация
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Фамилия *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Телефон *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Адрес доставки */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary-600" />
              Адрес доставки
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Улица и номер дома *
                </label>
                <input
                  type="text"
                  required
                  value={form.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Город *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Индекс *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Страна *
                </label>
                <input
                  type="text"
                  required
                  value={form.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>

          {/* Способ оплаты */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-primary-600" />
              Способ оплаты
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={form.payment_method === 'cash'}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-gray-900 dark:text-white font-medium">Наличными при получении</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Оплата при доставке</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  checked={form.payment_method === 'card'}
                  onChange={(e) => handleInputChange('payment_method', e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="text-gray-900 dark:text-white font-medium">Банковской картой онлайн</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Безопасная оплата</p>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Поля банковской карты */}
          {form.payment_method === 'card' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary-600" />
                Данные карты
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Номер карты *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.card_number}
                    onChange={(e) => {
                      // Форматирование номера карты: XXXX XXXX XXXX XXXX
                      const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
                      if (value.length <= 19) { // 16 цифр + 3 пробела
                        handleInputChange('card_number', value)
                      }
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                      cardValidation.card_number.isValid 
                        ? 'border-gray-300 dark:border-gray-600' 
                        : 'border-red-500 dark:border-red-400'
                    }`}
                  />
                  {!cardValidation.card_number.isValid && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {cardValidation.card_number.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Владелец карты *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.card_holder}
                    onChange={(e) => handleInputChange('card_holder', e.target.value.toUpperCase())}
                    placeholder="IVAN IVANOV"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                      cardValidation.card_holder.isValid 
                        ? 'border-gray-300 dark:border-gray-600' 
                        : 'border-red-500 dark:border-red-400'
                    }`}
                  />
                  {!cardValidation.card_holder.isValid && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {cardValidation.card_holder.message}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Срок действия *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.card_expiry}
                      onChange={(e) => {
                        // Форматирование: MM/YY
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 4) {
                          const formatted = value.replace(/(\d{2})(\d{0,2})/, '$1/$2')
                          handleInputChange('card_expiry', formatted)
                        }
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                        cardValidation.card_expiry.isValid 
                          ? 'border-gray-300 dark:border-gray-600' 
                          : 'border-red-500 dark:border-red-400'
                      }`}
                    />
                    {!cardValidation.card_expiry.isValid && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {cardValidation.card_expiry.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      CVV *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.card_cvv}
                      onChange={(e) => {
                        // Только цифры, максимум 4 символа
                        const value = e.target.value.replace(/\D/g, '')
                        if (value.length <= 4) {
                          handleInputChange('card_cvv', value)
                        }
                      }}
                      placeholder="123"
                      maxLength={4}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                        cardValidation.card_cvv.isValid 
                          ? 'border-gray-300 dark:border-gray-600' 
                          : 'border-red-500 dark:border-red-400'
                      }`}
                    />
                    {!cardValidation.card_cvv.isValid && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {cardValidation.card_cvv.message}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <Lock className="h-4 w-4" />
                  <span>Ваши данные защищены SSL-шифрованием</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Дополнительно */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Дополнительно
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Примечания к заказу
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                placeholder="Укажите дополнительные пожелания по доставке..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </motion.div>

          {/* Кнопка оформления заказа */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="sticky bottom-6 z-10"
          >
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Оформляем заказ...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Оформить заказ за {formatPrice(finalTotal)}</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Кнопка "Назад к корзине" */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center"
          >
            <Link
              href="/cart"
              className="inline-flex items-center space-x-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Назад к корзине</span>
            </Link>
          </motion.div>
        </main>
      </div>

      {/* Десктопная версия - оставляем как есть */}
      <div className="hidden md:block">
        <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/cart"
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Назад к корзине</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Оформление заказа
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Заполните данные для доставки и оплаты • {selectedItems.size} товаров
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Ваш заказ ({selectedItems.size} товаров)
              </h2>
              
              <div className="space-y-4 mb-6">
                {/* Пары товаров со скидками */}
                {bundlePairs.map((pair, index) => (
                  <div key={`pair-${index}`} className="border border-green-200 dark:border-green-800 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">
                      💚 Выгодная пара (скидка -{pair.discount}%)
                    </div>
                    
                    {/* Триггерный товар */}
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {pair.triggerProduct.product?.image_url ? (
                          <img
                            src={pair.triggerProduct.product.image_url}
                            alt={pair.triggerProduct.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {pair.triggerProduct.product?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Количество: {pair.triggerProduct.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice((pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity)}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          {formatPrice((pair.triggerProduct.product?.price || 0) * pair.triggerProduct.quantity * (1 - pair.discount / 100))}
                        </p>
                      </div>
                    </div>
                    
                    {/* Предложенный товар */}
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        {pair.suggestedProduct.product?.image_url ? (
                          <img
                            src={pair.suggestedProduct.product.image_url}
                            alt={pair.suggestedProduct.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {pair.suggestedProduct.product?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Количество: {pair.suggestedProduct.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 line-through">
                          {formatPrice((pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity)}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          {formatPrice((pair.suggestedProduct.product?.price || 0) * pair.suggestedProduct.quantity * (1 - pair.discount / 100))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Отдельные товары */}
                {singleItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.product?.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Количество: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice((item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Подытог:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Доставка:</span>
                  <span>{shipping === 0 ? 'Бесплатно' : formatPrice(shipping)}</span>
                </div>
                {pointsToUse > 0 && (
                  <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                    <span>Списание баллов:</span>
                    <span>-{formatPrice(pointsToUse)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span>Итого:</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Выбор способа доставки */}
          {activeShippingMethods.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Способ доставки
              </h3>
              <div className="space-y-3">
                {activeShippingMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedShippingMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
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
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {method.name}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {method.description} • {method.estimated_days}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {subtotal >= method.free_shipping_threshold ? (
                          <div className="text-green-600 font-semibold text-sm">
                            Бесплатно
                          </div>
                        ) : (
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
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

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              {/* Contact Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Контактная информация
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Имя *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Телефон *
                    </label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Адрес доставки
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Улица и номер дома *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Город *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Почтовый индекс *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Страна *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Способ оплаты
                </h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={form.payment_method === 'cash'}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">Наличными при получении</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={form.payment_method === 'card'}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-900 dark:text-white">Банковской картой онлайн</span>
                  </label>
                </div>
              </div>

              {/* Credit Card Fields */}
              {form.payment_method === 'card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Данные банковской карты
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Номер карты *
                      </label>
                      <input
                        type="text"
                        required={form.payment_method === 'card'}
                        value={form.card_number}
                        onChange={(e) => {
                          // Форматирование номера карты: XXXX XXXX XXXX XXXX
                          const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
                          if (value.length <= 19) { // 16 цифр + 3 пробела
                            handleInputChange('card_number', value)
                          }
                        }}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                          cardValidation.card_number.isValid 
                            ? 'border-gray-300 dark:border-gray-600' 
                            : 'border-red-500 dark:border-red-400'
                        }`}
                      />
                      {!cardValidation.card_number.isValid && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {cardValidation.card_number.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Владелец карты *
                      </label>
                      <input
                        type="text"
                        required={form.payment_method === 'card'}
                        value={form.card_holder}
                        onChange={(e) => handleInputChange('card_holder', e.target.value.toUpperCase())}
                        placeholder="IVAN IVANOV"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          cardValidation.card_holder.isValid 
                            ? 'border-gray-300 dark:border-gray-600' 
                            : 'border-red-500 dark:border-red-400'
                        }`}
                      />
                      {!cardValidation.card_holder.isValid && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {cardValidation.card_holder.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Срок действия *
                        </label>
                        <input
                          type="text"
                          required={form.payment_method === 'card'}
                          value={form.card_expiry}
                          onChange={(e) => {
                            // Форматирование: MM/YY
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length <= 4) {
                              const formatted = value.replace(/(\d{2})(\d{0,2})/, '$1/$2')
                              handleInputChange('card_expiry', formatted)
                            }
                          }}
                          placeholder="MM/YY"
                          maxLength={5}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                            cardValidation.card_expiry.isValid 
                              ? 'border-gray-300 dark:border-gray-600' 
                              : 'border-red-500 dark:border-red-400'
                          }`}
                        />
                        {!cardValidation.card_expiry.isValid && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {cardValidation.card_expiry.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          CVV *
                        </label>
                        <input
                          type="text"
                          required={form.payment_method === 'card'}
                          value={form.card_cvv}
                          onChange={(e) => {
                            // Только цифры, максимум 4 символа
                            const value = e.target.value.replace(/\D/g, '')
                            if (value.length <= 4) {
                              handleInputChange('card_cvv', value)
                            }
                          }}
                          placeholder="123"
                          maxLength={4}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono ${
                            cardValidation.card_cvv.isValid 
                              ? 'border-gray-300 dark:border-gray-600' 
                              : 'border-red-500 dark:border-red-400'
                          }`}
                        />
                        {!cardValidation.card_cvv.isValid && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {cardValidation.card_cvv.message}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Lock className="h-4 w-4" />
                      <span>Ваши данные защищены SSL-шифрованием</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Дополнительные комментарии
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Укажите любые дополнительные пожелания..."
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5" />
                )}
                <span>
                  {loading ? 'Оформление заказа...' : `Оформить заказ за ${formatPrice(finalTotal)}`}
                </span>
              </motion.button>
            </motion.form>
          </div>
        </div>
      </main>
    </div>
  </div>
  )
} 