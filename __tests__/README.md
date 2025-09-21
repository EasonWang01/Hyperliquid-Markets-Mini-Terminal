# Testing Guide

This directory contains comprehensive unit tests for the Trade Mini Terminal application using Jest and React Testing Library.

## Test Structure

```
__tests__/
├── components/           # Component tests
│   ├── OrderBook.test.tsx
│   ├── PriceChart.test.tsx
│   ├── TradesList.test.tsx
│   └── AccountLookup.test.tsx
├── store/               # Store tests
│   └── trading-store.test.ts
├── services/            # API service tests
│   └── hyperliquid-api.test.ts
├── app/                 # Page tests
│   └── page.test.tsx
├── utils/               # Test utilities
│   └── test-utils.tsx
└── README.md           # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific Test File
```bash
npm test OrderBook.test.tsx
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="OrderBook Component"
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- JSdom test environment for React components
- Path mapping for `@/` imports
- Coverage collection from components, store, hooks, and services
- 70% coverage threshold

### Setup File (`jest.setup.js`)
- Imports `@testing-library/jest-dom` matchers
- Mocks Next.js router and navigation
- Mocks WebSocket, ResizeObserver, and IntersectionObserver
- Mocks external libraries (QR Scanner, lightweight-charts, lucide-react)
- Suppresses console warnings in tests

## Test Utilities

### Mock Data Factories
Located in `__tests__/utils/test-utils.tsx`:

```typescript
// Create mock data
const mockMarket = createMockMarket({ coin: 'ETH' })
const mockOrderBook = createMockOrderBook()
const mockTrade = createMockTrade({ side: 'A' })
const mockCandle = createMockCandle()
const mockUserState = createMockUserState()

// Generate multiple items
const trades = generateMockTrades(10)
const candles = generateMockCandles(5)
```

### Custom Render Function
```typescript
import { renderWithStore } from '@/__tests__/utils/test-utils'

// Render with custom store state
renderWithStore(<Component />, {
  storeState: { selectedMarket: mockMarket }
})
```

### Test Scenarios
```typescript
import { testScenarios } from '@/__tests__/utils/test-utils'

// Use predefined scenarios
renderWithStore(<Component />, {
  storeState: testScenarios.loading
})
```

## Component Testing Patterns

### Basic Component Test
```typescript
import { render, screen } from '@testing-library/react'
import { renderWithStore } from '@/__tests__/utils/test-utils'
import Component from '@/components/Component'

describe('Component', () => {
  it('renders correctly', () => {
    renderWithStore(<Component />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event'

it('handles user interaction', async () => {
  const user = userEvent.setup()
  renderWithStore(<Component />)
  
  const button = screen.getByRole('button')
  await user.click(button)
  
  expect(mockFunction).toHaveBeenCalled()
})
```

### Testing Async Operations
```typescript
import { waitFor } from '@testing-library/react'

it('handles async operations', async () => {
  renderWithStore(<Component />)
  
  await waitFor(() => {
    expect(mockApiCall).toHaveBeenCalled()
  })
})
```

## Store Testing

### Testing Zustand Store
```typescript
import { renderHook, act } from '@testing-library/react'
import { useTradingStore } from '@/store/trading-store'

it('updates store state', () => {
  const { result } = renderHook(() => useTradingStore())
  
  act(() => {
    result.current.setSelectedMarket(mockMarket)
  })
  
  expect(result.current.selectedMarket).toEqual(mockMarket)
})
```

## API Service Testing

### Testing HTTP Requests
```typescript
import { hyperliquidAPI } from '@/services/hyperliquid-api'

beforeEach(() => {
  global.fetch = jest.fn()
})

it('fetches data successfully', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockData,
  })
  
  const result = await hyperliquidAPI.fetchMarkets()
  expect(result).toEqual(mockData)
})
```

### Testing WebSocket Connections
```typescript
it('subscribes to WebSocket updates', async () => {
  const mockCallback = jest.fn()
  await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)
  
  expect(mockWebSocket.send).toHaveBeenCalledWith(
    expect.stringContaining('subscribe')
  )
})
```

## Mocking Strategies

### External Libraries
- **lightweight-charts**: Mocked chart creation and data updates
- **qr-scanner**: Mocked QR code scanning functionality
- **lucide-react**: Mocked icon components
- **WebSocket**: Mocked WebSocket connections and message handling

### API Responses
- Mock successful responses with realistic data
- Mock error responses for error handling tests
- Mock network failures and timeouts

### Store State
- Use factory functions to create consistent mock data
- Provide default states for common scenarios
- Allow overrides for specific test cases

## Best Practices

### Test Organization
1. Group related tests in `describe` blocks
2. Use descriptive test names that explain the behavior
3. Test both happy path and error scenarios
4. Test user interactions and state changes

### Mock Management
1. Clear mocks between tests with `jest.clearAllMocks()`
2. Use factory functions for consistent mock data
3. Mock at the appropriate level (component, service, or store)
4. Avoid over-mocking; test real behavior when possible

### Assertions
1. Use specific matchers from `@testing-library/jest-dom`
2. Test user-visible behavior, not implementation details
3. Assert on multiple aspects when relevant
4. Use `waitFor` for async operations

### Coverage
1. Aim for meaningful coverage, not just high percentages
2. Test error handling and edge cases
3. Test user interactions and state changes
4. Focus on critical business logic

## Common Test Patterns

### Loading States
```typescript
it('shows loading state', () => {
  renderWithStore(<Component />, {
    storeState: { isLoading: true }
  })
  
  expect(screen.getByText('Loading...')).toBeInTheDocument()
})
```

### Error Handling
```typescript
it('handles errors gracefully', () => {
  renderWithStore(<Component />, {
    storeState: { error: 'Something went wrong' }
  })
  
  expect(screen.getByText('Something went wrong')).toBeInTheDocument()
})
```

### Conditional Rendering
```typescript
it('renders conditionally', () => {
  const { rerender } = renderWithStore(<Component />)
  
  expect(screen.queryByText('Content')).not.toBeInTheDocument()
  
  rerender(<Component condition={true} />)
  
  expect(screen.getByText('Content')).toBeInTheDocument()
})
```

## Debugging Tests

### Debug Output
```typescript
import { screen } from '@testing-library/react'

// Print current DOM state
screen.debug()

// Print specific element
screen.debug(screen.getByRole('button'))
```

### Test Isolation
- Each test should be independent
- Use `beforeEach` to set up common state
- Clear mocks and state between tests
- Avoid shared mutable state

### Common Issues
1. **Async operations**: Use `waitFor` or `findBy` queries
2. **Mock not working**: Check mock setup and clearing
3. **Element not found**: Use `screen.debug()` to inspect DOM
4. **State not updating**: Ensure proper `act()` usage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Scheduled runs

Coverage reports are generated and tracked to ensure code quality standards are maintained.
