'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ToggleSwitchProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5'
    },
    md: {
      track: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7'
    }
  }

  const currentSize = sizeClasses[size]

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 toggle-switch-mobile',
        currentSize.track,
        checked 
          ? 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600' 
          : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500',
        className
      )}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      style={{
        // Дополнительные стили для предотвращения искажения на мобильных
        WebkitTransform: 'translateZ(0)',
        transform: 'translateZ(0)',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden'
      }}
    >
      <motion.div
        className={cn(
          'bg-white rounded-full shadow-lg border border-gray-200 dark:border-gray-700',
          currentSize.thumb
        )}
        initial={false}
        animate={{
          x: checked ? 0 : 0,
          translateX: checked ? currentSize.translate : '0.125rem'
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
        style={{
          // Дополнительные стили для thumb
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      />
    </motion.button>
  )
} 