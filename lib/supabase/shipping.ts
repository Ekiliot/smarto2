import { createClient } from '@supabase/supabase-js'
import { supabase } from '../supabase'

export interface ShippingMethod {
  id: string
  name: string
  description: string
  price: number
  free_shipping_threshold: number
  estimated_days: string
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface ShippingMethodFormData {
  name: string
  description: string
  price: number
  free_shipping_threshold: number
  estimated_days: string
  is_active: boolean
  sort_order: number
}

// Получение всех активных способов доставки
export async function getActiveShippingMethods() {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching active shipping methods:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod[], error: null }
  } catch (error) {
    console.error('Error in getActiveShippingMethods:', error)
    return { data: null, error: error as Error }
  }
}

// Получение всех способов доставки (для админов)
export async function getAllShippingMethods() {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching all shipping methods:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod[], error: null }
  } catch (error) {
    console.error('Error in getAllShippingMethods:', error)
    return { data: null, error: error as Error }
  }
}

// Получение способа доставки по ID
export async function getShippingMethodById(id: string) {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching shipping method by ID:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod, error: null }
  } catch (error) {
    console.error('Error in getShippingMethodById:', error)
    return { data: null, error: error as Error }
  }
}

// Создание нового способа доставки
export async function createShippingMethod(methodData: ShippingMethodFormData) {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .insert([methodData])
      .select()
      .single()

    if (error) {
      console.error('Error creating shipping method:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod, error: null }
  } catch (error) {
    console.error('Error in createShippingMethod:', error)
    return { data: null, error: error as Error }
  }
}

// Обновление способа доставки
export async function updateShippingMethod(id: string, methodData: Partial<ShippingMethodFormData>) {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .update(methodData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating shipping method:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod, error: null }
  } catch (error) {
    console.error('Error in updateShippingMethod:', error)
    return { data: null, error: error as Error }
  }
}

// Удаление способа доставки
export async function deleteShippingMethod(id: string) {
  try {
    const { error } = await supabase
      .from('shipping_methods')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting shipping method:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error('Error in deleteShippingMethod:', error)
    return { error: error as Error }
  }
}

// Переключение статуса активности способа доставки
export async function toggleShippingMethodStatus(id: string, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error toggling shipping method status:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod, error: null }
  } catch (error) {
    console.error('Error in toggleShippingMethodStatus:', error)
    return { data: null, error: error as Error }
  }
}

// Обновление порядка сортировки способов доставки
export async function updateShippingMethodsOrder(orderData: { id: string; sort_order: number }[]) {
  try {
    const updates = orderData.map(item => ({
      id: item.id,
      sort_order: item.sort_order
    }))

    const { data, error } = await supabase
      .from('shipping_methods')
      .upsert(updates, { onConflict: 'id' })
      .select()

    if (error) {
      console.error('Error updating shipping methods order:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod[], error: null }
  } catch (error) {
    console.error('Error in updateShippingMethodsOrder:', error)
    return { data: null, error: error as Error }
  }
}

// Расчет стоимости доставки с использованием функции Supabase
export async function calculateShippingCost(subtotal: number, shippingMethodId: string) {
  try {
    const { data, error } = await supabase
      .rpc('calculate_shipping_cost', {
        p_subtotal: subtotal,
        p_shipping_method_id: shippingMethodId
      })

    if (error) {
      console.error('Error calculating shipping cost:', error)
      return { data: null, error }
    }

    return { data: data as number, error: null }
  } catch (error) {
    console.error('Error in calculateShippingCost:', error)
    return { data: null, error: error as Error }
  }
}

// Получение способа доставки с использованием функции Supabase
export async function getShippingMethodByIdRPC(id: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_shipping_method_by_id', {
        p_id: id
      })

    if (error) {
      console.error('Error fetching shipping method by ID RPC:', error)
      return { data: null, error }
    }

    if (data && data.length > 0) {
      return { data: data[0] as ShippingMethod, error: null }
    }

    return { data: null, error: new Error('Shipping method not found') }
  } catch (error) {
    console.error('Error in getShippingMethodByIdRPC:', error)
    return { data: null, error: error as Error }
  }
}

// Получение активных способов доставки с использованием функции Supabase
export async function getActiveShippingMethodsRPC() {
  try {
    const { data, error } = await supabase
      .rpc('get_active_shipping_methods')

    if (error) {
      console.error('Error fetching active shipping methods RPC:', error)
      return { data: null, error }
    }

    return { data: data as ShippingMethod[], error: null }
  } catch (error) {
    console.error('Error in getActiveShippingMethodsRPC:', error)
    return { data: null, error: error as Error }
  }
}

// Проверка доступности способа доставки
export async function isShippingMethodAvailable(id: string) {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('is_active')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error checking shipping method availability:', error)
      return { data: false, error }
    }

    return { data: data?.is_active || false, error: null }
  } catch (error) {
    console.error('Error in isShippingMethodAvailable:', error)
    return { data: false, error: error as Error }
  }
}

// Получение статистики по способам доставки
export async function getShippingMethodsStats() {
  try {
    const { data, error } = await supabase
      .from('shipping_methods')
      .select('is_active')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching shipping methods stats:', error)
      return { data: null, error }
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(method => method.is_active).length || 0
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error('Error in getShippingMethodsStats:', error)
    return { data: null, error: error as Error }
  }
} 