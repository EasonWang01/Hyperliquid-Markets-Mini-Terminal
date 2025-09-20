// Hyperliquid API Types
export interface Asset {
  name: string;
  szDecimals: number;
  onlyIsolated?: boolean;
  maxLeverage?: number;
}

export interface Market {
  coin: string;
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated: boolean;
}

export interface OrderBookLevel {
  px: string; // price
  sz: string; // size
  n: number;  // number of orders
}

export interface OrderBook {
  coin: string;
  levels: [OrderBookLevel[], OrderBookLevel[]]; // [bids, asks]
  time: number;
}

export interface Trade {
  coin: string;
  side: 'A' | 'B'; // A = ask (sell), B = bid (buy)
  px: string;
  sz: string;
  time: number;
  hash: string;
}

export interface Candle {
  T: number; // timestamp
  c: string; // close
  h: string; // high
  l: string; // low
  n: number; // number of trades
  o: string; // open
  s: string; // coin
  t: number; // start time
  v: string; // volume
}

export interface UserState {
  assetPositions: Array<{
    position: {
      coin: string;
      entryPx?: string;
      leverage?: {
        type: string;
        value: number;
      };
      liquidationPx?: string;
      marginUsed: string;
      maxLeverage: number;
      positionValue: string;
      returnOnEquity: string;
      szi: string;
      unrealizedPnl: string;
    };
    type: string;
  }>;
  crossMaintenanceMarginUsed: string;
  crossMarginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  marginSummary: {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
  };
  time: number;
  withdrawable: string;
}

export interface WebSocketMessage {
  channel: string;
  data: any;
}

export interface SubscriptionRequest {
  method: 'subscribe';
  subscription: {
    type: 'l2Book' | 'trades' | 'candle' | 'activeAssetData' | 'userEvents';
    coin?: string;
    user?: string;
    interval?: string;
  };
}
