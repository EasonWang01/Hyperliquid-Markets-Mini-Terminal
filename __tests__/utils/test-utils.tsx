import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { useTradingStore } from '@/store/trading-store'
import { Market, OrderBook, Trade, Candle, UserState } from '@/types/hyperliquid'

// Mock data factories
export const createMockMarket = (overrides: Partial<Market> = {}): Market => ({
  coin: 'BTC',
  name: 'Bitcoin',
  szDecimals: 2,
  maxLeverage: 20,
  onlyIsolated: false,
  ...overrides,
})

export const createMockOrderBook = (overrides: Partial<OrderBook> = {}): OrderBook => ({
  coin: 'BTC',
  levels: [
    [
      { px: '50000.00', sz: '1.5', n: 3 },
      { px: '49999.50', sz: '2.0', n: 2 },
    ],
    [
      { px: '50001.00', sz: '1.2', n: 2 },
      { px: '50001.50', sz: '1.8', n: 3 },
    ],
  ],
  time: Date.now(),
  ...overrides,
})

export const createMockTrade = (overrides: Partial<Trade> = {}): Trade => ({
  coin: 'BTC',
  side: 'B',
  px: '50000.00',
  sz: '1.5',
  time: Date.now(),
  hash: 'hash1',
  ...overrides,
})

export const createMockCandle = (overrides: Partial<Candle> = {}): Candle => ({
  T: Date.now(),
  c: '50000.00',
  h: '50100.00',
  l: '49900.00',
  n: 100,
  o: '49950.00',
  s: 'BTC',
  t: Date.now() - 60000,
  v: '1000.00',
  ...overrides,
})

export const createMockUserState = (overrides: Partial<UserState> = {}): UserState => ({
  assetPositions: [
    {
      position: {
        coin: 'BTC',
        entryPx: '45000.00',
        leverage: {
          type: 'cross',
          value: 5,
        },
        liquidationPx: '40000.00',
        marginUsed: '1000.00',
        maxLeverage: 20,
        positionValue: '5000.00',
        returnOnEquity: '12.5',
        szi: '0.1',
        unrealizedPnl: '500.00',
      },
      type: 'cross',
    },
  ],
  crossMaintenanceMarginUsed: '50.00',
  crossMarginSummary: {
    accountValue: '10000.00',
    totalMarginUsed: '1000.00',
    totalNtlPos: '5000.00',
    totalRawUsd: '10000.00',
  },
  marginSummary: {
    accountValue: '10000.00',
    totalMarginUsed: '1000.00',
    totalNtlPos: '5000.00',
    totalRawUsd: '10000.00',
  },
  time: Date.now(),
  withdrawable: '9000.00',
  ...overrides,
})

// Default store state
export const createDefaultStoreState = (overrides: any = {}) => ({
  markets: [createMockMarket()],
  selectedMarket: null,
  orderBook: null,
  trades: [],
  candles: [],
  chartData: [],
  userState: null,
  walletAddress: null,
  orderBookAggregation: 0.1,
  isLoading: false,
  error: null,
  setMarkets: jest.fn(),
  setSelectedMarket: jest.fn(),
  setOrderBook: jest.fn(),
  addTrade: jest.fn(),
  setTrades: jest.fn(),
  addCandle: jest.fn(),
  setCandles: jest.fn(),
  updateChartData: jest.fn(),
  setUserState: jest.fn(),
  setWalletAddress: jest.fn(),
  setOrderBookAggregation: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
  ...overrides,
})

// Custom render function with store provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  storeState?: any
}

export const renderWithStore = (
  ui: ReactElement,
  { storeState = {}, ...renderOptions }: CustomRenderOptions = {}
) => {
  const mockUseTradingStore = useTradingStore as jest.MockedFunction<typeof useTradingStore>
  mockUseTradingStore.mockReturnValue(createDefaultStoreState(storeState))

  return render(ui, renderOptions)
}

// Test helpers
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))

export const createMockWebSocket = () => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
})

export const createMockFetchResponse = (data: any, ok: boolean = true) => ({
  ok,
  json: async () => data,
  status: ok ? 200 : 500,
  statusText: ok ? 'OK' : 'Internal Server Error',
})

// Common test scenarios
export const testScenarios = {
  loading: {
    isLoading: true,
    markets: [],
    selectedMarket: null,
  },
  error: {
    isLoading: false,
    error: 'Test error message',
    markets: [],
    selectedMarket: null,
  },
  withSelectedMarket: {
    isLoading: false,
    error: null,
    selectedMarket: createMockMarket(),
    orderBook: createMockOrderBook(),
    trades: [createMockTrade()],
  },
  withUserData: {
    isLoading: false,
    error: null,
    userState: createMockUserState(),
    walletAddress: '0x1234567890abcdef',
  },
}

// Mock API responses
export const mockApiResponses = {
  markets: [
    createMockMarket({ coin: 'BTC', name: 'Bitcoin' }),
    createMockMarket({ coin: 'ETH', name: 'Ethereum' }),
    createMockMarket({ coin: 'SOL', name: 'Solana' }),
  ],
  orderBook: createMockOrderBook(),
  trades: [
    createMockTrade({ side: 'B', px: '50000.00' }),
    createMockTrade({ side: 'A', px: '50001.00' }),
  ],
  candles: [
    createMockCandle({ o: '49950.00', h: '50100.00', l: '49900.00', c: '50000.00' }),
    createMockCandle({ o: '50000.00', h: '50050.00', l: '49950.00', c: '50025.00' }),
  ],
  userState: createMockUserState(),
}

// Test data generators
export const generateMockTrades = (count: number, baseTime: number = Date.now()): Trade[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockTrade({
      hash: `hash${i}`,
      time: baseTime + i * 1000,
      px: (50000 + Math.random() * 100).toFixed(2),
      sz: (Math.random() * 5).toFixed(2),
      side: Math.random() > 0.5 ? 'B' : 'A',
    })
  )
}

export const generateMockCandles = (count: number, baseTime: number = Date.now()): Candle[] => {
  return Array.from({ length: count }, (_, i) => {
    const time = baseTime - (count - i) * 60000 // 1 minute intervals
    const basePrice = 50000 + Math.random() * 1000
    return createMockCandle({
      t: time,
      T: time,
      o: basePrice.toFixed(2),
      h: (basePrice + Math.random() * 100).toFixed(2),
      l: (basePrice - Math.random() * 100).toFixed(2),
      c: (basePrice + (Math.random() - 0.5) * 50).toFixed(2),
      v: (Math.random() * 1000 + 100).toFixed(2),
    })
  })
}

// Assertion helpers
export const expectToBeInDocument = (text: string) => {
  expect(screen.getByText(text)).toBeInTheDocument()
}

export const expectNotToBeInDocument = (text: string) => {
  expect(screen.queryByText(text)).not.toBeInTheDocument()
}

export const expectToHaveBeenCalledWith = (mockFn: jest.Mock, ...args: any[]) => {
  expect(mockFn).toHaveBeenCalledWith(...args)
}

export const expectToHaveBeenCalledTimes = (mockFn: jest.Mock, times: number) => {
  expect(mockFn).toHaveBeenCalledTimes(times)
}
