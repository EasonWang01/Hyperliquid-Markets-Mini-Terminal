import { Market, OrderBook, Trade, Candle, UserState } from '@/types/hyperliquid';

class HyperliquidAPI {
  private baseUrl = 'https://api.hyperliquid.xyz';

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
        })
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
    console.log('Testing candle API with correct format...');
    
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
      console.log('Test API status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Test API response:', data);
        return data;
      } else {
        const errorText = await response.text();
        console.log('Test API error response:', errorText);
      }
    } catch (error) {
      console.log('Test API failed:', error);
    }
    
    return null;
  }

  async fetchCandles(coin: string, interval: string = '1m', startTime?: number, endTime?: number): Promise<Candle[]> {
    try {
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
      
      console.log('Fetching candles with request:', requestBody);
      
      const response = await fetch(`${this.baseUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
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

}

export const hyperliquidAPI = new HyperliquidAPI();
