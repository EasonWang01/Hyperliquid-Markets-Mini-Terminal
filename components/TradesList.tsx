'use client'

import { useEffect, useState } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';
import { Trade } from '@/types/hyperliquid';

export default function TradesList() {
  const [maxTrades, setMaxTrades] = useState(30);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  const {
    selectedMarket,
    trades,
    addTrade,
    setLoading,
    setError
  } = useTradingStore();

  // Load trades when market changes and set up WebSocket subscription
  useEffect(() => {
    console.log('TradesList useEffect triggered for market:', selectedMarket?.coin);
    if (!selectedMarket) {
      console.log('TradesList: No selected market, skipping subscription');
      return;
    }

    const loadTrades = async () => {
      setLoading(true);
      try {
        const tradesData = await hyperliquidAPI.fetchTrades(selectedMarket.coin);
        // Add trades individually to avoid setTrades dependency
        tradesData.forEach(trade => addTrade(trade));
      } catch (error) {
        console.error('Failed to load trades:', error);
        setError('Failed to load trades');
      } finally {
        setLoading(false);
      }
    };

    // Load initial data
    loadTrades();

    // Set up WebSocket subscription for real-time updates
    const handleTradeUpdate = (data: any) => {
      console.log('Trade update received:', data);
      if (data && Array.isArray(data)) {
        // Add new trades to the list (most recent first)
        data.forEach(trade => {
          if (trade.coin === selectedMarket.coin) {
            addTrade(trade);
            setLastUpdateTime(Date.now());
            console.log('Added new trade:', trade);
          }
        });
      } else if (data && data.coin === selectedMarket.coin) {
        // Single trade update
        addTrade(data);
        setLastUpdateTime(Date.now());
        console.log('Added single trade:', data);
      }
    };

    // Subscribe to real-time trade updates
    const subscribeToTrades = async () => {
      try {
        await hyperliquidAPI.subscribeToTrades(selectedMarket.coin, handleTradeUpdate);
        console.log(`Subscribed to real-time trades for ${selectedMarket.coin}`);
      } catch (error) {
        console.error('Failed to subscribe to trades:', error);
        // Fallback to polling if WebSocket fails
        const interval = setInterval(loadTrades, 15000);
        return () => clearInterval(interval);
      }
    };

    // Add a small delay to ensure WebSocket connection is ready
    const subscriptionTimeout = setTimeout(() => {
      console.log('Starting trades subscription after delay...');
      subscribeToTrades();
    }, 200);

    return () => {
      clearTimeout(subscriptionTimeout);
      if (selectedMarket) {
        hyperliquidAPI.unsubscribeFromTrades(selectedMarket.coin);
      }
    };
  }, [selectedMarket, addTrade, setLoading, setError]);

  const displayTrades = trades.slice(0, maxTrades);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSize = (size: string, decimals: number) => {
    const num = parseFloat(size);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  return (
    <div className="trades-container">
      {/* Header */}
      <div className="trades-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="trades-title">Recent Trades</h2>
            <div className="trades-update-indicator">
              <div className="update-dot"></div>
              <span className="update-text">Live</span>
            </div>
          </div>
          <div className="trades-controls">
            <select
              value={maxTrades}
              onChange={(e) => setMaxTrades(parseInt(e.target.value))}
              className="trades-select"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trades Data */}
      <div className="trades-content">
        {!selectedMarket ? (
          <div className="trades-empty">
            <p>Select a market to view trades</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="trades-loading">
            <div className="trades-spinner"></div>
            <p>Loading trades...</p>
          </div>
        ) : (
          <div className="trades-table">
            {/* Header Row */}
            <div className="trades-header-row">
              <span className="text-left">Time</span>
              <span className="text-right">Price</span>
              <span className="text-right">Size ({selectedMarket.coin})</span>
              <span className="text-center">Side</span>
            </div>

            {/* Trades List */}
            <div className="trades-list">
              {displayTrades.map((trade, index) => (
                <TradeRow
                  key={`${trade.hash}-${index}`}
                  trade={trade}
                  decimals={selectedMarket.szDecimals}
                />
              ))}
            </div>

            {/* Load More */}
            {trades.length > maxTrades && (
              <div className="trades-load-more">
                <button
                  onClick={() => setMaxTrades(prev => prev + 20)}
                  className="trades-load-more-btn"
                >
                  Load more trades
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TradeRowProps {
  trade: Trade;
  decimals: number;
}

function TradeRow({ trade, decimals }: TradeRowProps) {
  const isBuy = trade.side === 'B';

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatSize = (size: string, decimals: number) => {
    const num = parseFloat(size);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  return (
    <div className={`trade-row ${isBuy ? 'buy' : 'sell'}`}>
      {/* Time */}
      <div className="trade-time">
        <Clock className="trade-time-icon" />
        <span>
          {formatTime(trade.time)}
        </span>
      </div>

      {/* Price */}
      <div className={`trade-price ${isBuy ? 'buy' : 'sell'}`}>
        {parseFloat(trade.px).toFixed(3)}
      </div>

      {/* Size */}
      <div className="trade-size">
        {formatSize(trade.sz, decimals)}
      </div>

      {/* Side */}
      <div className={`trade-side ${isBuy ? 'buy' : 'sell'}`}>
        {isBuy ? (
          <TrendingUp className="trade-side-icon" />
        ) : (
          <TrendingDown className="trade-side-icon" />
        )}
        <span className="trade-side-text">
          {isBuy ? 'BUY' : 'SELL'}
        </span>
      </div>
    </div>
  );
}

// Real-time trade animation component
export function TradeFlash({ trade }: { trade: Trade }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const isBuy = trade.side === 'B';

  return (
    <div className={`trade-flash ${isBuy ? 'buy' : 'sell'}`}>
      <div className="text-sm font-semibold">
        {isBuy ? 'BUY' : 'SELL'} {trade.coin}
      </div>
      <div className="text-xs">
        {parseFloat(trade.sz).toFixed(2)} @ ${parseFloat(trade.px).toFixed(4)}
      </div>
    </div>
  );
}
