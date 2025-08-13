'use client'

import { cn } from '@/lib/utils'

interface ToggleSwitchTailwindProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ToggleSwitchTailwind({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className
}: ToggleSwitchTailwindProps) {
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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        currentSize.track,
        checked 
          ? 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600' 
          : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500',
        className
      )}
    >
      <div
        className={cn(
          'bg-white rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out',
          currentSize.thumb,
          checked ? currentSize.translate : 'translate-x-0.5'
        )}
        style={{
          transform: checked ? `translateX(${size === 'sm' ? '20px' : size === 'md' ? '24px' : '28px'})` : 'translateX(2px)'
        }}
      />
    </button>
  )
} 