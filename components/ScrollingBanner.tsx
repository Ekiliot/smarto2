'use client'

import { motion } from 'framer-motion'
import { Truck, RotateCcw, Headphones, Clock, Zap, Tag } from 'lucide-react'

export function ScrollingBanner() {
  const bannerItems = [
    { text: 'Бесплатная доставка', icon: Truck, color: 'text-green-600' },
    { text: 'Удобный возврат', icon: RotateCcw, color: 'text-blue-600' },
    { text: 'Техподдержка 24/7', icon: Headphones, color: 'text-purple-600' },
    { text: 'Доставка за 1-5 дней', icon: Clock, color: 'text-orange-600' },
    { text: 'Получи товар в день заказа', icon: Zap, color: 'text-red-600' },
    { text: 'Распродажа', icon: Tag, color: 'text-pink-600' },
    { text: 'Бесплатная доставка', icon: Truck, color: 'text-green-600' },
    { text: 'Удобный возврат', icon: RotateCcw, color: 'text-blue-600' },
    { text: 'Техподдержка 24/7', icon: Headphones, color: 'text-purple-600' },
    { text: 'Доставка за 1-5 дней', icon: Clock, color: 'text-orange-600' },
    { text: 'Получи товар в день заказа', icon: Zap, color: 'text-red-600' },
    { text: 'Распродажа', icon: Tag, color: 'text-pink-600' }
  ]

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="relative">
        {/* Градиентные края для плавного перехода */}
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white dark:from-gray-800 to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white dark:from-gray-800 to-transparent z-10"></div>
        
        {/* Бегущий текст */}
        <div className="py-3">
          <motion.div
            className="flex space-x-8 whitespace-nowrap"
            animate={{
              x: [0, -50 * bannerItems.length]
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            {bannerItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
} 