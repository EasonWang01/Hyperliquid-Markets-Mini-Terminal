import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'
import { useTradingStore } from '@/store/trading-store'
import { hyperliquidAPI } from '@/services/hyperliquid-api'

// Mock the store
jest.mock('@/store/trading-store')
const mockUseTradingStore = useTradingStore as jest.MockedFunction<typeof useTradingStore>

// Mock the API
jest.mock('@/services/hyperliquid-api')
const mockHyperliquidAPI = hyperliquidAPI as jest.Mocked<typeof hyperliquidAPI>

// Mock data
const mockMarkets = [
  {
    coin: 'BTC',
    name: 'Bitcoin',
    szDecimals: 2,
    maxLeverage: 20,
    onlyIsolated: false,
  },
  {
    coin: 'ETH',
    name: 'Ethereum',
    szDecimals: 3,
    maxLeverage: 15,
    onlyIsolated: false,
  },
  {
    coin: 'SOL',
    name: 'Solana',
    szDecimals: 2,
    maxLeverage: 10,
    onlyIsolated: false,
  },
]

const defaultStoreState = {
  markets: mockMarkets,
  selectedMarket: null,
  isLoading: false,
  error: null,
  setMarkets: jest.fn(),
  setSelectedMarket: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
}

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTradingStore.mockReturnValue(defaultStoreState)
    mockHyperliquidAPI.fetchMarkets.mockResolvedValue(mockMarkets)
  })

  it('renders the main layout', () => {
    render(<Home />)
    
    expect(screen.getByText('Trade Mini Terminal')).toBeInTheDocument()
    expect(screen.getByText('Select Market')).toBeInTheDocument()
  })

  it('displays market selector', () => {
    render(<Home />)
    
    expect(screen.getByText('Select Market')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getByText('ETH')).toBeInTheDocument()
    expect(screen.getByText('SOL')).toBeInTheDocument()
  })

  it('shows loading state when markets are loading', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      markets: [],
      isLoading: true,
    })
    
    render(<Home />)
    
    expect(screen.getByText('Loading markets...')).toBeInTheDocument()
  })

  it('shows error state when there is an error', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      error: 'Failed to load markets',
    })
    
    render(<Home />)
    
    expect(screen.getByText('Failed to load markets')).toBeInTheDocument()
  })

  it('handles market selection', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const btcButton = screen.getByText('BTC')
    await user.click(btcButton)
    
    expect(defaultStoreState.setSelectedMarket).toHaveBeenCalledWith(mockMarkets[0])
  })

  it('displays selected market information', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: mockMarkets[0],
    })
    
    render(<Home />)
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('20x')).toBeInTheDocument() // Max leverage
  })

  it('shows trading components when market is selected', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: mockMarkets[0],
    })
    
    render(<Home />)
    
    // Check that trading components are rendered
    expect(screen.getByText('Order Book')).toBeInTheDocument()
    expect(screen.getByText('Recent Trades')).toBeInTheDocument()
  })

  it('handles account lookup modal', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    const accountButton = screen.getByText('Account')
    await user.click(accountButton)
    
    expect(screen.getByText('Account Lookup')).toBeInTheDocument()
  })

  it('closes account lookup modal', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    // Open modal
    const accountButton = screen.getByText('Account')
    await user.click(accountButton)
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(screen.queryByText('Account Lookup')).not.toBeInTheDocument()
  })

  it('displays market statistics', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: mockMarkets[0],
    })
    
    render(<Home />)
    
    // Check for market info display
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
  })

  it('handles responsive layout', () => {
    render(<Home />)
    
    // Check that the main container has proper classes
    const mainContainer = screen.getByRole('main')
    expect(mainContainer).toBeInTheDocument()
  })

  it('shows empty state when no markets are available', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      markets: [],
      isLoading: false,
    })
    
    render(<Home />)
    
    expect(screen.getByText('No markets available')).toBeInTheDocument()
  })

  it('handles market selection with keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    // Focus on first market button
    const btcButton = screen.getByText('BTC')
    btcButton.focus()
    
    // Press Enter to select
    await user.keyboard('{Enter}')
    
    expect(defaultStoreState.setSelectedMarket).toHaveBeenCalledWith(mockMarkets[0])
  })

  it('displays market leverage information', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: mockMarkets[0],
    })
    
    render(<Home />)
    
    expect(screen.getByText('20x')).toBeInTheDocument() // Max leverage for BTC
  })

  it('shows different leverage for different markets', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: mockMarkets[1], // ETH with 15x leverage
    })
    
    render(<Home />)
    
    expect(screen.getByText('15x')).toBeInTheDocument() // Max leverage for ETH
  })

  it('handles error clearing', async () => {
    const user = userEvent.setup()
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      error: 'Test error',
    })
    
    render(<Home />)
    
    const errorMessage = screen.getByText('Test error')
    await user.click(errorMessage)
    
    expect(defaultStoreState.clearError).toHaveBeenCalled()
  })

  it('displays market selection instructions', () => {
    render(<Home />)
    
    expect(screen.getByText('Select a market to start trading')).toBeInTheDocument()
  })

  it('shows market count', () => {
    render(<Home />)
    
    expect(screen.getByText('3 markets available')).toBeInTheDocument()
  })

  it('handles empty market list', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      markets: [],
    })
    
    render(<Home />)
    
    expect(screen.getByText('0 markets available')).toBeInTheDocument()
  })

  it('displays proper market formatting', () => {
    render(<Home />)
    
    // Check that market names are displayed properly
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('Solana')).toBeInTheDocument()
  })

  it('handles market selection state changes', () => {
    const { rerender } = render(<Home />)
    
    // Initially no market selected
    expect(screen.getByText('Select a market to start trading')).toBeInTheDocument()
    
    // Select a market
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      selectedMarket: mockMarkets[0],
    })
    
    rerender(<Home />)
    
    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.queryByText('Select a market to start trading')).not.toBeInTheDocument()
  })
})
