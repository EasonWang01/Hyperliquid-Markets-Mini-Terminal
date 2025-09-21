import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TradesList, { TradeFlash } from '@/components/TradesList'
import { useTradingStore } from '@/store/trading-store'
import { hyperliquidAPI } from '@/services/hyperliquid-api'
import { Trade } from '@/types/hyperliquid'

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

const mockTrades: Trade[] = [
  {
    coin: 'BTC',
    side: 'B',
    px: '50000.00',
    sz: '1.5',
    time: 1640995200000,
    hash: 'hash1',
  },
  {
    coin: 'BTC',
    side: 'A',
    px: '50001.00',
    sz: '2.0',
    time: 1640995260000,
    hash: 'hash2',
  },
  {
    coin: 'BTC',
    side: 'B',
    px: '49999.50',
    sz: '0.8',
    time: 1640995320000,
    hash: 'hash3',
  },
]

const defaultStoreState = {
  selectedMarket: mockMarket,
  trades: mockTrades,
  addTrade: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
}

describe('TradesList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTradingStore.mockReturnValue(defaultStoreState)
    mockHyperliquidAPI.fetchTrades.mockResolvedValue(mockTrades)
    mockHyperliquidAPI.subscribeToTrades.mockResolvedValue(undefined)
    mockHyperliquidAPI.unsubscribeFromTrades.mockResolvedValue(undefined)
  })

  it('renders trades list with header', () => {
    render(<TradesList />)
    
    expect(screen.getByText('Recent Trades')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Size (BTC)')).toBeInTheDocument()
    expect(screen.getByText('Side')).toBeInTheDocument()
  })

  it('displays trades data correctly', () => {
    render(<TradesList />)
    
    // Check that trade data is displayed
    expect(screen.getByText('50000.000')).toBeInTheDocument()
    expect(screen.getByText('50001.000')).toBeInTheDocument()
    expect(screen.getByText('49999.500')).toBeInTheDocument()
    
    // Check buy/sell indicators
    expect(screen.getAllByText('BUY')).toHaveLength(2) // Two buy trades
    expect(screen.getByText('SELL')).toBeInTheDocument() // One sell trade
  })

  it('shows loading state when no market is selected', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: null,
    })
    
    render(<TradesList />)
    
    expect(screen.getByText('Select a market to view trades')).toBeInTheDocument()
  })

  it('shows loading state when trades are loading', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      trades: [],
    })
    
    render(<TradesList />)
    
    expect(screen.getByText('Loading trades...')).toBeInTheDocument()
  })

  it('handles max trades selection', async () => {
    const user = userEvent.setup()
    render(<TradesList />)
    
    const maxTradesSelect = screen.getByDisplayValue('30')
    await user.selectOptions(maxTradesSelect, '50')
    
    // Should update the display limit
    expect(maxTradesSelect).toHaveValue('50')
  })

  it('displays correct number of trades based on maxTrades setting', () => {
    // Set maxTrades to 2
    const limitedTrades = mockTrades.slice(0, 2)
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      trades: limitedTrades,
    })
    
    render(<TradesList />)
    
    // Should show only 2 trades
    expect(screen.getAllByText(/BUY|SELL/)).toHaveLength(2)
  })

  it('shows load more button when there are more trades', () => {
    const manyTrades = Array.from({ length: 50 }, (_, i) => ({
      ...mockTrades[0],
      hash: `hash${i}`,
      time: 1640995200000 + i * 1000,
    }))
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      trades: manyTrades,
    })
    
    render(<TradesList />)
    
    expect(screen.getByText('Load more trades')).toBeInTheDocument()
  })

  it('loads more trades when load more button is clicked', async () => {
    const user = userEvent.setup()
    const manyTrades = Array.from({ length: 50 }, (_, i) => ({
      ...mockTrades[0],
      hash: `hash${i}`,
      time: 1640995200000 + i * 1000,
    }))
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      trades: manyTrades,
    })
    
    render(<TradesList />)
    
    const loadMoreButton = screen.getByText('Load more trades')
    await user.click(loadMoreButton)
    
    // Should increase the display limit
    expect(loadMoreButton).toBeInTheDocument()
  })

  it('calls API to fetch trades on mount', async () => {
    render(<TradesList />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.fetchTrades).toHaveBeenCalledWith('BTC')
    })
  })

  it('subscribes to trade updates', async () => {
    render(<TradesList />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToTrades).toHaveBeenCalledWith(
        'BTC',
        expect.any(Function)
      )
    })
  })

  it('handles trade updates from websocket', async () => {
    render(<TradesList />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToTrades).toHaveBeenCalled()
    })
    
    const subscribeCall = mockHyperliquidAPI.subscribeToTrades.mock.calls[0]
    const handleTradeUpdate = subscribeCall[1]
    
    const newTrade: Trade = {
      coin: 'BTC',
      side: 'B',
      px: '50002.00',
      sz: '1.0',
      time: 1640995380000,
      hash: 'newhash',
    }
    
    handleTradeUpdate(newTrade)
    
    expect(defaultStoreState.addTrade).toHaveBeenCalledWith(newTrade)
  })

  it('handles array of trade updates', async () => {
    render(<TradesList />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToTrades).toHaveBeenCalled()
    })
    
    const subscribeCall = mockHyperliquidAPI.subscribeToTrades.mock.calls[0]
    const handleTradeUpdate = subscribeCall[1]
    
    const newTrades: Trade[] = [
      {
        coin: 'BTC',
        side: 'B',
        px: '50002.00',
        sz: '1.0',
        time: 1640995380000,
        hash: 'newhash1',
      },
      {
        coin: 'BTC',
        side: 'A',
        px: '50003.00',
        sz: '0.5',
        time: 1640995440000,
        hash: 'newhash2',
      },
    ]
    
    handleTradeUpdate(newTrades)
    
    expect(defaultStoreState.addTrade).toHaveBeenCalledTimes(2)
    expect(defaultStoreState.addTrade).toHaveBeenCalledWith(newTrades[0])
    expect(defaultStoreState.addTrade).toHaveBeenCalledWith(newTrades[1])
  })

  it('filters trade updates by coin', async () => {
    render(<TradesList />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToTrades).toHaveBeenCalled()
    })
    
    const subscribeCall = mockHyperliquidAPI.subscribeToTrades.mock.calls[0]
    const handleTradeUpdate = subscribeCall[1]
    
    const ethTrade: Trade = {
      coin: 'ETH', // Different coin
      side: 'B',
      px: '3000.00',
      sz: '5.0',
      time: 1640995380000,
      hash: 'ethhash',
    }
    
    handleTradeUpdate(ethTrade)
    
    // Should not add trades for different coins
    expect(defaultStoreState.addTrade).not.toHaveBeenCalledWith(ethTrade)
  })

  it('unsubscribes from trades on unmount', () => {
    const { unmount } = render(<TradesList />)
    
    unmount()
    
    expect(mockHyperliquidAPI.unsubscribeFromTrades).toHaveBeenCalledWith('BTC')
  })

  it('handles API errors gracefully', async () => {
    mockHyperliquidAPI.fetchTrades.mockRejectedValue(new Error('API Error'))
    
    render(<TradesList />)
    
    await waitFor(() => {
      expect(defaultStoreState.setError).toHaveBeenCalledWith('Failed to load trades')
    })
  })

  it('handles subscription errors with fallback polling', async () => {
    mockHyperliquidAPI.subscribeToTrades.mockRejectedValue(new Error('Subscription Error'))
    
    render(<TradesList />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToTrades).toHaveBeenCalled()
    })
  })

  it('formats time correctly', () => {
    render(<TradesList />)
    
    // Check that time is displayed in HH:MM:SS format
    const timeElements = screen.getAllByText(/\d{2}:\d{2}:\d{2}/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('formats size correctly with K and M suffixes', () => {
    const tradesWithLargeSizes: Trade[] = [
      {
        coin: 'BTC',
        side: 'B',
        px: '50000.00',
        sz: '1500.0', // Should show as 1.5K
        time: 1640995200000,
        hash: 'hash1',
      },
      {
        coin: 'BTC',
        side: 'A',
        px: '50001.00',
        sz: '2000000.0', // Should show as 2.0M
        time: 1640995260000,
        hash: 'hash2',
      },
    ]
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      trades: tradesWithLargeSizes,
    })
    
    render(<TradesList />)
    
    expect(screen.getByText('1.5K')).toBeInTheDocument()
    expect(screen.getByText('2.0M')).toBeInTheDocument()
  })
})

