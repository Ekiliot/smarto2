# Smarto Design Guide 🎨

## Обзор бренда

**Smarto** - премиальный онлайн магазин умного дома и электроники в Молдове. Бренд олицетворяет инновации, качество и современный образ жизни.

### Миссия
Сделать умные технологии доступными для каждого дома в Молдове, предоставляя качественные продукты с отличным сервисом.

### Целевая аудитория
- Молодые профессионалы 25-45 лет
- Технологически продвинутые пользователи
- Семьи, заботящиеся о комфорте и безопасности
- Любители инноваций и гаджетов

---

## Цветовая палитра 🎨

### Основные цвета
```css
/* Primary (Фиолетовый) */
primary-50: #faf5ff    /* Светлый фон */
primary-100: #f3e8ff   /* Hover состояния */
primary-200: #e9d5ff   /* Границы и разделители */
primary-300: #d8b4fe   /* Иконки и акценты */
primary-400: #c084fc   /* Кнопки и ссылки */
primary-500: #a855f7   /* Основной цвет бренда */
primary-600: #9333ea   /* Активные состояния */
primary-700: #7c3aed   /* Hover кнопок */
primary-800: #6b21a8   /* Текст на светлом фоне */
primary-900: #581c87   /* Темные акценты */

/* Secondary (Розовый) */
secondary-50: #fdf4ff
secondary-100: #fae8ff
secondary-200: #f5d0fe
secondary-300: #f0abfc
secondary-400: #e879f9
secondary-500: #d946ef
secondary-600: #c026d3
secondary-700: #a21caf
secondary-800: #86198f
secondary-900: #701a75
```

### Нейтральные цвета
```css
/* Серые оттенки */
gray-50: #f9fafb      /* Фон секций */
gray-100: #f3f4f6     /* Карточки */
gray-200: #e5e7eb     /* Границы */
gray-300: #d1d5db     /* Разделители */
gray-400: #9ca3af     /* Вторичный текст */
gray-500: #6b7280     /* Основной текст */
gray-600: #4b5563     /* Заголовки */
gray-700: #374151     /* Темный текст */
gray-800: #1f2937     /* Темный фон */
gray-900: #111827     /* Темный фон секций */
```

### Семантические цвета
```css
/* Успех */
green-500: #10b981
green-600: #059669

/* Ошибка */
red-500: #ef4444
red-600: #dc2626

/* Предупреждение */
yellow-500: #f59e0b
yellow-600: #d97706

/* Информация */
blue-500: #3b82f6
blue-600: #2563eb
```

---

## Типографика 📝

### Шрифты
- **Основной**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif

### Размеры шрифтов
```css
/* Заголовки */
text-xs: 0.75rem      /* 12px - Мелкие метки */
text-sm: 0.875rem     /* 14px - Описания */
text-base: 1rem       /* 16px - Основной текст */
text-lg: 1.125rem     /* 18px - Подзаголовки */
text-xl: 1.25rem      /* 20px - Заголовки секций */
text-2xl: 1.5rem      /* 24px - Заголовки страниц */
text-3xl: 1.875rem    /* 30px - Главные заголовки */
text-4xl: 2.25rem     /* 36px - Hero заголовки */
text-5xl: 3rem        /* 48px - Большие заголовки */
text-6xl: 3.75rem     /* 60px - Очень большие заголовки */
```

### Веса шрифтов
```css
font-light: 300       /* Легкий */
font-normal: 400      /* Обычный */
font-medium: 500      /* Средний */
font-semibold: 600    /* Полужирный */
font-bold: 700        /* Жирный */
font-extrabold: 800   /* Очень жирный */
```

### Высота строк
```css
leading-tight: 1.25   /* Заголовки */
leading-normal: 1.5   /* Обычный текст */
leading-relaxed: 1.625 /* Описания */
leading-loose: 2      /* Большие блоки текста */
```

---

## Компоненты 🧩

### Кнопки

#### Primary Button
```css
bg-primary-600 hover:bg-primary-700
text-white font-semibold
py-3 px-6 rounded-lg
transition-all duration-300
transform hover:scale-105 active:scale-95
```

#### Secondary Button
```css
bg-secondary-600 hover:bg-secondary-700
text-white font-semibold
py-3 px-6 rounded-lg
transition-all duration-300
transform hover:scale-105 active:scale-95
```

#### Outline Button
```css
border-2 border-gray-300 dark:border-gray-600
text-gray-700 dark:text-gray-300
hover:border-primary-500 hover:text-primary-600
font-semibold py-3 px-6 rounded-lg
transition-all duration-300
```

#### Icon Button
```css
p-2 rounded-lg
bg-gray-100 dark:bg-gray-800
hover:bg-gray-200 dark:hover:bg-gray-700
text-gray-700 dark:text-gray-300
hover:text-primary-600 dark:hover:text-primary-400
transition-colors duration-200
```

### Карточки

#### Product Card
```css
bg-white dark:bg-gray-800
rounded-xl shadow-lg hover:shadow-2xl
transition-all duration-300
overflow-hidden
group hover:-translate-y-2
```

#### Feature Card
```css
bg-gradient-to-br from-primary-100 to-primary-200
dark:from-primary-900 dark:to-primary-800
rounded-xl p-4 text-center
hover:scale-105 transition-transform
```

### Input Fields
```css
w-full px-4 py-3
border border-gray-300 dark:border-gray-600
rounded-lg
focus:ring-2 focus:ring-primary-500 focus:border-transparent
bg-white dark:bg-gray-800
text-gray-900 dark:text-white
transition-all duration-300
```

---

## Анимации и переходы 🎭

