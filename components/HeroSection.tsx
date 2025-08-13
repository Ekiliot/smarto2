'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Play, Star, Home, Smartphone, Zap, Shield, Package } from 'lucide-react'
import { Category } from '@/lib/supabase'
import React from 'react'

interface HeroSectionProps {
  categories?: Category[]
}

// Функция для получения иконки по названию категории
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  
  if (name.includes('дом') || name.includes('home') || name.includes('умный')) return Home
  if (name.includes('электроника') || name.includes('гаджет') || name.includes('phone') || name.includes('смартфон')) return Smartphone
  if (name.includes('энергия') || name.includes('эффективность') || name.includes('power')) return Zap
  if (name.includes('безопасность') || name.includes('security') || name.includes('камера') || name.includes('датчик')) return Shield
  if (name.includes('лампа') || name.includes('освещение') || name.includes('круг') || name.includes('кольцо') || name.includes('кольцевая')) return Zap
  if (name.includes('автоматизация') || name.includes('контроль') || name.includes('управление')) return Home
  if (name.includes('аудио') || name.includes('звук') || name.includes('динамик')) return Package
  if (name.includes('климат') || name.includes('температура') || name.includes('кондиционер')) return Zap
  
  return Package // Иконка по умолчанию
}

// Функция для получения цвета по названию категории
const getCategoryColor = (categoryName: string) => {
  const name = categoryName.toLowerCase()
  
  if (name.includes('дом') || name.includes('home') || name.includes('умный')) return 'primary'
  if (name.includes('электроника') || name.includes('гаджет') || name.includes('phone') || name.includes('смартфон')) return 'secondary'
  if (name.includes('энергия') || name.includes('эффективность') || name.includes('power') || name.includes('лампа') || name.includes('освещение') || name.includes('круг') || name.includes('кольцо') || name.includes('кольцевая')) return 'green'
  if (name.includes('безопасность') || name.includes('security') || name.includes('камера') || name.includes('датчик')) return 'purple'
  if (name.includes('автоматизация') || name.includes('контроль') || name.includes('управление')) return 'blue'
  if (name.includes('аудио') || name.includes('звук') || name.includes('динамик')) return 'orange'
  if (name.includes('климат') || name.includes('температура') || name.includes('кондиционер')) return 'green'
  
  return 'primary' // Изменяем с 'gray' на 'primary' для более яркого вида
}

// Функция для получения CSS классов по цвету
const getCategoryClasses = (color: string) => {
  switch (color) {
    case 'primary':
      return 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-800'
    case 'secondary':
      return 'bg-gradient-to-br from-pink-400 via-pink-500 to-rose-600 dark:from-pink-600 dark:via-pink-700 dark:to-rose-800'
    case 'green':
      return 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 dark:from-emerald-600 dark:via-emerald-700 dark:to-teal-800'
    case 'purple':
      return 'bg-gradient-to-br from-violet-400 via-violet-500 to-purple-600 dark:from-violet-600 dark:via-violet-700 dark:to-purple-800'
    case 'blue':
      return 'bg-gradient-to-br from-blue-400 via-blue-500 to-cyan-600 dark:from-blue-600 dark:via-blue-700 dark:to-cyan-800'
    case 'orange':
      return 'bg-gradient-to-br from-orange-400 via-orange-500 to-red-600 dark:from-orange-600 dark:via-orange-700 dark:to-red-800'
    default:
      return 'bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-800'
  }
}

// Функция для получения CSS классов иконки по цвету
const getIconClasses = (color: string) => {
  switch (color) {
    case 'primary':
      return 'w-6 h-6 text-white'
    case 'secondary':
      return 'w-6 h-6 text-white'
    case 'green':
      return 'w-6 h-6 text-white'
    case 'purple':
      return 'w-6 h-6 text-white'
    default:
      return 'w-6 h-6 text-white'
  }
}

export function HeroSection({ categories = [] }: HeroSectionProps) {
  // Берем первые 4 категории для отображения
  const displayCategories = categories.slice(0, 4)
  
  // Если категорий меньше 4, добавляем заглушки
  const defaultCategories = [
    { id: '1', name: 'Умный дом', description: 'Автоматизация' },
    { id: '2', name: 'Электроника', description: 'Гаджеты' },
    { id: '3', name: 'Энергия', description: 'Эффективность' },
    { id: '4', name: 'Безопасность', description: 'Системы' }
  ]
  
  const finalCategories = displayCategories.length >= 4 
    ? displayCategories 
    : [...displayCategories, ...defaultCategories.slice(displayCategories.length)]

  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-primary-200 dark:bg-primary-800 rounded-full opacity-20 blur-xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-200 dark:bg-secondary-800 rounded-full opacity-20 blur-xl"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
            >
              <Star className="w-4 h-4 mr-2 fill-current" />
              #1 Магазин умного дома в Молдове
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight"
            >
              Умный дом
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Технологии
              </span>
              для каждого
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              Откройте для себя последние умные устройства для дома и электронику. 
              Превратите свой дом с помощью передовых технологий от лучших брендов.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Магазин
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                Смотреть демо
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex items-center space-x-8 pt-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">10K+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Довольных клиентов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Товаров</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Поддержка</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Заголовок "Категории" */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Категории
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Выберите интересующую вас категорию
              </p>
            </motion.div>
            
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-3xl transform rotate-6 scale-105 opacity-20"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    {finalCategories.map((category) => {
                      const color = getCategoryColor(category.name)
                      return (
                        <motion.div
                          key={category.id}
                          whileHover={{ scale: 1.05, y: -5 }}
                          className={`${getCategoryClasses(color)} rounded-xl p-4 text-center shadow-lg hover:shadow-xl border border-white/20 transition-all duration-300`}
                        >
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg mx-auto mb-2 flex items-center justify-center border border-white/30 shadow-inner">
                            {React.createElement(getCategoryIcon(category.name), { 
                              className: getIconClasses(color)
                            })}
                          </div>
                          <h3 className="font-semibold text-white mb-1">{category.name}</h3>
                          <p className="text-sm text-white/90">{category.description}</p>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
} 