import { useState, useEffect } from 'react'
import { 
  getActiveShippingMethods as getActiveShippingMethodsAPI, 
  getShippingMethodById as getShippingMethodByIdAPI, 
  calculateShippingCost as calculateShippingCostAPI,
  ShippingMethod 
} from '@/lib/supabase/shipping'

export function useShipping() {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Загружаем способы доставки
  useEffect(() => {
    loadShippingMethods()
  }, [])

  const loadShippingMethods = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: apiError } = await getActiveShippingMethodsAPI()
      
      if (apiError) {
        setError('Ошибка загрузки способов доставки')
        console.error('Error loading shipping methods:', apiError)
        return
      }
      
      setShippingMethods(data || [])
    } catch (err) {
      setError('Ошибка загрузки способов доставки')
      console.error('Error in loadShippingMethods:', err)
    } finally {
      setLoading(false)
    }
  }

  // Получаем активные способы доставки
  const getActiveShippingMethods = () => {
    return shippingMethods
      .filter(method => method.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  // Вычисляем стоимость доставки для заданной суммы
  const calculateShippingCost = async (subtotal: number, methodId: string) => {
    try {
      const { data, error } = await calculateShippingCostAPI(subtotal, methodId)
      
      if (error) {
        console.error('Error calculating shipping cost:', error)
        return 0
      }
      
      return data || 0
    } catch (err) {
      console.error('Error in calculateShippingCost:', err)
      // Fallback на локальный расчет
      const method = shippingMethods.find(m => m.id === methodId)
      if (!method) return 0
      
      if (subtotal >= method.free_shipping_threshold) {
        return 0 // Бесплатная доставка
      }
      
      return method.price
    }
  }

  // Получаем способ доставки по ID
  const getShippingMethodById = async (id: string): Promise<ShippingMethod | null> => {
    try {
      const { data, error } = await getShippingMethodByIdAPI(id)
      
      if (error) {
        console.error('Error getting shipping method by ID:', error)
        return null
      }
      
      return data
    } catch (err) {
      console.error('Error in getShippingMethodById:', err)
      // Fallback на локальный поиск
      return shippingMethods.find(method => method.id === id) || null
    }
  }

  // Получаем самый дешевый способ доставки
  const getCheapestShippingMethod = () => {
    const activeMethods = getActiveShippingMethods()
    if (activeMethods.length === 0) return null
    
    return activeMethods.reduce((cheapest, current) => 
      current.price < cheapest.price ? current : cheapest
    )
  }

  // Получаем способ доставки по ID (локальный поиск)
  const getShippingMethodByIdLocal = (id: string) => {
    return shippingMethods.find(method => method.id === id)
  }

  return {
    shippingMethods,
    activeShippingMethods: getActiveShippingMethods(),
    loading,
    error,
    calculateShippingCost,
    getShippingMethodById,
    getShippingMethodByIdLocal,
    getCheapestShippingMethod,
    refresh: loadShippingMethods
  }
} 