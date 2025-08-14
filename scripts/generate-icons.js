const fs = require('fs');
const path = require('path');

// Создаем простую PNG иконку в Base64 формате
function createSimpleIcon(size) {
  // Базовый PNG header + белый фон + градиентный текст Smarto
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#9333EA;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="white"/>
      <text x="50%" y="60%" font-family="Arial,sans-serif" font-size="${Math.floor(size/8)}" font-weight="bold" text-anchor="middle" fill="url(#grad)">SMARTO</text>
      <circle cx="${size/6}" cy="${size/6}" r="${size/15}" fill="url(#grad)" opacity="0.3"/>
      <circle cx="${size*5/6}" cy="${size/6}" r="${size/20}" fill="url(#grad)" opacity="0.2"/>
      <circle cx="${size/6}" cy="${size*5/6}" r="${size/18}" fill="url(#grad)" opacity="0.25"/>
      <circle cx="${size*5/6}" cy="${size*5/6}" r="${size/16}" fill="url(#grad)" opacity="0.2"/>
    </svg>
  `;
  
  return canvas;
}

// Создаем директорию для иконок
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Размеры иконок для PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('🎨 Generating Smarto PWA icons...');

iconSizes.forEach(size => {
  const svgContent = createSimpleIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`✅ Created ${filename}`);
});

// Создаем основную иконку
const mainIcon = createSimpleIcon(512);
fs.writeFileSync(path.join(__dirname, '../public/icon.svg'), mainIcon);
console.log('✅ Created main icon.svg');

// Создаем apple-touch-icon
const appleIcon = createSimpleIcon(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleIcon);
console.log('✅ Created apple-touch-icon.svg');

console.log('🚀 All icons generated successfully!');
console.log('📝 Note: SVG icons will work for PWA. For better compatibility, convert to PNG using the generate-icons.html tool.'); 