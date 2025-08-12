const CACHE_NAME = 'smarto2-v1'
const STATIC_CACHE = 'smarto2-static-v1'
const DYNAMIC_CACHE = 'smarto2-dynamic-v1'

// Страницы для предварительного кеширования
const STATIC_URLS = [
  '/',
  '/cart',
  '/wishlist',
  '/products',
  '/login',
  '/account'
]

// Файлы для предварительного кеширования
const STATIC_ASSETS = [
  '/offline.html'
]

// Стратегии кеширования
const CACHE_STRATEGIES = {
  // Кешируем статические страницы
  STATIC: 'static',
  // Кешируем динамические страницы (товары)
  DYNAMIC: 'dynamic',
  // Кешируем API ответы
  API: 'api',
  // Стратегия "сначала сеть, потом кеш"
  NETWORK_FIRST: 'network-first',
  // Стратегия "сначала кеш, потом сеть"
  CACHE_FIRST: 'cache-first'
}

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    Promise.all([
      // Кешируем статические страницы
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static pages')
        return cache.addAll(STATIC_URLS).catch(error => {
          console.log('Some static pages failed to cache:', error)
          // Кешируем по одному, если addAll не работает
          return Promise.allSettled(STATIC_URLS.map(url => cache.add(url)))
        })
      }),
      // Кешируем статические ресурсы
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS).catch(error => {
          console.log('Some static assets failed to cache:', error)
          // Кешируем по одному, если addAll не работает
          return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)))
        })
      })
    ])
  )
  
  self.skipWaiting()
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Пропускаем не-GET запросы
  if (request.method !== 'GET') return
  
  // Пропускаем запросы к внешним ресурсам
  if (url.origin !== self.location.origin) return
  
  // Определяем стратегию кеширования
  const strategy = getCacheStrategy(url.pathname)
  
  event.respondWith(
    handleRequest(request, strategy)
  )
})

// Определение стратегии кеширования для URL
function getCacheStrategy(pathname) {
  // Статические страницы
  if (STATIC_URLS.includes(pathname)) {
    return CACHE_STRATEGIES.STATIC
  }
  
  // Страницы товаров
  if (pathname.startsWith('/product/')) {
    return CACHE_STRATEGIES.DYNAMIC
  }
  
  // API запросы
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.API
  }
  
  // По умолчанию - сеть сначала
  return CACHE_STRATEGIES.NETWORK_FIRST
}

// Обработка запросов в зависимости от стратегии
async function handleRequest(request, strategy) {
  try {
    switch (strategy) {
      case CACHE_STRATEGIES.STATIC:
        return await cacheFirst(request, STATIC_CACHE)
      
      case CACHE_STRATEGIES.DYNAMIC:
        return await networkFirst(request, DYNAMIC_CACHE)
      
      case CACHE_STRATEGIES.API:
        return await networkFirst(request, DYNAMIC_CACHE)
      
      case CACHE_STRATEGIES.NETWORK_FIRST:
        return await networkFirst(request, DYNAMIC_CACHE)
      
      case CACHE_STRATEGIES.CACHE_FIRST:
        return await cacheFirst(request, DYNAMIC_CACHE)
      
      default:
        return await networkFirst(request, DYNAMIC_CACHE)
    }
  } catch (error) {
    console.error('Error handling request:', error)
    
    // Показываем offline страницу для навигационных запросов
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
    throw error
  }
}

// Стратегия "сначала кеш"
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    throw error
  }
}

// Стратегия "сначала сеть"
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    // Если сеть недоступна, пробуем кеш
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Фоновая синхронизация для кеширования
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    event.waitUntil(backgroundSync())
  }
})

// Фоновая синхронизация
async function backgroundSync() {
  try {
    // Здесь можно добавить логику для фонового обновления кеша
    console.log('Background sync completed')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Обработка push уведомлений
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.data
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
}) 