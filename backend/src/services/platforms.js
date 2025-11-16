import axios from 'axios';

// Common headers for requests
const commonHeaders = {
  'accept-language': 'en-US,en;q=0.9',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
};

/**
 * Fetch points from Ventuals
 */
export async function fetchVentualsPoints(address) {
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
    const rank = response.data.rank || null;
    const points = response.data.totalPoints || 0;
    const max_rank = 8586;
    return { success: true, rank, points, max_rank };
  } catch (error) {
    return { success: false, error: error.message, points: 0, rank: null, max_rank: 8586 };
  }
}

/**
 * Fetch points from Hybra
 */
export async function fetchHybraPoints(address) {
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
    const rank = response.data.data?.rank || null;
    const points = response.data.data?.totalPoints || response.data.data?.session1Points || 0;
    const max_rank = 8665;
    return { success: true, rank, points, max_rank };
  } catch (error) {
    return { success: false, error: error.message, points: 0, rank: null, max_rank: 8665 };
  }
}

/**
 * Fetch points from Prjx
 */
export async function fetchPrjxPoints(address) {
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
        }
      }
    );
    const rank = response.data.rank || null;
    const points = response.data.pointsTotal || 0;
    const max_rank = 34384;
    return { success: true, rank, points, max_rank };
  } catch (error) {
    // If error (especially 404 for no points), return 0 points
    const max_rank = 5207; // Fallback max_rank on error
    return { success: false, error: error.message, points: 0, rank: null, max_rank };
  }
}

/**
 * Fetch points from Ultrasolid
 */
export async function fetchUltrasolidPoints(address) {
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
    const rank = response.data.totalRank || null;
    const points = response.data.totalPoint || 0;
    const max_rank = 30000;
    return { success: true, rank, points, max_rank };
  } catch (error) {
    return { success: false, error: error.message, points: 0, rank: null, max_rank: 30000 };
  }
}

