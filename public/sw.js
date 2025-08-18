// Версия и имена кешей
const SW_VERSION = '1.1.9'
const CACHE_PREFIX = 'smarto2'
const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${SW_VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v${SW_VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${SW_VERSION}`,
  API: `${CACHE_PREFIX}-api-v${SW_VERSION}`
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
  console.log(`�� Service Worker v${SW_VERSION} installing...`)
  
  event.waitUntil(
    Promise.all([
      // Предварительное кеширование критических ресурсов
      precacheResources(),
      // Очистка старых кешей только если есть подключение
      navigator.onLine ? cleanupOldCaches() : Promise.resolve()
    ])
  )
  
  // Активируем новый SW только если он действительно новый
  if (self.registration && self.registration.waiting) {
    self.skipWaiting()
  }
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log(`✅ Service Worker v${SW_VERSION} activating...`)
  
  event.waitUntil(
    Promise.all([
      // Очистка устаревших кешей только если есть подключение
      navigator.onLine ? cleanupOldCaches() : Promise.resolve(),
      // Очистка кешей по размеру и TTL только если есть подключение
      navigator.onLine ? cleanupExpiredCache() : Promise.resolve(),
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
  
  // Определяем стратегию кеширования на основе URL
  const getCachingStrategy = (url) => {
    const urlString = url.toString()
    
    // Не кешируем иконки с версией
    if (urlString.includes('/icon.png?v=') || urlString.includes('/manifest.json')) {
      return 'NETWORK_ONLY'
    }
    
    // Статические страницы
    if (urlString.includes('/') && !urlString.includes('/api/') && !urlString.includes('/admin/')) {
      return 'CACHE_FIRST'
    }
    
    // API запросы
    if (urlString.includes('/api/')) {
      return 'NETWORK_FIRST'
    }
    
    // Админ панель
    if (urlString.includes('/admin/')) {
      return 'NETWORK_FIRST'
    }
    
    // Изображения
    if (urlString.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      return 'CACHE_FIRST'
    }
    
    // Шрифты и CSS/JS
    if (urlString.match(/\.(css|js|woff|woff2|ttf|eot)$/i)) {
      return 'CACHE_FIRST'
    }
    
    // По умолчанию
    return 'CACHE_FIRST'
  }
  
  event.respondWith(
    handleRequest(request, getCachingStrategy(url)).catch(error => {
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
          
          // В offline режиме не пытаемся кешировать
          if (!navigator.onLine) {
            console.log('📱 Offline mode - skipping precache for failed resources')
          }
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
  
  // Статические страницы - кеш сначала (всегда доступны offline)
  if (URL_PATTERNS.STATIC_PAGES.test(pathname)) {
    return { strategy: STRATEGIES.CACHE_FIRST, cache: CACHES.STATIC }
  }
  
  // Страницы товаров - кеш сначала (чтобы были доступны offline)
  if (URL_PATTERNS.PRODUCT_PAGES.test(pathname)) {
    return { strategy: STRATEGIES.CACHE_FIRST, cache: CACHES.DYNAMIC }
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
  
  // По умолчанию - кеш сначала (чтобы страницы были доступны offline)
  return { strategy: STRATEGIES.CACHE_FIRST, cache: CACHES.DYNAMIC }
}

// Обработка запросов
async function handleRequest(request, strategy) {
  const cacheKey = getCacheKey(request)
  
  switch (strategy) {
    case 'CACHE_FIRST':
      return await cacheFirst(request, CACHES.DYNAMIC, cacheKey)
    
    case 'NETWORK_FIRST':
      return await networkFirst(request, CACHES.DYNAMIC, cacheKey)
    
    case 'STALE_WHILE_REVALIDATE':
      return await staleWhileRevalidate(request, CACHES.DYNAMIC, cacheKey)
    
    case 'NETWORK_ONLY':
      return await fetch(request)
    
    case 'CACHE_ONLY':
      return await caches.match(cacheKey) || new Response('Not found', { status: 404 })
    
    default:
      return await networkFirst(request, CACHES.DYNAMIC, cacheKey)
  }
}

  // Стратегия Cache First
  async function cacheFirst(request, cacheName, cacheKey) {
    try {
      // Сначала пытаемся получить из кеша
      const cachedResponse = await caches.match(cacheKey)
      if (cachedResponse) {
        console.log(`📦 Serving from cache: ${request.url}`)
        return cachedResponse
      }
      
      // Если нет в кеше, загружаем из сети
      const response = await fetch(request)
      if (response.ok) {
        await fetchAndCache(request, response, cacheName, cacheKey)
      }
      
      return response
    } catch (error) {
      console.error('❌ Cache First failed:', error)
      return new Response('Service Unavailable', { status: 503 })
    }
  }

  // Стратегия Network First
  async function networkFirst(request, cacheName, cacheKey) {
    try {
      // Сначала пытаемся загрузить из сети
      const response = await fetch(request)
      if (response.ok) {
        await fetchAndCache(request, response, cacheName, cacheKey)
        return response
      }
      
      // Если сеть недоступна, возвращаем из кеша
      const cachedResponse = await caches.match(cacheKey)
      if (cachedResponse) {
        console.log(`📦 Serving from cache (network failed): ${request.url}`)
        return cachedResponse
      }
      
      return response
    } catch (error) {
      console.error('❌ Network First failed:', error)
      // Пытаемся получить из кеша при ошибке сети
      const cachedResponse = await caches.match(cacheKey)
      if (cachedResponse) {
        console.log(`📦 Serving from cache (network error): ${request.url}`)
        return cachedResponse
      }
      return new Response('Service Unavailable', { status: 503 })
    }
  }

  // Стратегия Stale While Revalidate
  async function staleWhileRevalidate(request, cacheName, cacheKey) {
    try {
      // Сначала возвращаем из кеша (если есть)
      const cachedResponse = await caches.match(cacheKey)
      
      // Затем обновляем кеш в фоне
      fetch(request).then(async (response) => {
        if (response.ok) {
          await fetchAndCache(request, response, cacheName, cacheKey)
        }
      }).catch(error => {
        console.error('❌ Background revalidation failed:', error)
      })
      
      if (cachedResponse) {
        console.log(`📦 Serving stale from cache: ${request.url}`)
        return cachedResponse
      }
      
      // Если нет в кеше, загружаем из сети
      const response = await fetch(request)
      if (response.ok) {
        await fetchAndCache(request, response, cacheName, cacheKey)
      }
      
      return response
    } catch (error) {
      console.error('❌ Stale While Revalidate failed:', error)
      return new Response('Service Unavailable', { status: 503 })
    }
  }

// Получение кешированного ответа с проверкой TTL
async function getCachedResponse(cacheKey, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const response = await cache.match(cacheKey)
    
    if (!response) return null
    
    // Проверяем TTL только если есть подключение к интернету
    const cachedAt = response.headers.get('sw-cached-at')
    if (cachedAt) {
      const age = Date.now() - parseInt(cachedAt)
      const ttl = getCacheTTL(cacheName)
      
      // В offline режиме не удаляем кеш по TTL
      if (age > ttl && navigator.onLine) {
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
async function fetchAndCache(request, response, cacheName, cacheKey) {
  try {
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
    headers.set('sw-cache-version', SW_VERSION)
    
    const responseWithMeta = new Response(responseToCache.body, {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers
    })
    
    // Кешируем асинхронно только если есть подключение
    if (navigator.onLine) {
      cacheResponse(cacheName, cacheKey, responseWithMeta)
        .then(() => console.log(`💾 Cached: ${request.url}`))
        .catch(error => console.error(`❌ Cache write error:`, error))
    } else {
      console.log('📱 Offline mode - skipping cache write')
    }
    
  } catch (error) {
    console.error('❌ Fetch and cache failed:', error)
  }
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
    // В offline режиме не ограничиваем размер кеша
    if (!navigator.onLine) {
      console.log('📱 Offline mode - skipping cache size limit')
      return
    }
    
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
  // Убираем параметры версии для кеширования
  url.searchParams.delete('v')
  return url.toString()
}

// Очистка старых кешей
async function cleanupOldCaches() {
  try {
    // В offline режиме не очищаем кеш
    if (!navigator.onLine) {
      console.log('📱 Offline mode - skipping old cache cleanup')
      return
    }
    
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
    // В offline режиме не очищаем кеш
    if (!navigator.onLine) {
      console.log('📱 Offline mode - skipping cache cleanup')
      return
    }
    
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
    // Сначала пробуем найти страницу в кеше
    for (const cacheName of Object.values(CACHES)) {
      try {
        const cached = await caches.open(cacheName)
        const response = await cached.match(request)
        if (response) {
          console.log(`📱 Found cached version: ${request.url}`)
          return response
        }
      } catch (e) {
        // Игнорируем ошибки кеша
      }
    }
    
    // Если нет в кеше, показываем offline страницу
    const offlineResponse = await caches.match('/offline.html')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Если нет offline страницы, возвращаем базовую HTML страницу
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Страница недоступна</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .offline { color: #666; margin: 20px 0; }
          .retry { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>📱 Страница недоступна</h1>
        <p class="offline">Нет подключения к интернету</p>
        <p>Эта страница не была загружена ранее и не может быть показана offline.</p>
        <button class="retry" onclick="window.location.reload()">Попробовать снова</button>
      </body>
      </html>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    )
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
    // В offline режиме не кешируем новые страницы
    if (!navigator.onLine) {
      console.log('📱 Offline mode - skipping manual page caching')
      return
    }
    
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
    // В offline режиме не предзагружаем ресурсы
    if (!navigator.onLine) {
      console.log('📱 Offline mode - skipping prefetch')
      return
    }
    
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
  
  // В offline режиме не выполняем фоновые задачи
  if (!navigator.onLine) {
    console.log('📱 Offline mode - skipping background sync')
    return
  }
  
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

console.log(`�� Service Worker v${SW_VERSION} loaded`) 