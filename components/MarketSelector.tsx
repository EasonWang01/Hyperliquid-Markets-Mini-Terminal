'use client'

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useTradingStore } from '@/store/trading-store';
import { Market } from '@/types/hyperliquid';

interface MarketSelectorProps {
  onClose?: () => void;
}

export default function MarketSelector({ onClose }: MarketSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { 
    markets, 
    selectedMarket, 
    setSelectedMarket
  } = useTradingStore();

  // Filter markets based on search term
  const filteredMarkets = useMemo(() => {
    if (!searchTerm) return markets;
    
    const term = searchTerm.toLowerCase();
    return markets.filter(market => 
      market.name.toLowerCase().includes(term) ||
      market.coin.toLowerCase().includes(term)
    );
  }, [markets, searchTerm]);

  // Markets are now loaded in the main page, no need to load here

  const handleMarketSelect = (market: Market) => {
    setSelectedMarket(market);
    if (onClose) onClose();
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">Select Market</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Markets List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredMarkets.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-400">
              {searchTerm ? 'No markets found' : 'No markets available'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredMarkets.map((market) => (
              <MarketItem
                key={market.coin}
                market={market}
                isSelected={selectedMarket?.coin === market.coin}
                onSelect={() => handleMarketSelect(market)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface MarketItemProps {
  market: Market;
  isSelected: boolean;
  onSelect: () => void;
}

function MarketItem({ market, isSelected, onSelect }: MarketItemProps) {
  // Simple display without individual price fetching to avoid rate limiting

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 text-left hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-gray-700 border-r-2 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{market.coin}</h3>
            {market.onlyIsolated && (
              <span className="text-xs bg-orange-600 text-white px-1.5 py-0.5 rounded">
                ISO
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">{market.name}</p>
          <p className="text-xs text-gray-500">
            Max Leverage: {market.maxLeverage}x
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-400">
            Click to select
          </p>
        </div>
      </div>
    </button>
  );
}
