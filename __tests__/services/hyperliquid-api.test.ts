import { hyperliquidAPI } from '@/services/hyperliquid-api'
import { Market, OrderBook, Trade, Candle, UserState } from '@/types/hyperliquid'

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
}

global.WebSocket = jest.fn(() => mockWebSocket) as any

// Mock fetch
global.fetch = jest.fn()

describe('Hyperliquid API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    mockWebSocket.send.mockClear()
    mockWebSocket.close.mockClear()
  })

  describe('fetchMarkets', () => {
    it('fetches markets successfully', async () => {
      const mockMarkets: Market[] = [
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
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMarkets,
      })

      const result = await hyperliquidAPI.fetchMarkets()

      expect(result).toEqual(mockMarkets)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hyperliquid.xyz/info',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'meta',
          }),
        })
      )
    })

    it('handles fetch errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(hyperliquidAPI.fetchMarkets()).rejects.toThrow('Network error')
    })

    it('handles non-ok responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(hyperliquidAPI.fetchMarkets()).rejects.toThrow('HTTP error! status: 500')
    })
  })

  describe('fetchOrderBook', () => {
    it('fetches order book successfully', async () => {
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

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOrderBook,
      })

      const result = await hyperliquidAPI.fetchOrderBook('BTC')

      expect(result).toEqual(mockOrderBook)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hyperliquid.xyz/info',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'l2Book',
            coin: 'BTC',
          }),
        })
      )
    })
  })

  describe('fetchTrades', () => {
    it('fetches trades successfully', async () => {
      const mockTrades: Trade[] = [
        {
          coin: 'BTC',
          side: 'B',
          px: '50000.00',
          sz: '1.5',
          time: Date.now(),
          hash: 'hash1',
        },
        {
          coin: 'BTC',
          side: 'A',
          px: '50001.00',
          sz: '2.0',
          time: Date.now() + 1000,
          hash: 'hash2',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrades,
      })

      const result = await hyperliquidAPI.fetchTrades('BTC')

      expect(result).toEqual(mockTrades)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hyperliquid.xyz/info',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'trades',
            coin: 'BTC',
          }),
        })
      )
    })
  })

  describe('fetchCandles', () => {
    it('fetches candles successfully', async () => {
      const mockCandles: Candle[] = [
        {
          T: Date.now(),
          c: '50000.00',
          h: '50100.00',
          l: '49900.00',
          n: 100,
          o: '49950.00',
          s: 'BTC',
          t: Date.now() - 60000,
          v: '1000.00',
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCandles,
      })

      const startTime = Date.now() - 3600000 // 1 hour ago
      const endTime = Date.now()

      const result = await hyperliquidAPI.fetchCandles('BTC', '1m', startTime, endTime)

      expect(result).toEqual(mockCandles)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hyperliquid.xyz/info',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'candleSnapshot',
            coin: 'BTC',
            interval: '1m',
            startTime,
            endTime,
          }),
        })
      )
    })
  })

  describe('fetchUserState', () => {
    it('fetches user state successfully', async () => {
      const mockUserState: UserState = {
        assetPositions: [],
        crossMaintenanceMarginUsed: '0.00',
        crossMarginSummary: {
          accountValue: '10000.00',
          totalMarginUsed: '0.00',
          totalNtlPos: '0.00',
          totalRawUsd: '10000.00',
        },
        marginSummary: {
          accountValue: '10000.00',
          totalMarginUsed: '0.00',
          totalNtlPos: '0.00',
          totalRawUsd: '10000.00',
        },
        time: Date.now(),
        withdrawable: '10000.00',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserState,
      })

      const result = await hyperliquidAPI.fetchUserState('0x1234567890abcdef')

      expect(result).toEqual(mockUserState)
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.hyperliquid.xyz/info',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            type: 'clearinghouseState',
            user: '0x1234567890abcdef',
          }),
        })
      )
    })
  })

  describe('WebSocket Subscriptions', () => {
    beforeEach(() => {
      // Reset WebSocket mock
      mockWebSocket.readyState = 1
    })

    describe('subscribeToOrderBook', () => {
      it('subscribes to order book updates', async () => {
        const mockCallback = jest.fn()

        await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)

        expect(global.WebSocket).toHaveBeenCalledWith('wss://api.hyperliquid.xyz/ws')
        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'subscribe',
            subscription: {
              type: 'l2Book',
              coin: 'BTC',
            },
          })
        )
      })

      it('handles WebSocket connection errors', async () => {
        const mockCallback = jest.fn()
        ;(global.WebSocket as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Connection failed')
        })

        await expect(
          hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)
        ).rejects.toThrow('Connection failed')
      })
    })

    describe('subscribeToTrades', () => {
      it('subscribes to trade updates', async () => {
        const mockCallback = jest.fn()

        await hyperliquidAPI.subscribeToTrades('BTC', mockCallback)

        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'subscribe',
            subscription: {
              type: 'trades',
              coin: 'BTC',
            },
          })
        )
      })
    })

    describe('subscribeToCandles', () => {
      it('subscribes to candle updates', async () => {
        const mockCallback = jest.fn()

        await hyperliquidAPI.subscribeToCandles('BTC', '1m', mockCallback)

        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'subscribe',
            subscription: {
              type: 'candle',
              coin: 'BTC',
              interval: '1m',
            },
          })
        )
      })
    })

    describe('WebSocket Message Handling', () => {
      it('processes order book messages', async () => {
        const mockCallback = jest.fn()
        await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)

        const mockMessage = {
          channel: 'l2Book',
          data: {
            coin: 'BTC',
            levels: [
              [{ px: '50000.00', sz: '1.5', n: 3 }],
              [{ px: '50001.00', sz: '1.2', n: 2 }],
            ],
            time: Date.now(),
          },
        }

        // Simulate WebSocket message
        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify(mockMessage),
        })

        // Get the message handler that was registered
        const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )
        const messageHandler = addEventListenerCall[1]

        messageHandler(messageEvent)

        expect(mockCallback).toHaveBeenCalledWith(mockMessage.data)
      })

      it('processes trade messages', async () => {
        const mockCallback = jest.fn()
        await hyperliquidAPI.subscribeToTrades('BTC', mockCallback)

        const mockMessage = {
          channel: 'trades',
          data: [
            {
              coin: 'BTC',
              side: 'B',
              px: '50000.00',
              sz: '1.5',
              time: Date.now(),
              hash: 'hash1',
            },
          ],
        }

        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify(mockMessage),
        })

        const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )
        const messageHandler = addEventListenerCall[1]

        messageHandler(messageEvent)

        expect(mockCallback).toHaveBeenCalledWith(mockMessage.data)
      })

      it('processes candle messages', async () => {
        const mockCallback = jest.fn()
        await hyperliquidAPI.subscribeToCandles('BTC', '1m', mockCallback)

        const mockMessage = {
          channel: 'candle',
          data: {
            s: 'BTC',
            t: Date.now(),
            o: '50000.00',
            h: '50100.00',
            l: '49900.00',
            c: '50050.00',
            v: '1000.00',
          },
        }

        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify(mockMessage),
        })

        const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )
        const messageHandler = addEventListenerCall[1]

        messageHandler(messageEvent)

        expect(mockCallback).toHaveBeenCalledWith(mockMessage.data)
      })

      it('ignores messages for different channels', async () => {
        const mockCallback = jest.fn()
        await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)

        const mockMessage = {
          channel: 'trades', // Different channel
          data: { coin: 'BTC', side: 'B', px: '50000.00', sz: '1.5', time: Date.now(), hash: 'hash1' },
        }

        const messageEvent = new MessageEvent('message', {
          data: JSON.stringify(mockMessage),
        })

        const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'message'
        )
        const messageHandler = addEventListenerCall[1]

        messageHandler(messageEvent)

        expect(mockCallback).not.toHaveBeenCalled()
      })
    })

    describe('Unsubscribe Methods', () => {
      it('unsubscribes from order book', async () => {
        await hyperliquidAPI.unsubscribeFromOrderBook('BTC')

        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'unsubscribe',
            subscription: {
              type: 'l2Book',
              coin: 'BTC',
            },
          })
        )
      })

      it('unsubscribes from trades', async () => {
        await hyperliquidAPI.unsubscribeFromTrades('BTC')

        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'unsubscribe',
            subscription: {
              type: 'trades',
              coin: 'BTC',
            },
          })
        )
      })

      it('unsubscribes from candles', async () => {
        await hyperliquidAPI.unsubscribeFromCandles('BTC', '1m')

        expect(mockWebSocket.send).toHaveBeenCalledWith(
          JSON.stringify({
            method: 'unsubscribe',
            subscription: {
              type: 'candle',
              coin: 'BTC',
              interval: '1m',
            },
          })
        )
      })
    })

    describe('WebSocket Connection Management', () => {
      it('handles WebSocket close events', async () => {
        const mockCallback = jest.fn()
        await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)

        // Simulate WebSocket close
        const closeEvent = new CloseEvent('close')
        const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'close'
        )
        const closeHandler = addEventListenerCall[1]

        closeHandler(closeEvent)

        // Should attempt to reconnect or handle gracefully
        expect(mockWebSocket.close).toHaveBeenCalled()
      })

      it('handles WebSocket error events', async () => {
        const mockCallback = jest.fn()
        await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)

        // Simulate WebSocket error
        const errorEvent = new Event('error')
        const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
          call => call[0] === 'error'
        )
        const errorHandler = addEventListenerCall[1]

        errorHandler(errorEvent)

        // Should handle error gracefully
        expect(mockWebSocket.close).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles malformed JSON responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      await expect(hyperliquidAPI.fetchMarkets()).rejects.toThrow('Invalid JSON')
    })

    it('handles network timeouts', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      )

      await expect(hyperliquidAPI.fetchMarkets()).rejects.toThrow('Timeout')
    })

    it('handles WebSocket message parsing errors', async () => {
      const mockCallback = jest.fn()
      await hyperliquidAPI.subscribeToOrderBook('BTC', mockCallback)

      const messageEvent = new MessageEvent('message', {
        data: 'invalid json',
      })

      const addEventListenerCall = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )
      const messageHandler = addEventListenerCall[1]

      // Should not throw error, just ignore malformed messages
      expect(() => messageHandler(messageEvent)).not.toThrow()
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })
})
