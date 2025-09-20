'use client'

import { useEffect, useState } from 'react';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';
import { Trade } from '@/types/hyperliquid';

export default function TradesList() {
  const [maxTrades, setMaxTrades] = useState(30);

  const {
    selectedMarket,
    trades,
    addTrade,
    setLoading,
    setError
  } = useTradingStore();

  // Load trades when market changes and poll for updates
  useEffect(() => {
    const loadTrades = async () => {
      if (!selectedMarket) return;

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

    loadTrades();

    // Poll for updates every 15 seconds to avoid rate limiting
    const interval = setInterval(loadTrades, 15000);

    return () => clearInterval(interval);
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
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
          <div className="flex items-center gap-2">
            <select
              value={maxTrades}
              onChange={(e) => setMaxTrades(parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
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
      <div className="p-4">
        {!selectedMarket ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Select a market to view trades</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading trades...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Header Row */}
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 font-medium pb-2 border-b border-gray-700">
              <span className="text-left">Time</span>
              <span className="text-right">Price</span>
              <span className="text-right">Size</span>
              <span className="text-center">Side</span>
            </div>

            {/* Trades List */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
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
              <div className="text-center pt-2">
                <button
                  onClick={() => setMaxTrades(prev => prev + 20)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
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
  const sideColor = isBuy ? 'text-green-400' : 'text-red-400';
  const bgColor = isBuy ? 'bg-green-900/10' : 'bg-red-900/10';

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
    <div className={`grid grid-cols-4 gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-700/50 transition-colors ${bgColor}`}>
      {/* Time */}
      <div className="flex items-center gap-1 text-gray-300">
        <Clock className="w-3 h-3" />
        <span className="font-mono text-xs">
          {formatTime(trade.time)}
        </span>
      </div>

      {/* Price */}
      <div className={`text-right font-mono ${sideColor}`}>
        {parseFloat(trade.px).toFixed(4)}
      </div>

      {/* Size */}
      <div className="text-right font-mono text-white">
        {formatSize(trade.sz, decimals)}
      </div>

      {/* Side */}
      <div className="flex items-center justify-center">
        <div className={`flex items-center gap-1 ${sideColor}`}>
          {isBuy ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span className="text-xs font-semibold">
            {isBuy ? 'BUY' : 'SELL'}
          </span>
        </div>
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
  const bgColor = isBuy ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-3 py-2 rounded-lg shadow-lg animate-pulse z-50`}>
      <div className="text-sm font-semibold">
        {isBuy ? 'BUY' : 'SELL'} {trade.coin}
      </div>
      <div className="text-xs">
        {parseFloat(trade.sz).toFixed(2)} @ ${parseFloat(trade.px).toFixed(4)}
      </div>
    </div>
  );
}
