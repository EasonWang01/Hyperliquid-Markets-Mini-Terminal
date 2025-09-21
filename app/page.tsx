'use client'

import { useState, useEffect } from 'react';
import { Menu, User } from 'lucide-react';
import MarketSelector from '@/components/MarketSelector';
import PriceChart from '@/components/PriceChart';
import OrderBook from '@/components/OrderBook';
import TradesList from '@/components/TradesList';
import AccountLookup from '@/components/AccountLookup';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';

export default function Home() {
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [showAccountLookup, setShowAccountLookup] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'trades'>('chart');

  const { 
    selectedMarket, 
    markets, 
    error, 
    clearError, 
    setMarkets, 
    setSelectedMarket, 
    setLoading, 
    setError 
  } = useTradingStore();

  // Load markets once on app start
  useEffect(() => {
    const loadMarkets = async () => {
      if (markets.length > 0) return; // Already loaded
      
      setLoading(true);
      try {
        const fetchedMarkets = await hyperliquidAPI.fetchMarkets();
        setMarkets(fetchedMarkets);
        
        // Auto-select first market if none selected
        if (!selectedMarket && fetchedMarkets.length > 0) {
          setSelectedMarket(fetchedMarkets[0]);
        }
      } catch (error) {
        console.error('Failed to load markets:', error);
        setError('Failed to load markets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, [markets.length, selectedMarket, setMarkets, setSelectedMarket, setLoading, setError]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return (
    <main className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="trading-header">
        {/* Market Select Control */}
        <div className="market-select-section">
          <div className="market-select-wrapper">
            <select
              aria-label="Select market"
              value={selectedMarket?.coin ?? ''}
              onChange={(e) => {
                const next = markets.find((m) => m.coin === e.target.value);
                if (next) setSelectedMarket(next);
              }}
              className="market-select-dropdown"
            >
              <option value="" disabled>
                {markets.length > 0 ? 'Select a market…' : 'Loading markets…'}
              </option>
              {markets.map((m) => (
                <option key={m.coin} value={m.coin} className="market-select-option">
                  {m.coin}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-600 text-white p-3 text-center">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-7xl">
        {/*
          Unified Layout:
          - Mobile: Tabs control visibility of OrderBook and TradesList. Chart is always present but hidden by the tab content.
          - Desktop: Grid layout places Chart, OrderBook, and TradesList side-by-side.
        */}
        <div className="grid grid-cols-12 gap-4">
          {/* Main Content Area (Chart) */}
          <div className={`col-span-12 lg:col-span-8 space-y-4 ${activeTab !== 'chart' && 'hidden lg:block'}`}>
            <PriceChart height={400} />
          </div>

          {/* Sidebar Content Area (OrderBook & Trades) */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Content - Always mount components but hide with CSS */}
            <div className={`${activeTab !== 'orderbook' && 'hidden'} lg:block`}>
              <OrderBook />
            </div>
            <div className={`${activeTab !== 'trades' && 'hidden'} lg:block`}>
              <TradesList />
            </div>
          </div>
        </div>


        {/* PWA Install Prompt */}
        <div className="mt-8 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-center">
          <h3 className="text-white font-semibold mb-2">
            Install Hyperliquid Terminal
          </h3>
          <p className="text-blue-100 text-sm mb-3">
            Get the full app experience with offline support and native performance.
          </p>
          <div className="text-xs text-blue-200">
            <p>📱 <strong>iOS:</strong> Safari → Share → "Add to Home Screen"</p>
            <p>🤖 <strong>Android:</strong> Chrome → Menu → "Add to Home Screen"</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showMarketSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <MarketSelector onClose={() => setShowMarketSelector(false)} />
          </div>
        </div>
      )}

      <AccountLookup
        isOpen={showAccountLookup}
        onClose={() => setShowAccountLookup(false)}
      />
    </main>
  );
}
