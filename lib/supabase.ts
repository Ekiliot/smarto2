import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Product {
  id: string
  name: string
  description: string
  price: number
  purchase_price: number
  original_price?: number
  image_url: string
  images: string[]
  category_id: string
  brand: string
  in_stock: boolean
  stock_quantity: number
  features: string[]
  specifications: Record<string, string>
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  image_url: string
  icon?: string
  product_count: number
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: string
  updated_at: string
  product?: Product
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
}

// Auth types
export interface AuthUser {
  id: string
  email: string
  first_name?: string
  last_name?: string
  is_new_user?: boolean
}

// Auth functions
export const signInWithMagicLink = async (email: string) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const updateUserProfile = async (userId: string, profile: { first_name: string; last_name: string; email?: string; image_url?: string }) => {
  const updateData: any = {
    id: userId,
    first_name: profile.first_name,
    last_name: profile.last_name,
    updated_at: new Date().toISOString()
  }
  
  // Добавляем email если он передан
  if (profile.email) {
    updateData.email = profile.email
  }
  
  // Добавляем image_url если он передан
  if (profile.image_url !== undefined) {
    updateData.image_url = profile.image_url
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .upsert(updateData)
    
  return { data, error }
}

// Admin functions
export const checkIsAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single()
  
  return { isAdmin: data?.is_admin || false, error }
}

export const createProduct = async (product: {
  name: string
  description: string
  price: number
  purchase_price: number
  original_price?: number
  image_url: string
  images: string[]
  category_id: string
  brand: string
  in_stock: boolean
  stock_quantity: number
  features: string[]
  specifications: Record<string, string>
}) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single()
  
  return { data, error }
}

export const updateProduct = async (id: string, product: Partial<{
  name: string
  description: string
  price: number
  purchase_price: number
  original_price: number
  image_url: string
  images: string[]
  category_id: string
  brand: string
  in_stock: boolean
  stock_quantity: number
  features: string[]
  specifications: Record<string, string>
}>) => {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
  
  return { error }
}

export const createCategory = async (category: {
  name: string
  description: string
  image_url: string
  icon?: string
}) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()
  
  return { data, error }
}

export const updateCategory = async (id: string, category: Partial<{
  name: string
  description: string
  image_url: string
  icon?: string
}>) => {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export const deleteCategory = async (id: string) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  
  return { error }
}

export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getAllCategories = async () => {
  console.log('Fetching categories...')
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  
  console.log('Categories result:', { data, error })
  
  return { data, error }
}

export const getCategoryById = async (id: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

// Storage functions
export const uploadProductImage = async (file: File, productId: string) => {
  const fileExt = file.name.split('.').pop()
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const fileName = `${productId}-${timestamp}-${randomId}.${fileExt}`
  const filePath = `products/${productId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { data: null, error }
  }

  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return { data: publicUrl, error: null }
}

export const deleteProductImage = async (imageUrl: string) => {
  // Извлекаем путь из URL
  const urlParts = imageUrl.split('/')
  const filePath = urlParts.slice(-2).join('/') // products/productId/filename

  const { error } = await supabase.storage
    .from('product-images')
    .remove([filePath])

  return { error }
}

export const uploadCategoryImage = async (file: File, categoryId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${categoryId}-${Date.now()}.${fileExt}`
  const filePath = `categories/${categoryId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('category-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { data: null, error }
  }

  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('category-images')
    .getPublicUrl(filePath)

  return { data: publicUrl, error: null }
}

export const uploadProfileImage = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `profiles/${userId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    return { data: null, error }
  }

  // Получаем публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath)

  return { data: publicUrl, error: null }
}

// Cart functions
export const getCartItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('cart_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data: data as CartItem[], error }
}

export const addToCart = async (userId: string, productId: string, quantity: number = 1) => {
  // Проверяем, есть ли уже товар в корзине
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  if (existingItem) {
    // Если товар уже есть, увеличиваем количество
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
      .select()
      .single()

    return { data, error }
  } else {
    // Если товара нет, добавляем новый
    const { data, error } = await supabase
      .from('cart_items')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity
      })
      .select()
      .single()

    return { data, error }
  }
}

