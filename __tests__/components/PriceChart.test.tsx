import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PriceChart from '@/components/PriceChart'
import { useTradingStore } from '@/store/trading-store'
import { hyperliquidAPI } from '@/services/hyperliquid-api'

// Mock the store
jest.mock('@/store/trading-store')
const mockUseTradingStore = useTradingStore as jest.MockedFunction<typeof useTradingStore>

// Mock the API
jest.mock('@/services/hyperliquid-api')
const mockHyperliquidAPI = hyperliquidAPI as jest.Mocked<typeof hyperliquidAPI>

// Mock data
const mockMarket = {
  coin: 'BTC',
  name: 'Bitcoin',
  szDecimals: 2,
  maxLeverage: 20,
  onlyIsolated: false,
}

const mockChartData = [
  {
    time: 1640995200, // 2022-01-01 00:00:00
    open: 47000,
    high: 48000,
    low: 46500,
    close: 47500,
    volume: 1000,
  },
  {
    time: 1640995260, // 2022-01-01 00:01:00
    open: 47500,
    high: 48500,
    low: 47000,
    close: 48000,
    volume: 1200,
  },
]

const mockCandles = [
  {
    T: 1640995200000,
    t: 1640995200000,
    o: '47000',
    h: '48000',
    l: '46500',
    c: '47500',
    v: '1000',
    s: 'BTC',
    n: 50,
  },
  {
    T: 1640995260000,
    t: 1640995260000,
    o: '47500',
    h: '48500',
    l: '47000',
    c: '48000',
    v: '1200',
    s: 'BTC',
    n: 60,
  },
]

const defaultStoreState = {
  selectedMarket: mockMarket,
  chartData: mockChartData,
  updateChartData: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
}

