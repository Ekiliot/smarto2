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
  EyeOff,
  Eraser
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
  const lastCaretPosition = useRef<number>(0)

  // Сохраняем позицию курсора
  const saveCaretPosition = () => {
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const preCaretRange = range.cloneRange()
        preCaretRange.selectNodeContents(editorRef.current)
        preCaretRange.setEnd(range.endContainer, range.endOffset)
        lastCaretPosition.current = preCaretRange.toString().length
      }
    }
  }

  // Восстанавливаем позицию курсора
  const restoreCaretPosition = () => {
    if (editorRef.current && lastCaretPosition.current > 0) {
      const selection = window.getSelection()
      if (selection) {
        const range = document.createRange()
        let charIndex = 0
        let found = false
        
        const traverseNodes = (node: Node) => {
          if (found) return
          
          if (node.nodeType === Node.TEXT_NODE) {
            const nextCharIndex = charIndex + node.textContent!.length
            if (lastCaretPosition.current <= nextCharIndex) {
              range.setStart(node, lastCaretPosition.current - charIndex)
              range.setEnd(node, lastCaretPosition.current - charIndex)
              found = true
              return
            }
            charIndex = nextCharIndex
          } else {
            for (let i = 0; i < node.childNodes.length; i++) {
              traverseNodes(node.childNodes[i])
              if (found) return
            }
          }
        }
        
        traverseNodes(editorRef.current)
        
        if (found) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    }
  }

  useEffect(() => {
    if (editorRef.current && !isPreview) {
      // Сохраняем текущую позицию курсора
      saveCaretPosition()
      
      // Обновляем содержимое
      editorRef.current.innerHTML = value
      
      // Восстанавливаем позицию курсора
      setTimeout(() => {
        restoreCaretPosition()
      }, 0)
    }
  }, [value, isPreview])

  const execCommand = (command: string, value?: string) => {
    if (disabled) return
    
    // Сохраняем позицию курсора
    saveCaretPosition()
    
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    
    // Восстанавливаем позицию курсора
    setTimeout(() => {
      restoreCaretPosition()
    }, 0)
  }

  const insertHTML = (html: string) => {
    if (disabled) return
    
    // Сохраняем позицию курсора
    saveCaretPosition()
    
    document.execCommand('insertHTML', false, html)
    editorRef.current?.focus()
    
    // Восстанавливаем позицию курсора
    setTimeout(() => {
      restoreCaretPosition()
    }, 0)
  }

  const clearFormatting = () => {
    if (disabled) return
    
    // Сохраняем позицию курсора
    saveCaretPosition()
    
    // Очищаем все форматирование
    document.execCommand('removeFormat', false)
    // Также очищаем все стили
    if (editorRef.current) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const span = document.createElement('span')
        span.appendChild(range.extractContents())
        range.insertNode(span)
        // Убираем все атрибуты style
        const elements = span.querySelectorAll('[style]')
        elements.forEach(el => el.removeAttribute('style'))
        // Убираем span, оставляя содержимое
        if (span.parentNode) {
          span.parentNode.replaceChild(document.createTextNode(span.textContent || ''), span)
        }
      }
    }
    editorRef.current?.focus()
    
    // Восстанавливаем позицию курсора
    setTimeout(() => {
      restoreCaretPosition()
    }, 0)
  }

  const generateTable = (rows: number, cols: number): string => {
    let tableHTML = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd;">'
    
    // Заголовок таблицы
    tableHTML += '<thead><tr>'
    for (let i = 0; i < cols; i++) {
      tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Заголовок ${i + 1}</th>`
    }
    tableHTML += '</tr></thead>'
    
    // Тело таблицы
    tableHTML += '<tbody>'
    for (let i = 0; i < rows; i++) {
      tableHTML += '<tr>'
      for (let j = 0; j < cols; j++) {
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px;">Ячейка ${i + 1}-${j + 1}</td>`
      }
      tableHTML += '</tr>'
    }
    tableHTML += '</tbody></table>'
    
    return tableHTML
  }

  const handleInput = () => {
    if (editorRef.current) {
      // Сохраняем позицию курсора перед обновлением
      saveCaretPosition()
      
      // Вызываем onChange с новым значением
      onChange(editorRef.current.innerHTML)
      
      // Восстанавливаем позицию курсора
      setTimeout(() => {
        restoreCaretPosition()
      }, 0)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    
    // Сохраняем позицию курсора
    saveCaretPosition()
    
    // Пытаемся получить различные типы контента
    let html = e.clipboardData.getData('text/html')
    let text = e.clipboardData.getData('text/plain')
    let files = e.clipboardData.files
    
    // Если есть файлы (изображения), обрабатываем их
    if (files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (event) => {
            const imageUrl = event.target?.result as string
            insertHTML(`<img src="${imageUrl}" alt="Вставленное изображение" style="max-width: 100%; height: auto;" />`)
          }
          reader.readAsDataURL(file)
        }
      })
      return
    }
    
    // Если есть HTML контент, используем его
    if (html) {
      // Очищаем HTML от потенциально опасных тегов и атрибутов
      const cleanHTML = sanitizeHTML(html)
      document.execCommand('insertHTML', false, cleanHTML)
    } else if (text) {
      // Если HTML нет, вставляем обычный текст
    document.execCommand('insertText', false, text)
    }
    
    // Восстанавливаем позицию курсора
    setTimeout(() => {
      restoreCaretPosition()
    }, 0)
  }

  // Функция для очистки HTML от потенциально опасных элементов
  const sanitizeHTML = (html: string): string => {
    // Создаем временный div для парсинга HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Разрешенные HTML теги
    const allowedTags = [
      'p', 'div', 'span', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
    ]
    
    // Разрешенные CSS свойства
    const allowedStyles = [
      'color', 'background-color', 'font-size', 'font-weight', 'font-style', 'text-align',
      'text-decoration', 'margin', 'padding', 'border', 'width', 'height', 'max-width'
    ]
    
    // Рекурсивно очищаем DOM
    const cleanNode = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element
        const tagName = element.tagName.toLowerCase()
        
        // Если тег не разрешен, заменяем его содержимым
        if (!allowedTags.includes(tagName)) {
          const fragment = document.createDocumentFragment()
          while (element.firstChild) {
            fragment.appendChild(element.firstChild)
          }
          element.parentNode?.replaceChild(fragment, element)
          return
        }
        
        // Очищаем атрибуты, оставляя только безопасные
        const allowedAttributes = ['href', 'src', 'alt', 'title', 'target']
        const attributes = Array.from(element.attributes)
        
        attributes.forEach(attr => {
          if (!allowedAttributes.includes(attr.name)) {
            element.removeAttribute(attr.name)
          }
        })
        
        // Очищаем стили, оставляя только разрешенные
        if (element.hasAttribute('style')) {
          const elementWithStyle = element as HTMLElement
          const computedStyle = window.getComputedStyle(elementWithStyle)
          const cleanStyles: string[] = []
          
          allowedStyles.forEach(style => {
            const value = computedStyle.getPropertyValue(style)
            if (value && value !== 'initial' && value !== 'normal') {
              cleanStyles.push(`${style}: ${value}`)
            }
          })
          
          if (cleanStyles.length > 0) {
            element.setAttribute('style', cleanStyles.join('; '))
          } else {
            element.removeAttribute('style')
          }
        }
        
        // Рекурсивно обрабатываем дочерние элементы
        Array.from(element.childNodes).forEach(cleanNode)
      }
    }
    
    // Очищаем весь DOM
    Array.from(tempDiv.childNodes).forEach(cleanNode)
    
    return tempDiv.innerHTML
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
      if (url) {
        const text = prompt('Введите текст ссылки (или оставьте пустым для URL):', url)
        if (text) {
          insertHTML(`<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`)
        } else {
          insertHTML(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
        }
      }
    }},
    { icon: Image, command: 'insertImage', title: 'Вставить изображение', action: () => {
      const url = prompt('Введите URL изображения:')
      if (url) {
        const alt = prompt('Введите описание изображения (alt):', '')
        const altText = alt || 'Изображение'
        insertHTML(`<img src="${url}" alt="${altText}" style="max-width: 100%; height: auto;" />`)
      }
    }},
    { icon: Code, command: 'formatBlock', title: 'Блок кода', action: () => insertHTML('<pre><code>Код</code></pre>') },
    { icon: Quote, command: 'formatBlock', title: 'Цитата', action: () => insertHTML('<blockquote>Цитата</blockquote>') },
    { separator: true },
    { icon: AlignLeft, command: 'justifyLeft', title: 'Выровнять по левому краю' },
    { icon: AlignCenter, command: 'justifyCenter', title: 'Выровнять по центру' },
    { icon: AlignRight, command: 'justifyRight', title: 'Выровнять по правому краю' },
    { icon: Eraser, command: 'removeFormat', title: 'Очистить форматирование', action: () => clearFormatting() },
    { separator: true },
    { 
      icon: List, 
      command: 'insertTable', 
      title: 'Вставить таблицу', 
      action: () => {
        const rows = prompt('Количество строк:', '3')
        const cols = prompt('Количество столбцов:', '3')
        if (rows && cols) {
          const tableHTML = generateTable(parseInt(rows), parseInt(cols))
          insertHTML(tableHTML)
        }
      }
    },
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