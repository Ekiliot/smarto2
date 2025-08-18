#!/usr/bin/env python3
"""
Скрипт для генерации иконок различных размеров на основе основной PNG иконки
Требует установки Pillow: pip install Pillow
"""

import os
from PIL import Image
import sys

def generate_icons(source_path, output_dir, sizes):
    """Генерирует иконки различных размеров из исходного изображения"""
    
    try:
        # Открываем исходное изображение
        with Image.open(source_path) as img:
            # Конвертируем в RGBA если нужно
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            print(f"✅ Загружена исходная иконка: {img.size[0]}x{img.size[1]} пикселей")
            
            # Создаем выходную директорию если её нет
            os.makedirs(output_dir, exist_ok=True)
            
            # Генерируем иконки для каждого размера
            for size in sizes:
                # Изменяем размер с сохранением пропорций
                resized = img.resize((size, size), Image.Resampling.LANCZOS)
                
                # Сохраняем PNG
                png_filename = f"icon-{size}x{size}.png"
                png_path = os.path.join(output_dir, png_filename)
                resized.save(png_path, 'PNG', optimize=True)
                print(f"✅ Создана {png_filename}")
                
                # Также создаем SVG версию (простая замена)
                svg_filename = f"icon-{size}x{size}.svg"
                svg_path = os.path.join(output_dir, svg_filename)
                
                # Создаем простой SVG с ссылкой на PNG
                svg_content = f'''<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">
  <image href="{png_filename}" width="{size}" height="{size}"/>
</svg>'''
                
                with open(svg_path, 'w', encoding='utf-8') as f:
                    f.write(svg_content)
                print(f"✅ Создан {svg_filename}")
            
            # Создаем основную иконку
            main_icon_path = os.path.join(os.path.dirname(output_dir), 'icon.png')
            if os.path.exists(source_path):
                import shutil
                shutil.copy2(source_path, main_icon_path)
                print(f"✅ Обновлена основная иконка: {main_icon_path}")
            
            # Создаем apple-touch-icon
            apple_size = 180
            apple_resized = img.resize((apple_size, apple_size), Image.Resampling.LANCZOS)
            apple_path = os.path.join(output_dir, 'apple-touch-icon.png')
            apple_resized.save(apple_path, 'PNG', optimize=True)
            print(f"✅ Создан apple-touch-icon.png ({apple_size}x{apple_size})")
            
            # Создаем SVG версию apple-touch-icon
            apple_svg_path = os.path.join(output_dir, 'apple-touch-icon.svg')
            apple_svg_content = f'''<svg width="{apple_size}" height="{apple_size}" xmlns="http://www.w3.org/2000/svg">
  <image href="apple-touch-icon.png" width="{apple_size}" height="{apple_size}"/>
</svg>'''
            
            with open(apple_svg_path, 'w', encoding='utf-8') as f:
                f.write(apple_svg_content)
            print(f"✅ Создан apple-touch-icon.svg")
            
    except Exception as e:
        print(f"❌ Ошибка при обработке изображения: {e}")
        return False
    
    return True

def main():
    # Пути
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    source_icon = os.path.join(project_root, 'icon.png')
    output_dir = os.path.join(project_root, 'public', 'icons')
    
    # Размеры иконок для PWA
    icon_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
    
    print("🎨 Генерация иконок Smarto PWA из новой PNG иконки...")
    print(f"📁 Исходная иконка: {source_icon}")
    print(f"📁 Выходная директория: {output_dir}")
    
    # Проверяем существование исходной иконки
    if not os.path.exists(source_icon):
        print(f"❌ Исходная иконка не найдена: {source_icon}")
        print("💡 Убедитесь, что файл icon.png находится в корне проекта")
        return
    
    # Генерируем иконки
    if generate_icons(source_icon, output_dir, icon_sizes):
        print("\n🚀 Все иконки успешно сгенерированы!")
        print("📝 Теперь можно обновить manifest.json и другие файлы")
    else:
        print("\n❌ Произошла ошибка при генерации иконок")

if __name__ == "__main__":
    main() 