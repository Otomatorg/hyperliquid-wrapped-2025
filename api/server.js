const express = require('express');
const axios = require('axios');
const { fetchAllPoints } = require('./services/pointsService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Main endpoint to fetch points for a wallet address
app.get('/points', async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({
      error: 'Missing required parameter: address',
      message: 'Please provide a wallet address as a query parameter'
    });
  }

  // Validate address format (basic check)
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({
      error: 'Invalid address format',
      message: 'Address must be a valid Ethereum address (0x followed by 40 hex characters)'
    });
  }

  try {
    const results = await fetchAllPoints(address);
    res.json({
      address,
      timestamp: new Date().toISOString(),
      points: results
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at: http://localhost:${PORT}/point?address=YOUR_WALLET_ADDRESS`);
});

