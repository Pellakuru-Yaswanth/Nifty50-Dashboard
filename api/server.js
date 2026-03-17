const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = 5000;

// Allow your React app (on port 3000) to talk to this server
app.use(cors());

app.get('/api/nifty', async (req, res) => {
    const { range = '1d', interval = '1m' } = req.query;
    const ticker = encodeURIComponent('^NSEI');
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=${interval}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        //if (!response.ok) throw new Error('Yahoo Finance Error');
        
        const data = await response.json();
        const meta = data.chart.result[0].meta;
        if(!meta) throw new Error("Meta not found");
        res.json(data);
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Failed to fetch market data" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend Server running on http://localhost:${PORT}`);
});