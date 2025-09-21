'use client'

import { useState, useEffect, useMemo } from 'react';
import { Menu, User, Search, Star } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  // Filter markets based on search term
  const filteredMarkets = useMemo(() => {
    if (!searchTerm.trim()) return markets.slice(0, 10); // Show first 10 by default
    
    const term = searchTerm.toLowerCase();
    return markets.filter(market => 
      market.coin.toLowerCase().includes(term) ||
      market.name.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [markets, searchTerm]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchResults(value.trim().length > 0);
  };

  // Handle market selection from search results
  const handleMarketSelect = (market: any) => {
    setSelectedMarket(market);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Toggle favorite
  const toggleFavorite = (coin: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(coin)) {
        newFavorites.delete(coin);
      } else {
        newFavorites.add(coin);
      }
      return newFavorites;
    });
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.market-search-wrapper')) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearchResults]);

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
                  {m.coin} x{m.maxLeverage}
                </option>
              ))}
            </select>
          </div>
          
          {/* Searchable Market List */}
          <div className="market-search-wrapper">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(searchTerm.trim().length > 0)}
                className="market-search-input"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="market-search-results">
                <div className="search-results-header">
                  <span className="text-xs text-gray-400">
                    {filteredMarkets.length} markets
                  </span>
                </div>
                {filteredMarkets.map((market) => (
                  <button
                    key={market.coin}
                    onClick={() => handleMarketSelect(market)}
                    className="market-search-item"
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(market.coin);
                        }}
                        className={`favorite-btn ${favorites.has(market.coin) ? 'favorited' : ''}`}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                      <div className="flex-1">
                        <div className="market-symbol">{market.coin}</div>
                        <div className="market-name">{market.name}</div>
                      </div>
                      <div className="leverage-badge">
                        {market.maxLeverage}x
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
