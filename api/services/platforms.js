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
    const rank = response.data.rank || 'N/A';
    const points = response.data.totalPoints || 'N/A';
    const max_rank = 8586;
    const rankPercentage = (typeof rank === 'number' && typeof max_rank === 'number') 
      ? ((rank / max_rank) * 100).toFixed(2) 
      : 'N/A';
    return { success: true, rank, points, max_rank, rank_percentage: rankPercentage };
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
    const rank = response.data.data.rank || 'N/A';
    const points = response.data.data.totalPoints || response.data.data.session1Points || 'N/A';
    const max_rank = 8665;
    const rankPercentage = (typeof rank === 'number' && typeof max_rank === 'number') 
      ? ((rank / max_rank) * 100).toFixed(2) 
      : 'N/A';
    return { success: true, rank, points, max_rank, rank_percentage: rankPercentage };
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
    const rank = response.data.rank || 'N/A';
    const points = response.data.pointsTotal || 'N/A';
    const max_rank = 34384;
    const rankPercentage = (typeof rank === 'number' && typeof max_rank === 'number') 
      ? ((rank / max_rank) * 100).toFixed(2) 
      : 'N/A';
    return { success: true, rank, points, max_rank, rank_percentage: rankPercentage };
  } catch (error) {
    // If error (especially 404 for no points), return default values instead of error
    const rank = 'N/A';
    const points = 0;
    const max_rank = 5207;
    const rankPercentage = 'N/A';
    return {
      success: false,
      rank,
      points,
      max_rank,
      rank_percentage: rankPercentage
    };
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
    const rank = response.data.totalRank || 'N/A';
    const points = response.data.totalPoint || 'N/A';
    const max_rank = 30000;
    const rankPercentage = (typeof rank === 'number' && typeof max_rank === 'number') 
      ? ((rank / max_rank) * 100).toFixed(2) 
      : 'N/A';
    return { success: true, rank, points, max_rank, rank_percentage: rankPercentage };
  } catch (error) {
    return { success: false, error: error.message, status: error.response?.status };
  }
}

module.exports = {
  fetchVentualsPoints,
  fetchHybraPoints,
  fetchPrjxPoints,
  fetchUltrasolidPoints
};

