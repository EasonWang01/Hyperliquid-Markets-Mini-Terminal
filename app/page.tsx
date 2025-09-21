'use client'

import { useState, useEffect, useMemo, memo, lazy, Suspense } from 'react';
import { Menu, User, Search, Star } from 'lucide-react';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';

const PriceChart = lazy(() => import('@/components/PriceChart'));
const OrderBook = lazy(() => import('@/components/OrderBook'));
const TradesList = lazy(() => import('@/components/TradesList'));
const AccountLookup = lazy(() => import('@/components/AccountLookup'));

export default function Home() {
  const [showAccountLookup, setShowAccountLookup] = useState(false);
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

  useEffect(() => {
    const loadMarkets = async () => {
      if (markets.length > 0) return; // Already loaded

      setLoading(true);
      try {
        const fetchedMarkets = await hyperliquidAPI.fetchMarkets();
        setMarkets(fetchedMarkets);

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

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const filteredMarkets = useMemo(() => {
    if (!searchTerm.trim()) return markets.slice(0, 10); // Show first 10 by default

    const term = searchTerm.toLowerCase();
    return markets.filter(market =>
      market.coin.toLowerCase().includes(term) ||
      market.name.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [markets, searchTerm]);

  const handleSearchChange = useMemo(() => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSearchResults(value.trim().length > 0);
  }, []);

  const handleMarketSelect = useMemo(() => (market: any) => {
    setSelectedMarket(market);
    setSearchTerm('');
    setShowSearchResults(false);
  }, [setSelectedMarket]);

  const toggleFavorite = useMemo(() => (coin: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(coin)) {
        newFavorites.delete(coin);
      } else {
        newFavorites.add(coin);
      }
      return newFavorites;
    });
  }, []);

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
      <header className="trading-header">
        <div className="market-select-section">
          <div className="market-select-wrapper">
            <div className="market-select-button">
              <div className="market-select-content">
                <div className="market-info">
                  <div className="market-symbol">
                    {selectedMarket ? `${selectedMarket.coin} x${selectedMarket.maxLeverage}` : 'Select Market'}
                  </div>
                </div>
                <div className="dropdown-arrow">▼</div>
              </div>
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
          </div>

          <div className="market-search-wrapper">
            <div>
              <input
                type="text"
                placeholder="Search markets..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(searchTerm.trim().length > 0)}
              />
            </div>

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
                    <div className="flex items-center space-x-3 gap-2">
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

      {error && (
        <div className="bg-red-600 text-white p-3 text-center">
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="container mx-auto p-4 max-w-7xl">
        <div className="grid grid-cols-12 gap-4">
          <Suspense fallback={<div className="col-span-12 lg:col-span-8 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center" style={{ height: 400 }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
            <PriceChart height={400} />
          </Suspense>

          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Suspense fallback={<div className="bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center" style={{ height: 200 }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
              <OrderBook />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center" style={{ height: 200 }}><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}>
              <TradesList />
            </Suspense>
          </div>
        </div>

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

      <Suspense fallback={null}>
        <AccountLookup
          isOpen={showAccountLookup}
          onClose={() => setShowAccountLookup(false)}
        />
      </Suspense>
    </main>
  );
}
