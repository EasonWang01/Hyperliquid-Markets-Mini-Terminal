'use client'

import { useEffect, useState, useMemo } from 'react';
import { Settings } from 'lucide-react';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';
import { OrderBookLevel } from '@/types/hyperliquid';

export default function OrderBook() {
  const [showSettings, setShowSettings] = useState(false);
  const [maxLevels, setMaxLevels] = useState(10);

  const {
    selectedMarket,
    orderBook,
    orderBookAggregation,
    setOrderBook,
    setOrderBookAggregation,
    setLoading,
    setError
  } = useTradingStore();

  // Load order book when market changes and poll for updates
  useEffect(() => {
    const loadOrderBook = async () => {
      if (!selectedMarket) return;

      setLoading(true);
      try {
        const bookData = await hyperliquidAPI.fetchOrderBook(selectedMarket.coin);
        setOrderBook(bookData);
      } catch (error) {
        console.error('Failed to load order book:', error);
        setError('Failed to load order book');
      } finally {
        setLoading(false);
      }
    };

    loadOrderBook();

    // Poll for updates every 10 seconds to avoid rate limiting
    const interval = setInterval(loadOrderBook, 10000);

    return () => clearInterval(interval);
  }, [selectedMarket, setOrderBook, setLoading, setError]);

  // Aggregate order book levels based on aggregation setting
  const aggregatedOrderBook = useMemo(() => {
    if (!orderBook || orderBookAggregation === 0) return orderBook;

    const aggregateLevels = (levels: OrderBookLevel[]): OrderBookLevel[] => {
      const aggregated = new Map<string, { px: string; sz: number; n: number }>();

      levels.forEach(level => {
        const price = parseFloat(level.px);
        const size = parseFloat(level.sz);
        
        // Round price to aggregation level
        const roundedPrice = Math.floor(price / orderBookAggregation) * orderBookAggregation;
        const priceKey = roundedPrice.toFixed(8);

        if (aggregated.has(priceKey)) {
          const existing = aggregated.get(priceKey)!;
          existing.sz += size;
          existing.n += level.n;
        } else {
          aggregated.set(priceKey, {
            px: priceKey,
            sz: size,
            n: level.n
          });
        }
      });

      return Array.from(aggregated.values())
        .map(item => ({
          px: item.px,
          sz: item.sz.toString(),
          n: item.n
        }))
        .sort((a, b) => parseFloat(b.px) - parseFloat(a.px));
    };

    return {
      ...orderBook,
      levels: [
        aggregateLevels(orderBook.levels[0]), // bids
        aggregateLevels(orderBook.levels[1])  // asks
      ]
    };
  }, [orderBook, orderBookAggregation]);

  const bids = aggregatedOrderBook?.levels[0]?.slice(0, maxLevels).sort((a, b) => parseFloat(b.px) - parseFloat(a.px)) || [];
  const asks = aggregatedOrderBook?.levels[1]?.slice(0, maxLevels).sort((a, b) => parseFloat(a.px) - parseFloat(b.px)) || [];
  
  // Debug: Check if we're getting different data for bids vs asks
  console.log('OrderBook Data Check:', {
    hasOrderBook: !!orderBook,
    levelsLength: orderBook?.levels?.length,
    level0Length: orderBook?.levels?.[0]?.length,
    level1Length: orderBook?.levels?.[1]?.length,
    bidsLength: bids.length,
    asksLength: asks.length,
    firstBid: bids[0],
    firstAsk: asks[0]
  });

  // Calculate totals for depth visualization
  const bidTotals = useMemo(() => {
    let total = 0;
    return bids.map(bid => {
      total += parseFloat(bid.sz);
      return total;
    });
  }, [bids]);

  const askTotals = useMemo(() => {
    let total = 0;
    return asks.map(ask => {
      total += parseFloat(ask.sz);
      return total;
    });
  }, [asks]);

  const maxTotal = Math.max(
    bidTotals[bidTotals.length - 1] || 0,
    askTotals[askTotals.length - 1] || 0
  );

  const aggregationOptions = [0, 0.01, 0.1, 1, 10, 100];

  return (
    <div className="order-book-container">
      {/* Header */}
      <div className="order-book-header">
        <div className="flex items-center justify-between">
          <h2 className="order-book-title">Order Book</h2>
          <div className="order-book-controls">
            {/* Aggregation Selector */}
            <select
              value={orderBookAggregation}
              onChange={(e) => setOrderBookAggregation(parseFloat(e.target.value))}
              className="order-book-select"
            >
              {aggregationOptions.map(option => (
                <option key={option} value={option}>
                  {option === 0 ? '0.001' : option.toString()}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="order-book-settings-btn"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="order-book-settings-panel">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Max Levels ({maxLevels})
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={maxLevels}
                  onChange={(e) => setMaxLevels(parseInt(e.target.value))}
                  className="order-book-slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Book Data */}
      <div className="order-book-content">
        {!selectedMarket ? (
          <div className="order-book-empty">
            <p>Select a market to view order book</p>
          </div>
        ) : !orderBook ? (
          <div className="order-book-loading">
            <div className="order-book-spinner"></div>
            <p>Loading order book...</p>
          </div>
        ) : (
          <div className="order-book-layout">
            {/* Bids (Left Side) - Green */}
            <div className="order-book-column">
              <div className="order-book-header-row">
                <span className="text-left">Total ({selectedMarket.coin})</span>
                <span className="text-right">Price</span>
              </div>
              <div className="order-book-rows">
                {bids.length > 0 ? bids.map((bid, index) => {
                  const total = bidTotals[index] || 0;
                  const depthPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                  const isBestBid = index === 0;
                  
                  return (
                    <BidRow
                      key={`bid-${bid.px}`}
                      price={bid.px}
                      size={bid.sz}
                      total={total}
                      depthPercent={depthPercent}
                      decimals={selectedMarket.szDecimals}
                      isBestBid={isBestBid}
                    />
                  );
                }) : (
                  <div className="order-book-empty">No bid data</div>
                )}
              </div>
            </div>

            {/* Asks (Right Side) - Red */}
            <div className="order-book-column">
              <div className="order-book-header-row">
                <span className="text-left">Price</span>
                <span className="text-right">Total ({selectedMarket.coin})</span>
              </div>
              <div className="order-book-rows">
                {asks.length > 0 ? asks.map((ask, index) => {
                  const total = askTotals[index] || 0;
                  const depthPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                  const isBestAsk = index === 0;
                  
                  return (
                    <AskRow
                      key={`ask-${ask.px}`}
                      price={ask.px}
                      size={ask.sz}
                      total={total}
                      depthPercent={depthPercent}
                      decimals={selectedMarket.szDecimals}
                      isBestAsk={isBestAsk}
                    />
                  );
                }) : (
                  <div className="order-book-empty">No ask data</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface BidRowProps {
  price: string;
  size: string;
  total: number;
  depthPercent: number;
  decimals: number;
  isBestBid?: boolean;
}

function BidRow({ price, size, total, depthPercent, decimals, isBestBid = false }: BidRowProps) {
  return (
    <div className={`bid-row ${isBestBid ? 'best-bid' : ''}`}>
      {/* Depth visualization - green bars extending left */}
      <div
        className="bid-depth-bar"
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Row content */}
      <div className="bid-row-content">
        <span className={`bid-text ${isBestBid ? 'best-bid' : ''}`}>
          {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`bid-price ${isBestBid ? 'best-bid' : ''}`}>
          {parseFloat(price).toFixed(3)}
        </span>
      </div>
    </div>
  );
}

interface AskRowProps {
  price: string;
  size: string;
  total: number;
  depthPercent: number;
  decimals: number;
  isBestAsk?: boolean;
}

function AskRow({ price, size, total, depthPercent, decimals, isBestAsk = false }: AskRowProps) {
  return (
    <div className={`ask-row ${isBestAsk ? 'best-ask' : ''}`}>
      {/* Depth visualization - red bars extending right */}
      <div
        className="ask-depth-bar"
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Row content */}
      <div className="ask-row-content">
        <span className={`ask-price ${isBestAsk ? 'best-ask' : ''}`}>
          {parseFloat(price).toFixed(3)}
        </span>
        <span className={`ask-text ${isBestAsk ? 'best-ask' : ''}`}>
          {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
