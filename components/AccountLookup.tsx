'use client'

import { useState, useRef, useEffect } from 'react';
import { Camera, Wallet, Search, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import QrScanner from 'qr-scanner';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';

interface AccountLookupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountLookup({ isOpen, onClose }: AccountLookupProps) {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  const {
    userState,
    walletAddress,
    setUserState,
    setWalletAddress,
    setError
  } = useTradingStore();

  // Initialize QR scanner
  useEffect(() => {
    if (showScanner && videoRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setAddress(result.data);
          setShowScanner(false);
        },
        {
          onDecodeError: (error) => {
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      scannerRef.current.start().catch((error) => {
        console.error('Failed to start QR scanner:', error);
        setError('Failed to access camera for QR scanning');
        setShowScanner(false);
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [showScanner, setError]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsLoading(true);
    try {
      const userData = await hyperliquidAPI.fetchUserState(address.trim());
      setUserState(userData);
      setWalletAddress(address.trim());
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to fetch account data. Please check the address.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPercent = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Account Lookup</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Address Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <form onSubmit={handleAddressSubmit} className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter wallet address (0x...)"
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 transition-colors"
                  title="Scan QR Code"
                >
                  <Camera className="w-4 h-4 text-gray-300" />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={!address.trim() || isLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
                {isLoading ? 'Loading...' : 'Lookup Account'}
              </button>
            </form>
          </div>

          {/* QR Scanner */}
          {showScanner && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">QR Code Scanner</h3>
                <button
                  onClick={() => setShowScanner(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Point your camera at a QR code containing a wallet address
              </p>
            </div>
          )}

          {/* Account Data */}
          {userState && walletAddress && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Account Overview</h3>
                <span className="text-xs text-gray-400 font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>

              {/* Account Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">Account Value</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(userState.marginSummary.accountValue)}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Total Position</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(userState.marginSummary.totalNtlPos)}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-300">Margin Used</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(userState.marginSummary.totalMarginUsed)}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-300">Withdrawable</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(userState.withdrawable)}
                  </p>
                </div>
              </div>

              {/* Positions */}
              {userState.assetPositions && userState.assetPositions.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-white mb-3">Open Positions</h4>
                  <div className="space-y-2">
                    {userState.assetPositions.map((assetPos, index) => {
                      const position = assetPos.position;
                      const unrealizedPnl = parseFloat(position.unrealizedPnl);
                      const roe = parseFloat(position.returnOnEquity);
                      
                      return (
                        <div key={index} className="bg-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-white">{position.coin}</h5>
                            <div className="flex items-center gap-2">
                              {position.leverage && (
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                  {position.leverage.value}x
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Size:</span>
                              <span className="text-white ml-1">{position.szi}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Entry:</span>
                              <span className="text-white ml-1">
                                {position.entryPx ? `$${parseFloat(position.entryPx).toFixed(4)}` : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">PnL:</span>
                              <span className={`ml-1 ${unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatCurrency(unrealizedPnl)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-400">ROE:</span>
                              <span className={`ml-1 ${roe >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {formatPercent(roe)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
