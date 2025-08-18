const fs = require('fs');
const path = require('path');

/**
 * Скрипт для генерации иконок различных размеров на основе основной PNG иконки
 * Создает SVG иконки с ссылками на PNG файлы
 */

function createSVGIcon(size, pngFilename) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <image href="${pngFilename}" width="${size}" height="${size}"/>
</svg>`;
}

function generateIcons() {
  const currentDir = __dirname;
  const projectRoot = path.dirname(currentDir);
  const sourceIcon = path.join(projectRoot, 'icon.png');
  const outputDir = path.join(projectRoot, 'public', 'icons');
  
  // Размеры иконок для PWA
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
  
  console.log('🎨 Генерация иконок Smarto PWA из новой PNG иконки...');
  console.log(`📁 Исходная иконка: ${sourceIcon}`);
  console.log(`📁 Выходная директория: ${outputDir}`);
  
  // Проверяем существование исходной иконки
  if (!fs.existsSync(sourceIcon)) {
    console.log(`❌ Исходная иконка не найдена: ${sourceIcon}`);
    console.log('💡 Убедитесь, что файл icon.png находится в корне проекта');
    return;
  }
  
  try {
    // Создаем выходную директорию если её нет
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Генерируем иконки для каждого размера
    iconSizes.forEach(size => {
      const pngFilename = `icon-${size}x${size}.png`;
      const svgFilename = `icon-${size}x${size}.svg`;
      
      // Создаем SVG с ссылкой на PNG
      const svgContent = createSVGIcon(size, pngFilename);
      const svgPath = path.join(outputDir, svgFilename);
      
      fs.writeFileSync(svgPath, svgContent);
      console.log(`✅ Создан ${svgFilename}`);
    });
    
    // Создаем apple-touch-icon
    const appleSize = 180;
    const applePngFilename = 'apple-touch-icon.png';
    const appleSvgFilename = 'apple-touch-icon.svg';
    
    const appleSvgContent = createSVGIcon(appleSize, applePngFilename);
    const appleSvgPath = path.join(outputDir, appleSvgFilename);
    
    fs.writeFileSync(appleSvgPath, appleSvgContent);
    console.log(`✅ Создан ${appleSvgFilename}`);
    
    // Создаем основной icon.svg
    const mainSvgContent = createSVGIcon(512, '../icon.png');
    const mainSvgPath = path.join(projectRoot, 'public', 'icon.svg');
    
    fs.writeFileSync(mainSvgPath, mainSvgContent);
    console.log('✅ Создан основной icon.svg');
    
    console.log('\n🚀 Все SVG иконки успешно сгенерированы!');
    console.log('📝 Теперь нужно создать PNG версии иконок');
    console.log('💡 Используйте онлайн инструменты или графические редакторы для создания PNG');
    
  } catch (error) {
    console.error('❌ Ошибка при генерации иконок:', error);
  }
}

// Запускаем генерацию
generateIcons(); 