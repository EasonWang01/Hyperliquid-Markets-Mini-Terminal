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
    <div className="market-selector-container">
      {/* Header */}
      <div className="market-selector-header">
        <h2 className="market-selector-title">Select Market</h2>
        
        {/* Search */}
        <div className="market-search-container">
          <Search className="market-search-icon" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="market-search-input"
          />
        </div>
      </div>

      {/* Markets List */}
      <div className="market-list">
        {filteredMarkets.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-gray-400">
              {searchTerm ? 'No markets found' : 'No markets available'}
            </p>
          </div>
        ) : (
          <div>
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
  return (
    <button
      onClick={onSelect}
      className={`market-item ${isSelected ? 'selected' : ''}`}
    >
      <div className="market-item-content">
        <div className="market-item-info">
          <div className="market-item-header">
            <h3 className="market-symbol">{market.coin}</h3>
            {market.onlyIsolated && (
              <span className="market-badge">
                ISO
              </span>
            )}
          </div>
          <p className="market-name">{market.name}</p>
          <p className="market-leverage">
            Max Leverage: {market.maxLeverage}x
          </p>
        </div>
        
        <div className="market-select-hint">
          Click to select
        </div>
      </div>
    </button>
  );
}
