import { Market, OrderBook, Trade, Candle, UserState, WebSocketMessage, SubscriptionRequest } from '@/types/hyperliquid';

class HyperliquidAPI {
  private baseUrl = 'https://api.hyperliquid.xyz';
  private wsUrl = 'wss://api.hyperliquid.xyz/ws';
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, (data: any) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // REST API methods
  async fetchMarkets(): Promise<Market[]> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        }),
        // Add performance optimizations
        cache: 'force-cache',
        keepalive: true
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform universe data to Market format
      if (data.universe) {
        return data.universe.map((asset: any, index: number) => ({
          coin: asset.name,
          name: asset.name,
          szDecimals: asset.szDecimals || 0,
          maxLeverage: asset.maxLeverage || 1,
          onlyIsolated: asset.onlyIsolated || false
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  async fetchOrderBook(coin: string): Promise<OrderBook> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'l2Book',
          coin: coin
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        coin,
        levels: data.levels || [[], []],
        time: Date.now()
      };
    } catch (error) {
      console.error('Error fetching order book:', error);
      throw error;
    }
  }

  async fetchTrades(coin: string): Promise<Trade[]> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'recentTrades',
          coin: coin
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      throw error;
    }
  }

  // Test method to try different API approaches
  async testCandleAPI(coin: string): Promise<any> {
    
    // Use the exact format from the API docs
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // Last 24 hours in milliseconds
    
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'candleSnapshot',
          req: {
            coin: coin,
            interval: '1h',
            startTime: startTime,
            endTime: endTime
          }
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
    }
    
    return null;
  }

  async fetchCandles(coin: string, interval: string = '1m', startTime?: number, endTime?: number): Promise<Candle[]> {
    try {
      // Validate interval format
      const supportedIntervals = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"];
      if (!supportedIntervals.includes(interval)) {
        console.error(`Unsupported interval: ${interval}. Supported intervals: ${supportedIntervals.join(", ")}`);
        throw new Error(`Unsupported interval: ${interval}`);
      }
      
      // Use the correct Hyperliquid API format
      const requestBody = {
        type: 'candleSnapshot',
        req: {
          coin,
          interval,
          startTime,
          endTime
        }
      };
      
      
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching candles:', error);
      throw error;
    }
  }

  async fetchUserState(address: string): Promise<UserState> {
    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: address
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user state:', error);
      throw error;
    }
  }

  // WebSocket methods
  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        this.ws.onclose = (event) => {
          this.ws = null;
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleWebSocketMessage(message: WebSocketMessage) {
    
    if (message.channel === 'subscriptionResponse') {
      return;
    }
    
    // Handle different message types
    if (message.channel === 'l2Book') {
      this.handleOrderBookUpdate(message.data);
    } else if (message.channel === 'trades') {
      this.handleTradeUpdate(message.data);
    } else if (message.channel === 'candle') {
      this.handleCandleUpdate(message.data);
    }
  }

  private handleOrderBookUpdate(data: any) {
    
    // Map the WebSocket data to our expected format
    const mappedData = {
      coin: data.coin,
      levels: data.levels, // [bids, asks] - already in correct format
      time: data.time
    };
    
    const callback = this.subscriptions.get(`l2Book:${data.coin}`);
    if (callback) {
      callback(mappedData);
    }
  }

  private handleTradeUpdate(data: any) {
    
    // Map the WebSocket data to our expected format
    const mappedData = data.map((trade: any) => ({
      coin: trade.coin,
      side: trade.side, // 'A' = ask (sell), 'B' = bid (buy)
      px: trade.px,
      sz: trade.sz,
      time: trade.time,
      hash: trade.hash,
      tid: trade.tid,
      users: trade.users
    }));
    
    const callback = this.subscriptions.get(`trades:${data[0]?.coin}`);
    if (callback) {
      callback(mappedData);
    }
  }

  private handleCandleUpdate(data: any) {
    
    // Map the WebSocket data to our expected format
    const mappedData = {
      T: data.T, // timestamp
      c: data.c, // close
      h: data.h, // high
      l: data.l, // low
      o: data.o, // open
      s: data.s, // coin
      t: data.t, // start time
      v: data.v, // volume
      n: data.n  // number of trades
    };
    
    const callback = this.subscriptions.get(`candle:${data.s}:${data.interval || '1m'}`);
    if (callback) {
      callback(mappedData);
    }
  }

  private async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    
    setTimeout(async () => {
      try {
        await this.connectWebSocket();
        this.resubscribeAll();
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private resubscribeAll() {
    this.subscriptions.forEach((callback, key) => {
      const [type, coin] = key.split(':');
      if (type === 'candle') {
        const [_, interval] = key.split(':');
        this.subscribeToCandles(coin, interval, callback);
      } else if (type === 'trades') {
        this.subscribeToTrades(coin, callback);
      } else if (type === 'l2Book') {
        this.subscribeToOrderBook(coin, callback);
      }
    });
  }

  private async ensureWebSocketConnection(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connectWebSocket();
      // Add a small delay to ensure connection is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private sendSubscription(request: SubscriptionRequest) {
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(request);
      this.ws.send(message);
    } else {
      console.error('WebSocket not connected - readyState:', this.ws?.readyState);
      // Retry after a short delay if WebSocket is not ready
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const message = JSON.stringify(request);
          this.ws.send(message);
        } else {
          console.error('WebSocket still not ready after retry');
        }
      }, 500);
    }
  }

  // Public WebSocket subscription methods
  async subscribeToCandles(coin: string, interval: string, callback: (data: any) => void) {
    await this.ensureWebSocketConnection();
    
    // Validate interval format
    const supportedIntervals = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "8h", "12h", "1d", "3d", "1w", "1M"];
    if (!supportedIntervals.includes(interval)) {
      console.error(`Unsupported interval: ${interval}. Supported intervals: ${supportedIntervals.join(", ")}`);
      return;
    }
    
    const subscriptionKey = `candle:${coin}:${interval}`;
    this.subscriptions.set(subscriptionKey, callback);
    
    const request: SubscriptionRequest = {
      method: 'subscribe',
      subscription: {
        type: 'candle',
        coin: coin,
        interval: interval
      }
    };
    
    this.sendSubscription(request);
  }

  async subscribeToTrades(coin: string, callback: (data: any) => void) {
    await this.ensureWebSocketConnection();
    
    const subscriptionKey = `trades:${coin}`;
    this.subscriptions.set(subscriptionKey, callback);
    
    const request: SubscriptionRequest = {
      method: 'subscribe',
      subscription: {
        type: 'trades',
        coin: coin
      }
    };
    
    this.sendSubscription(request);
  }

  async subscribeToOrderBook(coin: string, callback: (data: any) => void) {
    await this.ensureWebSocketConnection();
    
    const subscriptionKey = `l2Book:${coin}`;
    this.subscriptions.set(subscriptionKey, callback);
    
    const request: SubscriptionRequest = {
      method: 'subscribe',
      subscription: {
        type: 'l2Book',
        coin: coin
      }
    };
    
    this.sendSubscription(request);
  }

  unsubscribeFromCandles(coin: string, interval: string) {
    const subscriptionKey = `candle:${coin}:${interval}`;
    this.subscriptions.delete(subscriptionKey);
  }

  unsubscribeFromTrades(coin: string) {
    const subscriptionKey = `trades:${coin}`;
    this.subscriptions.delete(subscriptionKey);
  }

  unsubscribeFromOrderBook(coin: string) {
    const subscriptionKey = `l2Book:${coin}`;
    this.subscriptions.delete(subscriptionKey);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

}

export const hyperliquidAPI = new HyperliquidAPI();
