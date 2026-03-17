export default async function handler(req, res) {
    // Add CORS headers immediately
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle the pre-flight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { range, interval } = req.query;
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/^NSEI?interval=${interval}&range=${range}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Referer': 'https://finance.yahoo.com/'
            }
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "API Failed", details: error.message });
    }
}