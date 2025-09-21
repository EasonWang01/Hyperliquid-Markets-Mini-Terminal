import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccountLookup from '@/components/AccountLookup'
import { useTradingStore } from '@/store/trading-store'
import { hyperliquidAPI } from '@/services/hyperliquid-api'
import { UserState } from '@/types/hyperliquid'

// Mock the store
jest.mock('@/store/trading-store')
const mockUseTradingStore = useTradingStore as jest.MockedFunction<typeof useTradingStore>

// Mock the API
jest.mock('@/services/hyperliquid-api')
const mockHyperliquidAPI = hyperliquidAPI as jest.Mocked<typeof hyperliquidAPI>

// Mock QR Scanner
const mockQrScanner = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn(),
  destroy: jest.fn(),
}

jest.mock('qr-scanner', () => {
  return jest.fn().mockImplementation(() => mockQrScanner)
})

// Mock data
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
  time: 1640995200000,
  withdrawable: '9000.00',
}

const defaultStoreState = {
  userState: null,
  walletAddress: null,
  setUserState: jest.fn(),
  setWalletAddress: jest.fn(),
  setError: jest.fn(),
}

describe('AccountLookup Component', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTradingStore.mockReturnValue(defaultStoreState)
    mockHyperliquidAPI.fetchUserState.mockResolvedValue(mockUserState)
  })

  it('renders when isOpen is true', () => {
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Account Lookup')).toBeInTheDocument()
    expect(screen.getByText('Wallet Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter wallet address (0x...)')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(<AccountLookup isOpen={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Account Lookup')).not.toBeInTheDocument()
  })

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('handles address input and submission', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const addressInput = screen.getByPlaceholderText('Enter wallet address (0x...)')
    const submitButton = screen.getByRole('button', { name: /lookup account/i })
    
    await user.type(addressInput, '0x1234567890abcdef')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.fetchUserState).toHaveBeenCalledWith('0x1234567890abcdef')
    })
  })

  it('shows loading state during API call', async () => {
    const user = userEvent.setup()
    mockHyperliquidAPI.fetchUserState.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockUserState), 100))
    )
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const addressInput = screen.getByPlaceholderText('Enter wallet address (0x...)')
    const submitButton = screen.getByRole('button', { name: /lookup account/i })
    
    await user.type(addressInput, '0x1234567890abcdef')
    await user.click(submitButton)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('disables submit button when address is empty', () => {
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const submitButton = screen.getByRole('button', { name: /lookup account/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when address is entered', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const addressInput = screen.getByPlaceholderText('Enter wallet address (0x...)')
    const submitButton = screen.getByRole('button', { name: /lookup account/i })
    
    await user.type(addressInput, '0x1234567890abcdef')
    
    expect(submitButton).not.toBeDisabled()
  })

  it('handles form submission with Enter key', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const addressInput = screen.getByPlaceholderText('Enter wallet address (0x...)')
    
    await user.type(addressInput, '0x1234567890abcdef')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockHyperliquidAPI.fetchUserState).toHaveBeenCalledWith('0x1234567890abcdef')
    })
  })

  it('toggles QR scanner', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByRole('button', { name: /scan qr code/i })
    await user.click(cameraButton)
    
    expect(screen.getByText('QR Code Scanner')).toBeInTheDocument()
    expect(screen.getByText('Point your camera at a QR code containing a wallet address')).toBeInTheDocument()
  })

  it('closes QR scanner when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    // Open scanner
    const cameraButton = screen.getByRole('button', { name: /scan qr code/i })
    await user.click(cameraButton)
    
    // Close scanner
    const closeScannerButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeScannerButton)
    
    expect(screen.queryByText('QR Code Scanner')).not.toBeInTheDocument()
  })

  it('displays account data when user state is loaded', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: mockUserState,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Account Overview')).toBeInTheDocument()
    expect(screen.getByText('0x1234...cdef')).toBeInTheDocument()
    expect(screen.getByText('$10,000.00')).toBeInTheDocument() // Account value
    expect(screen.getByText('$5,000.00')).toBeInTheDocument() // Total position
    expect(screen.getByText('$1,000.00')).toBeInTheDocument() // Margin used
    expect(screen.getByText('$9,000.00')).toBeInTheDocument() // Withdrawable
  })

  it('displays open positions', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: mockUserState,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Open Positions')).toBeInTheDocument()
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.getByText('5x')).toBeInTheDocument() // Leverage
    expect(screen.getByText('0.1')).toBeInTheDocument() // Size
    expect(screen.getByText('$45,000.0000')).toBeInTheDocument() // Entry price
    expect(screen.getByText('$500.00')).toBeInTheDocument() // PnL
    expect(screen.getByText('+12.50%')).toBeInTheDocument() // ROE
  })

  it('formats currency values correctly', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: mockUserState,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    // Check for properly formatted currency values
    expect(screen.getByText('$10,000.00')).toBeInTheDocument()
    expect(screen.getByText('$5,000.00')).toBeInTheDocument()
    expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    expect(screen.getByText('$9,000.00')).toBeInTheDocument()
  })

  it('formats percentage values correctly', () => {
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: mockUserState,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('+12.50%')).toBeInTheDocument()
  })

  it('handles negative PnL and ROE', () => {
    const negativeUserState: UserState = {
      ...mockUserState,
      assetPositions: [
        {
          position: {
            ...mockUserState.assetPositions[0].position,
            returnOnEquity: '-5.25',
            unrealizedPnl: '-250.00',
          },
          type: 'cross',
        },
      ],
    }
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: negativeUserState,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('-$250.00')).toBeInTheDocument()
    expect(screen.getByText('-5.25%')).toBeInTheDocument()
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    mockHyperliquidAPI.fetchUserState.mockRejectedValue(new Error('API Error'))
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const addressInput = screen.getByPlaceholderText('Enter wallet address (0x...)')
    const submitButton = screen.getByRole('button', { name: /lookup account/i })
    
    await user.type(addressInput, '0x1234567890abcdef')
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(defaultStoreState.setError).toHaveBeenCalledWith(
        'Failed to fetch account data. Please check the address.'
      )
    })
  })

  it('handles QR scanner errors', async () => {
    const user = userEvent.setup()
    mockQrScanner.start.mockRejectedValue(new Error('Camera access denied'))
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByRole('button', { name: /scan qr code/i })
    await user.click(cameraButton)
    
    await waitFor(() => {
      expect(defaultStoreState.setError).toHaveBeenCalledWith(
        'Failed to access camera for QR scanning'
      )
    })
  })

  it('processes QR code scan result', async () => {
    const user = userEvent.setup()
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    const cameraButton = screen.getByRole('button', { name: /scan qr code/i })
    await user.click(cameraButton)
    
    // Simulate QR code scan result
    const mockResult = { data: '0xabcdef1234567890' }
    
    // Get the QR scanner instance and simulate successful scan
    const qrScannerInstance = mockQrScanner.constructor.mock.results[0].value
    qrScannerInstance.onDecodeSuccess(mockResult)
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('0xabcdef1234567890')).toBeInTheDocument()
    })
  })

  it('handles empty asset positions', () => {
    const emptyUserState: UserState = {
      ...mockUserState,
      assetPositions: [],
    }
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: emptyUserState,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Account Overview')).toBeInTheDocument()
    expect(screen.queryByText('Open Positions')).not.toBeInTheDocument()
  })

  it('handles positions without leverage', () => {
    const userStateWithoutLeverage: UserState = {
      ...mockUserState,
      assetPositions: [
        {
          position: {
            ...mockUserState.assetPositions[0].position,
            leverage: undefined,
          },
          type: 'cross',
        },
      ],
    }
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: userStateWithoutLeverage,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('BTC')).toBeInTheDocument()
    expect(screen.queryByText('5x')).not.toBeInTheDocument()
  })

  it('handles positions without entry price', () => {
    const userStateWithoutEntryPrice: UserState = {
      ...mockUserState,
      assetPositions: [
        {
          position: {
            ...mockUserState.assetPositions[0].position,
            entryPx: undefined,
          },
          type: 'cross',
        },
      ],
    }
    
    mockUseTradingStore.mockReturnValue({
      ...defaultStoreState,
      userState: userStateWithoutEntryPrice,
      walletAddress: '0x1234567890abcdef',
    })
    
    render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('cleans up QR scanner on unmount', () => {
    const { unmount } = render(<AccountLookup isOpen={true} onClose={mockOnClose} />)
    
    unmount()
    
    expect(mockQrScanner.destroy).toHaveBeenCalled()
  })
})
