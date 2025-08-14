// Версия и имена кешей
const CACHE_VERSION = '1.1.7'
const CACHE_PREFIX = 'smarto2'
const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${CACHE_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v${CACHE_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${CACHE_VERSION}`,
  API: `${CACHE_PREFIX}-api-v${CACHE_VERSION}`
}

// Конфигурация кеширования
const CACHE_CONFIG = {
  // Максимальные размеры кешей (в количестве элементов)
  MAX_CACHE_SIZE: {
    STATIC: 50,
    DYNAMIC: 100,
    IMAGES: 200,
    API: 100
  },
  // TTL для разных типов контента (в миллисекундах)
  TTL: {
    STATIC: 7 * 24 * 60 * 60 * 1000, // 7 дней
    DYNAMIC: 24 * 60 * 60 * 1000,    // 1 день
    IMAGES: 7 * 24 * 60 * 60 * 1000, // 7 дней
    API: 5 * 60 * 1000               // 5 минут
  },
  // Максимальный размер файла для кеширования (в байтах)
  MAX_FILE_SIZE: 10 * 1024 * 1024 // 10 MB
}

// Страницы для предварительного кеширования
const PRECACHE_URLS = [
  '/',
  '/cart',
  '/wishlist',
  '/products',
  '/login',
  '/account',
  '/offline.html',
  // Добавляем критические CSS и JS файлы если они есть
  '/manifest.json'
]

// Регулярные выражения для определения типов запросов
const URL_PATTERNS = {
  STATIC_PAGES: /^\/(?:$|cart|wishlist|products|login|account)/,
  PRODUCT_PAGES: /^\/product\/[^\/]+$/,
  API_REQUESTS: /^\/api\//,
  IMAGES: /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
  FONTS: /\.(woff|woff2|ttf|eot)$/i,
  SCRIPTS: /\.(js|css)$/i
}

// Стратегии кеширования
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
}

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log(`🔧 Service Worker v${CACHE_VERSION} installing...`)
  
  event.waitUntil(
    Promise.all([
      // Предварительное кеширование критических ресурсов
      precacheResources(),
      // Очистка старых кешей
      cleanupOldCaches()
    ])
  )
  
  // Принудительная активация нового SW
  self.skipWaiting()
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log(`✅ Service Worker v${CACHE_VERSION} activating...`)
  
  event.waitUntil(
    Promise.all([
      // Очистка устаревших кешей
      cleanupOldCaches(),
      // Очистка кешей по размеру и TTL
      cleanupExpiredCache(),
      // Получение контроля над всеми клиентами
      self.clients.claim()
    ])
  )
})

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Пропускаем не-GET запросы
  if (request.method !== 'GET') return
  
  // Пропускаем запросы к внешним ресурсам (включая Supabase изображения)
  if (url.origin !== self.location.origin) {
    return
  }
  
  // Определяем стратегию кеширования
  const strategy = determineStrategy(url, request)
  
  event.respondWith(
    handleRequest(request, strategy).catch(error => {
      console.error('❌ Request failed:', error)
      return handleRequestError(request, error)
    })
  )
})

// Предварительное кеширование ресурсов
async function precacheResources() {
  try {
    const cache = await caches.open(CACHES.STATIC)
    
    // Кешируем по одному для лучшей обработки ошибок
    const results = await Promise.allSettled(
      PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) {
            await cache.put(url, response)
            console.log(`✅ Precached: ${url}`)
          } else {
            console.warn(`⚠️ Failed to precache ${url}: ${response.status}`)
          }
        } catch (error) {
          console.warn(`⚠️ Failed to precache ${url}:`, error)
        }
      })
    )
    
    const successful = results.filter(r => r.status === 'fulfilled').length
    console.log(`📦 Precached ${successful}/${PRECACHE_URLS.length} resources`)
    
  } catch (error) {
    console.error('❌ Precaching failed:', error)
  }
}

// Определение стратегии кеширования
function determineStrategy(url, request) {
  const pathname = url.pathname
  
  // Статические страницы - кеш сначала
  if (URL_PATTERNS.STATIC_PAGES.test(pathname)) {
    return { strategy: STRATEGIES.CACHE_FIRST, cache: CACHES.STATIC }
  }
  
  // Страницы товаров - stale-while-revalidate
  if (URL_PATTERNS.PRODUCT_PAGES.test(pathname)) {
    return { strategy: STRATEGIES.STALE_WHILE_REVALIDATE, cache: CACHES.DYNAMIC }
  }
  
  // API запросы - network first с коротким TTL
  if (URL_PATTERNS.API_REQUESTS.test(pathname)) {
    return { strategy: STRATEGIES.NETWORK_FIRST, cache: CACHES.API }
  }
  
  // Изображения - cache first с длинным TTL
  if (URL_PATTERNS.IMAGES.test(pathname)) {
    return { strategy: STRATEGIES.CACHE_FIRST, cache: CACHES.IMAGES }
  }
  
  // Шрифты и статические ассеты - cache first
  if (URL_PATTERNS.FONTS.test(pathname) || URL_PATTERNS.SCRIPTS.test(pathname)) {
    return { strategy: STRATEGIES.CACHE_FIRST, cache: CACHES.STATIC }
  }
  
  // По умолчанию - network first
  return { strategy: STRATEGIES.NETWORK_FIRST, cache: CACHES.DYNAMIC }
}

// Обработка запросов
async function handleRequest(request, { strategy, cache: cacheName }) {
  const cacheKey = getCacheKey(request)
  
  switch (strategy) {
    case STRATEGIES.CACHE_FIRST:
      return await cacheFirst(request, cacheName, cacheKey)
    
    case STRATEGIES.NETWORK_FIRST:
      return await networkFirst(request, cacheName, cacheKey)
    
    case STRATEGIES.STALE_WHILE_REVALIDATE:
      return await staleWhileRevalidate(request, cacheName, cacheKey)
    
    case STRATEGIES.NETWORK_ONLY:
      return await fetch(request)
    
    case STRATEGIES.CACHE_ONLY:
      return await caches.match(cacheKey) || new Response('Not found', { status: 404 })
    
    default:
      return await networkFirst(request, cacheName, cacheKey)
  }
}

// Стратегия "кеш сначала"
async function cacheFirst(request, cacheName, cacheKey) {
  const cached = await getCachedResponse(cacheKey, cacheName)
  if (cached) {
    return cached
  }
  
  return await fetchAndCache(request, cacheName, cacheKey)
}

// Стратегия "сеть сначала"
async function networkFirst(request, cacheName, cacheKey) {
  try {
    return await fetchAndCache(request, cacheName, cacheKey)
  } catch (error) {
    const cached = await getCachedResponse(cacheKey, cacheName)
    if (cached) {
      console.log(`📱 Serving from cache (network failed): ${request.url}`)
      return cached
    }
    throw error
  }
}

// Стратегия "устаревший контент пока обновляется"
async function staleWhileRevalidate(request, cacheName, cacheKey) {
  const cached = getCachedResponse(cacheKey, cacheName)
  const network = fetchAndCache(request, cacheName, cacheKey).catch(() => null)
  
  // Возвращаем кешированную версию сразу, если есть
  const cachedResponse = await cached
  if (cachedResponse) {
    // Обновляем кеш в фоне
    network.then(response => {
      if (response) {
        console.log(`🔄 Background updated: ${request.url}`)
      }
    })
    return cachedResponse
  }
  
  // Если нет кеша, ждем сеть
  const networkResponse = await network
  if (networkResponse) {
    return networkResponse
  }
  
  throw new Error('No cache and network failed')
}

// Получение кешированного ответа с проверкой TTL
async function getCachedResponse(cacheKey, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const response = await cache.match(cacheKey)
    
    if (!response) return null
    
    // Проверяем TTL
    const cachedAt = response.headers.get('sw-cached-at')
    if (cachedAt) {
      const age = Date.now() - parseInt(cachedAt)
      const ttl = getCacheTTL(cacheName)
      
      if (age > ttl) {
        console.log(`⏰ Cache expired for: ${cacheKey}`)
        await cache.delete(cacheKey)
        return null
      }
    }
    
    console.log(`📱 Cache hit: ${cacheKey}`)
    return response
  } catch (error) {
    console.error('❌ Cache read error:', error)
    return null
  }
}

// Загрузка и кеширование ответа
async function fetchAndCache(request, cacheName, cacheKey) {
  const response = await fetch(request)
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  // Проверяем размер файла
  const contentLength = response.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > CACHE_CONFIG.MAX_FILE_SIZE) {
    console.log(`📦 File too large to cache: ${request.url}`)
    return response
  }
  
  // Клонируем ответ для кеширования
  const responseToCache = response.clone()
  
  // Добавляем метаданные
  const headers = new Headers(responseToCache.headers)
  headers.set('sw-cached-at', Date.now().toString())
  headers.set('sw-cache-version', CACHE_VERSION)
  
  const responseWithMeta = new Response(responseToCache.body, {
    status: responseToCache.status,
    statusText: responseToCache.statusText,
    headers
  })
  
  // Кешируем асинхронно
  cacheResponse(cacheName, cacheKey, responseWithMeta)
    .then(() => console.log(`💾 Cached: ${request.url}`))
    .catch(error => console.error(`❌ Cache write error:`, error))
  
  return response
}

// Кеширование ответа с проверкой размера кеша
async function cacheResponse(cacheName, cacheKey, response) {
  try {
    const cache = await caches.open(cacheName)
    
    // Проверяем размер кеша
    await limitCacheSize(cacheName)
    
    await cache.put(cacheKey, response)
  } catch (error) {
    console.error('❌ Failed to cache response:', error)
  }
}

// Ограничение размера кеша
async function limitCacheSize(cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    
    const maxSize = CACHE_CONFIG.MAX_CACHE_SIZE[getCacheType(cacheName)]
    
    if (requests.length >= maxSize) {
      // Удаляем самые старые записи
      const toDelete = requests.slice(0, requests.length - maxSize + 10) // Удаляем с запасом
      await Promise.all(toDelete.map(request => cache.delete(request)))
      console.log(`🧹 Cleaned ${toDelete.length} old cache entries from ${cacheName}`)
    }
  } catch (error) {
    console.error('❌ Cache size limit error:', error)
  }
}

// Получение типа кеша
function getCacheType(cacheName) {
  if (cacheName.includes('static')) return 'STATIC'
  if (cacheName.includes('images')) return 'IMAGES'
  if (cacheName.includes('api')) return 'API'
  return 'DYNAMIC'
}

// Получение TTL для кеша
function getCacheTTL(cacheName) {
  const type = getCacheType(cacheName)
  return CACHE_CONFIG.TTL[type] || CACHE_CONFIG.TTL.DYNAMIC
}

// Генерация ключа кеша
function getCacheKey(request) {
  const url = new URL(request.url)
  // Убираем некоторые query параметры для лучшего кеширования
  const ignoredParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid']
  ignoredParams.forEach(param => url.searchParams.delete(param))
  return url.toString()
}

// Очистка старых кешей
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys()
    const currentCaches = Object.values(CACHES)
    
    const oldCaches = cacheNames.filter(name => 
      name.startsWith(CACHE_PREFIX) && !currentCaches.includes(name)
    )
    
    if (oldCaches.length > 0) {
      await Promise.all(oldCaches.map(name => caches.delete(name)))
      console.log(`🧹 Deleted ${oldCaches.length} old caches`)
    }
  } catch (error) {
    console.error('❌ Cache cleanup error:', error)
  }
}

// Очистка устаревшего контента
async function cleanupExpiredCache() {
  try {
    for (const cacheName of Object.values(CACHES)) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      const ttl = getCacheTTL(cacheName)
      
      let deletedCount = 0
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const cachedAt = response.headers.get('sw-cached-at')
          if (cachedAt) {
            const age = Date.now() - parseInt(cachedAt)
            if (age > ttl) {
              await cache.delete(request)
              deletedCount++
            }
          }
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🧹 Deleted ${deletedCount} expired entries from ${cacheName}`)
      }
    }
  } catch (error) {
    console.error('❌ Expired cache cleanup error:', error)
  }
}

