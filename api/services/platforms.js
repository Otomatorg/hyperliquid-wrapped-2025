const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Common headers for requests
const commonHeaders = {
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
};

/**
 * Fetch points from Ventuals
 */
async function fetchVentualsPoints(address) {
  try {
    const response = await axios.get(
      `https://vhype.ventuals.com/api/points/${address}/stats?latest=false`,
      {
        headers: {
          ...commonHeaders,
          'accept': '*/*',
          'cache-control': 'no-cache',
          'referer': 'https://vhype.ventuals.com/points'
        }
      }
    );
    return { success: true, rank: response.data.rank || 'N/A', points: response.data.totalPoints || 'N/A', max_rank: 5207 };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Fetch points from Felix
 */
async function fetchFelixPoints(address) {
  try {
    const response = await axios.post(
      'https://www.usefelix.xyz/points',
      JSON.stringify([address]),
      {
        headers: {
          'content-type': 'text/plain;charset=UTF-8',
          'next-action': 'c04a6b63e7719e1aec93f066e17aece5443abf1613',
          'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(dashboard)%22%2C%7B%22children%22%3A%5B%22points%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fpoints%22%2C%22refresh%22%5D%7D%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
          'origin': 'https://www.usefelix.xyz',
          'referer': 'https://www.usefelix.xyz/points',
        }
      }
    );
    
    // Parse the response: format is "0:{...}\n1:{...}\n"
    const responseText = response.data;
    const lines = responseText.split('\n');
    const dataLine = lines.find(line => line.startsWith('1:'));
    
    if (!dataLine) {
      return { success: false, error: 'Invalid response format: data line not found' };
    }
    
    // Extract JSON part after "1:"
    const jsonStr = dataLine.substring(2); // Remove "1:" prefix
    const data = JSON.parse(jsonStr);
    
    // Parse rank string "8077/41595" into rank and max_rank
    let rank = 'N/A';
    let maxRank = 'N/A';
    if (data.rank && typeof data.rank === 'string') {
      const rankParts = data.rank.split('/');
      if (rankParts.length === 2) {
        rank = rankParts[0];
        maxRank = rankParts[1];
      } else {
        rank = data.rank;
      }
    }
    
    return { 
      success: true, 
      points: data.totalPoints || 'N/A', 
      rank: rank,
      max_rank: maxRank
    };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

// Cache for Gliquid users data
let gliquidUsersCache = null;

/**
 * Fetch points from Gliquid
 */
async function fetchGliquidPoints(address) {
  try {
    // Load the JSON file if not cached
    if (!gliquidUsersCache) {
      const jsonPath = path.join(__dirname, '../../src/gliquid/uniqueUsers.json');
      const jsonData = fs.readFileSync(jsonPath, 'utf8');
      gliquidUsersCache = JSON.parse(jsonData);
    }
    
    // Search for the address (case-insensitive)
    const addressLower = address.toLowerCase();
    const participant = gliquidUsersCache.find(
      user => user.address.toLowerCase() === addressLower
    );
    
    if (!participant) {
      return {success: false, points: 'N/A', rank: 'N/A', max_rank: 5775, error: 'Participant not found' };
    }
    
    // Calculate max_rank (total number of users)
    const maxRank = gliquidUsersCache.length-1;
    
    return { 
      success: true, 
      points: participant.points || 'N/A',
      rank: participant.rank || 'N/A',
      max_rank: maxRank
    };
  } catch (error) {
    console.error('Error fetching Gliquid points:', error);
    return { success: false, points: 'N/A', rank: 'N/A', max_rank: 5775, error: error.message };
  }
}

/**
 * Fetch points from Hyperbeat
 */
async function fetchHyperbeatPoints(address) {
  try {
    const response = await axios.get(
      `https://api.hyperbeat.org/api/v1/leaderboard-v2/${address.toLowerCase()}`,
      {
        headers: {
          ...commonHeaders,
          'accept': '*/*',
          'origin': 'https://app.hyperbeat.org',
          'referer': 'https://app.hyperbeat.org/'
        }
      }
    );
    return { success: true, rank: response.data.rank_position || 'N/A', points: response.data.points || 'N/A', maxrank: 59031};
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Fetch points from Hyperlend
 * Note: Requires signature parameter
 */
async function fetchHyperlendPoints(address) {
  try {
    // Note: This endpoint requires a signature parameter which we don't have
    // You may need to generate this signature or make it optional
    const response = await axios.get(
      `https://api.hyperlend.finance/points/getUser?address=${address}&signature=0x0c675b4c7cba7a01c5d88b06c88b6ee4bfac1ebecaae5f8ebb2d786053f2a7157b8b97276a038fa2681eb3793585d0eed1b6f1af239e2dfe62907c8a245af2cc1c`,
      {
        headers: {
          ...commonHeaders,
          'accept': '*/*',
          'origin': 'https://app.hyperlend.finance',
          'referer': 'https://app.hyperlend.finance/'
        }
      }
    );
    return { success: true, rank: response.data.data.rank || 'N/A', points: response.data.data.totalPoints || 'N/A', max_rank: 67887};
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Fetch points from Hybra
 */
async function fetchHybraPoints(address) {
  try {
    const response = await axios.get(
      `https://server.hybra.finance/api/points/user/${address}`,
      {
        headers: {
          ...commonHeaders,
          'accept': '*/*',
          'origin': 'https://www.hybra.finance',
          'referer': 'https://www.hybra.finance/'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Fetch points from Hypurrfi
 * Note: Requires Bearer token
 */
async function fetchHypurrfiPoints(address) {
  try {
    const response = await axios.get(
      `https://api.fuul.xyz/api/v1/payouts/leaderboard/points?page=1&page_size=1&user_identifier=${address}&user_identifier_type=evm_address&fields=tier`,
      {
        headers: {
          ...commonHeaders,
          'accept': '*/*',
          'origin': 'https://app.hypurr.fi',
          'referer': 'https://app.hypurr.fi/points'
          // Note: Authorization header would need to be added if available
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Fetch points from Prjx
 * Note: Requires Bearer token
 */
async function fetchPrjxPoints(address) {
  try {
    const response = await axios.get(
      `https://api.prjx.com/points/user?walletAddress=${address}`,
      {
        headers: {
          ...commonHeaders,
          'accept': '*/*',
          'content-type': 'application/json',
          'origin': 'https://www.prjx.com',
          'referer': 'https://www.prjx.com/'
          // Note: Authorization header would need to be added if available
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

/**
 * Fetch points from Ultrasolid
 */
async function fetchUltrasolidPoints(address) {
  try {
    const response = await axios.get(
      `https://api.cluster.ultrasolid.xyz/users/${address}/point-info/999`,
      {
        headers: {
          ...commonHeaders,
          'accept': 'application/json, text/plain, */*',
          'origin': 'https://app.ultrasolid.xyz',
          'referer': 'https://app.ultrasolid.xyz/'
        }
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

module.exports = {
  fetchVentualsPoints,
  fetchFelixPoints,
  fetchGliquidPoints,
  fetchHyperbeatPoints,
  fetchHyperlendPoints,
  fetchHybraPoints,
  fetchHypurrfiPoints,
  fetchPrjxPoints,
  fetchUltrasolidPoints
};

