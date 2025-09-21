'use client'

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, IChartApi, UTCTimestamp, CandlestickData, HistogramData, CrosshairMode, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';

interface PriceChartProps {
  height?: number;
}

export default function PriceChart({ height = 300 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const [timeframe, setTimeframe] = useState('1m');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChartReady, setIsChartReady] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  const {
    selectedMarket,
    chartData,
    updateChartData,
    setLoading,
    setError
  } = useTradingStore();

  // Initialize chart
  useEffect(() => {
    // A selected market and a container ref are required to init the chart
    if (!selectedMarket || !chartContainerRef.current) {
      console.log('Chart initialization skipped - missing requirements:', {
        hasSelectedMarket: !!selectedMarket,
        hasContainerRef: !!chartContainerRef.current
      });
      return;
    }

    console.log('Initializing chart for market:', selectedMarket.coin);

    // Small delay to ensure container is fully mounted
    const initTimeout = setTimeout(() => {
      if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: '#4b5563',
      },
      timeScale: {
        borderColor: '#4b5563',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#6b7280',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;
    chartRef.current = chart;

    console.log('Chart created successfully');

    // Mark chart as ready
    setIsChartReady(true);
    }, 50); // Close setTimeout

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initTimeout);
      console.log('Cleaning up chart for:', selectedMarket.coin);
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      setIsChartReady(false); // Reset ready state on cleanup
    };
  }, [selectedMarket, height]);

  const updateChartWithData = useCallback(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current || !chartData.length) {
      console.log('Chart still not ready after delay');
      return;
    }

    console.log('Transforming chart data...');
    console.log('Raw chart data length:', chartData.length);
    console.log('Sample raw chart data:', chartData[0]);
    console.log('All raw chart data:', chartData);

    const candleData: CandlestickData[] = chartData.map(candle => ({
      time: candle.time as UTCTimestamp, // Already converted to seconds in store
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));

    const volumeData: HistogramData[] = chartData.map(candle => ({
      time: candle.time as UTCTimestamp, // Already converted to seconds in store
      value: candle.volume,
      color: candle.close >= candle.open ? '#10b981' : '#ef4444',
    }));

    console.log('Transformed candle data length:', candleData.length);
    console.log('Sample transformed candle data:', candleData[0]);
    console.log('Sample transformed volume data:', volumeData[0]);
    console.log('All transformed candle data:', candleData);

    console.log('Setting chart data:', candleData.length, 'candles');
    console.log('Sample candle data:', candleData[0]);
    console.log('Sample volume data:', volumeData[0]);

    try {
      candlestickSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);

      // Auto-fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
      console.log('Chart data set successfully!');
    } catch (error) {
      console.error('Error setting chart data:', error);
    }
  }, [chartData]);

  // Generate mock data for candlestick chart
  const generateCandlestickMockData = () => {
    const mockCandles = [];
    const now = Math.floor(Date.now() / 1000);
    
    // Convert timeframe to seconds
    const getIntervalSeconds = (tf: string): number => {
      switch (tf) {
        case '1m': return 60;
        case '3m': return 180;
        case '5m': return 300;
        case '15m': return 900;
        case '30m': return 1800;
        case '1h': return 3600;
        case '2h': return 7200;
        case '4h': return 14400;
        case '8h': return 28800;
        case '12h': return 43200;
        case '1d': return 86400;
        case '3d': return 259200;
        case '1w': return 604800;
        case '1M': return 2592000; // 30 days approximation
        default: return 60;
      }
    };
    
    const intervalSeconds = getIntervalSeconds(timeframe);

    let basePrice = 50000; // Starting price for BTC-like data

    for (let i = 100; i >= 0; i--) {
      const time = now - (i * intervalSeconds);
      const open = basePrice;
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility * basePrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
      const volume = Math.random() * 1000 + 100;

      mockCandles.push({
        T: time * 1000, // Convert to milliseconds for mock data
        t: time * 1000, // Convert to milliseconds for mock data
        o: open.toString(),
        h: high.toString(),
        l: low.toString(),
        c: close.toString(),
        v: volume.toString(),
        s: selectedMarket?.coin || 'BTC',
        n: Math.floor(Math.random() * 100) + 10 // Random number of trades
      });

      basePrice = close; // Next candle starts where this one ended
    }

    return mockCandles;
  };

  // Load candle data when market changes and poll for updates
  useEffect(() => {

    const loadCandles = async () => {
      if (!selectedMarket || isLoadingRef.current) {
        console.log('Skipping load - no market or already loading');
        return;
      }

      console.log('Starting to load candles...');
      isLoadingRef.current = true;
      setIsLoadingData(true);
      setLoading(true);
      try {
        console.log('Loading candles for:', {
          coin: selectedMarket.coin,
          timeframe: timeframe,
          market: selectedMarket
        });

        // Try real API data
        console.log('Trying real API data...');

        // Use milliseconds format (epoch milliseconds as per API docs)
        const endTime = Date.now();
        const startTime = endTime - (24 * 60 * 60 * 1000); // Last 24 hours in milliseconds

        console.log('Time range (epoch milliseconds):', {
          startTime,
          endTime,
          startTimeISO: new Date(startTime).toISOString(),
          endTimeISO: new Date(endTime).toISOString()
        });

        try {
          // Try the API with correct format
          const candles = await hyperliquidAPI.fetchCandles(
            selectedMarket.coin,
            timeframe,
            startTime,
            endTime
          );

          console.log('Fetched candles:', candles.length);
          if (candles && candles.length > 0) {
            console.log('Sample candle from API:', candles[0]);
            console.log('All candles structure:', candles);
            updateChartData(candles);
          } else {
            console.log('No candles returned from API, falling back to mock data');
            const mockCandles = generateCandlestickMockData();
            updateChartData(mockCandles);
          }
        } catch (apiError) {
          console.log('API failed, falling back to mock data:', apiError);
          const mockCandles = generateCandlestickMockData();
          updateChartData(mockCandles);
        }
      } catch (error) {
        console.error('Failed to load candles:', error);
        setError('Failed to load chart data');
      } finally {
        console.log('Finished loading candles');
        setLoading(false);
        setIsLoadingData(false);
        isLoadingRef.current = false;
      }
    };

    loadCandles();

    // Cleanup function to prevent requests after unmount
    return () => {
      isLoadingRef.current = false;
    };
  }, [selectedMarket, timeframe, refreshKey]);

  // Update chart when data changes
  useEffect(() => {
    console.log('Chart data changed:', chartData.length, 'items');
    console.log('Chart refs status:', {
      candlestickSeries: !!candlestickSeriesRef.current,
      volumeSeries: !!volumeSeriesRef.current,
      chart: !!chartRef.current,
      isChartReady
    });

    if (!isChartReady || !candlestickSeriesRef.current || !volumeSeriesRef.current || !chartData.length) {
      console.log('Chart not ready or no data:', {
        isChartReady,
        candlestickSeries: !!candlestickSeriesRef.current,
        volumeSeries: !!volumeSeriesRef.current,
        dataLength: chartData.length
      });
      return;
    }

    // Add a small delay to ensure chart is fully rendered
    const timeoutId = setTimeout(() => {
      console.log('Setting chart data after delay...');
      updateChartWithData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [chartData, isChartReady, updateChartWithData]);

  // WebSocket subscription for real-time candle updates
  useEffect(() => {
    if (!selectedMarket || !isChartReady) return;

    const handleCandleUpdate = (newCandle: any) => {
      console.log('New candle received:', newCandle);
      
      if (newCandle && candlestickSeriesRef.current && newCandle.s === selectedMarket.coin) {
        // Convert the candle data to the format expected by the chart
        // Convert milliseconds to seconds for the chart
        const timestamp = newCandle.t || newCandle.T;
        const candleData = {
          time: Math.floor(timestamp / 1000) as UTCTimestamp,
          open: parseFloat(newCandle.o),
          high: parseFloat(newCandle.h),
          low: parseFloat(newCandle.l),
          close: parseFloat(newCandle.c)
        };

        console.log('Updating chart with candle data:', candleData);

        // Update the chart with the new candle
        candlestickSeriesRef.current.update(candleData);
        
        // Also update the volume if available
        if (volumeSeriesRef.current && newCandle.v) {
          const volumeData = {
            time: candleData.time, // Already converted to seconds above
            value: parseFloat(newCandle.v),
            color: candleData.close >= candleData.open ? '#4ade80' : '#f87171'
          };
          volumeSeriesRef.current.update(volumeData);
          console.log('Updated volume with data:', volumeData);
        }
      }
    };

    // Subscribe to real-time candle updates
    const subscribeToCandles = async () => {
      try {
        await hyperliquidAPI.subscribeToCandles(
          selectedMarket.coin,
          timeframe,
          handleCandleUpdate
        );
        setIsWebSocketConnected(true);
        console.log(`Subscribed to real-time candles for ${selectedMarket.coin} (${timeframe})`);
      } catch (error) {
        console.error('Failed to subscribe to candles:', error);
        setIsWebSocketConnected(false);
      }
    };

    // Add a small delay to ensure chart is fully ready
    const timeoutId = setTimeout(() => {
      subscribeToCandles();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (selectedMarket) {
        hyperliquidAPI.unsubscribeFromCandles(selectedMarket.coin, timeframe);
        setIsWebSocketConnected(false);
      }
    };
  }, [selectedMarket, timeframe, isChartReady]);

  const timeframes = [
    { label: '1m', value: '1m' },
    { label: '3m', value: '3m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '2h', value: '2h' },
    { label: '4h', value: '4h' },
    { label: '8h', value: '8h' },
    { label: '12h', value: '12h' },
    { label: '1d', value: '1d' },
    { label: '3d', value: '3d' },
    { label: '1w', value: '1w' },
    { label: '1M', value: '1M' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Chart Controls */}
      <div className="chart-controls">
        {/* Market Info */}
        <div className="market-info">
          <div className="market-symbol-large">
            {selectedMarket?.coin || 'Select Market'}
          </div>
          <div className="market-symbol-small">
            {selectedMarket?.coin || 'Select Market'}
          </div>
        </div>

        {/* Timeframe Controls */}
        <div className="timeframe-controls">
          {/* Connection Status */}
          <div className={`connection-status ${isWebSocketConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span className="status-text">
              {isWebSocketConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={isLoadingData}
            className={`timeframe-button refresh ${isLoadingData ? 'disabled' : ''}`}
          >
            {isLoadingData ? 'Loading...' : 'Refresh'}
          </button>
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`timeframe-button ${timeframe === tf.value ? 'active' : ''}`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {!selectedMarket ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading markets...</p>
            </div>
          </div>
        ) : (
          <div
            ref={chartContainerRef}
            style={{ height, width: '100%' }}
            className="w-full relative"
          >
            {!isChartReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">Initializing chart...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
