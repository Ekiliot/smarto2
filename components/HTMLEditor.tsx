'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff
} from 'lucide-react'

interface HTMLEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function HTMLEditor({ 
  value, 
  onChange, 
  placeholder = "Введите описание товара...", 
  disabled = false,
  className = ""
}: HTMLEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      editorRef.current.innerHTML = value
    }
  }, [value, isPreview])

  const execCommand = (command: string, value?: string) => {
    if (disabled) return
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertHTML = (html: string) => {
    if (disabled) return
    document.execCommand('insertHTML', false, html)
    editorRef.current?.focus()
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  const togglePreview = () => {
    setIsPreview(!isPreview)
  }

  const toolbarButtons = [
    { icon: Bold, command: 'bold', title: 'Жирный (Ctrl+B)' },
    { icon: Italic, command: 'italic', title: 'Курсив (Ctrl+I)' },
    { icon: Underline, command: 'underline', title: 'Подчеркнутый (Ctrl+U)' },
    { separator: true },
    { icon: List, command: 'insertUnorderedList', title: 'Маркированный список' },
    { icon: ListOrdered, command: 'insertOrderedList', title: 'Нумерованный список' },
    { separator: true },
    { icon: Link, command: 'createLink', title: 'Вставить ссылку', action: () => {
      const url = prompt('Введите URL ссылки:')
      if (url) execCommand('createLink', url)
    }},
    { icon: Image, command: 'insertImage', title: 'Вставить изображение', action: () => {
      const url = prompt('Введите URL изображения:')
      if (url) insertHTML(`<img src="${url}" alt="Изображение" style="max-width: 100%; height: auto;" />`)
    }},
    { icon: Code, command: 'formatBlock', title: 'Блок кода', action: () => insertHTML('<pre><code>Код</code></pre>') },
    { icon: Quote, command: 'formatBlock', title: 'Цитата', action: () => insertHTML('<blockquote>Цитата</blockquote>') },
    { separator: true },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Выровнять по левому краю' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Выровнять по центру' },
    { icon: AlignRight, command: 'justifyRight', title: 'Выровнять по правому краю' },
  ]

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 p-2">
          <div className="flex items-center space-x-1 flex-wrap gap-2">
            {toolbarButtons.map((button, index) => (
              <div key={index}>
                {button.separator ? (
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
                ) : (
                  <button
                    type="button"
                    onClick={button.action || (() => execCommand(button.command!))}
                    title={button.title}
                    disabled={disabled}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button.icon && <button.icon className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))}
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />
            
            <button
              type="button"
              onClick={togglePreview}
              title={isPreview ? "Режим редактирования" : "Предварительный просмотр"}
              disabled={disabled}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      <div className="relative">
        {isPreview ? (
          <div 
            className="min-h-[200px] px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable={!disabled}
            onInput={handleInput}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`min-h-[200px] px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none ${
              isFocused ? 'ring-2 ring-primary-500 ring-opacity-50' : ''
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            style={{
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit'
            }}
            data-placeholder={placeholder}
          />
        )}
        
        {/* Placeholder */}
        {!isPreview && !value && !isFocused && (
          <div className="absolute top-3 left-4 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Character count */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
        Символов: {value.replace(/<[^>]*>/g, '').length}
        {value.includes('<') && (
          <span className="ml-2 text-blue-600 dark:text-blue-400">
            HTML разметка активна
          </span>
        )}
      </div>
    </div>
  )
} 