# 🎨 Обновление иконок Smarto PWA
# Запуск: .\update-icons.ps1

Write-Host "🎨 Обновление иконок Smarto PWA..." -ForegroundColor Cyan
Write-Host ""

# Копирование основной иконки
Write-Host "📁 Копирование основной иконки..." -ForegroundColor Yellow
try {
    Copy-Item "icon.png" "public\icon.png" -Force
    Write-Host "✅ Основная иконка обновлена" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при копировании основной иконки: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host ""

# Генерация SVG иконок
Write-Host "🔄 Генерация SVG иконок..." -ForegroundColor Yellow
try {
    & node scripts/generate-icons-node.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SVG иконки сгенерированы" -ForegroundColor Green
    } else {
        throw "Node.js скрипт завершился с ошибкой"
    }
} catch {
    Write-Host "❌ Ошибка при генерации SVG иконок: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host ""

# Обновление версии в manifest.json
Write-Host "📝 Обновление версии в manifest.json..." -ForegroundColor Yellow
try {
    $manifestPath = "public/manifest.json"
    $content = Get-Content $manifestPath -Raw
    $updatedContent = $content -replace '1\.1\.9', '1.2.0'
    Set-Content $manifestPath $updatedContent -NoNewline
    Write-Host "✅ Версия обновлена до 1.2.0" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка при обновлении версии: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 Обновление иконок завершено!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Откройте generate-icons-from-png.html в браузере" -ForegroundColor White
Write-Host "2. Загрузите вашу иконку" -ForegroundColor White
Write-Host "3. Сгенерируйте PNG версии всех размеров" -ForegroundColor White
Write-Host "4. Разместите PNG файлы в public/icons/" -ForegroundColor White
Write-Host ""
Write-Host "📖 Подробные инструкции в ICON_UPDATE_README.md" -ForegroundColor Cyan
Write-Host ""

Read-Host "Нажмите Enter для выхода" 