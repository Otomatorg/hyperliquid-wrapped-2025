const axios = require('axios');
const { 
  fetchVentualsPoints,
  fetchHybraPoints,
  fetchPrjxPoints,
  fetchUltrasolidPoints
} = require('./platforms');

/**
 * Fetch points from all platforms for a given wallet address
 * @param {string} address - Wallet address (0x...)
 * @returns {Promise<Object>} Aggregated points data from all platforms
 */
async function fetchAllPoints(address) {
  const results = {
    ventuals: null,
    hybra: null,
    prjx: null,
    ultrasolid: null
  };

  // Fetch all points in parallel
  const promises = [
    fetchVentualsPoints(address).catch(err => ({ error: err.message })),
    fetchHybraPoints(address).catch(err => ({ error: err.message })),
    fetchPrjxPoints(address).catch(err => ({ error: err.message })),
    fetchUltrasolidPoints(address).catch(err => ({ error: err.message }))
  ];

  const [
    ventuals,
    hybra,
    prjx,
    ultrasolid
  ] = await Promise.all(promises);

  results.ventuals = ventuals;
  results.hybra = hybra;
  results.prjx = prjx;
  results.ultrasolid = ultrasolid;

  return results;
}

module.exports = {
  fetchAllPoints
};

