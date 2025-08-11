# Smarto - Smart Home & Electronics Store

Modern online store for smart home devices and electronics, built with Next.js, Tailwind CSS, and Supabase.

## Features

- 🏠 **Smart Home & Electronics Store** - Specialized in smart home devices and electronics
- 🎨 **Beautiful UI** - Modern design with purple color scheme and smooth animations
- 🌙 **Dark/Light Theme** - Toggle between dark and light themes
- 📱 **Responsive Design** - Works perfectly on all devices
- 🎭 **Smooth Animations** - Powered by Framer Motion
- 🛒 **Product Carousels** - Multiple product showcases with navigation
- 🔍 **Search Functionality** - Find products quickly
- 🛍️ **Shopping Cart** - Add products to cart
- ⭐ **Product Ratings** - Customer reviews and ratings
- 💰 **Price Formatting** - Localized currency (MDL)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Database**: Supabase
- **Language**: TypeScript
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smarto2
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
smarto2/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Header.tsx         # Navigation header
│   ├── HeroSection.tsx    # Hero section
│   ├── ProductCard.tsx    # Product card component
│   ├── ProductCarousel.tsx # Product carousel
│   ├── ThemeProvider.tsx  # Theme context
│   └── ThemeToggle.tsx    # Theme toggle button
├── data/                  # Mock data
│   └── products.ts        # Product data
├── lib/                   # Utilities
│   ├── supabase.ts        # Supabase client
│   └── utils.ts           # Helper functions
├── public/                # Static assets
├── DESIGN_GUIDE.md        # Design system guide
└── package.json           # Dependencies
```

## Features Overview

### 🏠 Smart Home Products
- Smart LED bulbs
- Security cameras
- Smart thermostats
- Smart speakers
- Smart door locks
- Robot vacuums
- Smart appliances

### 📱 Electronics
- Wireless earbuds
- Smart watches
- Wireless chargers
- Accessories

### 🎨 Design Features
- Purple gradient color scheme
- Glass morphism effects
- Smooth hover animations
- Responsive grid layouts
- Beautiful typography

### ⚡ Performance
- Optimized images
- Lazy loading
- Smooth animations
- Fast page loads

## Design System

This project follows a comprehensive design system documented in [`DESIGN_GUIDE.md`](./DESIGN_GUIDE.md). The guide includes:

- 🎨 **Color Palette** - Primary purple and secondary pink scheme
- 📝 **Typography** - Inter font with defined sizes and weights
- 🧩 **Components** - Button styles, cards, inputs, and more
- 🎭 **Animations** - Framer Motion patterns and CSS transitions
- 📐 **Spacing & Layout** - Consistent spacing and grid systems
- 🌙 **Dark Theme** - Complete dark mode implementation
- 📱 **Responsive Design** - Mobile-first approach
- ♿ **Accessibility** - WCAG compliance guidelines

**Always refer to the design guide when creating new components or modifying existing ones.**

## Customization

### Colors
The color scheme can be customized in `tailwind.config.js`:
```javascript
colors: {
  primary: {
    // Purple shades
  },
  secondary: {
    // Pink shades
  }
}
```

### Products
Add or modify products in `data/products.ts`:
```typescript
export const products: Product[] = [
  {
    id: 'unique-id',
    name: 'Product Name',
    description: 'Product description',
    price: 999,
    // ... other properties
  }
]
```

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@smarto.md or create an issue in the repository.

---

Made with ❤️ in Moldova 🇲🇩 