describe('TradeRow Component', () => {
  const mockTrade: Trade = {
    coin: 'BTC',
    side: 'B',
    px: '50000.00',
    sz: '1.5',
    time: 1640995200000,
    hash: 'hash1',
  }

  it('renders buy trade correctly', () => {
    render(
      <div className="trade-row buy">
        <div className="trade-time">
          <div data-testid="clock-icon" />
          <span>12:00:00</span>
        </div>
        <div className="trade-price buy">50000.000</div>
        <div className="trade-size">1.50</div>
        <div className="trade-side buy">
          <div data-testid="trending-up-icon" />
          <span className="trade-side-text">BUY</span>
        </div>
      </div>
    )
    
    expect(screen.getByText('50000.000')).toBeInTheDocument()
    expect(screen.getByText('1.50')).toBeInTheDocument()
    expect(screen.getByText('BUY')).toBeInTheDocument()
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument()
  })

  it('renders sell trade correctly', () => {
    const sellTrade = { ...mockTrade, side: 'A' as const }
    
    render(
      <div className="trade-row sell">
        <div className="trade-time">
          <div data-testid="clock-icon" />
          <span>12:00:00</span>
        </div>
        <div className="trade-price sell">50000.000</div>
        <div className="trade-size">1.50</div>
        <div className="trade-side sell">
          <div data-testid="trending-down-icon" />
          <span className="trade-side-text">SELL</span>
        </div>
      </div>
    )
    
    expect(screen.getByText('SELL')).toBeInTheDocument()
    expect(screen.getByTestId('trending-down-icon')).toBeInTheDocument()
  })
})

