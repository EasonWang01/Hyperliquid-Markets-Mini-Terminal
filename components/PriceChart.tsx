'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { createChart, IChartApi, UTCTimestamp, CandlestickData, HistogramData, CrosshairMode, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts';
import { useTradingStore } from '@/store/trading-store';
import { hyperliquidAPI } from '@/services/hyperliquid-api';

interface PriceChartProps {
  height?: number;
}

const PriceChart = memo(function PriceChart({ height = 300 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const isLoadingRef = useRef(false);
  const [timeframe, setTimeframe] = useState('1m');
  const [isChartReady, setIsChartReady] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

  const {
    selectedMarket,
    chartData,
    updateChartData,
    setLoading,
    setError
  } = useTradingStore();

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].close : null;
  const priceChange = chartData.length > 1 && currentPrice ? 
    currentPrice - chartData[chartData.length - 2].close : 0;
  const priceChangePercent = chartData.length > 1 && currentPrice && chartData[chartData.length - 2].close > 0 ?
    ((priceChange / chartData[chartData.length - 2].close) * 100) : 0;

  useEffect(() => {
    if (!selectedMarket || !chartContainerRef.current) {
      return;
    }
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
      return;
    }


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


    try {
      candlestickSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);

      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Error setting chart data:', error);
    }
  }, [chartData]);

  const generateCandlestickMockData = () => {
    const mockCandles = [];
    const now = Math.floor(Date.now() / 1000);
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

  useEffect(() => {

    const loadCandles = async () => {
      if (!selectedMarket || isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;
      setLoading(true);
      try {

        const endTime = Date.now();
        const startTime = endTime - (24 * 60 * 60 * 1000); // Last 24 hours in milliseconds


        try {
          const candles = await hyperliquidAPI.fetchCandles(
            selectedMarket.coin,
            timeframe,
            startTime,
            endTime
          );

          if (candles && candles.length > 0) {
            updateChartData(candles);
          } else {
            const mockCandles = generateCandlestickMockData();
            updateChartData(mockCandles);
          }
        } catch (apiError) {
          const mockCandles = generateCandlestickMockData();
          updateChartData(mockCandles);
        }
      } catch (error) {
        console.error('Failed to load candles:', error);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadCandles();

    return () => {
      isLoadingRef.current = false;
    };
  }, [selectedMarket, timeframe]);

  useEffect(() => {

    if (!isChartReady || !candlestickSeriesRef.current || !volumeSeriesRef.current || !chartData.length) {
      return;
    }

    const timeoutId = setTimeout(() => {
      updateChartWithData();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [chartData, isChartReady, updateChartWithData]);

  useEffect(() => {
    if (!selectedMarket || !isChartReady) return;

    const handleCandleUpdate = (newCandle: any) => {
      
      if (newCandle && candlestickSeriesRef.current && newCandle.s === selectedMarket.coin) {
        const timestamp = newCandle.t || newCandle.T;
        const candleData = {
          time: Math.floor(timestamp / 1000) as UTCTimestamp,
          open: parseFloat(newCandle.o),
          high: parseFloat(newCandle.h),
          low: parseFloat(newCandle.l),
          close: parseFloat(newCandle.c)
        };


        candlestickSeriesRef.current.update(candleData);
        
        if (volumeSeriesRef.current && newCandle.v) {
          const volumeData = {
            time: candleData.time, // Already converted to seconds above
            value: parseFloat(newCandle.v),
            color: candleData.close >= candleData.open ? '#4ade80' : '#f87171'
          };
          volumeSeriesRef.current.update(volumeData);
        }
      }
    };

    const subscribeToCandles = async () => {
      try {
        await hyperliquidAPI.subscribeToCandles(
          selectedMarket.coin,
          timeframe,
          handleCandleUpdate
        );
        setIsWebSocketConnected(true);
      } catch (error) {
        console.error('Failed to subscribe to candles:', error);
        setIsWebSocketConnected(false);
      }
    };

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
      <div className="chart-controls">
        <div className="market-info">
          <div className="market-symbol-large">
            {selectedMarket?.coin || 'Select Market'}
          </div>
          <div className="market-symbol-small">
            {selectedMarket?.coin || 'Select Market'}
          </div>
          {currentPrice && (
            <div className="current-price-info">
              <div className="current-price">
                ${currentPrice.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <div className={`price-change ${priceChange >= 0 ? 'positive' : 'negative'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
              </div>
            </div>
          )}
          {selectedMarket && (
            <div className="leverage-info">
              <span className="leverage-label">Leverage:</span>
              <span className="leverage-value">{selectedMarket.maxLeverage}x</span>
            </div>
          )}
        </div>

        <div className="timeframe-controls">
          <button className={`live-button ${isWebSocketConnected ? 'live' : 'offline'}`}>
            <div className="live-dot"></div>
            <span>Live</span>
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
});

export default PriceChart;
