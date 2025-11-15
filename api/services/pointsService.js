const axios = require('axios');
const { 
  fetchVentualsPoints,
  fetchFelixPoints,
  fetchGliquidPoints,
  fetchHyperbeatPoints,
  fetchHyperlendPoints,
  fetchHybraPoints,
  fetchHypurrfiPoints,
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
    felix: null,
    gliquid: null,
    hyperbeat: null,
    hyperlend: null,
    hybra: null,
    hypurrfi: null,
    prjx: null,
    ultrasolid: null
  };

  // Fetch all points in parallel
  const promises = [
    fetchVentualsPoints(address).catch(err => ({ error: err.message })),
    fetchFelixPoints(address).catch(err => ({ error: err.message })),
    fetchGliquidPoints(address).catch(err => ({ error: err.message })),
    fetchHyperbeatPoints(address).catch(err => ({ error: err.message })),
    fetchHyperlendPoints(address).catch(err => ({ error: err.message })),
    fetchHybraPoints(address).catch(err => ({ error: err.message })),
    fetchHypurrfiPoints(address).catch(err => ({ error: err.message })),
    fetchPrjxPoints(address).catch(err => ({ error: err.message })),
    fetchUltrasolidPoints(address).catch(err => ({ error: err.message }))
  ];

  const [
    ventuals,
    felix,
    gliquid,
    hyperbeat,
    hyperlend,
    hybra,
    hypurrfi,
    prjx,
    ultrasolid
  ] = await Promise.all(promises);

  results.ventuals = ventuals;
  results.felix = felix;
  results.gliquid = gliquid;
  results.hyperbeat = hyperbeat;
  results.hyperlend = hyperlend;
  results.hybra = hybra;
  results.hypurrfi = hypurrfi;
  results.prjx = prjx;
  results.ultrasolid = ultrasolid;

  return results;
}

module.exports = {
  fetchAllPoints
};

