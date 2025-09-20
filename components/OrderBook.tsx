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

  const bids = aggregatedOrderBook?.levels[0]?.slice(0, maxLevels) || [];
  const asks = aggregatedOrderBook?.levels[1]?.slice(0, maxLevels) || [];

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
    }).reverse();
  }, [asks]);

  const maxTotal = Math.max(
    bidTotals[bidTotals.length - 1] || 0,
    askTotals[0] || 0
  );

  const aggregationOptions = [0, 0.01, 0.1, 1, 10, 100];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Order Book</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 p-3 bg-gray-700 rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Price Aggregation
                </label>
                <select
                  value={orderBookAggregation}
                  onChange={(e) => setOrderBookAggregation(parseFloat(e.target.value))}
                  className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm"
                >
                  {aggregationOptions.map(option => (
                    <option key={option} value={option}>
                      {option === 0 ? 'No aggregation' : option.toString()}
                    </option>
                  ))}
                </select>
              </div>
              
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
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Book Data */}
      <div className="p-4">
        {!selectedMarket ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Select a market to view order book</p>
          </div>
        ) : !orderBook ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading order book...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Row */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium">
              <span className="text-right">Size</span>
              <span className="text-center">Price</span>
              <span className="text-left">Total</span>
            </div>

            {/* Asks (Sells) */}
            <div className="space-y-1">
              {asks.reverse().map((ask, index) => {
                const askIndex = asks.length - 1 - index;
                const total = askTotals[askIndex] || 0;
                const depthPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                
                return (
                  <OrderBookRow
                    key={`ask-${ask.px}`}
                    price={ask.px}
                    size={ask.sz}
                    total={total}
                    depthPercent={depthPercent}
                    side="ask"
                    decimals={selectedMarket.szDecimals}
                  />
                );
              })}
            </div>

            {/* Spread */}
            {bids.length > 0 && asks.length > 0 && (
              <div className="py-2 border-t border-b border-gray-700">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Spread</div>
                  <div className="text-lg font-semibold text-white">
                    {(parseFloat(asks[0]?.px || '0') - parseFloat(bids[0]?.px || '0')).toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* Bids (Buys) */}
            <div className="space-y-1">
              {bids.map((bid, index) => {
                const total = bidTotals[index] || 0;
                const depthPercent = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                
                return (
                  <OrderBookRow
                    key={`bid-${bid.px}`}
                    price={bid.px}
                    size={bid.sz}
                    total={total}
                    depthPercent={depthPercent}
                    side="bid"
                    decimals={selectedMarket.szDecimals}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderBookRowProps {
  price: string;
  size: string;
  total: number;
  depthPercent: number;
  side: 'bid' | 'ask';
  decimals: number;
}

function OrderBookRow({ price, size, total, depthPercent, side, decimals }: OrderBookRowProps) {
  const sideColor = side === 'bid' ? 'text-green-400' : 'text-red-400';
  const bgColor = side === 'bid' ? 'bg-green-900/20' : 'bg-red-900/20';

  return (
    <div className="relative group cursor-pointer hover:bg-gray-700/50 rounded">
      {/* Depth visualization */}
      <div
        className={`absolute inset-y-0 right-0 ${bgColor} rounded`}
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Row content */}
      <div className="relative grid grid-cols-3 gap-2 px-2 py-1 text-sm">
        <span className="text-right text-white font-mono">
          {parseFloat(size).toFixed(decimals)}
        </span>
        <span className={`text-center font-mono ${sideColor}`}>
          {parseFloat(price).toFixed(4)}
        </span>
        <span className="text-left text-gray-300 font-mono">
          {total.toFixed(decimals)}
        </span>
      </div>
    </div>
  );
}
