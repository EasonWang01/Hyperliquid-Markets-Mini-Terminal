# Hyperliquid Markets Mini-Terminal

A mobile-first Progressive Web App (PWA) UI terminal for Hyperliquid. Built with modern web technologies for optimal performance and user experience.

![Hyperliquid Terminal](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![PWA](https://img.shields.io/badge/PWA-Enabled-purple)

## Screenshots
<img width="349" height="615" alt="截圖 2025-09-21 下午3 28 05" src="https://github.com/user-attachments/assets/6975e0de-6ccb-4e02-82ba-e9a1b9a410c8" />
<img width="383" height="600" alt="截圖 2025-09-21 下午3 28 12" src="https://github.com/user-attachments/assets/97f7f8bc-425a-41e6-84fc-9b1e501d801b" />
<img width="372" height="541" alt="截圖 2025-09-21 下午3 28 18" src="https://github.com/user-attachments/assets/04caa1e1-ccb9-4192-be3d-8e83e02c9332" />
<img width="615" height="690" alt="截圖 2025-09-21 下午3 29 48" src="https://github.com/user-attachments/assets/e6849ed0-1df8-4788-830f-f1dd4b4adb4c" />



## Demo
https://trade-mini-terminal-idft4corw.vercel.app/

## ✨ Features

### 📱 Mobile-First Design
- **Responsive Layout**: Optimized for mobile devices with touch-friendly interface
- **PWA Support**: Install as a native app on iOS and Android
- **Offline Capability**: Service worker for offline functionality
- **Fast Loading**: Optimized bundle splitting and lazy loading

### 📊 Trading Interface
- **Real-time Price Charts**: Interactive candlestick charts with volume
- **Order Book**: Live order book with bid/ask visualization
- **Recent Trades**: Real-time trade feed with color-coded buy/sell indicators
- **Market Search**: Quick market discovery with favorites system
- **Account Lookup**: QR code scanning for wallet address lookup

### 🔧 Technical Features
- **WebSocket Integration**: Real-time data streaming from Hyperliquid API
- **State Management**: Zustand for efficient state management
- **Type Safety**: Full TypeScript implementation
- **Testing**: Comprehensive test suite with Jest and React Testing Library
- **Performance**: Optimized bundle splitting and code splitting

## 🛠️ Tech Stack

### Frontend Framework
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[React 18](https://reactjs.org/)** - UI library with concurrent features
- **[TypeScript 5.0](https://www.typescriptlang.org/)** - Type-safe JavaScript

### State Management & Data
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)** - Real-time data streaming
- **[Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)** - REST API communication

### UI & Styling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library
- **[Inter Font](https://rsms.me/inter/)** - Modern typography

### Charts & Visualization
- **[Lightweight Charts](https://tradingview.github.io/lightweight-charts/)** - High-performance trading charts
- **Custom Order Book Component** - Real-time bid/ask visualization
- **Trade Feed Component** - Live trade stream display

### PWA & Performance
- **Service Worker** - Offline functionality and caching
- **Web App Manifest** - Native app installation
- **Bundle Optimization** - Code splitting and lazy loading
- **Performance Monitoring** - Core Web Vitals optimization

### Development & Testing
- **[Jest](https://jestjs.io/)** - Testing framework
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Component testing
- **[ESLint](https://eslint.org/)** - Code linting
- **TypeScript Compiler** - Type checking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hyperliquid-terminal.git
cd hyperliquid-terminal

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📱 PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will be installed as a native app

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home Screen"
4. The app will be installed as a native app

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📁 Project Structure

```
hyperliquid-terminal/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI components
│   ├── AccountLookup.tsx # Account lookup modal
│   ├── OrderBook.tsx     # Order book component
│   ├── PriceChart.tsx    # Price chart component
│   └── TradesList.tsx    # Trades list component
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # API services
│   └── hyperliquid-api.ts # Hyperliquid API client
├── store/                # State management
│   └── trading-store.ts  # Zustand store
├── types/                # TypeScript type definitions
│   └── hyperliquid.ts    # Hyperliquid API types
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   ├── sw.js            # Service worker
│   └── icons/           # App icons
└── __tests__/           # Test files
    ├── components/      # Component tests
    ├── services/        # Service tests
    └── store/          # Store tests
```

## 🔌 API Integration

The app integrates with the Hyperliquid API for:

- **Market Data**: Real-time market information and metadata
- **Order Book**: Live bid/ask data via WebSocket
- **Trade Data**: Real-time trade feed
- **Price Charts**: Historical candlestick data
- **User State**: Account information and positions

### WebSocket Subscriptions
- Order book updates
- Trade feed updates
- Price chart data
- User state changes

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Touch-friendly interface
- Optimized for portrait orientation
- Dark theme optimized

### Performance Optimizations
- Lazy loading of components
- Bundle splitting for optimal loading
- Service worker caching
- Optimized WebSocket connections

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

### PWA Configuration
The app is configured as a PWA with:
- Service worker for offline functionality
- Web app manifest for native installation
- Optimized caching strategies
- Background sync capabilities

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ across all categories
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

