'use client'

interface SimpleToggleProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

export default function SimpleToggle({
  checked,
  onChange,
  disabled = false
}: SimpleToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
        ${checked 
          ? 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600' 
          : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'
        }
      `}
    >
      <div
        className={`
          absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-6' : 'translate-x-0.5'}
        `}
      />
    </button>
  )
} 