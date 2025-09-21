import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Market, OrderBook, Trade, Candle, UserState } from '@/types/hyperliquid';

interface TradingState {
  // Markets
  markets: Market[];
  selectedMarket: Market | null;
  
  // Market data
  orderBook: OrderBook | null;
  trades: Trade[];
  candles: Candle[];
  
  // Chart data
  chartData: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  
  // User data
  userState: UserState | null;
  walletAddress: string | null;
  
  
  // UI state
  orderBookAggregation: number;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setMarkets: (markets: Market[]) => void;
  setSelectedMarket: (market: Market) => void;
  setOrderBook: (orderBook: OrderBook) => void;
  addTrade: (trade: Trade) => void;
  setTrades: (trades: Trade[]) => void;
  addCandle: (candle: Candle) => void;
  setCandles: (candles: Candle[]) => void;
  updateChartData: (candles: Candle[]) => void;
  setUserState: (userState: UserState) => void;
  setWalletAddress: (address: string | null) => void;
  setOrderBookAggregation: (aggregation: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useTradingStore = create<TradingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      markets: [],
      selectedMarket: null,
      orderBook: null,
      trades: [],
      candles: [],
      chartData: [],
      userState: null,
      walletAddress: null,
      orderBookAggregation: 0.1,
      isLoading: false,
      error: null,
      
      // Actions
      setMarkets: (markets) => set({ markets }),
      
      setSelectedMarket: (market) => set({ 
        selectedMarket: market,
        orderBook: null,
        trades: [],
        candles: [],
        chartData: []
      }),
      
      setOrderBook: (orderBook) => set({ orderBook }),
      
      addTrade: (trade) => set((state) => ({
        trades: [trade, ...state.trades.slice(0, 99)] // Keep last 100 trades
      })),
      
      setTrades: (trades) => set({ trades }),
      
      addCandle: (candle) => set((state) => {
        const existingIndex = state.candles.findIndex(c => c.t === candle.t);
        if (existingIndex !== -1) {
          // Update existing candle
          const newCandles = [...state.candles];
          newCandles[existingIndex] = candle;
          return { candles: newCandles };
        } else {
          // Add new candle
          return { candles: [...state.candles, candle].sort((a, b) => a.t - b.t) };
        }
      }),
      
      setCandles: (candles) => set({ candles }),
      
      updateChartData: (candles) => {
        
        const transformedData = candles.map(candle => ({
          time: Math.floor(candle.t / 1000) as any, // Convert ms to seconds for UTCTimestamp
          open: parseFloat(candle.o),
          high: parseFloat(candle.h),
          low: parseFloat(candle.l),
          close: parseFloat(candle.c),
          volume: parseFloat(candle.v)
        }));
        
        set({ chartData: transformedData });
      },
      
      setUserState: (userState) => set({ userState }),
      
      setWalletAddress: (address) => set({ walletAddress: address }),
      
      setOrderBookAggregation: (aggregation) => set({ orderBookAggregation: aggregation }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'trading-store'
    }
  )
);