### Основные анимации
```css
/* Fade In */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* Slide Up */
@keyframes slideUp {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* Scale In */
@keyframes scaleIn {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* Float */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
```

### Framer Motion анимации
```javascript
// Появление элементов
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}

// Hover эффекты
whileHover={{ scale: 1.05, y: -5 }}
whileTap={{ scale: 0.95 }}

// Stagger анимации
transition={{ delay: index * 0.1 }}
```

### Переходы
```css
/* Быстрые переходы */
transition-all duration-200

/* Средние переходы */
transition-all duration-300

/* Медленные переходы */
transition-all duration-500

/* Easing функции */
ease-in-out
ease-out
ease-in
```

---

## Spacing и Layout 📐

### Отступы
```css
/* Маленькие отступы */
p-2: 0.5rem    /* 8px */
p-3: 0.75rem   /* 12px */
p-4: 1rem      /* 16px */

/* Средние отступы */
p-6: 1.5rem    /* 24px */
p-8: 2rem      /* 32px */

/* Большие отступы */
p-12: 3rem     /* 48px */
p-16: 4rem     /* 64px */
p-20: 5rem     /* 80px */
```

### Контейнеры
```css
/* Максимальная ширина */
max-w-7xl: 80rem    /* 1280px */

/* Отступы контейнера */
px-4 sm:px-6 lg:px-8
```

### Grid система
```css
/* Адаптивная сетка */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4

/* Отступы между элементами */
gap-4: 1rem
gap-6: 1.5rem
gap-8: 2rem
```

---

## Эффекты и тени 🌟

### Тени
```css
/* Легкие тени */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)

/* Средние тени */
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)

/* Сильные тени */
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25)
```

### Градиенты
```css
/* Основной градиент */
bg-gradient-to-r from-primary-600 to-secondary-600

/* Фоновый градиент */
bg-gradient-to-br from-primary-50 via-white to-secondary-50
dark:from-gray-900 dark:via-gray-800 dark:to-gray-900

/* Карточки */
bg-gradient-to-br from-primary-100 to-primary-200
dark:from-primary-900 dark:to-primary-800
```

### Glass Morphism
```css
backdrop-filter: blur(10px)
background: rgba(255, 255, 255, 0.1)
border: 1px solid rgba(255, 255, 255, 0.2)

/* Темная тема */
dark:background: rgba(0, 0, 0, 0.1)
dark:border: 1px solid rgba(255, 255, 255, 0.1)
```

---

## Темная тема 🌙

### Принципы
- **Контрастность**: Минимум 4.5:1 для текста
- **Читаемость**: Четкие границы между элементами
- **Комфорт**: Не слишком яркие цвета

### Цветовые пары
```css
/* Фон */
bg-white dark:bg-gray-900

/* Карточки */
bg-gray-50 dark:bg-gray-800

/* Границы */
border-gray-200 dark:border-gray-700

/* Текст */
text-gray-900 dark:text-white
text-gray-600 dark:text-gray-400
```

---

## Responsive Design 📱

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Планшеты */
md: 768px   /* Маленькие десктопы */
lg: 1024px  /* Средние десктопы */
xl: 1280px  /* Большие десктопы */
2xl: 1536px /* Очень большие экраны */
```

### Адаптивные классы
```css
/* Скрытие/показ элементов */
hidden md:block
block md:hidden

/* Размеры текста */
text-sm md:text-base lg:text-lg

/* Отступы */
p-4 md:p-6 lg:p-8

/* Сетки */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## Иконки и изображения 🖼️

### Иконки
- **Библиотека**: Lucide React
- **Размеры**: 16px, 20px, 24px, 32px
- **Цвета**: Соответствуют тексту элемента

### Изображения
- **Формат**: WebP с fallback на JPEG
- **Оптимизация**: Next.js Image component
- **Размеры**: Адаптивные с aspect-ratio

---

## Доступность ♿

### Контрастность
- Минимум 4.5:1 для обычного текста
- Минимум 3:1 для крупного текста
- Минимум 3:1 для UI элементов

### Фокус
```css
focus:ring-2 focus:ring-primary-500 focus:outline-none
```

### Семантика
- Правильные HTML теги
- ARIA атрибуты где необходимо
- Альтернативный текст для изображений

---

## Производительность ⚡

### Оптимизация
- Ленивая загрузка изображений
- Оптимизированные анимации
- Минификация CSS и JS
- Кэширование статических ресурсов

### Метрики
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Cumulative Layout Shift < 0.1

---

## Примеры использования 💡

### Hero секция
```jsx
<section className="relative min-h-[600px] bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
    <motion.h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
      Smart Home
      <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
        Technology
      </span>
    </motion.h1>
  </div>
</section>
```

### Карточка товара
```jsx
<motion.div className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
  <div className="relative overflow-hidden aspect-square">
    <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
  </div>
  <div className="p-4">
    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
      {product.name}
    </h3>
    <div className="flex items-center space-x-2">
      <span className="text-lg font-bold text-gray-900 dark:text-white">
        {formatPrice(product.price)}
      </span>
    </div>
  </div>
</motion.div>
```

---

## Чек-лист для новых компонентов ✅

- [ ] Использует правильную цветовую палитру
- [ ] Поддерживает темную тему
- [ ] Адаптивный дизайн
- [ ] Анимации и переходы
- [ ] Доступность (ARIA, контрастность)
- [ ] Производительность (ленивая загрузка)
- [ ] Соответствует типографике
- [ ] Правильные отступы и spacing
- [ ] Тестирование на разных устройствах

---

*Этот гайд должен использоваться как основа для всех дизайн-решений в проекте Smarto.* 