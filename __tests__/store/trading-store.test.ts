import { renderHook, act } from '@testing-library/react'
import { useTradingStore } from '@/store/trading-store'
import { Market, OrderBook, Trade, Candle, UserState } from '@/types/hyperliquid'

// Mock data
const mockMarket: Market = {
  coin: 'BTC',
  name: 'Bitcoin',
  szDecimals: 2,
  maxLeverage: 20,
  onlyIsolated: false,
}

const mockOrderBook: OrderBook = {
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
}

const mockTrade: Trade = {
  coin: 'BTC',
  side: 'B',
  px: '50000.00',
  sz: '1.5',
  time: Date.now(),
  hash: 'hash1',
}

const mockCandle: Candle = {
  T: Date.now(),
  c: '50000.00',
  h: '50100.00',
  l: '49900.00',
  n: 100,
  o: '49950.00',
  s: 'BTC',
  t: Date.now() - 60000,
  v: '1000.00',
}

const mockUserState: UserState = {
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
}

describe('Trading Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useTradingStore.getState().setMarkets([])
      useTradingStore.getState().setSelectedMarket(null)
      useTradingStore.getState().setOrderBook(null)
      useTradingStore.getState().setTrades([])
      useTradingStore.getState().setCandles([])
      useTradingStore.getState().setUserState(null)
      useTradingStore.getState().setWalletAddress(null)
      useTradingStore.getState().setOrderBookAggregation(0.1)
      useTradingStore.getState().setLoading(false)
      useTradingStore.getState().setError(null)
    })
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useTradingStore())
      
      expect(result.current.markets).toEqual([])
      expect(result.current.selectedMarket).toBeNull()
      expect(result.current.orderBook).toBeNull()
      expect(result.current.trades).toEqual([])
      expect(result.current.candles).toEqual([])
      expect(result.current.chartData).toEqual([])
      expect(result.current.userState).toBeNull()
      expect(result.current.walletAddress).toBeNull()
      expect(result.current.orderBookAggregation).toBe(0.1)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Markets', () => {
    it('sets markets', () => {
      const { result } = renderHook(() => useTradingStore())
      const markets = [mockMarket]
      
      act(() => {
        result.current.setMarkets(markets)
      })
      
      expect(result.current.markets).toEqual(markets)
    })

    it('sets selected market and clears related data', () => {
      const { result } = renderHook(() => useTradingStore())
      
      // First set some data
      act(() => {
        result.current.setOrderBook(mockOrderBook)
        result.current.setTrades([mockTrade])
        result.current.setCandles([mockCandle])
      })
      
      // Then select a market
      act(() => {
        result.current.setSelectedMarket(mockMarket)
      })
      
      expect(result.current.selectedMarket).toEqual(mockMarket)
      expect(result.current.orderBook).toBeNull()
      expect(result.current.trades).toEqual([])
      expect(result.current.candles).toEqual([])
      expect(result.current.chartData).toEqual([])
    })
  })

  describe('Order Book', () => {
    it('sets order book', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setOrderBook(mockOrderBook)
      })
      
      expect(result.current.orderBook).toEqual(mockOrderBook)
    })

    it('sets order book aggregation', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setOrderBookAggregation(1)
      })
      
      expect(result.current.orderBookAggregation).toBe(1)
    })
  })

  describe('Trades', () => {
    it('adds trade to beginning of list', () => {
      const { result } = renderHook(() => useTradingStore())
      const existingTrades = [mockTrade]
      
      act(() => {
        result.current.setTrades(existingTrades)
      })
      
      const newTrade: Trade = {
        ...mockTrade,
        hash: 'hash2',
        time: Date.now() + 1000,
      }
      
      act(() => {
        result.current.addTrade(newTrade)
      })
      
      expect(result.current.trades).toHaveLength(2)
      expect(result.current.trades[0]).toEqual(newTrade)
      expect(result.current.trades[1]).toEqual(mockTrade)
    })

    it('limits trades to 100 items', () => {
      const { result } = renderHook(() => useTradingStore())
      
      // Add 100 trades
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addTrade({
            ...mockTrade,
            hash: `hash${i}`,
            time: Date.now() + i * 1000,
          })
        }
      })
      
      expect(result.current.trades).toHaveLength(100)
      
      // Add one more trade
      act(() => {
        result.current.addTrade({
          ...mockTrade,
          hash: 'hash101',
          time: Date.now() + 101000,
        })
      })
      
      expect(result.current.trades).toHaveLength(100)
      expect(result.current.trades[0].hash).toBe('hash101')
      expect(result.current.trades[99].hash).toBe('hash1')
    })

    it('sets trades array', () => {
      const { result } = renderHook(() => useTradingStore())
      const trades = [mockTrade]
      
      act(() => {
        result.current.setTrades(trades)
      })
      
      expect(result.current.trades).toEqual(trades)
    })
  })

  describe('Candles', () => {
    it('adds new candle', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.addCandle(mockCandle)
      })
      
      expect(result.current.candles).toEqual([mockCandle])
    })

    it('updates existing candle with same timestamp', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.addCandle(mockCandle)
      })
      
      const updatedCandle: Candle = {
        ...mockCandle,
        c: '51000.00',
        h: '51100.00',
      }
      
      act(() => {
        result.current.addCandle(updatedCandle)
      })
      
      expect(result.current.candles).toHaveLength(1)
      expect(result.current.candles[0]).toEqual(updatedCandle)
    })

    it('sorts candles by timestamp', () => {
      const { result } = renderHook(() => useTradingStore())
      
      const candle1: Candle = {
        ...mockCandle,
        t: 1000,
        T: 1000,
      }
      
      const candle2: Candle = {
        ...mockCandle,
        t: 2000,
        T: 2000,
      }
      
      const candle3: Candle = {
        ...mockCandle,
        t: 1500,
        T: 1500,
      }
      
      act(() => {
        result.current.addCandle(candle1)
        result.current.addCandle(candle2)
        result.current.addCandle(candle3)
      })
      
      expect(result.current.candles).toHaveLength(3)
      expect(result.current.candles[0].t).toBe(1000)
      expect(result.current.candles[1].t).toBe(1500)
      expect(result.current.candles[2].t).toBe(2000)
    })

    it('sets candles array', () => {
      const { result } = renderHook(() => useTradingStore())
      const candles = [mockCandle]
      
      act(() => {
        result.current.setCandles(candles)
      })
      
      expect(result.current.candles).toEqual(candles)
    })
  })

  describe('Chart Data', () => {
    it('transforms candles to chart data format', () => {
      const { result } = renderHook(() => useTradingStore())
      const candles = [mockCandle]
      
      act(() => {
        result.current.updateChartData(candles)
      })
      
      expect(result.current.chartData).toHaveLength(1)
      expect(result.current.chartData[0]).toEqual({
        time: Math.floor(mockCandle.t / 1000),
        open: parseFloat(mockCandle.o),
        high: parseFloat(mockCandle.h),
        low: parseFloat(mockCandle.l),
        close: parseFloat(mockCandle.c),
        volume: parseFloat(mockCandle.v),
      })
    })

    it('handles multiple candles', () => {
      const { result } = renderHook(() => useTradingStore())
      const candles = [
        mockCandle,
        {
          ...mockCandle,
          t: mockCandle.t + 60000,
          T: mockCandle.T + 60000,
          o: '50000.00',
          h: '50100.00',
          l: '49900.00',
          c: '50050.00',
          v: '1200.00',
        },
      ]
      
      act(() => {
        result.current.updateChartData(candles)
      })
      
      expect(result.current.chartData).toHaveLength(2)
      expect(result.current.chartData[0].close).toBe(parseFloat(mockCandle.c))
      expect(result.current.chartData[1].close).toBe(50050)
    })
  })

  describe('User State', () => {
    it('sets user state', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setUserState(mockUserState)
      })
      
      expect(result.current.userState).toEqual(mockUserState)
    })

    it('sets wallet address', () => {
      const { result } = renderHook(() => useTradingStore())
      const address = '0x1234567890abcdef'
      
      act(() => {
        result.current.setWalletAddress(address)
      })
      
      expect(result.current.walletAddress).toBe(address)
    })

    it('clears wallet address when set to null', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setWalletAddress('0x1234567890abcdef')
      })
      
      expect(result.current.walletAddress).toBe('0x1234567890abcdef')
      
      act(() => {
        result.current.setWalletAddress(null)
      })
      
      expect(result.current.walletAddress).toBeNull()
    })
  })

  describe('UI State', () => {
    it('sets loading state', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
      
      act(() => {
        result.current.setLoading(false)
      })
      
      expect(result.current.isLoading).toBe(false)
    })

    it('sets error state', () => {
      const { result } = renderHook(() => useTradingStore())
      const errorMessage = 'Something went wrong'
      
      act(() => {
        result.current.setError(errorMessage)
      })
      
      expect(result.current.error).toBe(errorMessage)
    })

    it('clears error state', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setError('Error message')
      })
      
      expect(result.current.error).toBe('Error message')
      
      act(() => {
        result.current.clearError()
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('Complex Scenarios', () => {
    it('handles market selection with data clearing', () => {
      const { result } = renderHook(() => useTradingStore())
      
      // Set up initial data
      act(() => {
        result.current.setOrderBook(mockOrderBook)
        result.current.setTrades([mockTrade])
        result.current.setCandles([mockCandle])
        result.current.updateChartData([mockCandle])
      })
      
      // Select a market
      act(() => {
        result.current.setSelectedMarket(mockMarket)
      })
      
      // Verify data is cleared
      expect(result.current.selectedMarket).toEqual(mockMarket)
      expect(result.current.orderBook).toBeNull()
      expect(result.current.trades).toEqual([])
      expect(result.current.candles).toEqual([])
      expect(result.current.chartData).toEqual([])
    })

    it('maintains state consistency across multiple operations', () => {
      const { result } = renderHook(() => useTradingStore())
      
      act(() => {
        result.current.setMarkets([mockMarket])
        result.current.setSelectedMarket(mockMarket)
        result.current.setOrderBook(mockOrderBook)
        result.current.addTrade(mockTrade)
        result.current.addCandle(mockCandle)
        result.current.setUserState(mockUserState)
        result.current.setWalletAddress('0x1234567890abcdef')
        result.current.setOrderBookAggregation(1)
        result.current.setLoading(true)
        result.current.setError('Test error')
      })
      
      expect(result.current.markets).toEqual([mockMarket])
      expect(result.current.selectedMarket).toEqual(mockMarket)
      expect(result.current.orderBook).toEqual(mockOrderBook)
      expect(result.current.trades).toEqual([mockTrade])
      expect(result.current.candles).toEqual([mockCandle])
      expect(result.current.userState).toEqual(mockUserState)
      expect(result.current.walletAddress).toBe('0x1234567890abcdef')
      expect(result.current.orderBookAggregation).toBe(1)
      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBe('Test error')
    })
  })
})
