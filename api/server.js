const express = require('express');
const axios = require('axios');
const multer = require('multer');
const cors = require('cors');
const { fetchAllPoints } = require('./services/pointsService');
const { generateProfileImage } = require('./services/imageGenerationService');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for frontend access
app.use(cors());

// Configure multer for file uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json({ limit: '10mb' })); // Increase limit for JSON payloads

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

// Helper function to parse and validate data
function parseAndValidateData(data) {
  let parsedData;

  // If data is already an object, use it directly
  if (typeof data === 'object' && data !== null) {
    parsedData = data;
  } else if (typeof data === 'string') {
    // Try to parse as JSON string
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      throw new Error('Invalid JSON format');
    }
  } else {
    throw new Error('Invalid data format');
  }

  // Validate required fields
  if (!parsedData.rank || !parsedData.avatar || !parsedData.userBadge) {
    throw new Error('Missing required fields: rank, avatar, userBadge');
  }

  return parsedData;
}

// Image generation endpoint - accepts JSON object in body
app.post('/generate-image', async (req, res) => {
  try {
    let data;

    // Check if data is in request body (JSON object)
    if (req.body && Object.keys(req.body).length > 0) {
      data = parseAndValidateData(req.body);
    } else {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Please provide a JSON object in the request body or upload a JSON file'
      });
    }

    // Generate the image
    const imageBuffer = await generateProfileImage(data);

    // Set headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="profile-image.png"');
    res.setHeader('Content-Length', imageBuffer.length);

    // Send the image buffer
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(400).json({
      error: 'Error generating image',
      message: error.message
    });
  }
});

// Image generation endpoint - accepts JSON file upload
app.post('/generate-image/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a JSON file using the "file" field'
      });
    }

    // Parse the uploaded file
    const fileContent = req.file.buffer.toString('utf8');
    const data = parseAndValidateData(JSON.parse(fileContent));

    // Generate the image
    const imageBuffer = await generateProfileImage(data);

    // Set headers for image download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'attachment; filename="profile-image.png"');
    res.setHeader('Content-Length', imageBuffer.length);

    // Send the image buffer
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(400).json({
      error: 'Error generating image',
      message: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the API at: http://localhost:${PORT}/points?address=YOUR_WALLET_ADDRESS`);
  console.log(`Generate image (JSON object): POST http://localhost:${PORT}/generate-image`);
  console.log(`Generate image (file upload): POST http://localhost:${PORT}/generate-image/upload`);
});

