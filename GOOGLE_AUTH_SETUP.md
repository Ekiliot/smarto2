# Настройка Google Auth в Supabase

## 1. Настройка Google OAuth в Google Cloud Console

### Шаг 1: Создание проекта
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API

### Шаг 2: Создание OAuth 2.0 credentials
1. Перейдите в "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
3. Выберите "Web application"
4. Добавьте авторизованные URI перенаправления:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (для разработки)

### Шаг 3: Получение Client ID и Client Secret
- Скопируйте `Client ID` и `Client Secret`
- Сохраните их для настройки в Supabase

## 2. Настройка Supabase

### Шаг 1: Включение Google Auth
1. Перейдите в ваш проект Supabase
2. Откройте "Authentication" > "Providers"
3. Найдите "Google" и включите его

### Шаг 2: Настройка Google credentials
1. Вставьте `Client ID` в поле "Client ID"
2. Вставьте `Client Secret` в поле "Client Secret"
3. Сохраните настройки

### Шаг 3: Настройка redirect URLs
1. В "URL Configuration" добавьте:
   - `http://localhost:3000/auth/callback` (для разработки)
   - `https://yourdomain.com/auth/callback` (для продакшена)

## 3. Настройка переменных окружения

Добавьте в ваш `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Тестирование

1. Запустите приложение
2. Перейдите на страницу входа
3. Нажмите "Войти через Google"
4. Должно открыться окно авторизации Google
5. После успешной авторизации вы будете перенаправлены обратно

## 5. Возможные проблемы

### Проблема: "redirect_uri_mismatch"
- Убедитесь, что URI перенаправления в Google Cloud Console точно совпадает с настройками в Supabase

### Проблема: "invalid_client"
- Проверьте правильность Client ID и Client Secret
- Убедитесь, что Google+ API включен

### Проблема: CORS ошибки
- Добавьте домен в авторизованные источники JavaScript в Google Cloud Console

## 6. Дополнительные настройки

### Настройка профиля пользователя
После успешной авторизации Google, Supabase автоматически создаст профиль пользователя с:
- `email` - email из Google аккаунта
- `user_metadata` - дополнительная информация из Google

### Кастомизация профиля
Вы можете добавить дополнительные поля в таблицу `profiles`:
```sql
ALTER TABLE profiles ADD COLUMN google_id TEXT;
ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
```

## 7. Безопасность

- Никогда не коммитьте Client Secret в git
- Используйте переменные окружения
- Настройте правильные redirect URLs
- Ограничьте доступ только необходимыми API 