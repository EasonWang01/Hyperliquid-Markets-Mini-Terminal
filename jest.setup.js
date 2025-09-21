import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock WebSocket
global.WebSocket = class WebSocket {
  constructor(url) {
    this.url = url
    this.readyState = 1
    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
  }
  
  send = jest.fn()
  close = jest.fn()
  
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) {
    this.cb = cb
  }
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}

// Mock QR Scanner
jest.mock('qr-scanner', () => {
  return jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    destroy: jest.fn(),
  }))
})

// Mock lightweight-charts
jest.mock('lightweight-charts', () => ({
  createChart: jest.fn(() => ({
    addSeries: jest.fn(() => ({
      setData: jest.fn(),
      update: jest.fn(),
    })),
    timeScale: jest.fn(() => ({
      fitContent: jest.fn(),
    })),
    applyOptions: jest.fn(),
    remove: jest.fn(),
  })),
  ColorType: {
    Solid: 'solid',
  },
  CrosshairMode: {
    Normal: 'normal',
  },
  CandlestickSeries: 'candlestick',
  HistogramSeries: 'histogram',
}))

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: () => <div data-testid="settings-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  TrendingDown: () => <div data-testid="trending-down-icon" />,
  Camera: () => <div data-testid="camera-icon" />,
  Wallet: () => <div data-testid="wallet-icon" />,
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
}))

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
