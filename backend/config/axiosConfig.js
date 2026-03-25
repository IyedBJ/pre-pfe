const axios = require('axios');

const dolibarrApi = axios.create({
  baseURL: process.env.DOLIBARR_API_URL,
  headers: {
    'DOLAPIKEY': process.env.DOLIBARR_API_KEY,
    'Accept': 'application/json'
  }
});

module.exports = dolibarrApi;
