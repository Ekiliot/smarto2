'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-gray-700" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-400" />
        )}
      </motion.div>
      
      <motion.div
        className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary-400 to-secondary-400 opacity-0 hover:opacity-20 transition-opacity duration-200"
        initial={false}
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 0.2 }}
      />
    </motion.button>
  )
} 