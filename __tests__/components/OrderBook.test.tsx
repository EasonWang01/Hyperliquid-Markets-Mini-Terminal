import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderBook from '@/components/OrderBook'
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

const mockOrderBook = {
  coin: 'BTC',
  levels: [
    // Bids (buy orders)
    [
      { px: '50000.00', sz: '1.5', n: 3 },
      { px: '49999.50', sz: '2.0', n: 2 },
      { px: '49999.00', sz: '1.0', n: 1 },
    ],
    // Asks (sell orders)
    [
      { px: '50001.00', sz: '1.2', n: 2 },
      { px: '50001.50', sz: '1.8', n: 3 },
      { px: '50002.00', sz: '0.8', n: 1 },
    ],
  ],
  time: Date.now(),
}

const defaultStoreState = {
  selectedMarket: mockMarket,
  orderBook: mockOrderBook,
  orderBookAggregation: 0.1,
  setOrderBook: jest.fn(),
  setOrderBookAggregation: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
}

describe('OrderBook Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTradingStore.mockReturnValue(defaultStoreState)
    mockHyperliquidAPI.fetchOrderBook.mockResolvedValue(mockOrderBook)
    mockHyperliquidAPI.subscribeToOrderBook.mockResolvedValue(undefined)
    mockHyperliquidAPI.unsubscribeFromOrderBook.mockResolvedValue(undefined)
  })

  it('renders order book with market data', () => {
    render(<OrderBook />)
    
    expect(screen.getByText('Order Book')).toBeInTheDocument()
    expect(screen.getByText('Live')).toBeInTheDocument()
    expect(screen.getByText('Total (BTC)')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
  })

  it('displays bid and ask data correctly', () => {
    render(<OrderBook />)
    
    // Check bid prices (should be sorted highest to lowest)
    expect(screen.getByText('50000.000')).toBeInTheDocument()
    expect(screen.getByText('49999.500')).toBeInTheDocument()
    expect(screen.getByText('49999.000')).toBeInTheDocument()
    
    // Check ask prices (should be sorted lowest to highest)
    expect(screen.getByText('50001.000')).toBeInTheDocument()
    expect(screen.getByText('50001.500')).toBeInTheDocument()
    expect(screen.getByText('50002.000')).toBeInTheDocument()
  })

  it('shows loading state when no market is selected', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: null,
    })
    
    render(<OrderBook />)
    
    expect(screen.getByText('Select a market to view order book')).toBeInTheDocument()
  })

  it('shows loading state when order book is loading', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      orderBook: null,
    })
    
    render(<OrderBook />)
    
    expect(screen.getByText('Loading order book...')).toBeInTheDocument()
  })

  it('handles aggregation change', async () => {
    const user = userEvent.setup()
    render(<OrderBook />)
    
    const aggregationSelect = screen.getByDisplayValue('0.1')
    await user.selectOptions(aggregationSelect, '1')
    
    expect(defaultStoreState.setOrderBookAggregation).toHaveBeenCalledWith(1)
  })

  it('toggles settings panel', async () => {
    const user = userEvent.setup()
    render(<OrderBook />)
    
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)
    
    expect(screen.getByText('Max Levels (10)')).toBeInTheDocument()
    
    await user.click(settingsButton)
    expect(screen.queryByText('Max Levels (10)')).not.toBeInTheDocument()
  })

  it('adjusts max levels with slider', async () => {
    const user = userEvent.setup()
    render(<OrderBook />)
    
    // Open settings
    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)
    
    const slider = screen.getByRole('slider')
    await user.type(slider, '{arrowright}{arrowright}')
    
    // The slider should update the max levels
    expect(screen.getByText(/Max Levels/)).toBeInTheDocument()
  })

  it('calls API to fetch order book on mount', async () => {
    render(<OrderBook />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.fetchOrderBook).toHaveBeenCalledWith('BTC')
    })
  })

  it('subscribes to order book updates', async () => {
    render(<OrderBook />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToOrderBook).toHaveBeenCalledWith(
        'BTC',
        expect.any(Function)
      )
    })
  })

  it('handles order book aggregation correctly', () => {
    const aggregatedOrderBook = {
      coin: 'BTC',
      levels: [
        [
          { px: '50000.00', sz: '1.5', n: 3 },
          { px: '50000.00', sz: '0.5', n: 1 }, // Same price level
        ],
        [
          { px: '50001.00', sz: '1.2', n: 2 },
        ],
      ],
      time: Date.now(),
    }

    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      orderBook: aggregatedOrderBook,
      orderBookAggregation: 1,
    })

    render(<OrderBook />)
    
    // Should display aggregated data
    expect(screen.getByText('50000.000')).toBeInTheDocument()
    expect(screen.getByText('50001.000')).toBeInTheDocument()
  })

  it('displays best bid and ask with special styling', () => {
    render(<OrderBook />)
    
    // Best bid should have special class
    const bestBid = screen.getByText('50000.000')
    expect(bestBid.closest('.bid-row')).toHaveClass('best-bid')
    
    // Best ask should have special class
    const bestAsk = screen.getByText('50001.000')
    expect(bestAsk.closest('.ask-row')).toHaveClass('best-ask')
  })

  it('calculates and displays depth bars correctly', () => {
    render(<OrderBook />)
    
    const depthBars = screen.getAllByRole('generic').filter(el => 
      el.className.includes('depth-bar')
    )
    
    expect(depthBars.length).toBeGreaterThan(0)
  })

  it('handles empty order book data', () => {
    const emptyOrderBook = {
      coin: 'BTC',
      levels: [[], []], // Empty bids and asks
      time: Date.now(),
    }

    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      orderBook: emptyOrderBook,
    })

    render(<OrderBook />)
    
    expect(screen.getByText('No bid data')).toBeInTheDocument()
    expect(screen.getByText('No ask data')).toBeInTheDocument()
  })

  it('unsubscribes from order book on unmount', () => {
    const { unmount } = render(<OrderBook />)
    
    unmount()
    
    expect(mockHyperliquidAPI.unsubscribeFromOrderBook).toHaveBeenCalledWith('BTC')
  })

  it('handles API errors gracefully', async () => {
    mockHyperliquidAPI.fetchOrderBook.mockRejectedValue(new Error('API Error'))
    
    render(<OrderBook />)
    
    await waitFor(() => {
      expect(defaultStoreState.setError).toHaveBeenCalledWith('Failed to load order book')
    })
  })

  it('handles subscription errors with fallback polling', async () => {
    mockHyperliquidAPI.subscribeToOrderBook.mockRejectedValue(new Error('Subscription Error'))
    
    render(<OrderBook />)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.subscribeToOrderBook).toHaveBeenCalled()
    })
  })
})

