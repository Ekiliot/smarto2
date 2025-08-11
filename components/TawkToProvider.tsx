'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    Tawk_API?: any
    Tawk_LoadStart?: Date
  }
}

export function TawkToProvider() {
  const pathname = usePathname()
  const scriptLoaded = useRef(false)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const isSupportPage = pathname === '/support'

  // Функция для показа виджета с проверкой готовности
  const showWidget = () => {
    if (window.Tawk_API && window.Tawk_API.showWidget) {
      try {
        window.Tawk_API.showWidget()
        console.log('Tawk.to виджет показан')
      } catch (error) {
        console.log('Ошибка при показе виджета:', error)
      }
    }
  }

  // Функция для полного отключения виджета
  const disableWidget = () => {
    if (window.Tawk_API) {
      try {
        // Скрываем виджет
        if (window.Tawk_API.hideWidget) {
          window.Tawk_API.hideWidget()
        }
        
        // Отключаем виджет полностью
        if (window.Tawk_API.maximize) {
          window.Tawk_API.maximize()
        }
        
        // Скрываем все элементы чата
        if (window.Tawk_API.toggle) {
          window.Tawk_API.toggle()
        }
        
        console.log('Tawk.to виджет полностью отключен')
      } catch (error) {
        console.log('Ошибка при отключении виджета:', error)
      }
    }
  }

  // Функция для полного удаления виджета из DOM
  const removeWidget = () => {
    try {
      // Удаляем все элементы Tawk.to из DOM
      const tawkElements = document.querySelectorAll('[id*="tawk"], [class*="tawk"], iframe[src*="tawk"]')
      tawkElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      
      // Удаляем стили Tawk.to
      const tawkStyles = document.querySelectorAll('style[data-tawk], link[href*="tawk"]')
      tawkStyles.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })
      
      console.log('Tawk.to элементы удалены из DOM')
    } catch (error) {
      console.log('Ошибка при удалении элементов:', error)
    }
  }

  useEffect(() => {
    // Загружаем скрипт Tawk.to только один раз
    if (typeof window !== 'undefined' && !scriptLoaded.current) {
      // Создаем глобальные переменные
      window.Tawk_API = window.Tawk_API || {}
      window.Tawk_LoadStart = new Date()

      // Создаем и загружаем скрипт
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://embed.tawk.to/688c881fc001281928a1dd0f/1j1if7eu5'
      script.charset = 'UTF-8'
      script.setAttribute('crossorigin', '*')

      // Сохраняем ссылку на скрипт
      scriptRef.current = script
      scriptLoaded.current = true

      // Добавляем скрипт в head
      document.head.appendChild(script)

      // Ждем загрузки скрипта и сразу показываем виджет если мы на странице поддержки
      script.onload = () => {
        console.log('Tawk.to скрипт загружен')
        
        // Проверяем готовность API с интервалом
        const checkAPIReady = setInterval(() => {
          if (window.Tawk_API && window.Tawk_API.showWidget) {
            clearInterval(checkAPIReady)
            console.log('Tawk.to API готов')
            
            // Если мы на странице поддержки, показываем виджет
            if (isSupportPage) {
              setTimeout(() => {
                showWidget()
              }, 500)
            } else {
              // Если не на странице поддержки, отключаем виджет
              disableWidget()
            }
          }
        }, 100)

        // Таймаут на случай если API не загрузится
        setTimeout(() => {
          clearInterval(checkAPIReady)
          if (isSupportPage) {
            showWidget()
          } else {
            disableWidget()
          }
        }, 5000)
      }
    }
  }, [isSupportPage])

  useEffect(() => {
    // Управляем виджетом Tawk.to в зависимости от страницы
    if (typeof window !== 'undefined' && window.Tawk_API) {
      if (isSupportPage) {
        // Показываем виджет на странице поддержки
        setTimeout(() => {
          showWidget()
        }, 500)
      } else {
        // Полностью отключаем виджет на других страницах
        disableWidget()
        
        // Дополнительно удаляем элементы из DOM
        setTimeout(() => {
          removeWidget()
        }, 1000)
      }
    }

    // Устанавливаем атрибут data-page для CSS селекторов
    if (typeof document !== 'undefined') {
      if (isSupportPage) {
        document.body.setAttribute('data-page', 'support')
      } else {
        document.body.removeAttribute('data-page')
      }
    }
  }, [isSupportPage])

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      // Полностью отключаем виджет при размонтировании
      disableWidget()
      removeWidget()
    }
  }, [])

  // Не рендерим ничего в DOM
  return null
} 