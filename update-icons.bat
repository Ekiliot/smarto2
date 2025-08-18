@echo off
echo 🎨 Обновление иконок Smarto PWA...
echo.

echo 📁 Копирование основной иконки...
copy "icon.png" "public\icon.png" >nul
if %errorlevel% equ 0 (
    echo ✅ Основная иконка обновлена
) else (
    echo ❌ Ошибка при копировании основной иконки
    pause
    exit /b 1
)

echo.
echo 🔄 Генерация SVG иконок...
node scripts/generate-icons-node.js
if %errorlevel% equ 0 (
    echo ✅ SVG иконки сгенерированы
) else (
    echo ❌ Ошибка при генерации SVG иконок
    pause
    exit /b 1
)

echo.
echo 📝 Обновление версии в manifest.json...
powershell -Command "(Get-Content 'public/manifest.json') -replace '1\.1\.9', '1.2.0' | Set-Content 'public/manifest.json'"
if %errorlevel% equ 0 (
    echo ✅ Версия обновлена до 1.2.0
) else (
    echo ❌ Ошибка при обновлении версии
)

echo.
echo 🚀 Обновление иконок завершено!
echo.
echo 💡 Следующие шаги:
echo 1. Откройте generate-icons-from-png.html в браузере
echo 2. Загрузите вашу иконку
echo 3. Сгенерируйте PNG версии всех размеров
echo 4. Разместите PNG файлы в public/icons/
echo.
echo 📖 Подробные инструкции в ICON_UPDATE_README.md
echo.
pause 