export const updateCartItemQuantity = async (cartItemId: string, quantity: number) => {
  if (quantity <= 0) {
    // Если количество 0 или меньше, удаляем товар из корзины
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)

    return { data: null, error }
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .single()

  return { data, error }
}

export const removeFromCart = async (cartItemId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)

  return { error }
}

export const clearCart = async (userId: string) => {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)

  return { error }
}

export const getCartItemsCount = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_cart_items_count', { user_uuid: userId })

  return { count: data || 0, error }
}

// Admin statistics functions
export const getAdminStats = async () => {
  try {
    // Получаем количество товаров
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Получаем количество категорий
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    // Получаем количество пользователей
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Получаем количество заказов (пока 0, так как таблица заказов еще не создана)
    const ordersCount = 0

    return {
      products: productsCount || 0,
      categories: categoriesCount || 0,
      users: usersCount || 0,
      orders: ordersCount
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
    return {
      products: 0,
      categories: 0,
      users: 0,
      orders: 0
    }
  }
}

// User management functions
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export const updateUserRole = async (userId: string, isAdmin: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export const deleteUser = async (userId: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  return { error }
}

// Search functions
export const searchProducts = async (query: string, limit: number = 5) => {
  if (!query.trim()) return { data: [], error: null }

  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, image_url, brand, in_stock')
    .or(`name.ilike.%${query}%, brand.ilike.%${query}%`)
    .eq('in_stock', true)
    .limit(limit)
    .order('name')

  return { data, error }
}

// Wishlist functions
export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
  updated_at: string
  product?: Product
}

export const getWishlistItems = async (userId: string) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select(`
      *,
      product:products(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const addToWishlist = async (userId: string, productId: string) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      user_id: userId,
      product_id: productId
    })
    .select()
    .single()

  return { data, error }
}

export const removeFromWishlist = async (userId: string, productId: string) => {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  return { error }
}

export const isInWishlist = async (userId: string, productId: string) => {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single()

  return { isInWishlist: !!data, error }
}

export const getWishlistItemsCount = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_wishlist_items_count', { user_uuid: userId })

  return { count: data || 0, error }
}

export const clearWishlist = async (userId: string) => {
  const { error } = await supabase
    .rpc('clear_user_wishlist', { user_uuid: userId })

  return { error }
}

// Order interfaces
export interface Order {
  id: string
  user_id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  total_amount: number
  shipping_address: {
    street: string
    city: string
    postal_code: string
    country: string
  }
  contact_info: {
    first_name: string
    last_name: string
    email: string
    phone: string
  }
  payment_method?: string
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  created_at: string
  product?: Product
}

// Order functions
export const createOrder = async (orderData: {
  user_id: string
  total_amount: number
  shipping_address: Order['shipping_address']
  contact_info: Order['contact_info']
  payment_method?: string
  payment_status?: string
  notes?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
}) => {
  // Создаем заказ
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: orderData.user_id,
      order_number: await generateOrderNumber(),
      total_amount: orderData.total_amount,
      shipping_address: orderData.shipping_address,
      contact_info: orderData.contact_info,
      payment_method: orderData.payment_method,
      payment_status: orderData.payment_status || 'pending',
      notes: orderData.notes
    })
    .select()
    .single()

  if (orderError) return { error: orderError }

  // Создаем элементы заказа
  const orderItems = orderData.items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.quantity * item.unit_price
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) return { error: itemsError }

  return { data: order, error: null }
}

export const generateOrderNumber = async () => {
  const { data, error } = await supabase
    .rpc('generate_order_number')
  
  if (error) throw error
  return data
}

export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const getAllOrders = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (*)
      )
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const getOrderById = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (*)
      )
    `)
    .eq('id', orderId)
    .single()

  return { data, error }
}

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  return { data, error }
}