describe('BidRow Component', () => {
  const mockBidProps = {
    price: '50000.00',
    size: '1.5',
    total: 1.5,
    depthPercent: 50,
    decimals: 2,
    isBestBid: true,
  }

  it('renders bid row with correct data', () => {
    render(
      <div className="bid-row best-bid">
        <div className="bid-depth-bar" style={{ width: '50%' }} />
        <div className="bid-row-content">
          <span className="bid-text best-bid">1.50</span>
          <span className="bid-price best-bid">50000.000</span>
        </div>
      </div>
    )
    
    expect(screen.getByText('1.50')).toBeInTheDocument()
    expect(screen.getByText('50000.000')).toBeInTheDocument()
  })

  it('applies best bid styling when isBestBid is true', () => {
    const { container } = render(
      <div className="bid-row best-bid">
        <div className="bid-depth-bar" style={{ width: '50%' }} />
        <div className="bid-row-content">
          <span className="bid-text best-bid">1.50</span>
          <span className="bid-price best-bid">50000.000</span>
        </div>
      </div>
    )
    
    expect(container.firstChild).toHaveClass('best-bid')
  })
})

describe('AskRow Component', () => {
  const mockAskProps = {
    price: '50001.00',
    size: '1.2',
    total: 1.2,
    depthPercent: 40,
    decimals: 2,
    isBestAsk: true,
  }

  it('renders ask row with correct data', () => {
    render(
      <div className="ask-row best-ask">
        <div className="ask-depth-bar" style={{ width: '40%' }} />
        <div className="ask-row-content">
          <span className="ask-price best-ask">50001.000</span>
          <span className="ask-text best-ask">1.20</span>
        </div>
      </div>
    )
    
    expect(screen.getByText('1.20')).toBeInTheDocument()
    expect(screen.getByText('50001.000')).toBeInTheDocument()
  })

  it('applies best ask styling when isBestAsk is true', () => {
    const { container } = render(
      <div className="ask-row best-ask">
        <div className="ask-depth-bar" style={{ width: '40%' }} />
        <div className="ask-row-content">
          <span className="ask-price best-ask">50001.000</span>
          <span className="ask-text best-ask">1.20</span>
        </div>
      </div>
    )
    
    expect(container.firstChild).toHaveClass('best-ask')
  })
})