// Обработка ошибок запросов
async function handleRequestError(request, error) {
  console.error(`❌ Request failed: ${request.url}`, error)
  
  // Для навигационных запросов показываем offline страницу
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html')
      if (offlineResponse) {
        return offlineResponse
      }
    }
    
  // Для изображений возвращаем placeholder
  if (URL_PATTERNS.IMAGES.test(request.url)) {
    return new Response(
      '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#9ca3af">Изображение недоступно</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    )
  }
  
  // Для API запросов возвращаем JSON с ошибкой
  if (URL_PATTERNS.API_REQUESTS.test(request.url)) {
    return new Response(
      JSON.stringify({ error: 'Сервис временно недоступен' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
  
  // Базовая ошибка
  return new Response('Сервис недоступен', { status: 503 })
}

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'CACHE_PAGE':
      handleCachePageRequest(data.url)
      break
    
    case 'CLEAR_CACHE':
      handleClearCacheRequest()
      break
    
    case 'GET_CACHE_INFO':
      handleGetCacheInfoRequest(event)
      break
    
    case 'PREFETCH_RESOURCES':
      handlePrefetchRequest(data.urls)
      break
  }
})

// Кеширование страницы по запросу
async function handleCachePageRequest(url) {
  try {
    const cache = await caches.open(CACHES.DYNAMIC)
    await cache.add(url)
    console.log(`📱 Page cached on demand: ${url}`)
  } catch (error) {
    console.error('❌ Manual page caching failed:', error)
  }
}

// Очистка всех кешей
async function handleClearCacheRequest() {
  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('🧹 All caches cleared')
  } catch (error) {
    console.error('❌ Cache clearing failed:', error)
  }
}