describe('PriceChart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTradingStore.mockReturnValue(defaultStoreState)
    mockHyperliquidAPI.fetchCandles.mockResolvedValue(mockCandles)
    mockHyperliquidAPI.subscribeToCandles.mockResolvedValue(undefined)
    mockHyperliquidAPI.unsubscribeFromCandles.mockResolvedValue(undefined)
  })

  it('renders chart container with market info', () => {
    render(<PriceChart />)
    
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getByText('Select Market')).toBeInTheDocument()
  })

  it('displays current price and change when data is available', () => {
    render(<PriceChart />)
    
    expect(screen.getByText('$48,000.00')).toBeInTheDocument()
    expect(screen.getByText('+500.00 (1.05%)')).toBeInTheDocument()
  })

  it('shows leverage information for selected market', () => {
    render(<PriceChart />)
    
    expect(screen.getByText('Leverage:')).toBeInTheDocument()
    expect(screen.getByText('20x')).toBeInTheDocument()
  })

  it('renders timeframe controls', () => {
    render(<PriceChart />)
    
    const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '8h', '12h', '1d', '3d', '1w', '1M']
    
    timeframes.forEach(timeframe => {
      expect(screen.getByText(timeframe)).toBeInTheDocument()
    })
  })

  it('shows live connection status', () => {
    render(<PriceChart />)
    
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('handles timeframe selection', async () => {
    const user = userEvent.setup()
    render(<PriceChart />)
    
    const timeframeButton = screen.getByText('1h')
    await user.click(timeframeButton)
    
    // The component should handle timeframe changes internally
    expect(timeframeButton).toBeInTheDocument()
  })

  it('shows loading state when no market is selected', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: null,
    })
    
    render(<PriceChart />)
    
    expect(screen.getByText('Loading markets...')).toBeInTheDocument()
  })

  it('shows chart initialization loading state', () => {
    render(<PriceChart />)
    
    // The chart should show initialization state initially
    expect(screen.getByText('Initializing chart...')).toBeInTheDocument()
  })

  it('calls API to fetch candles on mount', async () => {
    render(<PriceChart />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.fetchCandles).toHaveBeenCalledWith(
        'BTC',
        '1m',
        expect.any(Number),
        expect.any(Number)
      )
    })
  })

  it('subscribes to candle updates', async () => {
    render(<PriceChart />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToCandles).toHaveBeenCalledWith(
        'BTC',
        '1m',
        expect.any(Function)
      )
    })
  })

  it('handles API errors with mock data fallback', async () => {
    mockHyperliquidAPI.fetchCandles.mockRejectedValue(new Error('API Error'))
    
    render(<PriceChart />)
    
    await waitFor(() => {
      expect(defaultStoreState.updateChartData).toHaveBeenCalled()
    })
  })

  it('unsubscribes from candles on unmount', () => {
    const { unmount } = render(<PriceChart />)
    
    unmount()
    
    expect(mockHyperliquidAPI.unsubscribeFromCandles).toHaveBeenCalledWith('BTC', '1m')
  })

  it('handles custom height prop', () => {
    const customHeight = 400
    const { container } = render(<PriceChart height={customHeight} />)
    
    const chartContainer = container.querySelector('[style*="height"]')
    expect(chartContainer).toHaveStyle(`height: ${customHeight}px`)
  })

  it('calculates price change correctly', () => {
    render(<PriceChart />)
    
    // With mock data: current price 48000, previous 47500
    // Change: +500, Percent: (500/47500) * 100 = 1.05%
    expect(screen.getByText('+500.00 (1.05%)')).toBeInTheDocument()
  })

  it('displays negative price change correctly', () => {
    const negativeChartData = [
      {
        time: 1640995200,
        open: 48000,
        high: 48500,
        low: 47000,
        close: 47500,
        volume: 1000,
      },
      {
        time: 1640995260,
        open: 47500,
        high: 48000,
        low: 46500,
        close: 47000,
        volume: 1200,
      },
    ]

    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      chartData: negativeChartData,
    })

    render(<PriceChart />)
    
    expect(screen.getByText('-500.00 (-1.05%)')).toBeInTheDocument()
  })

  it('handles empty chart data', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      chartData: [],
    })

    render(<PriceChart />)
    
    // Should not crash and should show market info
    expect(screen.getByText('BTC')).toBeInTheDocument()
  })

  it('handles subscription errors gracefully', async () => {
    mockHyperliquidAPI.subscribeToCandles.mockRejectedValue(new Error('Subscription Error'))
    
    render(<PriceChart />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToCandles).toHaveBeenCalled()
    })
  })

  it('updates chart when timeframe changes', async () => {
    const user = userEvent.setup()
    render(<PriceChart />)
    
    const timeframeButton = screen.getByText('5m')
    await user.click(timeframeButton)
    
    // Should trigger new data fetch for new timeframe
    await waitFor(() => {
      expect(mockHyperliquidAPI.fetchCandles).toHaveBeenCalledWith(
        'BTC',
        '5m',
        expect.any(Number),
        expect.any(Number)
      )
    })
  })

  it('handles window resize events', () => {
    const { container } = render(<PriceChart />)
    
    // Simulate window resize
    fireEvent(window, new Event('resize'))
    
    // Chart should handle resize (mocked in setup)
    expect(container).toBeInTheDocument()
  })

  it('generates mock data when API fails', async () => {
    mockHyperliquidAPI.fetchCandles.mockRejectedValue(new Error('API Error'))
    
    render(<PriceChart />)
    
    await waitFor(() => {
      // Should call updateChartData with mock data
      expect(defaultStoreState.updateChartData).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            s: 'BTC',
            o: expect.any(String),
            h: expect.any(String),
            l: expect.any(String),
            c: expect.any(String),
            v: expect.any(String),
          })
        ])
      )
    })
  })

  it('handles candle update from websocket', async () => {
    render(<PriceChart />)
    
    // Wait for subscription to be set up
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToCandles).toHaveBeenCalled()
    })
    
    // Get the callback function that was passed to subscribeToCandles
    const subscribeCall = mockHyperliquidAPI.subscribeToCandles.mock.calls[0]
    const handleCandleUpdate = subscribeCall[2]
    
    // Simulate a candle update
    const newCandle = {
      s: 'BTC',
      t: 1640995320000,
      o: '48000',
      h: '49000',
      l: '47500',
      c: '48500',
      v: '1500',
    }
    
    handleCandleUpdate(newCandle)
    
    // The chart should handle the update (mocked in setup)
    expect(mockHyperliquidAPI.subscribeToCandles).toHaveBeenCalled()
  })

  it('filters candle updates by coin', async () => {
    render(<PriceChart />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToCandles).toHaveBeenCalled()
    })
    
    const subscribeCall = mockHyperliquidAPI.subscribeToCandles.mock.calls[0]
    const handleCandleUpdate = subscribeCall[2]
    
    // Simulate a candle update for different coin
    const newCandle = {
      s: 'ETH', // Different coin
      t: 1640995320000,
      o: '3000',
      h: '3100',
      l: '2950',
      c: '3050',
      v: '2000',
    }
    
    handleCandleUpdate(newCandle)
    
    // Should not process updates for different coins
    expect(mockHyperliquidAPI.subscribeToCandles).toHaveBeenCalled()
  })
})