export const updatePaymentStatus = async (orderId: string, paymentStatus: Order['payment_status']) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId)
    .select()
    .single()

  return { data, error }
}

export const getOrdersStats = async () => {
  const { data, error } = await supabase
    .rpc('get_orders_stats')

  return { data, error }
} 

// Bundle interfaces
export interface ProductBundle {
  id: string
  trigger_product_id: string
  discount_percentage: number
  created_at: string
  updated_at: string
  suggested_products?: Product[]
  trigger_product?: Product
  bundle_products?: Array<{
    id: string
    bundle_id: string
    suggested_product_id: string
    created_at: string
    suggested_product?: Product
  }>
}

export interface BundleProduct {
  id: string
  bundle_id: string
  suggested_product_id: string
  created_at: string
}

export interface BundleWithProducts {
  bundle_id: string
  trigger_product_id: string
  discount_percentage: number
  suggested_products: Product[]
}

export interface BundleWithTrigger {
  bundle_id: string
  trigger_product_id: string
  discount_percentage: number
  trigger_product: Product
}

// Bundle functions
export const createBundle = async (bundleData: {
  trigger_product_id: string
  discount_percentage: number
  suggested_product_ids: string[]
}) => {
  // Создаем бандл
  const { data: bundle, error: bundleError } = await supabase
    .from('product_bundles')
    .insert({
      trigger_product_id: bundleData.trigger_product_id,
      discount_percentage: bundleData.discount_percentage
    })
    .select()
    .single()

  if (bundleError) return { error: bundleError }

  // Добавляем предложенные товары
  const bundleProducts = bundleData.suggested_product_ids.map(productId => ({
    bundle_id: bundle.id,
    suggested_product_id: productId
  }))

  const { error: productsError } = await supabase
    .from('bundle_products')
    .insert(bundleProducts)

  if (productsError) return { error: productsError }

  return { data: bundle, error: null }
}

export const updateBundle = async (bundleId: string, bundleData: {
  trigger_product_id: string
  discount_percentage: number
  suggested_product_ids: string[]
}) => {
  // Обновляем бандл
  const { data: bundle, error: bundleError } = await supabase
    .from('product_bundles')
    .update({
      trigger_product_id: bundleData.trigger_product_id,
      discount_percentage: bundleData.discount_percentage
    })
    .eq('id', bundleId)
    .select()
    .single()

  if (bundleError) return { error: bundleError }

  // Удаляем старые связи
  const { error: deleteError } = await supabase
    .from('bundle_products')
    .delete()
    .eq('bundle_id', bundleId)

  if (deleteError) return { error: deleteError }

  // Добавляем новые связи
  const bundleProducts = bundleData.suggested_product_ids.map(productId => ({
    bundle_id: bundleId,
    suggested_product_id: productId
  }))

  const { error: productsError } = await supabase
    .from('bundle_products')
    .insert(bundleProducts)

  if (productsError) return { error: productsError }

  return { data: bundle, error: null }
}

export const deleteBundle = async (bundleId: string) => {
  const { error } = await supabase
    .from('product_bundles')
    .delete()
    .eq('id', bundleId)

  return { error }
}