// Получение информации о кеше
async function handleGetCacheInfoRequest(event) {
  try {
    const cacheInfo = {}
    
    for (const [name, cacheName] of Object.entries(CACHES)) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      cacheInfo[name] = {
        size: requests.length,
        maxSize: CACHE_CONFIG.MAX_CACHE_SIZE[name] || 100,
        ttl: CACHE_CONFIG.TTL[name] || CACHE_CONFIG.TTL.DYNAMIC
      }
    }
    
    event.ports[0].postMessage({
      type: 'CACHE_INFO_RESPONSE',
      data: cacheInfo
    })
  } catch (error) {
    console.error('❌ Cache info request failed:', error)
  }
}

// Предварительная загрузка ресурсов
async function handlePrefetchRequest(urls) {
  try {
    const cache = await caches.open(CACHES.DYNAMIC)
    
    await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) {
            await cache.put(url, response)
            console.log(`🚀 Prefetched: ${url}`)
          }
        } catch (error) {
          console.warn(`⚠️ Prefetch failed for ${url}:`, error)
        }
      })
    )
  } catch (error) {
    console.error('❌ Prefetch request failed:', error)
  }
}

// Фоновая синхронизация
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case 'cache-cleanup':
      event.waitUntil(cleanupExpiredCache())
      break
    
    case 'prefetch-critical':
      event.waitUntil(precacheResources())
      break
  }
})

// Push уведомления (улучшенная версия)
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      image: data.image,
      data: data.data,
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      tag: data.tag || 'default',
      renotify: data.renotify || false
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Уведомление', options)
    )
  } catch (error) {
    console.error('❌ Push notification error:', error)
  }
})

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const { action, data } = event.notification
  let url = data?.url || '/'
  
  // Обработка действий
  if (action) {
    switch (action) {
      case 'view':
        url = data?.viewUrl || url
        break
      case 'dismiss':
        return // Просто закрываем уведомление
    }
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Пытаемся найти уже открытое окно
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Открываем новое окно
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

console.log(`🚀 Service Worker v${CACHE_VERSION} loaded`) 