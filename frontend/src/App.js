import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import './App.css';

const App = () => {
    const chartContainerRef = useRef();
    const seriesRef = useRef(null);
    const chartRef = useRef(null);
    const [currentTimeframe, setCurrentTimeframe] = useState('1D');
    const [activeSection, setActiveSection] = useState('home');
    
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

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    useEffect(() => {
        const sections = ['home', 'chart', 'contact'];
        
        const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px', // Detects section when it's in the middle of the screen
        threshold: 0
        };

        const observerCallback = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            }
        });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="app-container">
            <nav className="navbar">
                <div className="nav-logo">NIFTY<span>50</span></div>
                <ul className="nav-links">
                <li onClick={() => scrollToSection('home')} className={activeSection === 'home' ? 'active' : ''}>Home</li>
                <li onClick={() => scrollToSection('chart')} className={activeSection === 'chart' ? 'active' : ''}>Chart</li>
                <li onClick={() => scrollToSection('contact')} className={activeSection === 'contact' ? 'active' : ''}>Contact Us</li>
                </ul>
                <button className="nav-cta" onClick={() => scrollToSection('chart')}>
                Go Live
                </button>
            </nav>
            <div className="hero-container" id='home'>
            {/* The background decorative elements */}
                <div className="bg-glow"></div>
                <div className="bg-grid"></div>

                <div className="hero-content">
                    <div className="badge">v2.0 Live</div>
                    <h1 className="hero-title">
                    The Next Generation <br /> 
                    <span>Nifty 50</span> Analytics.
                    </h1>
                    <p className="hero-description">
                    Experience lightning-fast market data, professional-grade charts, 
                    and real-time tracking for India's benchmark index. Built for 
                    speed, accuracy, and the modern trader.
                    </p>
                    
                    <div className="hero-buttons">
                    <button className="btn-primary" onClick={() => scrollToSection('chart')}>View Live Chart</button>
                    </div>

                    <div className="hero-metrics">
                    <div className="metric">
                        <span className="number">99.9%</span>
                        <span className="label">Uptime</span>
                    </div>
                    <div className="metric">
                        <span className="number">&lt; 100ms</span>
                        <span className="label">Latency</span>
                    </div>
                    <div className="metric">
                        <span className="number">Free</span>
                        <span className="label">Forever</span>
                    </div>
                    </div>
                </div>
            </div>
            <header className="market-header" id='chart'>
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
                    <span className="stat-value live-tag">{marketData.lastUpdated}</span>
                </div>
            </footer>
            <footer className="main-footer" id="contact">
                <div className="footer-content">
                    <div className="footer-brand">
                    <div className="nav-logo">NIFTY<span>50</span></div>
                    <p>Providing real-time analytics and high-performance charting for India's benchmark index.</p>
                    <div className="social-links">
                        <a href="#"><i className="fab fa-twitter"></i></a>
                        <a href="#"><i className="fab fa-linkedin"></i></a>
                        <a href="#"><i className="fab fa-github"></i></a>
                    </div>
                    </div>

                    <div className="footer-links">
                    <h4>Platform</h4>
                    <ul>
                        <li onClick={() => scrollToSection('home')}>Home</li>
                        <li onClick={() => scrollToSection('chart')}>Live Chart</li>
                        <li>Market News</li>
                    </ul>
                    </div>

                    <div className="footer-contact">
                    <h4>Contact Us</h4>
                    <div className="contact-item">
                        <span className="icon">📍</span>
                        <p>Financial District, Hyderabad, India</p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">📧</span>
                        <p>support@nifty50live.com</p>
                    </div>
                    <div className="contact-item">
                        <span className="icon">📞</span>
                        <p>+91 98765 43210</p>
                    </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Nifty50 Analytics. All rights reserved.</p>
                    <div className="footer-legal">
                        <span>&ensp;Privacy Policy</span>
                        <span>Terms of Service</span>
                    </div>
                </div>
                </footer>
        </div>
    );
};

export default App;