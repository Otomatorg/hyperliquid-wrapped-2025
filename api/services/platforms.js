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

/**
 * Fetch points from Kinetiq
 */
async function fetchKinetiqPoints(address) {
  try {
    const response = await axios.post(
      'https://kinetiq.xyz/kpoints',
      JSON.stringify([{ chainId: 999, userAddress: address }]),
      {
        headers: {
          'accept': 'text/x-component',
          'accept-language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'cache-control': 'no-cache',
          'content-type': 'text/plain;charset=UTF-8',
          'next-action': '7fe98e616734232bdb03a27d671f1ea032ddd6ebed',
          'next-router-state-tree': '%5B%22%22%2C%7B%22children%22%3A%5B%22(defi)%22%2C%7B%22children%22%3A%5B%22kpoints%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
          'origin': 'https://kinetiq.xyz',
          'pragma': 'no-cache',
          'priority': 'u=1, i',
          'referer': 'https://kinetiq.xyz/kpoints',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'x-deployment-id': 'dpl_4fPiXNn5XknW3DoMLddFHZNoqF1z'
        },
        // Don't transform response automatically - handle as text first
        transformResponse: [(data) => data]
      }
    );
    
    // Check if response is HTML (error page)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE')) {
      return { 
        success: false, 
        error: 'Received HTML response instead of data. API may require authentication or the endpoint format may have changed.',
        status: response.status 
      };
    }
    
    // React Server Component format - response is text in line-delimited format
    // Format: "0:{...}\n1:{...}" where each line starts with a number and colon
    const responseText = typeof response.data === 'string' ? response.data : String(response.data);
    
    let data;
    
    // Check if it's RSC format (line-delimited with number: prefix)
    if (responseText.includes('\n') && /^\d+:/.test(responseText.split('\n')[0])) {
      // Parse RSC format: split by newlines and find the data line
      const lines = responseText.split('\n').filter(line => line.trim());
      
      // Look for the line with actual user data (usually contains address, points, rank, tier)
      let dataLine = null;
      for (const line of lines) {
        // Extract JSON part after the number: prefix
        const match = line.match(/^\d+:(.+)$/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            // Check if this line contains the user data (has address, rank, points, or tier)
            if (parsed.address || parsed.rank !== undefined || parsed.points !== undefined || parsed.tier) {
              dataLine = parsed;
              break;
            }
          } catch (e) {
            // Continue to next line
            continue;
          }
        }
      }
      
      if (dataLine) {
        data = dataLine;
      } else {
        // Fallback: try to parse the last line or any line with JSON
        for (const line of lines) {
          const match = line.match(/^\d+:(.+)$/);
          if (match) {
            try {
              data = JSON.parse(match[1]);
              break;
            } catch (e) {
              continue;
            }
          }
        }
      }
      
      if (!data) {
        return { 
          success: false, 
          error: 'Failed to parse RSC format response',
          status: response.status,
          rawResponse: responseText.substring(0, 500)
        };
      }
    } else {
      // Try to parse as standard JSON
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            data = JSON.parse(jsonMatch[0]);
          } catch (e) {
            // Try array format
            const arrayMatch = responseText.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              try {
                data = JSON.parse(arrayMatch[0]);
              } catch (e2) {
                return { 
                  success: false, 
                  error: `Failed to parse response: ${parseError.message}`,
                  status: response.status,
                  rawResponse: responseText.substring(0, 500)
                };
              }
            } else {
              return { 
                success: false, 
                error: `Failed to parse response: ${parseError.message}`,
                status: response.status,
                rawResponse: responseText.substring(0, 500)
              };
            }
          }
        } else {
          return { 
            success: false, 
            error: `Unexpected response format: ${responseText.substring(0, 100)}...`,
            status: response.status,
            rawResponse: responseText.substring(0, 500)
          };
        }
      }
    }
    
    // Extract rank, points, and tier from response
    // Data structure from RSC format: {address, points, rank, tier}
    let rank, points, tier;
    
    // Handle array response
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      rank = firstItem.rank !== undefined ? firstItem.rank : 'N/A';
      points = firstItem.points !== undefined ? firstItem.points : 'N/A';
      tier = firstItem.tier || 'N/A';
    } 
    // Handle object response
    else if (typeof data === 'object' && data !== null) {
      // Check nested data structure first
      const responseData = data.data || data.result || data;
      rank = responseData.rank !== undefined ? responseData.rank : (data.rank !== undefined ? data.rank : 'N/A');
      points = responseData.points !== undefined ? responseData.points : (data.points !== undefined ? data.points : 'N/A');
      tier = responseData.tier || data.tier || 'N/A';
    } else {
      rank = 'N/A';
      points = 'N/A';
      tier = 'N/A';
    }
    
    // Calculate rank percentage if we have rank data
    const max_rank = data.max_rank || data.maxRank || data.data?.max_rank || 100000; // Adjust based on actual max rank
    const rankPercentage = (typeof rank === 'number' && typeof max_rank === 'number' && rank !== 'N/A') 
      ? ((rank / max_rank) * 100).toFixed(2) 
      : 'N/A';
    
    return { 
      success: true, 
      rank, 
      points, 
      tier,
      max_rank, 
      rank_percentage: rankPercentage 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      details: error.response?.data ? String(error.response.data).substring(0, 200) : undefined
    };
  }
}

module.exports = {
  fetchVentualsPoints,
  fetchHybraPoints,
  fetchPrjxPoints,
  fetchUltrasolidPoints,
  fetchKinetiqPoints
};

