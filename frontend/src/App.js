import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import './App.css';

const App = () => {
    const chartContainerRef = useRef();
    const seriesRef = useRef(null);
    const chartRef = useRef(null);
    const [currentTimeframe, setCurrentTimeframe] = useState('1D');
    
    const [marketData, setMarketData] = useState({
        price: "0.00",
        change: "0.00",
        pChange: "0.00",
        high: "0.00",
        low: "0.00",
        lastUpdated: "Connecting..."
    });

    const timeframes = {
        '1H': { range: '1h', interval: '1m', delay: 20000 }, // 20 sec fetch
        '1D': { range: '1d', interval: '2m', delay: 50000 }, // 50 sec fetch
        '1W': { range: '5d', interval: '5m', delay: 100000 }, // 100 sec fetch
        '1M': { range: '1mo', interval: '1h', delay: 150000 },
        '1Y': { range: '1y', interval: '1d', delay: 600000 },
    };
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 400,
            layout: { background: { color: '#0b0e14' }, textColor: '#94a3b8' },
            grid: { vertLines: { visible: false }, horzLines: { color: '#1e293b' } },
            timeScale: { 
                borderColor: '#1e293b', 
                timeVisible: true,
                secondsVisible: false,
            },
            localization: {
                timeFormatter: (time) => {
                    const date = new Date(time * 1000);
                    return date.toLocaleTimeString('en-IN',{ hour: '2-digit', minute: '2-digit' });
                },
            }, 
        });

        // FIXED: Using addSeries(AreaSeries) for v5.1.0 compatibility
        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: '#3b82f6',
            topColor: 'rgba(59, 130, 246, 0.4)',
            bottomColor: 'rgba(59, 130, 246, 0)',
            lineWidth: 2,
        });

        chartRef.current = chart;
        seriesRef.current = areaSeries;

        const handleResize = () => chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, []);

  const fetchNiftyData = async () => {
    try {
        const { range, interval } = timeframes[currentTimeframe];
        
        // Use query2 - it's often less guarded than query1
        const targetURL = `https://query2.finance.yahoo.com/v8/finance/chart/^NSEI?interval=${interval}&range=${range}&includePrePost=true`;
        
        // We use 'corsproxy.io' - it is currently the most stable for Yahoo Finance
        const apiURL = `https://corsproxy.io/?${encodeURIComponent(targetURL)}`;

        const response = await fetch(apiURL);
        
        // If the proxy returns an error, stop immediately so we don't get the "Unexpected token <"
        if (!response.ok) return;

        const data = await response.json();

        if (!data?.chart?.result) return;

        const result = data.chart.result[0];
        const meta = result.meta;

        setMarketData({
            price: meta.regularMarketPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
            change: (meta.regularMarketPrice - meta.previousClose).toFixed(2),
            pChange: (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2),
            high: meta.regularMarketDayHigh?.toLocaleString('en-IN') || "0.00",
            low: meta.regularMarketDayLow?.toLocaleString('en-IN') || "0.00",
            lastUpdated: new Date().toLocaleTimeString('en-IN', {
                timeZone: 'Asia/Kolkata',
                hour12: true
            })
        });

        const getTime = (t) => {
          return t+19800;
        }

        if (seriesRef.current && result.timestamp) {
            const prices = result.indicators.quote[0].close;
            const chartData = result.timestamp.map((t, i) => ({
                time: getTime(t), // Adjusting for IST offset
                value: prices[i]
            })).filter(item => item.value !== null);

            seriesRef.current.setData(chartData);
        }
    } catch (error) {
        // Silently fail so the UI stays clean
        console.log("Syncing...");
        console.log(error);
    }
};

    useEffect(() => {
        fetchNiftyData();
        const interval = setInterval(fetchNiftyData, timeframes[currentTimeframe].delay); 
        return () => clearInterval(interval);
    }, [currentTimeframe]);

    return (
        <div className="app-container">
            <header className="market-header">
                <div className="ticker-info">
                    <span className="label">Live Index</span>
                    <h1 className="title">NIFTY 50</h1>
                    <div className="timeframe-selector">
                        {Object.keys(timeframes).map(tf => (
                            <button 
                                key={tf} 
                                className={currentTimeframe === tf ? 'active' : ''} 
                                onClick={() => setCurrentTimeframe(tf)}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="price-container">
                    <div className="current-price">{marketData.price}</div>
                    <div className={`price-movement ${parseFloat(marketData.change) >= 0 ? 'positive' : 'negative'}`}>
                        <span>{parseFloat(marketData.change) >= 0 ? '+' : ''}{marketData.change}</span>
                        <span>({marketData.pChange}%)</span>
                    </div>
                </div>
            </header>

            <main className="chart-section">
                <div className="chart-canvas" ref={chartContainerRef} />
            </main>

            <footer className="market-details">
                <div className="stat-box">
                    <span className="stat-label">Day High</span>
                    <span className="stat-value">{marketData.high}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Day Low</span>
                    <span className="stat-value">{marketData.low}</span>
                </div>
                <div className="stat-box">
                    <span className="stat-label">Update Status</span>
                    <span className="stat-value live-tag">{marketData.lastUpdated} (UTC+5:30)</span>
                </div>
            </footer>
        </div>
    );
};

export default App;