export const getAllBundles = async () => {
  const { data, error } = await supabase
    .from('product_bundles')
    .select(`
      *,
      trigger_product:products (*),
      bundle_products (
        *,
        suggested_product:products (*)
      )
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

export const getBundleById = async (bundleId: string) => {
  const { data, error } = await supabase
    .from('product_bundles')
    .select(`
      *,
      trigger_product:products (*),
      bundle_products (
        *,
        suggested_product:products (*)
      )
    `)
    .eq('id', bundleId)
    .single()

  return { data, error }
}

export const getActiveBundlesForProduct = async (productId: string) => {
  const { data, error } = await supabase
    .rpc('get_active_bundles_for_product', { product_id: productId })

  return { data, error }
}

export const getBundlesWithSuggestedProduct = async (productId: string) => {
  const { data, error } = await supabase
    .rpc('get_bundles_with_suggested_product', { product_id: productId })

  return { data, error }
}

export const getBundlesForCart = async (cartProductIds: string[]) => {
  if (cartProductIds.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from('product_bundles')
    .select(`
      *,
      trigger_product:products (*),
      bundle_products (
        *,
        suggested_product:products (*)
      )
    `)
    .in('trigger_product_id', cartProductIds)

  return { data, error }
} 

// Loyalty System Interfaces
export interface LoyaltyTransaction {
  id: string
  user_id: string
  points_change: number
  reason: string
  order_id?: string
  created_at: string
  expires_at: string
}

export interface LoyaltyTask {
  id: string
  task_name: string
  description: string
  points_reward: number
  task_type: 'daily' | 'once'
  status: 'active' | 'hidden'
  created_at: string
  updated_at: string
}

export interface UserTaskCompletion {
  id: string
  user_id: string
  task_id: string
  completed_at: string
  date_completed: string
}

export interface LoyaltySettings {
  id: string
  setting_name: string
  setting_value: string
  updated_at: string
}

export interface LoyaltyStats {
  total_users_with_points: number
  total_points_awarded: number
  total_points_spent: number
  avg_points_per_user: number
}

// Loyalty API Functions

// Получить баланс баллов пользователя
export const getUserLoyaltyPoints = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('loyalty_points')
    .eq('id', userId)
    .single()
    
  if (error) throw error
  return data?.loyalty_points || 0
}

// Получить историю транзакций баллов
export const getLoyaltyTransactions = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) throw error
  return data || []
}

// Получить все активные задания
export const getActiveLoyaltyTasks = async () => {
  const { data, error } = await supabase
    .from('loyalty_tasks')
    .select('*')
    .eq('status', 'active')
    .order('task_type', { ascending: true })
    
  if (error) throw error
  return data || []
}

// Получить выполненные задания пользователя за сегодня
export const getTodayCompletedTasks = async (userId: string) => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('user_task_completions')
    .select(`
      *,
      loyalty_tasks (*)
    `)
    .eq('user_id', userId)
    .eq('date_completed', today)
    
  if (error) throw error
  return data || []
}

// Выполнить задание
export const completeLoyaltyTask = async (userId: string, taskName: string) => {
  const { data, error } = await supabase
    .rpc('complete_loyalty_task', {
      p_user_id: userId,
      p_task_name: taskName
    })
    
  if (error) throw error
  return data
}

// Потратить баллы при оплате заказа
export const spendLoyaltyPoints = async (userId: string, pointsToSpend: number, orderId: string) => {
  const { data, error } = await supabase
    .rpc('spend_loyalty_points', {
      p_user_id: userId,
      p_points_to_spend: pointsToSpend,
      p_order_id: orderId
    })
    
  if (error) throw error
  return data
}

// Получить настройки системы лояльности
export const getLoyaltySettings = async () => {
  const { data, error } = await supabase
    .from('loyalty_settings')
    .select('*')
    
  if (error) throw error
  
  // Преобразуем в объект для удобства
  const settings: { [key: string]: string } = {}
  data?.forEach(setting => {
    settings[setting.setting_name] = setting.setting_value
  })
  
  return settings
}

// Обновить настройку системы лояльности (только для админов)
export const updateLoyaltySetting = async (settingName: string, settingValue: string) => {
  const { data, error } = await supabase
    .from('loyalty_settings')
    .update({ setting_value: settingValue, updated_at: new Date().toISOString() })
    .eq('setting_name', settingName)
    
  if (error) throw error
  return data
}

// Получить статистику по лояльности (для админов)
export const getLoyaltyStats = async () => {
  const { data, error } = await supabase
    .rpc('get_loyalty_stats')
    .single()
    
  if (error) throw error
  return data as LoyaltyStats
}

// Получить всех пользователей с баллами (для админов)
export const getAllUsersWithLoyaltyPoints = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, loyalty_points, created_at')
    .gt('loyalty_points', 0)
    .order('loyalty_points', { ascending: false })
    
  if (error) throw error
  return data || []
}

// Получить все транзакции баллов (для админов)
export const getAllLoyaltyTransactions = async (limit = 100) => {
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select(`
      *,
      profiles:user_id (first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
    
  if (error) throw error
  return data || []
}

// Управление заданиями (для админов)
export const createLoyaltyTask = async (task: Omit<LoyaltyTask, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('loyalty_tasks')
    .insert(task)
    .select()
    .single()
    
  if (error) throw error
  return data
}

export const updateLoyaltyTask = async (taskId: string, updates: Partial<LoyaltyTask>) => {
  const { data, error } = await supabase
    .from('loyalty_tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .select()
    .single()
    
  if (error) throw error
  return data
}

export const deleteLoyaltyTask = async (taskId: string) => {
  const { data, error } = await supabase
    .from('loyalty_tasks')
    .delete()
    .eq('id', taskId)
    
  if (error) throw error
  return data
}

// Получить все задания (для админов)
export const getAllLoyaltyTasks = async () => {
  const { data, error } = await supabase
    .from('loyalty_tasks')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (error) throw error
  return data || []
}

// Рассчитать максимальное количество баллов для оплаты заказа
export const calculateMaxPointsForOrder = async (orderAmount: number) => {
  const settings = await getLoyaltySettings()
  const maxPercentage = parseInt(settings.max_payment_percentage || '40')
  return Math.floor(orderAmount * maxPercentage / 100)
} 

// Daily Check-in System Interfaces
export interface DailyCheckin {
  id: string
  user_id: string
  checkin_date: string
  points_earned: number
  is_super_bonus: boolean
  streak_day: number
  created_at: string
}

export interface CheckinCalendar {
  checkins: DailyCheckin[]
  current_streak: number
  longest_streak: number
  year: number
  month: number
}

export interface CheckinStatus {
  can_checkin: boolean
  already_checked: boolean
  current_streak: number
  next_is_super: boolean
  days_until_super: number
}

export interface CheckinResult {
  success: boolean
  points_earned?: number
  is_super_day?: boolean
  current_streak?: number
  longest_streak?: number
  message: string
  already_checked?: boolean
}

// Daily Check-in API Functions

// Выполнить ежедневную отметку
export const performDailyCheckin = async (userId: string): Promise<CheckinResult> => {
  const { data, error } = await supabase
    .rpc('perform_daily_checkin', { p_user_id: userId })
    
  if (error) throw error
  return data as CheckinResult
}

// Проверить, можно ли отметиться сегодня
export const canCheckinToday = async (userId: string): Promise<CheckinStatus> => {
  const { data, error } = await supabase
    .rpc('can_checkin_today', { p_user_id: userId })
    
  if (error) throw error
  return data as CheckinStatus
}

// Получить календарь отметок
export const getCheckinCalendar = async (
  userId: string, 
  year?: number, 
  month?: number
): Promise<CheckinCalendar> => {
  const { data, error } = await supabase
    .rpc('get_user_checkin_calendar', { 
      p_user_id: userId,
      p_year: year,
      p_month: month
    })
    
  if (error) throw error
  return data as CheckinCalendar
}

// Получить текущий стрейк пользователя
export const getUserStreak = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('current_streak, longest_streak, last_checkin_date')
    .eq('id', userId)
    .single()
    
  if (error) throw error
  return data
}

// Получить историю отметок пользователя
export const getUserCheckins = async (userId: string, limit = 30) => {
  const { data, error } = await supabase
    .from('daily_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .limit(limit)
    
  if (error) throw error
  return data || []
} 