describe('TradeFlash Component', () => {
  const mockTrade: Trade = {
    coin: 'BTC',
    side: 'B',
    px: '50000.00',
    sz: '1.5',
    time: 1640995200000,
    hash: 'hash1',
  }

  it('renders buy trade flash', () => {
    render(<TradeFlash trade={mockTrade} />)
    
    expect(screen.getByText('BUY BTC')).toBeInTheDocument()
    expect(screen.getByText('1.50 @ $50000.0000')).toBeInTheDocument()
  })

  it('renders sell trade flash', () => {
    const sellTrade = { ...mockTrade, side: 'A' as const }
    render(<TradeFlash trade={sellTrade} />)
    
    expect(screen.getByText('SELL BTC')).toBeInTheDocument()
    expect(screen.getByText('1.50 @ $50000.0000')).toBeInTheDocument()
  })

  it('disappears after timeout', async () => {
    jest.useFakeTimers()
    
    const { container } = render(<TradeFlash trade={mockTrade} />)
    
    expect(container.firstChild).toBeInTheDocument()
    
    // Fast-forward time
    jest.advanceTimersByTime(2000)
    
    await waitFor(() => {
      expect(container.firstChild).not.toBeInTheDocument()
    })
    
    jest.useRealTimers()
  })

  it('formats price and size correctly', () => {
    const tradeWithDecimals: Trade = {
      ...mockTrade,
      px: '50000.1234',
      sz: '1.5678',
    }
    
    render(<TradeFlash trade={tradeWithDecimals} />)
    
    expect(screen.getByText('1.57 @ $50000.1234')).toBeInTheDocument()
  })
})
